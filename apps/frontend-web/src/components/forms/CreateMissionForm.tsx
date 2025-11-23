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
import {
  CalendarIcon,
  Package,
  DollarSign,
  Plus,
  MapPin,
  Clock,
  X,
  Calculator,
  Loader2,
} from 'lucide-react';
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
import type { Address, AddressDetails, CreateAddressDto } from '@/types/address.types';
import { useMissions } from '@/hooks/useMissions';
import { missionService } from '@/services/mission.service';
import { GoogleMapsService } from '@/services/google-maps.service';
import { toast } from 'sonner';
import { useErrorsTranslation, useFormsTranslation } from '@/hooks/useTranslation';
import { useAddresses } from '@/hooks/useAddresses';

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
  selectedAddress?: Address | CreateAddressDto;
  onAddressSelect: (address: AddressDetails) => void;
  onClear?: () => void;
  placeholder?: string;
  value?: string;
  className?: string;
  showMap?: boolean;
}

// Client-side only wrapper for AddressPicker
const ClientSideAddressPicker = ({
  selectedAddress,
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
        selectedAddress={selectedAddress}
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
    volume: Yup.number().min(0, tForms('validation.positive')).nullable(),
    dateDepartEstime: Yup.date()
      .required(tForms('validation.required'))
      .typeError(tForms('validation.date')),
    dateArriveePrevue: Yup.date()
      .required(tForms('validation.required'))
      .typeError(tForms('validation.date')),
    adresseDepart: Yup.object({
      street: Yup.string().nullable(),
      city: Yup.string().required(tForms('validation.required')),
      postalCode: Yup.string().nullable(),
      country: Yup.string().required(tForms('validation.required')),
      label: Yup.string().required(tForms('validation.required')),
      region: Yup.string().required(tForms('validation.required')),
      latitude: Yup.number().required(tForms('validation.coordinatesRequired')),
      longitude: Yup.number().required(tForms('validation.coordinatesRequired')),
    }).required(tForms('validation.addressRequired')),
    adresseArrivee: Yup.object({
      street: Yup.string().nullable(),
      city: Yup.string().required(tForms('validation.required')),
      postalCode: Yup.string().nullable(),
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

export default function CreateMissionForm({ onSubmit, isSubmitting }: CreateMissionFormProps) {
  const { user } = useAuth();
  const { addresses, convertAddress } = useAddresses();
  const { getUsersByRole } = useUsers();
  const { currentMission } = useMissions();
  const { t: tForms } = useFormsTranslation();
  const { t: tErrors } = useErrorsTranslation();

  const [showNewAddressForm, setShowNewAddressForm] = useState<'departure' | 'arrival' | null>(
    null
  );

  // Dynamic pricing state
  const [dynamicPricing, setDynamicPricing] = useState<DynamicPricingResponse | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [showDynamicPricing, setShowDynamicPricing] = useState(false);

  // Date picker popover state
  const [departureDateOpen, setDepartureDateOpen] = useState(false);
  const [arrivalDateOpen, setArrivalDateOpen] = useState(false);

  const INITIAL_VALUES: CreateMissionDto = {
    title: currentMission?.title || '',
    affreteurId: currentMission?.affreteurId || (user?.role === 'admin' ? '' : user?.id || ''),
    description: currentMission?.description || '',
    typeMarchandise: currentMission?.typeMarchandise || '',
    poids: currentMission?.poids || 0,
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
      latitude: null,
      longitude: null,
    },
    adresseArrivee: currentMission?.adresseArrivee || {
      street: '',
      city: '',
      region: '',
      country: '',
      postalCode: '',
      label: '',
      latitude: null,
      longitude: null,
    },
    budgetMin: currentMission?.budgetMin || 0,
    budgetMax: currentMission?.budgetMax || 0,
  };

  // Calculate dynamic pricing
  const calculateDynamicPricing = async (
    formValues: CreateMissionDto,
    autoApply = false,
    setFieldValue?: (field: string, value: number) => void
  ) => {
    if (!formValues.adresseDepart || !formValues.adresseArrivee || !formValues.poids) {
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
          lat: Number(formValues.adresseDepart.latitude),
          lng: Number(formValues.adresseDepart.longitude),
        },
        {
          lat: Number(formValues.adresseArrivee.latitude),
          lng: Number(formValues.adresseArrivee.longitude),
        }
      );

      if (!distanceResult) {
        // Fallback to straight-line distance if directions fail
        const straightLineDistance = await googleMapsService.calculateDistance(
          {
            lat: Number(formValues.adresseDepart.latitude),
            lng: Number(formValues.adresseDepart.longitude),
          },
          {
            lat: Number(formValues.adresseArrivee.latitude),
            lng: Number(formValues.adresseArrivee.longitude),
          }
        );

        if (!straightLineDistance) {
          toast.error(tErrors('missions.cannotCalculateDistance'));
          return;
        }

        // Use straight-line distance with a 1.3 multiplier for road distance estimation
        const estimatedDistance = Math.round(straightLineDistance * 1.3);

        const pricingRequest: DynamicPricingRequest = {
          origin: formValues.adresseDepart.label!,
          destination: formValues.adresseArrivee.label!,
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
          if (autoApply && setFieldValue) {
            setFieldValue('budgetMin', response.data.calculated_price);
          }
          toast.success(
            `${tForms('messages.dynamicPricingCalculated')} (Distance estimée: ${estimatedDistance} km)`
          );
        }
      } else {
        // Use actual driving distance from Google Directions API
        const pricingRequest: DynamicPricingRequest = {
          origin: formValues.adresseDepart.label!,
          destination: formValues.adresseArrivee.label!,
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
          if (autoApply) {
            // Auto-apply pricing when called from useEffect
            return response.data;
          }
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
      setFieldValue('budgetMin', dynamicPricing.calculated_price);
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
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldTouched }) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (
            (!currentMission && values.budgetMin > 0) ||
            (currentMission &&
              (currentMission.budgetMin !== values.budgetMin ||
                currentMission.adresseDepart?.latitude !== values.adresseDepart.latitude ||
                currentMission.adresseDepart?.longitude !== values.adresseDepart.longitude ||
                currentMission.adresseArrivee?.latitude !== values.adresseArrivee.latitude ||
                currentMission.adresseArrivee?.longitude !== values.adresseArrivee.longitude ||
                currentMission.poids !== values.poids))
          ) {
            calculateDynamicPricing(values, true, setFieldValue);
            applyDynamicPricing(setFieldValue);
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [
          values.adresseDepart.latitude,
          values.adresseDepart.longitude,
          values.adresseArrivee.latitude,
          values.adresseArrivee.longitude,
          values.poids,
        ]);

        return (
          <Form className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  {tForms('sections.missionDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="title">{tForms('labels.missionTitle')}</Label>
                    <Input
                      id="title"
                      name="title"
                      type="text"
                      placeholder={tForms('placeholders.missionTitle')}
                      value={values.title || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={cn(touched.title && errors.title && 'border-red-500')}
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
                        }}
                      >
                        <SelectTrigger
                          className={cn(
                            'w-full',
                            touched.affreteurId && errors.affreteurId && 'border-red-500'
                          )}
                          onBlur={handleBlur}
                        >
                          <SelectValue placeholder={tForms('placeholders.selectAffreteur')} />
                        </SelectTrigger>
                        <SelectContent>
                          {getUsersByRole('affreteur').map((affreteur) => (
                            <SelectItem key={affreteur.id} value={affreteur.id}>
                              <span className="truncate">
                                {affreteur.firstName} {affreteur.lastName} ({affreteur.email})
                              </span>
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    {showNewAddressForm === 'departure' ? (
                      <div className="p-3 sm:p-4 border rounded-lg bg-gray-50">
                        <div className="flex flex-1 justify-between items-center mb-3 sm:mb-4">
                          <h1 className="font-medium text-sm sm:text-base">
                            {tForms('labels.departureAddress')}
                          </h1>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowNewAddressForm(null);
                              setFieldValue('adresseDepart', INITIAL_VALUES.adresseDepart);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className="flex flex-col space-y-2 w-full">
                            <Label htmlFor="label" className="text-xs sm:text-sm">
                              {tForms('labels.addressLabel')}
                            </Label>
                            <Input
                              name="label"
                              value={values.adresseDepart!.label}
                              onChange={(e) =>
                                handleNewAddressChange(e, 'departure', setFieldValue)
                              }
                              onBlur={handleBlur}
                              placeholder={tForms('placeholders.addressLabel')}
                              className={cn(
                                'w-full',
                                (touched.adresseDepart || touched.adresseDepart) &&
                                  errors.adresseDepart &&
                                  'border-red-500'
                              )}
                            />
                          </div>
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <Label className="text-xs sm:text-sm">
                              {tForms('labels.selectWithGoogleMaps')}
                            </Label>
                            <div className="mt-2">
                              <ClientSideAddressPicker
                                selectedAddress={values.adresseDepart}
                                onAddressSelect={(addressDetails) => {
                                  setFieldTouched('adresseDepart', true);
                                  const convertedAddress = convertAddress(addressDetails);
                                  setFieldValue('adresseDepart', convertedAddress);
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
                    ) : (
                      <div className="p-3 sm:p-4 border rounded-lg bg-gray-50">
                        <div className="flex flex-1 justify-between items-center mb-3 sm:mb-4">
                          <h1 className="font-medium text-sm sm:text-base">
                            {tForms('labels.departureAddress')}
                          </h1>
                        </div>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Select
                            value={
                              'id' in values.adresseDepart && values.adresseDepart.id
                                ? values.adresseDepart.id
                                : ''
                            }
                            onValueChange={(value) => {
                              if (value === 'new') {
                                setShowNewAddressForm('departure');
                              } else {
                                const selectedAddress = addresses.find((addr) => addr.id === value);
                                if (selectedAddress)
                                  setFieldValue('adresseDepart', selectedAddress);
                              }
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                'pl-10',
                                'w-full',
                                touched.adresseDepart && errors.adresseDepart && 'border-red-500'
                              )}
                            >
                              <SelectValue
                                placeholder={
                                  values.adresseDepart?.label ||
                                  tForms('placeholders.selectAddress')
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 text-primary"
                                  onClick={() => setShowNewAddressForm('departure')}
                                >
                                  <Plus className="h-4 w-4" />
                                  <span>{tForms('labels.newAddress')}</span>
                                </button>
                              </div>
                              {addresses.map((address) => (
                                <SelectItem key={address.id} value={address.id}>
                                  {address.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {values.adresseDepart && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md text-xs sm:text-sm">
                        <p className="font-medium truncate">{values.adresseDepart.label}</p>
                        <p className="truncate">{values.adresseDepart.street}</p>
                        <p className="truncate">
                          {values.adresseDepart.postalCode} {values.adresseDepart.city}
                        </p>
                        {values.adresseDepart.region && (
                          <p className="truncate">{values.adresseDepart.region}</p>
                        )}
                        <p className="truncate">{values.adresseDepart.country}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {tForms('labels.coordinates')}:{' '}
                          {Number(values.adresseDepart.latitude)?.toFixed(6)},{' '}
                          {Number(values.adresseDepart.longitude)?.toFixed(6)}
                        </p>
                      </div>
                    )}

                    {touched.adresseDepart && errors.adresseDepart && (
                      <div className="text-sm text-red-600 mt-1">
                        {tForms('validation.addressRequired')}
                      </div>
                    )}
                  </div>

                  <div>
                    {showNewAddressForm === 'arrival' ? (
                      <div className="p-3 sm:p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                          <h1 className="font-medium text-sm sm:text-base">
                            {tForms('labels.arrivalAddress')}
                          </h1>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowNewAddressForm(null);
                              setFieldValue('adresseArrivee', INITIAL_VALUES.adresseArrivee);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className="flex flex-col space-y-2 w-full">
                            <Label htmlFor="label" className="text-xs sm:text-sm">
                              {tForms('labels.addressLabel')}
                            </Label>
                            <Input
                              name="label"
                              value={values.adresseArrivee!.label}
                              onChange={(e) => handleNewAddressChange(e, 'arrival', setFieldValue)}
                              onBlur={handleBlur}
                              placeholder={tForms('placeholders.addressLabel')}
                              className={cn(
                                'w-full',
                                (touched.adresseArrivee || touched.adresseArrivee) &&
                                  errors.adresseArrivee &&
                                  'border-red-500'
                              )}
                            />
                          </div>
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <Label className="text-xs sm:text-sm">
                              {tForms('labels.selectWithGoogleMaps')}
                            </Label>
                            <div className="mt-2">
                              <ClientSideAddressPicker
                                selectedAddress={values.adresseArrivee}
                                onAddressSelect={(addressDetails) => {
                                  setFieldTouched('adresseArrivee', true);
                                  const convertedAddress = convertAddress(addressDetails);
                                  setFieldValue('adresseArrivee', convertedAddress);
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
                    ) : (
                      <div className="p-3 sm:p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                          <h1 className="font-medium text-sm sm:text-base">
                            {tForms('labels.arrivalAddress')}
                          </h1>
                        </div>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Select
                            value={
                              'id' in values.adresseArrivee && values.adresseArrivee.id
                                ? values.adresseArrivee.id
                                : ''
                            }
                            onValueChange={(value) => {
                              if (value === 'new') {
                                setShowNewAddressForm('arrival');
                              } else {
                                const selectedAddress = addresses.find((addr) => addr.id === value);
                                if (selectedAddress) {
                                  setFieldValue('adresseArrivee', selectedAddress);
                                }
                              }
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                'pl-10',
                                'w-full',
                                touched.adresseArrivee && errors.adresseArrivee && 'border-red-500'
                              )}
                            >
                              <SelectValue
                                placeholder={
                                  values.adresseArrivee?.label ||
                                  tForms('placeholders.selectAddress')
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 text-primary"
                                  onClick={() => setShowNewAddressForm('arrival')}
                                >
                                  <Plus className="h-4 w-4" />
                                  <span>{tForms('labels.newAddress')}</span>
                                </button>
                              </div>
                              {addresses.map((address) => (
                                <SelectItem key={address.id} value={address.id}>
                                  {address.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {values.adresseArrivee && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md text-xs sm:text-sm">
                        <p className="font-medium truncate">{values.adresseArrivee.label}</p>
                        <p className="truncate">{values.adresseArrivee.street}</p>
                        <p className="truncate">
                          {values.adresseArrivee.postalCode} {values.adresseArrivee.city}
                        </p>
                        {values.adresseArrivee.region && (
                          <p className="truncate">{values.adresseArrivee.region}</p>
                        )}
                        <p className="truncate">{values.adresseArrivee.country}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {tForms('labels.coordinates')}:{' '}
                          {Number(values.adresseArrivee.latitude)?.toFixed(6)},{' '}
                          {Number(values.adresseArrivee.longitude)?.toFixed(6)}
                        </p>
                      </div>
                    )}

                    {touched.adresseArrivee && errors.adresseArrivee && (
                      <div className="text-sm text-red-600 mt-1">
                        {tForms('validation.addressRequired')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                      step="0.1"
                      placeholder={tForms('placeholders.weight')}
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
                      step="0.1"
                      placeholder={tForms('placeholders.volume')}
                      value={values.volume || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={cn(touched.volume && errors.volume && 'border-red-500')}
                    />
                    {touched.volume && errors.volume && (
                      <div className="text-sm text-red-600 mt-1">{errors.volume}</div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">{tForms('labels.description')}</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder={tForms('placeholders.missionDescription')}
                    value={values.description || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={cn(
                      'min-h-[100px] resize-none',
                      touched.description && errors.description && 'border-red-500'
                    )}
                  />
                  {touched.description && errors.description && (
                    <div className="text-sm text-red-600 mt-1">{errors.description}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  {tForms('sections.schedule')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label>{tForms('labels.estimatedDepartureDate')}</Label>
                    <Popover open={departureDateOpen} onOpenChange={setDepartureDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !values.dateDepartEstime && 'text-muted-foreground',
                            touched.dateDepartEstime && errors.dateDepartEstime && 'border-red-500'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {values.dateDepartEstime ? (
                            format(new Date(values.dateDepartEstime), 'dd MMM yyy')
                          ) : (
                            <span>{tForms('placeholders.selectDate')}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                              setDepartureDateOpen(false);
                            }
                          }}
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
                    <Popover open={arrivalDateOpen} onOpenChange={setArrivalDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !values.dateArriveePrevue && 'text-muted-foreground',
                            touched.dateArriveePrevue &&
                              errors.dateArriveePrevue &&
                              'border-red-500'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {values.dateArriveePrevue ? (
                            format(new Date(values.dateArriveePrevue), 'dd MMM yyy')
                          ) : (
                            <span>{tForms('placeholders.selectDate')}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            values.dateArriveePrevue
                              ? new Date(values.dateArriveePrevue)
                              : undefined
                          }
                          onSelect={(date) => {
                            setFieldValue('dateArriveePrevue', date ? date.toISOString() : '');
                            if (date) {
                              setArrivalDateOpen(false);
                            }
                          }}
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

            <Card className="gap-0">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                  {tForms('sections.pricing')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4 sm:space-y-6">
                {/* Dynamic Pricing Section */}
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-sm sm:text-base text-blue-900">
                        {tForms('sections.dynamicPricing')}
                      </h3>
                      <p className="text-xs sm:text-sm text-blue-700 mt-1">
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
                      className="border-blue-300 text-blue-700 hover:bg-blue-100 w-full sm:w-auto"
                    >
                      {isCalculatingPrice ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          <span>{tForms('messages.calculating')}</span>
                        </>
                      ) : (
                        <>
                          <Calculator className="h-4 w-4 mr-2" />
                          <span>{tForms('buttons.calculatePrice')}</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {dynamicPricing && showDynamicPricing && (
                    <div className="bg-white p-3 sm:p-4 rounded-lg border border-blue-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {tForms('labels.calculatedDistance')}
                          </p>
                          <p className="text-base sm:text-lg font-semibold text-gray-900">
                            {dynamicPricing.distance_km.toFixed(1)} km
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs sm:text-sm text-gray-600">
                            {tForms('labels.estimatedPrice')}
                          </p>
                          <p className="text-xl sm:text-2xl font-bold text-green-600">
                            {dynamicPricing.calculated_price.toLocaleString()} FCFA
                          </p>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-md space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
                          <span className="text-gray-700">{tForms('labels.negotiationRange')}</span>
                          <span className="font-medium text-blue-900">
                            {dynamicPricing.negotiation_range.min_price.toLocaleString()} -{' '}
                            {dynamicPricing.negotiation_range.max_price.toLocaleString()} FCFA
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs">
                          <span className="text-gray-600">{tForms('labels.margin')}</span>
                          <span className="font-medium text-gray-700">
                            ±{dynamicPricing.negotiation_range.margin_percentage}%
                          </span>
                        </div>
                        {dynamicPricing.negotiation_range.reason && (
                          <div className="text-xs text-gray-600 italic">
                            {dynamicPricing.negotiation_range.reason}
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => applyDynamicPricing(setFieldValue)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        {tForms('buttons.applyPrice')}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Manual Budget Section */}
                <div>
                  <Label htmlFor="budgetMin">{tForms('placeholders.budgetWillingToPay')}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="budgetMin"
                      name="budgetMin"
                      type="number"
                      min="0"
                      max={dynamicPricing?.negotiation_range.max_price}
                      step="0.1"
                      placeholder={tForms('placeholders.budgetExample')}
                      value={values.budgetMin || ''}
                      onChange={(e) =>
                        setFieldValue(
                          'budgetMin',
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      onBlur={(e) => {
                        handleBlur(e);
                        setFieldTouched('budgetMin', true);
                      }}
                      className={cn(
                        'pl-10',
                        touched.budgetMin && errors.budgetMin && 'border-red-500'
                      )}
                      disabled={!dynamicPricing}
                    />
                  </div>
                  {touched.budgetMin && errors.budgetMin && (
                    <div className="text-sm text-red-600 mt-1">{errors.budgetMin}</div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {tForms('placeholders.budgetHelper')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {!currentMission && (
                <>
                  <Button
                    type="submit"
                    className="flex-1 w-full sm:w-auto"
                    style={{ backgroundColor: 'var(--tsa-blue)' }}
                    disabled={isSubmitting || Object.keys(errors).length > 0}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    <span>
                      {isSubmitting
                        ? tForms('messages.publishing')
                        : tForms('buttons.publishMission')}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={(e) => {
                      e.preventDefault();
                      // Set status to 'draft' and submit
                      onSubmit({ ...values }, 'create', false);
                    }}
                    disabled={isSubmitting || Object.keys(errors).length > 0}
                  >
                    <span>
                      {isSubmitting ? tForms('messages.saving') : tForms('buttons.saveAsDraft')}
                    </span>
                  </Button>
                </>
              )}
              {currentMission && (
                <>
                  <Button
                    type="submit"
                    className="flex-1 w-full sm:w-auto"
                    style={{ backgroundColor: 'var(--tsa-blue)' }}
                    disabled={isSubmitting || Object.keys(errors).length > 0}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    <span>
                      {isSubmitting
                        ? currentMission?.status === 'draft'
                          ? tForms('messages.updatingAndPublishing')
                          : tForms('messages.updating')
                        : currentMission?.status === 'draft'
                          ? tForms('buttons.updateAndPublishMission')
                          : tForms('buttons.updateMission')}
                    </span>
                  </Button>
                  {currentMission?.status === 'draft' && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={(e) => {
                        e.preventDefault();
                        // Set status to 'draft' and submit
                        onSubmit({ ...values }, 'update', false);
                      }}
                      disabled={isSubmitting || Object.keys(errors).length > 0}
                    >
                      <span>
                        {isSubmitting ? tForms('messages.updating') : tForms('buttons.updateDraft')}
                      </span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
