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
  MapPin,
  Package,
  DollarSign,
  Clock,
  Plus,
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
import type { Address } from '@/types/address.types';
import { useMissions } from '@/hooks/useMissions';
import { missionService } from '@/services/mission.service';
import { GoogleMapsService } from '@/services/google-maps.service';
import { toast } from 'sonner';
import { useFormsTranslation } from '@/hooks/useTranslation';

// Lazy load AddressPicker with Suspense for client-side rendering
const AddressPicker = lazy(() => import('@/components/maps/AddressPicker'));

// Loading component for Suspense fallback
const AddressPickerLoading = () => {
  const { t } = useFormsTranslation();
  return (
    <div className="h-64 w-full bg-gray-100 flex items-center justify-center">
      <div className="animate-pulse">{t('messages.loadingAddressPicker')}</div>
    </div>
  );
};

// Import AddressDetails type
import type { AddressDetails } from '@/components/maps/AddressPicker';

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

const validationSchema = (t: (key: string) => string) =>
  Yup.object({
    title: Yup.string().required(t('validation.required')),
    affreteurId: Yup.string().when('$isAdmin', {
      is: true,
      then: (schema) => schema.required(t('validation.required')),
      otherwise: (schema) => schema.optional(),
    }),
    description: Yup.string(),
    typeMarchandise: Yup.string(),
    poids: Yup.number().min(0, t('validation.positive')),
    volume: Yup.number().min(0, t('validation.positive')),
    dateDepartEstime: Yup.date().required(t('validation.required')).typeError(t('validation.date')),
    dateArriveePrevue: Yup.date().typeError(t('validation.date')),
    adresseDepart: Yup.object({
      street: Yup.string().required(t('validation.required')),
      city: Yup.string().required(t('validation.required')),
      postalCode: Yup.string(),
      country: Yup.string().required(t('validation.required')),
      label: Yup.string().required(t('validation.required')),
      region: Yup.string().required(t('validation.required')),
      latitude: Yup.number().required(t('validation.coordinatesRequired')),
      longitude: Yup.number().required(t('validation.coordinatesRequired')),
    }).required(t('validation.addressRequired')),
    adresseArrivee: Yup.object({
      street: Yup.string().required(t('validation.required')),
      city: Yup.string().required(t('validation.required')),
      postalCode: Yup.string(),
      country: Yup.string().required(t('validation.required')),
      label: Yup.string().required(t('validation.required')),
      region: Yup.string().required(t('validation.required')),
      latitude: Yup.number().required(t('validation.coordinatesRequired')),
      longitude: Yup.number().required(t('validation.coordinatesRequired')),
    }).required(t('validation.addressRequired')),
    budgetMin: Yup.number().min(0, t('validation.positive')),
    budgetMax: Yup.number().min(Yup.ref('budgetMin'), t('validation.budgetMaxGreaterThanMin')),
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
    label:
      addressDetails.locality ||
      addressDetails.formatted_address.split(',')[0] ||
      'Nouvelle adresse',
    street:
      `${addressDetails.street_number || ''} ${addressDetails.route || ''}`.trim() ||
      addressDetails.formatted_address.split(',')[0] ||
      '',
    city: addressDetails.locality || '',
    region: addressDetails.administrative_area_level_1 || '',
    country: addressDetails.country || '',
    postalCode: addressDetails.postal_code || '',
    latitude: addressDetails.latitude,
    longitude: addressDetails.longitude,
  };
};

export default function CreateMissionForm({
  onSubmit,
  isSubmitting,
  addresses,
}: CreateMissionFormProps) {
  const { user } = useAuth();
  const { getUsersByRole } = useUsers();
  const { currentMission } = useMissions();
  const { t } = useFormsTranslation();

  const [showNewAddressForm, setShowNewAddressForm] = useState<'departure' | 'arrival' | null>(
    null
  );
  const [newAddress, setNewAddress] = useState<NewAddressFormData>({
    label: '',
    street: '',
    city: '',
    region: '',
    country: 'Cameroun',
    postalCode: '00000',
    latitude: 3.848, // Default to Yaoundé, Cameroon
    longitude: 11.5021,
  });

  // Dynamic pricing state
  const [dynamicPricing, setDynamicPricing] = useState<DynamicPricingResponse | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [showDynamicPricing, setShowDynamicPricing] = useState(false);

  const INITIAL_VALUES: CreateMissionDto = {
    title: currentMission?.title || '',
    affreteurId: currentMission?.affreteurId || (user?.role === 'admin' ? '' : user?.id || ''),
    description: currentMission?.description || '',
    typeMarchandise: currentMission?.typeMarchandise || '',
    poids: currentMission?.poids || 0,
    volume: currentMission?.volume || 0,
    dateDepartEstime: currentMission?.dateDepartEstime || '',
    dateArriveePrevue: currentMission?.dateArriveePrevue || '',
    adresseDepart: currentMission?.adresseDepart || undefined,
    adresseArrivee: currentMission?.adresseArrivee || undefined,
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
      toast.error(t('messages.fillAddressesForPricing'));
      return;
    }

    // Validate that addresses have coordinates
    if (
      !formValues.adresseDepart.latitude ||
      !formValues.adresseDepart.longitude ||
      !formValues.adresseArrivee.latitude ||
      !formValues.adresseArrivee.longitude
    ) {
      toast.error(t('messages.addressesNeedCoordinates'));
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
          toast.error(t('messages.cannotCalculateDistance'));
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
            `${t('messages.dynamicPricingCalculated')} (Distance estimée: ${estimatedDistance} km)`
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
            `${t('messages.dynamicPricingCalculated')} (Distance: ${distanceResult.distance} km, Durée: ${Math.round(distanceResult.duration / 60)}h${distanceResult.duration % 60}min)`
          );
        }
      }
    } catch (error) {
      console.error('Error calculating dynamic pricing:', error);
      toast.error(t('messages.dynamicPricingError'));
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  // Apply dynamic pricing to form
  const applyDynamicPricing = (setFieldValue: (field: string, value: number) => void) => {
    if (dynamicPricing) {
      setFieldValue('budgetMin', dynamicPricing.calculated_price * 0.8); // 20% below estimated
      setFieldValue('budgetMax', dynamicPricing.calculated_price * 1.2); // 20% above estimated
      toast.success(t('messages.dynamicPricingApplied'));
    }
  };

  const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveNewAddress = (
    type: 'departure' | 'arrival',
    setFieldValue: (field: string, value: NewAddressFormData) => void
  ) => {
    // Create a new address object with all required fields
    const newAddressData: NewAddressFormData = {
      street: newAddress.street,
      city: newAddress.city,
      region: newAddress.region,
      country: newAddress.country,
      postalCode: newAddress.postalCode,
      label: newAddress.label,
      latitude: newAddress.latitude,
      longitude: newAddress.longitude,
    };

    // Set the selected address in the form
    setFieldValue(type === 'departure' ? 'adresseDepart' : 'adresseArrivee', newAddressData);

    // Reset the form
    setShowNewAddressForm(null);
    setNewAddress({
      street: '',
      city: '',
      region: '',
      country: 'Cameroun',
      postalCode: '00000',
      label: '',
      latitude: 3.848,
      longitude: 11.5021,
    });
  };

  return (
    <Formik<CreateMissionDto>
      initialValues={INITIAL_VALUES}
      validationSchema={validationSchema}
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
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
        <Form className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('sections.missionDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cn('grid gap-4', {
                  'grid-cols-1 md:grid-cols-2': user?.role === 'admin',
                })}
              >
                <div>
                  <Label htmlFor="title">{t('fields.missionTitle')}</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder={t('placeholders.missionTitle')}
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
                    <Label htmlFor="affreteurId">{t('fields.affreteur')}</Label>
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
                      >
                        <SelectValue placeholder={t('placeholders.selectAffreteur')} />
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
                  <Label htmlFor="adresseDepart">{t('fields.departureAddress')}</Label>
                  {showNewAddressForm === 'departure' ? (
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{t('labels.newAddress')}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewAddressForm(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between gap-4">
                        <div className="flex space-y-2 items-center gap-2 w-full">
                          <Label htmlFor="label">{t('fields.label')}</Label>
                          <Input
                            name="label"
                            value={newAddress.label}
                            onChange={handleNewAddressChange}
                            placeholder={t('placeholders.addressLabel')}
                            className="w-full"
                          />
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            onClick={() => saveNewAddress('departure', setFieldValue)}
                            disabled={!newAddress.street || !newAddress.city}
                          >
                            {t('actions.save')}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label>{t('labels.selectAddressWithMaps')}</Label>
                          <div className="mt-2">
                            <ClientSideAddressPicker
                              onAddressSelect={(addressDetails) => {
                                const convertedAddress =
                                  convertAddressDetailsToAddress(addressDetails);
                                setNewAddress(convertedAddress);
                              }}
                              onClear={() => {
                                setNewAddress({
                                  label: '',
                                  street: '',
                                  city: '',
                                  region: '',
                                  country: 'Cameroun',
                                  postalCode: '00000',
                                  latitude: 3.848,
                                  longitude: 11.5021,
                                });
                              }}
                              placeholder={t('placeholders.searchDepartureAddress')}
                              showMap={true}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Select
                          value={values.adresseDepart?.id || ''}
                          onValueChange={(value) => {
                            if (value === 'new') {
                              setShowNewAddressForm('departure');
                            } else {
                              const selectedAddress = addresses.find((addr) => addr.id === value);
                              if (selectedAddress) {
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                const { id, ...addressWithoutId } = selectedAddress;
                                setFieldValue('adresseDepart', addressWithoutId);
                              }
                            }
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              'pl-10',
                              touched.adresseDepart && errors.adresseDepart && 'border-red-500'
                            )}
                          >
                            <SelectValue
                              placeholder={
                                values.adresseDepart?.label || t('placeholders.selectAddress')
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {addresses.map((address) => (
                              <SelectItem key={address.id} value={address.id}>
                                {address.label}
                              </SelectItem>
                            ))}
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 text-primary"
                                onClick={() => setShowNewAddressForm('departure')}
                              >
                                <Plus className="h-4 w-4" />
                                <span>{t('labels.newAddress')}</span>
                              </button>
                            </div>
                          </SelectContent>
                        </Select>
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
                            {t('labels.coordinates')}:{' '}
                            {Number(values.adresseDepart.latitude)?.toFixed(6)},{' '}
                            {Number(values.adresseDepart.longitude)?.toFixed(6)}
                          </p>
                        </div>
                      )}
                      {touched.adresseDepart && errors.adresseDepart && (
                        <div className="text-sm text-red-600 mt-1">
                          {typeof errors.adresseDepart === 'string'
                            ? errors.adresseDepart
                            : t('validation.departureAddressRequired')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="adresseArrivee">{t('fields.arrivalAddress')}</Label>
                  {showNewAddressForm === 'arrival' ? (
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{t('labels.newAddress')}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewAddressForm(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between gap-4">
                        <div className="flex space-y-2 items-center gap-2 w-full">
                          <Label htmlFor="label">{t('fields.label')}</Label>
                          <Input
                            name="label"
                            value={newAddress.label}
                            onChange={handleNewAddressChange}
                            placeholder={t('placeholders.addressLabel')}
                            className="w-full"
                          />
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            onClick={() => saveNewAddress('arrival', setFieldValue)}
                            disabled={!newAddress.street || !newAddress.city}
                          >
                            {t('actions.save')}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label>{t('labels.selectAddressWithMaps')}</Label>
                          <div className="mt-2">
                            <ClientSideAddressPicker
                              onAddressSelect={(addressDetails) => {
                                const convertedAddress =
                                  convertAddressDetailsToAddress(addressDetails);
                                setNewAddress(convertedAddress);
                              }}
                              onClear={() => {
                                setNewAddress({
                                  label: '',
                                  street: '',
                                  city: '',
                                  region: '',
                                  country: 'Cameroun',
                                  postalCode: '00000',
                                  latitude: 3.848,
                                  longitude: 11.5021,
                                });
                              }}
                              placeholder={t('placeholders.searchArrivalAddress')}
                              showMap={true}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Select
                          value={values.adresseArrivee?.id || ''}
                          onValueChange={(value) => {
                            if (value === 'new') {
                              setShowNewAddressForm('arrival');
                            } else {
                              const selectedAddress = addresses.find((addr) => addr.id === value);
                              if (selectedAddress) {
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                const { id, ...addressWithoutId } = selectedAddress;
                                setFieldValue('adresseArrivee', addressWithoutId);
                              }
                            }
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              'pl-10',
                              touched.adresseArrivee && errors.adresseArrivee && 'border-red-500'
                            )}
                          >
                            <SelectValue
                              placeholder={
                                values.adresseArrivee?.label || t('placeholders.selectAddress')
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {addresses.map((address) => (
                              <SelectItem key={address.id} value={address.id}>
                                {address.label}
                              </SelectItem>
                            ))}
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 text-primary"
                                onClick={() => setShowNewAddressForm('arrival')}
                              >
                                <Plus className="h-4 w-4" />
                                <span>{t('labels.newAddress')}</span>
                              </button>
                            </div>
                          </SelectContent>
                        </Select>
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
                            {t('labels.coordinates')}:{' '}
                            {Number(values.adresseArrivee.latitude)?.toFixed(6)},{' '}
                            {Number(values.adresseArrivee.longitude)?.toFixed(6)}
                          </p>
                        </div>
                      )}
                      {touched.adresseArrivee && errors.adresseArrivee && (
                        <div className="text-sm text-red-600 mt-1">
                          {typeof errors.adresseArrivee === 'string'
                            ? errors.adresseArrivee
                            : t('validation.arrivalAddressRequired')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="typeMarchandise">{t('fields.cargoType')}</Label>
                  <Input
                    id="typeMarchandise"
                    name="typeMarchandise"
                    type="text"
                    placeholder={t('placeholders.cargoType')}
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
                  <Label htmlFor="poids">{t('fields.weight')}</Label>
                  <Input
                    id="poids"
                    name="poids"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={values.poids || ''}
                    onChange={(e) =>
                      setFieldValue('poids', e.target.value ? parseFloat(e.target.value) : null)
                    }
                    onBlur={handleBlur}
                    className={cn(touched.poids && errors.poids && 'border-red-500')}
                  />
                  {touched.poids && errors.poids && (
                    <div className="text-sm text-red-600 mt-1">{errors.poids}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="volume">{t('fields.volume')}</Label>
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
                    onBlur={handleBlur}
                    className={cn(touched.volume && errors.volume && 'border-red-500')}
                  />
                  {touched.volume && errors.volume && (
                    <div className="text-sm text-red-600 mt-1">{errors.volume}</div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">{t('fields.missionDescription')}</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder={t('placeholders.missionDescription')}
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
                {t('sections.missionDates')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('fields.estimatedDepartureDate')}</Label>
                  <Popover>
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
                        {values.dateDepartEstime
                          ? format(new Date(values.dateDepartEstime), 'dd MMM yyyy')
                          : t('placeholders.selectDate')}
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
                  <Label>{t('fields.expectedArrivalDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !values.dateArriveePrevue && 'text-muted-foreground',
                          touched.dateArriveePrevue && errors.dateArriveePrevue && 'border-red-500'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {values.dateArriveePrevue
                          ? format(new Date(values.dateArriveePrevue), 'dd MMM yyyy')
                          : t('placeholders.selectDate')}
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
                {t('sections.budget')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dynamic Pricing Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-tsa-blue" />
                    <h4 className="font-medium text-blue-900">{t('labels.dynamicPricing')}</h4>
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
                        {t('actions.calculating')}
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        {t('actions.calculatePrice')}
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  {t('messages.dynamicPricingDescription')}
                </p>

                {dynamicPricing && showDynamicPricing && (
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">{t('labels.distance')}</p>
                        <p className="font-medium">
                          {dynamicPricing.breakdown.distance_factor.toFixed(1)} km
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('labels.estimatedPrice')}</p>
                        <p className="font-medium text-green-600">
                          {dynamicPricing.calculated_price.toLocaleString()} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('labels.priceRange')}</p>
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
                          {t('actions.apply')}
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
              <div className="flex justify-center w-1/2 gap-4">
                <div>
                  <Label htmlFor="budgetMin">{t('fields.price')}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="budgetMin"
                      name="budgetMin"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="0"
                      value={values.budgetMin || ''}
                      onChange={(e) =>
                        setFieldValue(
                          'budgetMin',
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
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
                  disabled={isSubmitting}
                  onClick={() => {
                    // Set status to 'draft' and submit
                    onSubmit({ ...values }, 'create', true);
                  }}
                >
                  <Package className="h-4 w-4 mr-2" />
                  {isSubmitting ? t('actions.publishing') : t('actions.publishMission')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Set status to 'draft' and submit
                    onSubmit({ ...values }, 'create', false);
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('actions.saving') : t('actions.saveAsDraft')}
                </Button>
              </>
            )}
            {currentMission && (
              <>
                <Button
                  className="flex-1"
                  style={{ backgroundColor: 'var(--tsa-blue)' }}
                  disabled={isSubmitting}
                  onClick={() => {
                    // Set status to 'draft' and submit
                    onSubmit({ ...values }, 'update', currentMission.status === 'draft');
                  }}
                >
                  <Package className="h-4 w-4 mr-2" />
                  {isSubmitting
                    ? currentMission?.status === 'draft'
                      ? t('actions.updatingAndPublishing')
                      : t('actions.updating')
                    : currentMission?.status === 'draft'
                      ? t('actions.updateAndPublishMission')
                      : t('actions.updateMission')}
                </Button>
                {currentMission?.status === 'draft' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // Set status to 'draft' and submit
                      onSubmit({ ...values }, 'update', false);
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('actions.updating') : t('actions.updateDraft')}
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
