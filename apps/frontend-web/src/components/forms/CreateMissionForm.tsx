import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Package, DollarSign, Clock, X, Calculator, Loader2 } from 'lucide-react';
import type {
  CreateMissionDto,
  DynamicPricingRequest,
  DynamicPricingResponse,
} from '@/types/mission.types';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState, Suspense, lazy, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import type { Address } from '@/types/address.types';
import { useMissions } from '@/hooks/useMissions';
import { missionService } from '@/services/mission.service';
import { GoogleMapsService } from '@/services/google-maps.service';
import { toast } from 'sonner';
import { useErrorsTranslation, useFormsTranslation } from '@/hooks/useTranslation';
import type { AddressDetails } from '@/components/maps/AddressPicker';

// Lazy load ModernAddressPicker with Suspense for client-side rendering
const AddressPicker = lazy(() => import('@/components/maps/AddressPicker'));

// Loading component for Suspense fallback
const AddressPickerLoading = () => {
  const { t: tForms } = useFormsTranslation();
  return (
    <div className="h-64 w-full bg-gray-100 flex items-center justify-center">
      <div className="animate-pulse">{tForms('messages.loadingAddressPicker')}</div>
    </div>
  );
};

// Define props type for ClientSideAddressPicker
interface AddressPickerProps {
  onAddressSelect: (address: AddressDetails) => void;
  onClear?: () => void;
  placeholder?: string;
  value?: string;
  className?: string;
  showMap?: boolean;
}

// Client-side only wrapper for AddressPicker
const ClientSideAddressPicker = ({
  onAddressSelect,
  onClear,
  placeholder,
  value,
  className,
  showMap,
}: AddressPickerProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <AddressPickerLoading />;
  }

  return (
    <Suspense fallback={<AddressPickerLoading />}>
      <AddressPicker
        onAddressSelect={onAddressSelect}
        onClear={onClear}
        placeholder={placeholder}
        value={value}
        className={className}
        showMap={showMap}
      />
    </Suspense>
  );
};

const validationSchema = (tForms: (key: string, options?: Record<string, unknown>) => string) =>
  Yup.object({
    title: Yup.string()
      .min(5, tForms('validation.minLength', { min: 5 }))
      .required(tForms('validation.required'))
      .nullable(),
    affreteurId: Yup.string().when('$isAdmin', {
      is: true,
      then: (schema) => schema.required(tForms('validation.required')),
      otherwise: (schema) => schema.optional(),
    }),
    description: Yup.string().nullable(),
    typeMarchandise: Yup.string().nullable(),
    poids: Yup.number()
      .min(0, tForms('validation.positive'))
      .required(tForms('validation.required'))
      .nullable(),
    volume: Yup.number()
      .min(0, tForms('validation.positive'))
      .required(tForms('validation.required'))
      .nullable(),
    dateDepartEstime: Yup.date()
      .required(tForms('validation.required'))
      .typeError(tForms('validation.date')),
    dateArriveePrevue: Yup.date()
      .required(tForms('validation.required'))
      .typeError(tForms('validation.date')),
    adresseDepart: Yup.object({
      street: Yup.string().required(tForms('validation.required')),
      city: Yup.string().required(tForms('validation.required')),
      postalCode: Yup.string(),
      country: Yup.string().required(tForms('validation.required')),
      label: Yup.string().required(tForms('validation.required')),
      region: Yup.string().required(tForms('validation.required')),
      latitude: Yup.number().required(tForms('validation.coordinatesRequired')),
      longitude: Yup.number().required(tForms('validation.coordinatesRequired')),
    }).required(tForms('validation.addressRequired')),
    adresseArrivee: Yup.object({
      street: Yup.string(),
      city: Yup.string().required(tForms('validation.required')),
      postalCode: Yup.string(),
      country: Yup.string().required(tForms('validation.required')),
      label: Yup.string().required(tForms('validation.required')),
      region: Yup.string().required(tForms('validation.required')),
      latitude: Yup.number().required(tForms('validation.coordinatesRequired')),
      longitude: Yup.number().required(tForms('validation.coordinatesRequired')),
    }).required(tForms('validation.addressRequired')),
    budgetMin: Yup.number()
      .min(1, tForms('validation.positive'))
      .required(tForms('validation.required'))
      .nullable(),
  });

export interface CreateMissionFormProps {
  onSubmit: (data: CreateMissionDto, action: string, publish: boolean) => Promise<void>;
  isSubmitting?: boolean;
  addresses: Address[];
}

// Type for the form data when creating a new address
type NewAddressFormData = Omit<Address, 'id' | 'createdAt' | 'updatedAt'>;

// Helper function to convert AddressDetails to Address format
const convertAddressDetailsToAddress = (addressDetails: AddressDetails): NewAddressFormData => {
  return {
    label: addressDetails.label || addressDetails.formatted_address || 'Nouvelle adresse',
    street: `${addressDetails.street_number || ''} ${addressDetails.route || ''}`.trim() || '',
    city: addressDetails.locality || '',
    region: addressDetails.administrative_area_level_1 || '',
    country: addressDetails.country || '',
    postalCode: addressDetails.postal_code || addressDetails.street_number || '',
    latitude: addressDetails.latitude,
    longitude: addressDetails.longitude,
  };
};

export default function CreateMissionForm({ onSubmit, isSubmitting }: CreateMissionFormProps) {
  const { user } = useAuth();
  const { getUsersByRole } = useUsers();
  const { currentMission } = useMissions();
  const { t: tForms } = useFormsTranslation();
  const { t: tErrors } = useErrorsTranslation();

  // Dynamic pricing state
  const [dynamicPricing, setDynamicPricing] = useState<DynamicPricingResponse | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [showDynamicPricing, setShowDynamicPricing] = useState(false);

  const INITIAL_VALUES: CreateMissionDto = {
    title: currentMission?.title || '',
    affreteurId: currentMission?.affreteurId || (user?.role === 'admin' ? '' : user?.id || ''),
    description: currentMission?.description || '',
    typeMarchandise: currentMission?.typeMarchandise || '',
    poids: currentMission?.poids || undefined,
    volume: currentMission?.volume || undefined,
    dateDepartEstime: currentMission?.dateDepartEstime || '',
    dateArriveePrevue: currentMission?.dateArriveePrevue || '',
    adresseDepart: currentMission?.adresseDepart || {
      street: '',
      city: '',
      region: '',
      country: '',
      postalCode: '',
      label: '',
      latitude: 3.848,
      longitude: 11.5021,
    },
    adresseArrivee: currentMission?.adresseArrivee || {
      street: '',
      city: '',
      region: '',
      country: '',
      postalCode: '',
      label: '',
      latitude: 3.848,
      longitude: 11.5021,
    },
    budgetMin: currentMission?.budgetMin || 0,
    budgetMax: currentMission?.budgetMax || 0,
  };

  // Calculate dynamic pricing
  const calculateDynamicPricing = async (formValues: CreateMissionDto) => {
    if (
      !formValues.adresseDepart ||
      !formValues.adresseArrivee ||
      !formValues.poids ||
      !formValues.volume
    ) {
      toast.error(tErrors('missions.fillAddressesForPricing'));
      return;
    }

    // Validate that addresses have coordinates
    if (
      !formValues.adresseDepart.latitude ||
      !formValues.adresseDepart.longitude ||
      !formValues.adresseArrivee.latitude ||
      !formValues.adresseArrivee.longitude
    ) {
      toast.error(tErrors('missions.addressesNeedCoordinates'));
      return;
    }

    setIsCalculatingPrice(true);
    try {
      // Calculate distance using Google Maps API
      const googleMapsService = new GoogleMapsService();
      const distanceResult = await googleMapsService.calculateDistanceWithDirections(
        {
          lat: formValues.adresseDepart.latitude,
          lng: formValues.adresseDepart.longitude,
        },
        {
          lat: formValues.adresseArrivee.latitude,
          lng: formValues.adresseArrivee.longitude,
        }
      );

      if (!distanceResult) {
        // Fallback to straight-line distance if directions fail
        const straightLineDistance = await googleMapsService.calculateDistance(
          {
            lat: formValues.adresseDepart.latitude,
            lng: formValues.adresseDepart.longitude,
          },
          {
            lat: formValues.adresseArrivee.latitude,
            lng: formValues.adresseArrivee.longitude,
          }
        );

        if (!straightLineDistance) {
          toast.error(tErrors('missions.cannotCalculateDistance'));
          return;
        }

        // Use straight-line distance with a 1.3 multiplier for road distance estimation
        const estimatedDistance = Math.round(straightLineDistance * 1.3);

        const pricingRequest: DynamicPricingRequest = {
          origin: formValues.adresseDepart.label,
          destination: formValues.adresseArrivee.label,
          distance_km: estimatedDistance,
          weight_tons: formValues.poids,
          cargo_type: formValues.typeMarchandise || 'general',
          urgency: formValues.dateDepartEstime
            ? (new Date(formValues.dateDepartEstime).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24) <
              7
              ? 'urgent'
              : 'normal'
            : 'normal',
        };

        const response = await missionService.calculateDynamicPricing(pricingRequest);

        if (response.error) {
          toast.error(response.error.message || 'Erreur lors du calcul du prix dynamique');
        } else if (response.data) {
          setDynamicPricing(response.data);
          setShowDynamicPricing(true);
          toast.success(
            `${tForms('messages.dynamicPricingCalculated')} (Distance estimée: ${estimatedDistance} km)`
          );
        }
      } else {
        // Use actual driving distance from Google Directions API
        const pricingRequest: DynamicPricingRequest = {
          origin: formValues.adresseDepart.label,
          destination: formValues.adresseArrivee.label,
          distance_km: distanceResult.distance,
          weight_tons: formValues.poids,
          cargo_type: formValues.typeMarchandise || 'general',
          urgency: formValues.dateDepartEstime
            ? (new Date(formValues.dateDepartEstime).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24) <
              7
              ? 'urgent'
              : 'normal'
            : 'normal',
        };

        const response = await missionService.calculateDynamicPricing(pricingRequest);

        if (response.error) {
          toast.error(response.error.message || 'Erreur lors du calcul du prix dynamique');
        } else if (response.data) {
          setDynamicPricing(response.data);
          setShowDynamicPricing(true);
          toast.success(
            `${tForms('messages.dynamicPricingCalculated')} (Distance: ${distanceResult.distance} km, Durée: ${Math.round(distanceResult.duration / 60)}h${distanceResult.duration % 60}min)`
          );
        }
      }
    } catch (error) {
      console.error('Error calculating dynamic pricing:', error);
      toast.error(tErrors('missions.dynamicPricingError'));
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  // Apply dynamic pricing to form
  const applyDynamicPricing = (setFieldValue: (field: string, value: number) => void) => {
    if (dynamicPricing) {
      setFieldValue('budgetMin', dynamicPricing.calculated_price * 0.8); // 20% below estimated
      toast.success(tForms('messages.dynamicPricingApplied'));
    }
  };

  const handleNewAddressChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    type: 'departure' | 'arrival',
    setFieldValue: (field: string, value: string | number) => void
  ) => {
    const { name, value } = e.target;

    setFieldValue(type === 'departure' ? `adresseDepart.${name}` : `adresseArrivee.${name}`, value);
  };

  return (
    <Formik<CreateMissionDto>
      initialValues={INITIAL_VALUES}
      validationSchema={validationSchema(tForms)}
      onSubmit={(values) => {
        console.log(values);
        onSubmit(
          values,
          currentMission ? 'update' : 'create',
          currentMission ? currentMission.status === 'draft' : true
        );
      }}
      validateOnBlur={true}
      validateOnChange={true}
      validateOnMount={true}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldTouched }) => (
        <Form className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {tForms('sections.missionDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cn('grid gap-4', {
                  'grid-cols-1 md:grid-cols-2': user?.role === 'admin',
                })}
              >
                <div>
                  <Label htmlFor="title">{tForms('labels.missionTitle')}</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder={tForms('placeholders.missionTitle')}
                    value={values.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={cn('w-full', touched.title && errors.title && 'border-red-500')}
                    required
                  />
                  {touched.title && errors.title && (
                    <div className="text-sm text-red-600 mt-1">{errors.title}</div>
                  )}
                </div>
                {user?.role === 'admin' && (
                  <div>
                    <Label htmlFor="affreteurId">{tForms('labels.affreteur')}</Label>
                    <Select
                      value={values.affreteurId || ''}
                      onValueChange={(value) => {
                        setFieldValue('affreteurId', value);
                        setFieldTouched('affreteurId', true);
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          'w-full',
                          touched.affreteurId && errors.affreteurId && 'border-red-500'
                        )}
                        onBlur={() => setFieldTouched('affreteurId', true)}
                      >
                        <SelectValue placeholder={tForms('placeholders.selectAffreteur')} />
                      </SelectTrigger>
                      <SelectContent>
                        {getUsersByRole('affreteur').map((affreteur) => (
                          <SelectItem key={affreteur.id} value={affreteur.id}>
                            {affreteur.firstName} {affreteur.lastName} ({affreteur.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {touched.affreteurId && errors.affreteurId && (
                      <div className="text-sm text-red-600 mt-1">{errors.affreteurId}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex flex-1 justify-between items-center">
                      <h1 className="font-medium">{tForms('labels.departureAddress')}</h1>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFieldValue('adresseDepart', INITIAL_VALUES.adresseDepart)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between gap-4">
                      <div className="flex space-y-2 items-center gap-2 w-full">
                        <Label htmlFor="label">{tForms('labels.addressLabel')}</Label>
                        <Input
                          name="label"
                          value={values.adresseDepart!.label}
                          onChange={(e) => handleNewAddressChange(e, 'departure', setFieldValue)}
                          placeholder={tForms('placeholders.addressLabel')}
                          className={cn(
                            'w-full',
                            touched.typeMarchandise && errors.adresseDepart && 'border-red-500'
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>{tForms('labels.selectWithGoogleMaps')}</Label>
                        <div className="mt-2">
                          <ClientSideAddressPicker
                            onAddressSelect={(addressDetails) => {
                              const convertedAddress =
                                convertAddressDetailsToAddress(addressDetails);
                              setFieldValue('adresseDepart', convertedAddress);
                              setFieldTouched('adresseDepart', true);
                            }}
                            onClear={() =>
                              setFieldValue('adresseDepart', INITIAL_VALUES.adresseDepart)
                            }
                            placeholder={tForms('placeholders.searchDepartureAddress')}
                            showMap={true}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {values.adresseDepart && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                      <p className="font-medium">{values.adresseDepart.label}</p>
                      <p>{values.adresseDepart.street}</p>
                      <p>
                        {values.adresseDepart.postalCode} {values.adresseDepart.city}
                      </p>
                      {values.adresseDepart.region && <p>{values.adresseDepart.region}</p>}
                      <p>{values.adresseDepart.country}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {tForms('labels.coordinates')}:{' '}
                        {Number(values.adresseDepart.latitude)?.toFixed(6)},{' '}
                        {Number(values.adresseDepart.longitude)?.toFixed(6)}
                      </p>
                    </div>
                  )}
                  {touched.typeMarchandise && errors.adresseDepart && (
                    <div className="text-sm text-red-600 mt-1">
                      {tForms('validation.addressRequired')}
                    </div>
                  )}
                </div>

                <div>
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h1 className="font-medium">{tForms('labels.arrivalAddress')}</h1>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFieldValue('adresseArrivee', INITIAL_VALUES.adresseArrivee)
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between gap-4">
                      <div className="flex space-y-2 items-center gap-2 w-full">
                        <Label htmlFor="label">{tForms('labels.addressLabel')}</Label>
                        <Input
                          name="label"
                          value={values.adresseArrivee!.label}
                          onBlur={(e) => {
                            handleBlur(e);
                            setFieldTouched('adresseArrivee.label', true);
                          }}
                          onChange={(e) => handleNewAddressChange(e, 'arrival', setFieldValue)}
                          placeholder={tForms('placeholders.addressLabel')}
                          className={cn(
                            'w-full',
                            touched.typeMarchandise && errors.adresseArrivee && 'border-red-500'
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>{tForms('labels.selectWithGoogleMaps')}</Label>
                        <div className="mt-2">
                          <ClientSideAddressPicker
                            onAddressSelect={(addressDetails) => {
                              const convertedAddress =
                                convertAddressDetailsToAddress(addressDetails);
                              setFieldValue('adresseArrivee', convertedAddress);
                              setFieldTouched('adresseArrivee', true);
                            }}
                            onClear={() =>
                              setFieldValue('adresseArrivee', INITIAL_VALUES.adresseArrivee)
                            }
                            placeholder={tForms('placeholders.searchArrivalAddress')}
                            showMap={true}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {values.adresseArrivee && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                      <p className="font-medium">{values.adresseArrivee.label}</p>
                      <p>{values.adresseArrivee.street}</p>
                      <p>
                        {values.adresseArrivee.postalCode} {values.adresseArrivee.city}
                      </p>
                      {values.adresseArrivee.region && <p>{values.adresseArrivee.region}</p>}
                      <p>{values.adresseArrivee.country}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {tForms('labels.coordinates')}:{' '}
                        {Number(values.adresseArrivee.latitude)?.toFixed(6)},{' '}
                        {Number(values.adresseArrivee.longitude)?.toFixed(6)}
                      </p>
                    </div>
                  )}

                  {touched.typeMarchandise && errors.adresseArrivee && (
                    <div className="text-sm text-red-600 mt-1">
                      {tForms('validation.addressRequired')}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="typeMarchandise">{tForms('labels.cargoType')}</Label>
                  <Input
                    id="typeMarchandise"
                    name="typeMarchandise"
                    type="text"
                    placeholder={tForms('placeholders.cargoType')}
                    value={values.typeMarchandise || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={cn(
                      touched.typeMarchandise && errors.typeMarchandise && 'border-red-500'
                    )}
                  />
                  {touched.typeMarchandise && errors.typeMarchandise && (
                    <div className="text-sm text-red-600 mt-1">{errors.typeMarchandise}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="poids">{tForms('labels.weight')}</Label>
                  <Input
                    id="poids"
                    name="poids"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={values.poids || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={cn(touched.poids && errors.poids && 'border-red-500')}
                  />
                  {touched.poids && errors.poids && (
                    <div className="text-sm text-red-600 mt-1">{errors.poids}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="volume">{tForms('labels.volume')}</Label>
                  <Input
                    id="volume"
                    name="volume"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={values.volume || ''}
                    onChange={(e) =>
                      setFieldValue('volume', e.target.value ? parseFloat(e.target.value) : null)
                    }
                    onBlur={(e) => {
                      handleBlur(e);
                      setFieldTouched('volume', true);
                    }}
                    className={cn(touched.volume && errors.volume && 'border-red-500')}
                  />
                  {touched.volume && errors.volume && (
                    <div className="text-sm text-red-600 mt-1">{errors.volume}</div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">{tForms('labels.missionDescription')}</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder={tForms('placeholders.missionDescription')}
                  value={values.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={cn(touched.description && errors.description && 'border-red-500')}
                  rows={4}
                />
                {touched.description && errors.description && (
                  <div className="text-sm text-red-600 mt-1">{errors.description}</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {tForms('sections.missionDates')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{tForms('labels.estimatedDepartureDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !values.dateDepartEstime && 'text-muted-foreground',
                          touched.dateDepartEstime && errors.dateDepartEstime && 'border-red-500'
                        )}
                        onBlur={() => setFieldTouched('dateDepartEstime', true)}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {values.dateDepartEstime
                          ? format(new Date(values.dateDepartEstime), 'dd MMM yyyy')
                          : tForms('placeholders.selectDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          values.dateDepartEstime ? new Date(values.dateDepartEstime) : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            setFieldValue('dateDepartEstime', date);
                            if (
                              values.dateArriveePrevue &&
                              date > new Date(values.dateArriveePrevue)
                            ) {
                              setFieldValue('dateArriveePrevue', date);
                            }
                          }
                        }}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {touched.dateDepartEstime && errors.dateDepartEstime && (
                    <div className="text-sm text-red-600 mt-1">{errors.dateDepartEstime}</div>
                  )}
                </div>
                <div>
                  <Label>{tForms('labels.expectedArrivalDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !values.dateArriveePrevue && 'text-muted-foreground',
                          touched.dateArriveePrevue && errors.dateArriveePrevue && 'border-red-500'
                        )}
                        onBlur={() => setFieldTouched('dateArriveePrevue', true)}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {values.dateArriveePrevue
                          ? format(new Date(values.dateArriveePrevue), 'dd MMM yyyy')
                          : tForms('placeholders.selectDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          values.dateArriveePrevue ? new Date(values.dateArriveePrevue) : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            setFieldValue('dateArriveePrevue', date);
                            setFieldTouched('dateArriveePrevue', true);
                          }
                        }}
                        initialFocus
                        disabled={(date) =>
                          values.dateDepartEstime
                            ? date < new Date(values.dateDepartEstime)
                            : date < new Date()
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  {touched.dateArriveePrevue && errors.dateArriveePrevue && (
                    <div className="text-sm text-red-600 mt-1">{errors.dateArriveePrevue}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {tForms('sections.dynamicPricing')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dynamic Pricing Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-tsa-blue" />
                    <p className="text-sm text-blue-700 mb-3">
                      {tForms('messages.dynamicPricingDescription')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => calculateDynamicPricing(values)}
                    disabled={
                      isCalculatingPrice ||
                      !values.adresseDepart ||
                      !values.adresseArrivee ||
                      !values.poids ||
                      !values.volume
                    }
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    {isCalculatingPrice ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {tForms('messages.calculating')}
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        {tForms('buttons.calculatePrice')}
                      </>
                    )}
                  </Button>
                </div>

                {dynamicPricing && showDynamicPricing && (
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">{tForms('labels.distance')}</p>
                        <p className="font-medium">
                          {dynamicPricing.breakdown.distance_factor.toFixed(1)} km
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{tForms('labels.estimatedPrice')}</p>
                        <p className="font-medium text-green-600">
                          {dynamicPricing.calculated_price.toLocaleString()} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{tForms('labels.priceRange')}</p>
                        <p className="font-medium">
                          {(dynamicPricing.calculated_price * 0.8).toLocaleString()} -{' '}
                          {(dynamicPricing.calculated_price * 1.2).toLocaleString()} FCFA
                        </p>
                      </div>
                      <div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => applyDynamicPricing(setFieldValue)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {tForms('buttons.apply')}
                        </Button>
                      </div>
                    </div>
                    {/* {dynamicPricing.factors && (
                      <div className="mt-3 pt-3 border-t border-blue-100">
                        <p className="text-xs text-gray-600 mb-2">Facteurs de prix:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(dynamicPricing.factors).map(([key, value]) => (
                            <span
                              key={key}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )} */}
                  </div>
                )}
              </div>

              {/* Manual Budget Section */}
              <div className="flex justify-center gap-4">
                <div>
                  <Label htmlFor="budgetMin">{tForms('labels.price')}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="budgetMin"
                      name="budgetMin"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="0"
                      value={values.budgetMin}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={cn(
                        'pl-10',
                        touched.budgetMin && errors.budgetMin && 'border-red-500'
                      )}
                    />
                  </div>
                  {touched.budgetMin && errors.budgetMin && (
                    <div className="text-sm text-red-600 mt-1">{errors.budgetMin}</div>
                  )}
                  {/* <p className="text-xs text-gray-500 mt-1">
                    Les transporteurs peuvent négocier ce prix
                  </p> */}
                </div>
                {/* <div>
                  <Label htmlFor="budgetMax">Budget Maximum (FCFA)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="budgetMax"
                      name="budgetMax"
                      type="number"
                      min={values.budgetMin || 0}
                      step="1000"
                      placeholder="0"
                      value={values.budgetMax || ''}
                      onChange={(e) =>
                        setFieldValue(
                          'budgetMax',
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      onBlur={handleBlur}
                      className={cn(
                        'pl-10',
                        touched.budgetMax && errors.budgetMax && 'border-red-500'
                      )}
                    />
                  </div>
                  {touched.budgetMax && errors.budgetMax && (
                    <div className="text-sm text-red-600 mt-1">{errors.budgetMax}</div>
                  )}
                </div> */}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            {!currentMission && (
              <>
                <Button
                  type="submit"
                  className="flex-1"
                  style={{ backgroundColor: 'var(--tsa-blue)' }}
                  disabled={isSubmitting || Object.keys(errors).length > 0}
                  onClick={() => {
                    // Set status to 'draft' and submit
                    onSubmit({ ...values }, 'create', true);
                  }}
                >
                  <Package className="h-4 w-4 mr-2" />
                  {isSubmitting ? tForms('messages.publishing') : tForms('buttons.publishMission')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Set status to 'draft' and submit
                    onSubmit({ ...values }, 'create', false);
                  }}
                  disabled={isSubmitting || Object.keys(errors).length > 0}
                >
                  {isSubmitting ? tForms('messages.saving') : tForms('buttons.saveAsDraft')}
                </Button>
              </>
            )}
            {currentMission && (
              <>
                <Button
                  className="flex-1"
                  style={{ backgroundColor: 'var(--tsa-blue)' }}
                  disabled={isSubmitting || Object.keys(errors).length > 0}
                  onClick={() => {
                    // Set status to 'draft' and submit
                    onSubmit({ ...values }, 'update', currentMission.status === 'draft');
                  }}
                >
                  <Package className="h-4 w-4 mr-2" />
                  {isSubmitting
                    ? currentMission?.status === 'draft'
                      ? tForms('messages.updatingAndPublishing')
                      : tForms('messages.updating')
                    : currentMission?.status === 'draft'
                      ? tForms('buttons.updateAndPublishMission')
                      : tForms('buttons.updateMission')}
                </Button>
                {currentMission?.status === 'draft' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // Set status to 'draft' and submit
                      onSubmit({ ...values }, 'update', false);
                    }}
                    disabled={isSubmitting || Object.keys(errors).length > 0}
                  >
                    {isSubmitting ? tForms('messages.updating') : tForms('buttons.updateDraft')}
                  </Button>
                )}
              </>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
}
