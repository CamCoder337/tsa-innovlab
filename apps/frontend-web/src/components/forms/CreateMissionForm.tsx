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
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, MapPin, Package, DollarSign, Minus, Clock, FileText } from 'lucide-react';
import type { CreateMissionDto } from '@/types/mission.types';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const INITIAL_VALUES: CreateMissionDto = {
  titre: '',
  description: '',
  typeMarchandise: '',
  poids: 0,
  volume: 0,
  dateDepartEstime: '',
  dateArriveePrevue: '',
  adresseDepartId: '',
  adresseArriveeId: '',
  budgetMin: 0,
  budgetMax: 0,
  isFlexibleDates: false,
  isFlexibleRoute: false,
  notesComplementaires: '',
  documents: [],
};

const validationSchema = Yup.object({
  titre: Yup.string().required('Le titre est requis'),
  description: Yup.string().required('La description est requise'),
  typeMarchandise: Yup.string().required('Le type de marchandise est requis'),
  poids: Yup.number().nullable().min(0, 'Le poids doit être positif'),
  volume: Yup.number().nullable().min(0, 'Le volume doit être positif'),
  dateDepartEstime: Yup.date().required('La date de départ est requise'),
  dateArriveePrevue: Yup.date()
    .required("La date d'arrivée prévue est requise")
    .min(Yup.ref('dateDepartEstime'), "La date d'arrivée doit être après la date de départ"),
  adresseDepartId: Yup.string().required("L'adresse de départ est requise"),
  adresseArriveeId: Yup.string().required("L'adresse d'arrivée est requise"),
  budgetMin: Yup.number().nullable().min(0, 'Le budget minimum doit être positif'),
  budgetMax: Yup.number()
    .nullable()
    .min(Yup.ref('budgetMin'), 'Le budget maximum doit être supérieur ou égal au budget minimum'),
  isFlexibleDates: Yup.boolean(),
  isFlexibleRoute: Yup.boolean(),
  notesComplementaires: Yup.string().nullable(),
  documents: Yup.array()
    .of(
      Yup.object({
        name: Yup.string().required(),
        size: Yup.number().required(),
        type: Yup.string().required(),
      })
    )
    .nullable(),
});

interface CreateMissionFormProps {
  onSubmit: (data: CreateMissionDto) => Promise<void>;
  isSubmitting?: boolean;
  addresses: Array<{ id: string; label: string }>; // Assuming we'll pass addresses from parent
}

export default function CreateMissionForm({
  onSubmit,
  isSubmitting = false,
  addresses = [],
}: CreateMissionFormProps) {
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
                  <Label htmlFor="adresseDepartId">Adresse de Départ</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Select
                      value={values.adresseDepartId || ''}
                      onValueChange={(value) => setFieldValue('adresseDepartId', value)}
                    >
                      <SelectTrigger
                        className={cn(
                          'pl-10',
                          touched.adresseDepartId && errors.adresseDepartId && 'border-red-500'
                        )}
                      >
                        <SelectValue placeholder="Sélectionner une adresse" />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map((address) => (
                          <SelectItem key={address.id} value={address.id}>
                            {address.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {touched.adresseDepartId && errors.adresseDepartId && (
                    <div className="text-sm text-red-600 mt-1">{errors.adresseDepartId}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="adresseArriveeId">Adresse d'Arrivée</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Select
                      value={values.adresseArriveeId || ''}
                      onValueChange={(value) => setFieldValue('adresseArriveeId', value)}
                    >
                      <SelectTrigger
                        className={cn(
                          'pl-10',
                          touched.adresseArriveeId && errors.adresseArriveeId && 'border-red-500'
                        )}
                      >
                        <SelectValue placeholder="Sélectionner une adresse" />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map((address) => (
                          <SelectItem key={address.id} value={address.id}>
                            {address.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {touched.adresseArriveeId && errors.adresseArriveeId && (
                    <div className="text-sm text-red-600 mt-1">{errors.adresseArriveeId}</div>
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
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="isFlexibleDates"
                  checked={values.isFlexibleDates}
                  onCheckedChange={(checked) => setFieldValue('isFlexibleDates', checked)}
                />
                <Label htmlFor="isFlexibleDates">Dates flexibles</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFlexibleRoute"
                  checked={values.isFlexibleRoute}
                  onCheckedChange={(checked) => setFieldValue('isFlexibleRoute', checked)}
                />
                <Label htmlFor="isFlexibleRoute">Itinéraire flexible</Label>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations Complémentaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notesComplementaires">Notes Complémentaires</Label>
                <Textarea
                  id="notesComplementaires"
                  name="notesComplementaires"
                  placeholder="Ajoutez des informations supplémentaires ou des instructions spéciales..."
                  value={values.notesComplementaires || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={cn(
                    touched.notesComplementaires && errors.notesComplementaires && 'border-red-500'
                  )}
                  rows={3}
                />
                {touched.notesComplementaires && errors.notesComplementaires && (
                  <div className="text-sm text-red-600 mt-1">{errors.notesComplementaires}</div>
                )}
              </div>

              <div>
                <Label>Documents (optionnel)</Label>
                <div className="mt-2 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                      >
                        <span>Télécharger un fichier</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setFieldValue('documents', [...(values.documents || []), ...files]);
                          }}
                        />
                      </label>
                      <p className="pl-1">ou glisser-déposer</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOC, JPG, PNG jusqu'à 10MB</p>
                  </div>
                </div>
                {values.documents && values.documents.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {values.documents.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            const newFiles = [...(values.documents || [])];
                            newFiles.splice(index, 1);
                            setFieldValue('documents', newFiles);
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
