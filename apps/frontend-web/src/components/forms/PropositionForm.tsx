import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import * as Yup from 'yup';
import type { Mission } from '@/types/mission.types';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';

type PropositionAction = 'accept' | 'reject' | 'offer' | null;

interface FormValues {
  id: string;
  amount: number;
  delai: number;
  message: string;
  dateDepart: string;
  dateArrivee: string | undefined;
}

interface PropositionFormProps {
  action: PropositionAction;
  mission: Mission;
  onSubmit: (data: Omit<FormValues, 'dateDepart' & 'dateArrivee'>) => void;
  onCancel: () => void;
}

const validationSchema = Yup.object().shape({
  amount: Yup.number().when('action', {
    is: 'offer',
    then: (schema) =>
      schema
        .required('Le montant est requis')
        .positive('Le montant doit être positif')
        .typeError('Veuillez entrer un nombre valide'),
    otherwise: (schema) => schema.notRequired(),
  }),
  delai: Yup.number().when('action', {
    is: 'offer',
    then: (schema) =>
      schema
        .required('Le montant est requis')
        .positive('Le montant doit être positif')
        .typeError('Veuillez entrer un nombre valide'),
    otherwise: (schema) => schema.notRequired(),
  }),
  message: Yup.string().when('action', {
    is: 'reject',
    then: (schema) => schema.required('La raison du rejet est requise'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

export function PropositionForm({ action, mission, onSubmit, onCancel }: PropositionFormProps) {
  const getSubmitButtonText = () => {
    switch (action) {
      case 'accept':
        return "Accepter l'offre";
      case 'reject':
        return "Rejeter l'offre";
      case 'offer':
        return "Envoyer l'offre";
      default:
        return 'Valider';
    }
  };

  const calculateDelai = useCallback((dateDepart: string, dateArrivee: Date | undefined) => {
    if (dateDepart && dateArrivee) {
      const dateDepartDate = new Date(dateDepart);
      if (dateArrivee === dateDepartDate) return 0;

      const days = differenceInDays(dateArrivee, dateDepartDate); // +1 to include both start and end dates
      return days + 1;
    }
    return 0;
  }, []);

  // Date field component with calendar popover
  const DatePickerField = ({
    name,
    label,
    disabled = false,
  }: {
    name: string;
    label: string;
    disabled?: boolean | ((date: Date) => boolean);
  }) => {
    const { values, setFieldValue } = useFormikContext<FormValues>();
    const rawValue = values[name as keyof FormValues] as string | undefined;
    const dateValue = rawValue ? new Date(rawValue) : new Date();
    const [isOpen, setIsOpen] = useState(false);

    const isDisabled = typeof disabled === 'function' ? disabled(dateValue) : disabled;

    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={isDisabled}
              className={cn(
                'w-full justify-start text-left font-normal',
                !dateValue && 'text-muted-foreground',
                isDisabled && 'opacity-100 cursor-default bg-gray-100'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateValue ? (
                <span className="font-medium">
                  {format(dateValue, 'dd MMM yyyy', { locale: fr })}
                </span>
              ) : (
                <span>Choisir une date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={(date) => {
                if (date) {
                  setFieldValue(name, date.toISOString());
                }
                setIsOpen(false);
                if (name === 'dateArrivee') {
                  setFieldValue('delai', calculateDelai(values.dateDepart, date));
                }
              }}
              locale={fr}
              disabled={disabled}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const initialValues: FormValues = {
    id: mission?.id,
    amount: mission?.budgetMin,
    delai: calculateDelai(mission?.dateDepartEstime, new Date(mission?.dateArriveePrevue)),
    message: '',
    dateDepart: mission?.dateDepartEstime,
    dateArrivee: mission?.dateArriveePrevue ? mission?.dateArriveePrevue : undefined,
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      validateOnChange={false}
      validateOnBlur={true}
      enableReinitialize
    >
      {({ errors, touched, isSubmitting, handleChange, values }) => {
        return (
          <Form className="space-y-4">
            {action === 'offer' && (
              <div className="space-y-4">
                {/* <div className="space-y-2">
                  <Label htmlFor="amount">Votre offre (FCFA)</Label>
                  <Field
                    as={Input}
                    id="amount"
                    name="amount"
                    type="number"
                    value={values.amount}
                    onChange={handleChange}
                    placeholder="Montant de la contre-offre"
                    className={errors.amount && touched.amount ? 'border-red-500' : ''}
                  />
                  <ErrorMessage name="amount" component="p" className="text-sm text-red-500 mt-1" />
                </div> */}

                <div className="space-y-4">
                  <h4 className="font-medium">Dates de mission</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DatePickerField name="dateDepart" label="Date de départ" disabled={true} />
                    <DatePickerField
                      name="dateArrivee"
                      label="Date d'arrivée prévue"
                      disabled={(date: Date) => date < new Date(values.dateDepart)}
                    />
                  </div>

                  {/* <div className="space-y-2">
                    <Label>Délai de livraison</Label>
                    <div className="p-3 border rounded-md bg-gray-50">
                      {values.delai > 0 ? (
                        <span className="font-medium">{values.delai} jour{values.delai > 1 ? 's' : ''}</span>
                      ) : (
                        <span className="text-muted-foreground">Sélectionnez une date d'arrivée</span>
                      )}
                    </div>
                  </div> */}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">
                {action === 'accept' && 'Message (optionnel)'}
                {action === 'reject' && 'Raison du rejet (recommandé)'}
                {action === 'offer' && 'Message accompagnant votre offre'}
              </Label>
              <Field
                as={Textarea}
                id="message"
                name="message"
                value={values.message}
                onChange={handleChange}
                placeholder={
                  action === 'accept'
                    ? 'Envoyez un message au transporteur...'
                    : action === 'reject'
                      ? 'Expliquez pourquoi vous rejetez cette offre...'
                      : 'Détaillez votre offre...'
                }
                rows={4}
                className={errors.message && touched.message ? 'border-red-500' : ''}
              />
              <ErrorMessage name="message" component="p" className="text-sm text-red-500 mt-1" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Traitement...' : getSubmitButtonText()}
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
