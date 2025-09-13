import React from 'react';
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
import {
  CalendarIcon,
  MapPin,
  Package,
  DollarSign,
  AlertTriangle,
  Plus,
  Minus,
} from 'lucide-react';
import type { CreateMissionFormData, MissionItem } from '@/types';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const INITIAL_VALUES: CreateMissionFormData = {
  title: '',
  origin: '',
  destination: '',
  cargoType: '',
  urgency: 'low',
  proposedPrice: '',
  description: '',
  specialRequirements: {
    refrigerated: false,
    fragile: false,
    hazardous: false,
    insurance: false,
  },
  deadline: undefined,
  missionItems: [{ id: '1', description: '', weight: '', volume: '', value: '' }] as MissionItem[],
};

const validationSchema = Yup.object({
  title: Yup.string().required('Le titre est requis'),
  origin: Yup.string().required("L'origine est requise"),
  destination: Yup.string().required('La destination est requise'),
  cargoType: Yup.string().required('Le type de marchandise est requis'),
  urgency: Yup.string().required("Le niveau d'urgence est requis"),
  proposedPrice: Yup.string().required('Le prix proposé est requis'),
  description: Yup.string().required('La description est requise'),
  deadline: Yup.date().required('La date limite est requise'),
  missionItems: Yup.array()
    .of(
      Yup.object({
        description: Yup.string().required("La description de l'article est requise"),
        weight: Yup.string().required('Le poids est requis'),
        volume: Yup.string().required('Le volume est requis'),
        value: Yup.string().required('La valeur est requise'),
      })
    )
    .min(1, 'Au moins un article est requis'),
});

interface CreateMissionFormProps {
  onSubmit: (data: CreateMissionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export default function CreateMissionForm({
  onSubmit,
  isSubmitting = false,
}: CreateMissionFormProps) {
  return (
    <Formik<CreateMissionFormData>
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
                <Label htmlFor="title">Titre de la Mission</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="ex: Transport Électronique Douala → Yaoundé"
                  value={values.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={cn(touched.title && errors.title && 'border-red-500')}
                  required
                />
                {touched.title && errors.title && (
                  <div className="text-sm text-red-600 mt-1">{errors.title}</div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="origin">Origine</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="origin"
                      name="origin"
                      placeholder="Ville de départ"
                      className={cn('pl-10', touched.origin && errors.origin && 'border-red-500')}
                      value={values.origin}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    />
                  </div>
                  {touched.origin && errors.origin && (
                    <div className="text-sm text-red-600 mt-1">{errors.origin}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="destination">Destination</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="destination"
                      name="destination"
                      placeholder="Ville d'arrivée"
                      className={cn(
                        'pl-10',
                        touched.destination && errors.destination && 'border-red-500'
                      )}
                      value={values.destination}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    />
                  </div>
                  {touched.destination && errors.destination && (
                    <div className="text-sm text-red-600 mt-1">{errors.destination}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cargoType">Type de Marchandise</Label>
                  <Select
                    value={values.cargoType}
                    onValueChange={(value) => setFieldValue('cargoType', value)}
                  >
                    <SelectTrigger
                      className={cn(touched.cargoType && errors.cargoType && 'border-red-500')}
                    >
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Électronique</SelectItem>
                      <SelectItem value="construction">Matériaux de Construction</SelectItem>
                      <SelectItem value="food">Produits Alimentaires</SelectItem>
                      <SelectItem value="textiles">Textiles</SelectItem>
                      <SelectItem value="machinery">Machines</SelectItem>
                      <SelectItem value="chemicals">Produits Chimiques</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  {touched.cargoType && errors.cargoType && (
                    <div className="text-sm text-red-600 mt-1">{errors.cargoType}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="urgency">Niveau d'Urgence</Label>
                  <Select
                    value={values.urgency}
                    onValueChange={(value) => setFieldValue('urgency', value)}
                  >
                    <SelectTrigger
                      className={cn(touched.urgency && errors.urgency && 'border-red-500')}
                    >
                      <SelectValue placeholder="Sélectionner l'urgence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible - Livraison standard</SelectItem>
                      <SelectItem value="medium">Moyenne - Livraison prioritaire</SelectItem>
                      <SelectItem value="high">Élevée - Livraison urgente</SelectItem>
                    </SelectContent>
                  </Select>
                  {touched.urgency && errors.urgency && (
                    <div className="text-sm text-red-600 mt-1">{errors.urgency}</div>
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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Articles de Marchandise
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldArray name="missionItems">
                {({ push, remove }) => (
                  <>
                    {values.missionItems.map((item, index) => (
                      <div key={item.id} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Article {index + 1}</h4>
                          {values.missionItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label>Description</Label>
                            <Input
                              name={`missionItems.${index}.description`}
                              placeholder="Description de l'article"
                              value={item.description}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              // className={cn(
                              //     touched.missionItems?.[index]?.description &&
                              //     errors.missionItems?.[index]?.description &&
                              //     "border-red-500"
                              // )}
                            />
                            {/* {touched.missionItems?.[index]?.description &&
                                                            errors.missionItems?.[index]?.description && (
                                                                <div className="text-sm text-red-600 mt-1">
                                                                    {errors.missionItems[index]?.description}
                                                                </div>
                                                            )} */}
                          </div>
                          <div>
                            <Label>Poids (kg)</Label>
                            <Input
                              name={`missionItems.${index}.weight`}
                              placeholder="0"
                              value={item.weight}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              // className={cn(
                              //     touched.missionItems?.[index]?.weight &&
                              //     errors.missionItems?.[index]?.weight &&
                              //     "border-red-500"
                              // )}
                            />
                            {/* {touched.missionItems?.[index]?.weight &&
                                                            errors.missionItems?.[index]?.weight && (
                                                                <div className="text-sm text-red-600 mt-1">
                                                                    {errors.missionItems[index]?.weight}
                                                                </div>
                                                            )} */}
                          </div>
                          <div>
                            <Label>Volume (m³)</Label>
                            <Input
                              name={`missionItems.${index}.volume`}
                              placeholder="0"
                              value={item.volume}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              // className={cn(
                              //     touched.missionItems?.[index]?.volume &&
                              //     errors.missionItems?.[index]?.volume &&
                              //     "border-red-500"
                              // )}
                            />
                            {/* {touched.missionItems?.[index]?.volume &&
                                                            errors.missionItems?.[index]?.volume && (
                                                                <div className="text-sm text-red-600 mt-1">
                                                                    {errors.missionItems[index]?.volume}
                                                                </div>
                                                            )} */}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        push({
                          id: Date.now().toString(),
                          description: '',
                          weight: '',
                          volume: '',
                          value: '',
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter Article
                    </Button>
                  </>
                )}
              </FieldArray>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Exigences Spéciales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(values.specialRequirements).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) =>
                        setFieldValue(`specialRequirements.${key}`, checked as boolean)
                      }
                    />
                    <Label htmlFor={key} className="capitalize">
                      {key === 'refrigerated' && 'Réfrigéré'}
                      {key === 'fragile' && 'Fragile'}
                      {key === 'hazardous' && 'Dangereux'}
                      {key === 'insurance' && 'Assurance Requise'}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Prix et Délais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="proposedPrice">Prix Proposé (FCFA)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="proposedPrice"
                      name="proposedPrice"
                      placeholder="0"
                      className={cn(
                        'pl-10',
                        touched.proposedPrice && errors.proposedPrice && 'border-red-500'
                      )}
                      value={values.proposedPrice}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                  {touched.proposedPrice && errors.proposedPrice && (
                    <div className="text-sm text-red-600 mt-1">{errors.proposedPrice}</div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Les transporteurs peuvent négocier ce prix
                  </p>
                </div>
                <div>
                  <Label>Date Limite</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !values.deadline && 'text-muted-foreground',
                          touched.deadline && errors.deadline && 'border-red-500'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {values.deadline ? format(values.deadline, 'PPP') : 'Choisir une date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={values.deadline}
                        onSelect={(date) => setFieldValue('deadline', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {touched.deadline && errors.deadline && (
                    <div className="text-sm text-red-600 mt-1">{errors.deadline}</div>
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
              Créer la Mission
            </Button>
            <Button type="button" variant="outline">
              Sauvegarder comme Brouillon
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
