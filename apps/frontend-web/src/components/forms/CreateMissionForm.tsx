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
import countryList from 'react-select-country-list';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin, Package, DollarSign, Clock, Plus, X } from 'lucide-react';
import type { CreateMissionDto } from '@/types/mission.types';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { Address } from '@/types/address.types';

// Initialize country list with French labels
const countryOptions = countryList().getData();

const INITIAL_VALUES: CreateMissionDto = {
  titre: '',
  description: '',
  typeMarchandise: '',
  poids: 0,
  volume: 0,
  dateDepartEstime: '',
  dateArriveePrevue: '',
  adresseDepart: undefined,
  adresseArrivee: undefined,
  budgetMin: 0,
  budgetMax: 0,
};

const validationSchema = Yup.object({
  titre: Yup.string().required('Le titre est requis'),
  description: Yup.string(),
  typeMarchandise: Yup.string(),
  poids: Yup.number().min(0, 'Le poids doit être positif'),
  volume: Yup.number().min(0, 'Le volume doit être positif'),
  dateDepartEstime: Yup.string(),
  dateArriveePrevue: Yup.string(),
  adresseDepart: Yup.object({
    street: Yup.string().required('La rue est requise'),
    city: Yup.string().required('La ville est requise'),
    postalCode: Yup.string().required('Le code postal est requis'),
    country: Yup.string().required('Le pays est requis'),
    label: Yup.string().required('Le nom est requis'),
    region: Yup.string().required('La région est requise'),
  }).required("L'adresse de départ est requise"),
  adresseArrivee: Yup.object({
    street: Yup.string().required('La rue est requise'),
    city: Yup.string().required('La ville est requise'),
    postalCode: Yup.string().required('Le code postal est requis'),
    country: Yup.string().required('Le pays est requis'),
    label: Yup.string().required('Le nom est requis'),
    region: Yup.string().required('La région est requise'),
  }).required("L'adresse d'arrivée est requise"),
  budgetMin: Yup.number().min(0, 'Le budget minimum doit être positif'),
  budgetMax: Yup.number().min(
    Yup.ref('budgetMin'),
    'Le budget maximum doit être supérieur ou égal au budget minimum'
  ),
});

interface CreateMissionFormProps {
  onSubmit: (data: CreateMissionDto) => Promise<void>;
  isSubmitting?: boolean;
  addresses: Address[];
}

// Type for the form data when creating a new address
type NewAddressFormData = Omit<Address, 'id' | 'createdAt' | 'updatedAt'>;

export default function CreateMissionForm({
  onSubmit,
  isSubmitting = false,
  addresses = [],
}: CreateMissionFormProps) {
  const [showNewAddressForm, setShowNewAddressForm] = useState<'departure' | 'arrival' | null>(
    null
  );
  const [newAddress, setNewAddress] = useState<NewAddressFormData>({
    street: '',
    city: '',
    region: '',
    country: 'Cameroun',
    postalCode: '',
    label: '',
    latitude: 0,
    longitude: 0,
  });

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
      postalCode: '',
      label: '',
      latitude: 0,
      longitude: 0,
    });
  };

  return (
    <Formik<CreateMissionDto>
      initialValues={INITIAL_VALUES}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      validateOnBlur={true}
      validateOnChange={true}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
        <Form className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Détails de la Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titre">Titre de la Mission</Label>
                <Input
                  id="titre"
                  name="titre"
                  placeholder="ex: Transport Électronique Douala → Yaoundé"
                  value={values.titre}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={cn(touched.titre && errors.titre && 'border-red-500')}
                  required
                />
                {touched.titre && errors.titre && (
                  <div className="text-sm text-red-600 mt-1">{errors.titre}</div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adresseDepart">Adresse de Départ</Label>
                  {showNewAddressForm === 'departure' ? (
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Nouvelle adresse</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewAddressForm(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="label">Nom</Label>
                          <Input
                            name="label"
                            value={newAddress.label}
                            onChange={handleNewAddressChange}
                            placeholder="Ex: Domicile, Travail"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="street">Rue *</Label>
                          <Input
                            name="street"
                            value={newAddress.street}
                            onChange={handleNewAddressChange}
                            placeholder="123 Rue de l'Exemple"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Code postal *</Label>
                          <Input
                            name="postalCode"
                            value={newAddress.postalCode}
                            onChange={handleNewAddressChange}
                            placeholder="75000"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">Ville *</Label>
                          <Input
                            name="city"
                            value={newAddress.city}
                            onChange={handleNewAddressChange}
                            placeholder="Yaoundé"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="region">Région</Label>
                          <Input
                            name="region"
                            value={newAddress.region}
                            onChange={handleNewAddressChange}
                            placeholder="Centre"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Pays *</Label>
                          <select
                            name="country"
                            value={newAddress.country}
                            onChange={handleNewAddressChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Sélectionner un pays</option>
                            {countryOptions.map((country) => (
                              <option key={country.value} value={country.label}>
                                {country.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowNewAddressForm(null)}
                        >
                          Annuler
                        </Button>
                        <Button
                          type="button"
                          onClick={() => saveNewAddress('departure', setFieldValue)}
                          disabled={
                            !newAddress.street || !newAddress.city || !newAddress.postalCode
                          }
                        >
                          Enregistrer
                        </Button>
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
                              setFieldValue('adresseDepart', selectedAddress);
                            }
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              'pl-10',
                              touched.adresseDepart && errors.adresseDepart && 'border-red-500'
                            )}
                          >
                            <SelectValue placeholder="Sélectionner une adresse" />
                          </SelectTrigger>
                          <SelectContent>
                            {addresses.map((address) => (
                              <SelectItem key={address.id} value={address.id}>
                                {address.label} - {address.street}, {address.postalCode}{' '}
                                {address.city}
                              </SelectItem>
                            ))}
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 text-primary"
                                onClick={() => setShowNewAddressForm('departure')}
                              >
                                <Plus className="h-4 w-4" />
                                <span>Nouvelle adresse</span>
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
                        </div>
                      )}
                      {touched.adresseDepart && errors.adresseDepart && (
                        <div className="text-sm text-red-600 mt-1">
                          {typeof errors.adresseDepart === 'string'
                            ? errors.adresseDepart
                            : 'Adresse de départ requise'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="adresseArrivee">Adresse d'Arrivée</Label>
                  {showNewAddressForm === 'arrival' ? (
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Nouvelle adresse</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewAddressForm(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="label">Libellé</Label>
                          <Input
                            name="label"
                            value={newAddress.label}
                            onChange={handleNewAddressChange}
                            placeholder="Ex: Domicile, Travail"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="street">Rue *</Label>
                          <Input
                            name="street"
                            value={newAddress.street}
                            onChange={handleNewAddressChange}
                            placeholder="123 Rue de l'Exemple"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Code postal *</Label>
                          <Input
                            name="postalCode"
                            value={newAddress.postalCode}
                            onChange={handleNewAddressChange}
                            placeholder="75000"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">Ville *</Label>
                          <Input
                            name="city"
                            value={newAddress.city}
                            onChange={handleNewAddressChange}
                            placeholder="Yaoundé"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="region">Région</Label>
                          <Input
                            name="region"
                            value={newAddress.region}
                            onChange={handleNewAddressChange}
                            placeholder="Centre"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Pays *</Label>
                          <select
                            name="country"
                            value={newAddress.country}
                            onChange={handleNewAddressChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Sélectionner un pays</option>
                            {countryOptions.map((country) => (
                              <option key={country.value} value={country.label}>
                                {country.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowNewAddressForm(null)}
                        >
                          Annuler
                        </Button>
                        <Button
                          type="button"
                          onClick={() => saveNewAddress('arrival', setFieldValue)}
                          disabled={
                            !newAddress.street || !newAddress.city || !newAddress.postalCode
                          }
                        >
                          Enregistrer
                        </Button>
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
                              setFieldValue('adresseArrivee', selectedAddress);
                            }
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              'pl-10',
                              touched.adresseArrivee && errors.adresseArrivee && 'border-red-500'
                            )}
                          >
                            <SelectValue placeholder="Sélectionner une adresse" />
                          </SelectTrigger>
                          <SelectContent>
                            {addresses.map((address) => (
                              <SelectItem key={address.id} value={address.id}>
                                {address.label} - {address.street}, {address.postalCode}{' '}
                                {address.city}
                              </SelectItem>
                            ))}
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 text-primary"
                                onClick={() => setShowNewAddressForm('arrival')}
                              >
                                <Plus className="h-4 w-4" />
                                <span>Nouvelle adresse</span>
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
                        </div>
                      )}
                      {touched.adresseArrivee && errors.adresseArrivee && (
                        <div className="text-sm text-red-600 mt-1">
                          {typeof errors.adresseArrivee === 'string'
                            ? errors.adresseArrivee
                            : "Adresse d'arrivée requise"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="typeMarchandise">Type de Marchandise</Label>
                  <Select
                    value={values.typeMarchandise || ''}
                    onValueChange={(value) => setFieldValue('typeMarchandise', value)}
                  >
                    <SelectTrigger
                      className={cn(
                        touched.typeMarchandise && errors.typeMarchandise && 'border-red-500'
                      )}
                    >
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronique">Électronique</SelectItem>
                      <SelectItem value="construction">Matériaux de Construction</SelectItem>
                      <SelectItem value="alimentaire">Produits Alimentaires</SelectItem>
                      <SelectItem value="textile">Textiles</SelectItem>
                      <SelectItem value="machines">Machines</SelectItem>
                      <SelectItem value="chimique">Produits Chimiques</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  {touched.typeMarchandise && errors.typeMarchandise && (
                    <div className="text-sm text-red-600 mt-1">{errors.typeMarchandise}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="poids">Poids (kg)</Label>
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
                  <Label htmlFor="volume">Volume (m³)</Label>
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
                <Label htmlFor="description">Description de la Mission</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Fournissez des informations détaillées sur votre marchandise et les exigences spéciales..."
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
                Dates de la Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date de Départ Estimée</Label>
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
                          ? format(new Date(values.dateDepartEstime), 'PPP')
                          : 'Sélectionner une date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          values.dateDepartEstime ? new Date(values.dateDepartEstime) : undefined
                        }
                        onSelect={(date) => setFieldValue('dateDepartEstime', date?.toISOString())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {touched.dateDepartEstime && errors.dateDepartEstime && (
                    <div className="text-sm text-red-600 mt-1">{errors.dateDepartEstime}</div>
                  )}
                </div>
                <div>
                  <Label>Date d'Arrivée Prévue</Label>
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
                          ? format(new Date(values.dateArriveePrevue), 'PPP')
                          : 'Sélectionner une date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          values.dateArriveePrevue ? new Date(values.dateArriveePrevue) : undefined
                        }
                        onSelect={(date) => setFieldValue('dateArriveePrevue', date?.toISOString())}
                        initialFocus
                        disabled={(date) =>
                          values.dateDepartEstime ? date < new Date(values.dateDepartEstime) : false
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
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budgetMin">Budget Minimum (FCFA)</Label>
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
                  <p className="text-xs text-gray-500 mt-1">
                    Les transporteurs peuvent négocier ce prix
                  </p>
                </div>
                <div>
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
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1"
              style={{ backgroundColor: 'var(--tsa-blue)' }}
              disabled={isSubmitting}
            >
              <Package className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Création en cours...' : 'Créer la Mission'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Set status to 'draft' and submit
                onSubmit({ ...values });
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder comme Brouillon'}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
