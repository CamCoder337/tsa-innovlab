import React, { useState, type Dispatch, type SetStateAction } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import libphonenumber from 'google-libphonenumber';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Smartphone, Banknote, AlertCircle } from 'lucide-react';
import type {
  Payment,
  PaymentMethod,
  PaymentMethodType,
  MobileMoneyProvider,
  CardDetails,
} from '@/types/payment.types';
import { PaymentMethod as PaymentMethods } from '@/types/order.types';

interface PaymentFormProps {
  amount: number;
  orderId: string;
  paymentMethod?: PaymentMethodType;
  setPaymentMethod: Dispatch<SetStateAction<PaymentMethodType>>;
  onSuccess: (payment: Payment) => void;
  onError: (error: Error) => void;
  savedCards?: CardDetails[];
}

interface PaymentFormData {
  paymentMethod: PaymentMethod;
  // Card fields
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  saveCard: boolean;
  useSavedCard: string;
  // Mobile money fields
  mobileProvider: MobileMoneyProvider;
  mobilePhone: string;
  receiverName: string;
}

const validateCameroonPhone = (phone: string): boolean => {
  try {
    console.log('verify');
    console.log(phone);
    const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
    const number = phoneUtil.parseAndKeepRawInput(phone, 'CM');
    console.log(number);
    console.log(phoneUtil.isValidNumber(number));
    return phoneUtil.isValidNumber(number);
  } catch {
    return false;
  }
};

const PaymentValidationSchema = Yup.object().shape({
  paymentMethod: Yup.string()
    .oneOf(Object.values(PaymentMethods), 'Méthode de paiement invalide')
    .required('Veuillez sélectionner une méthode de paiement'),

  // Card validation (conditional)
  cardNumber: Yup.string().when('paymentMethod', {
    is: 'card',
    then: (schema) =>
      schema
        .required('Numéro de carte requis')
        .test('card-length', 'Numéro de carte invalide', (value) =>
          value ? value.replace(/\s/g, '').length >= 13 : false
        ),
    otherwise: (schema) => schema.notRequired(),
  }),

  expiryDate: Yup.string().when('paymentMethod', {
    is: 'card',
    then: (schema) =>
      schema
        .required("Date d'expiration requise")
        .matches(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format invalide (MM/AA)'),
    otherwise: (schema) => schema.notRequired(),
  }),

  cvv: Yup.string().when('paymentMethod', {
    is: 'card',
    then: (schema) => schema.required('CVV requis').min(3, 'CVV invalide').max(4, 'CVV invalide'),
    otherwise: (schema) => schema.notRequired(),
  }),

  cardholderName: Yup.string().when('paymentMethod', {
    is: 'card',
    then: (schema) => schema.required('Nom du titulaire requis').min(2, 'Nom trop court'),
    otherwise: (schema) => schema.notRequired(),
  }),

  // Mobile money validation (conditional)
  mobilePhone: Yup.string().when('paymentMethod', {
    is: 'mobile',
    then: (schema) =>
      schema
        .required('Numéro de téléphone requis')
        .test('cameroon-phone', 'Numéro camerounais invalide', validateCameroonPhone),
    otherwise: (schema) => schema.notRequired(),
  }),

  receiverName: Yup.string().when('paymentMethod', {
    is: 'mobile',
    then: (schema) => schema.required('Nom du bénéficiaire requis').min(2, 'Nom trop court'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  orderId,
  paymentMethod = 'cash',
  setPaymentMethod,
  onSuccess,
  onError,
  savedCards = [],
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const formik = useFormik<PaymentFormData>({
    initialValues: {
      paymentMethod: 'cash_on_delivery',
      // Card fields
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      saveCard: false,
      useSavedCard: '',
      // Mobile money fields
      mobileProvider: 'mtn_mobile_money',
      mobilePhone: '',
      receiverName: '',
    },
    validationSchema: PaymentValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      setIsProcessing(true);

      try {
        // Simulate API call with different delays for different methods
        const delay =
          values.paymentMethod === 'orange_money' ||
          values.paymentMethod === 'mtn_mobile_money' ||
          values.paymentMethod === 'wave'
            ? 2000
            : values.paymentMethod === 'bank_transfer'
              ? 1500
              : 500;
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Mock payment success
        const mockPayment: Payment = {
          id: `pay_${Math.random().toString(36).substr(2, 9)}`,
          orderId: orderId,
          amount,
          status: 'completed',
          method: values.paymentMethod,
          transactionId: `pi_${Math.random().toString(36).substr(2, 17)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        onSuccess(mockPayment);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Une erreur est survenue lors du traitement du paiement';
        onError(new Error(errorMessage));
      } finally {
        setIsProcessing(false);
      }
    },
  });

  // Utility functions
  const formatCardNumber = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{4})(?=\d)/g, '$1 ')
      .trim();
  };

  const formatExpiryDate = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})/, '$1/')
      .substring(0, 5);
  };

  const handlePhoneChange = (value: string) => {
    formik.setFieldValue('mobilePhone', value);
  };

  const renderPaymentMethodSelector = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Méthode de paiement</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value: PaymentMethodType) => {
            setPaymentMethod(value);
            if (paymentMethod === 'cash') formik.setFieldValue('paymentMethod', 'cash_on_delivery');
            if (paymentMethod === 'mobile')
              formik.setFieldValue('paymentMethod', 'mtn_mobile_money');
            if (paymentMethod === 'card') formik.setFieldValue('paymentMethod', 'bank_transfer');
          }}
          className="flex gap-4 justify-center"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="cash"
              id="cash"
              className="border-2 border-accent-foreground/50 shadow-xl"
            />
            <Banknote className="h-5 w-5 text-yellow-600" />
            <Label htmlFor="cash">Espèces</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="mobile"
              id="mobile"
              className="border-2 border-accent-foreground/50 shadow-xl"
            />
            <Smartphone className="h-5 w-5 text-green-600" />
            <Label htmlFor="mobile">Mobile Money</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="card"
              id="card"
              className="border-2 border-accent-foreground/50 shadow-xl"
            />
            <CreditCard className="h-5 w-5 text-tsa-blue dark:text-tsa-white" />
            <Label htmlFor="card">Carte bancaire</Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );

  const renderCardPayment = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Paiement par carte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {savedCards.length > 0 && (
          <div>
            <Label>Carte enregistrée</Label>
            <Select
              value={formik.values.useSavedCard}
              onValueChange={(value) => formik.setFieldValue('useSavedCard', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une carte enregistrée" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nouvelle carte</SelectItem>
                {savedCards.map((card) => (
                  <SelectItem key={card.cardNumber} value={card.cardNumber}>
                    {card.cardNumber.slice(0, 4)} •••• {card.cardNumber.slice(-4)} (Exp:{' '}
                    {card.expiryDate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!formik.values.useSavedCard && (
          <>
            <div>
              <Label htmlFor="cardNumber">Numéro de carte *</Label>
              <Input
                id="cardNumber"
                name="cardNumber"
                value={formik.values.cardNumber}
                onChange={(e) => {
                  const formatted = formatCardNumber(e.target.value);
                  formik.setFieldValue('cardNumber', formatted);
                }}
                onBlur={formik.handleBlur}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className={formik.errors.cardNumber ? 'border-red-500' : ''}
              />
              {formik.errors.cardNumber && (
                <p className="text-sm text-red-600 mt-1">{formik.errors.cardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Date d'expiration *</Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  value={formik.values.expiryDate}
                  onChange={(e) => {
                    const formatted = formatExpiryDate(e.target.value);
                    formik.setFieldValue('expiryDate', formatted);
                  }}
                  onBlur={formik.handleBlur}
                  placeholder="MM/AA"
                  maxLength={5}
                  className={formik.errors.expiryDate ? 'border-red-500' : ''}
                />
                {formik.errors.expiryDate && (
                  <p className="text-sm text-red-600 mt-1">{formik.errors.expiryDate}</p>
                )}
              </div>
              <div>
                <Label htmlFor="cvv">CVV *</Label>
                <Input
                  id="cvv"
                  name="cvv"
                  value={formik.values.cvv}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="123"
                  maxLength={4}
                  className={formik.errors.cvv ? 'border-red-500' : ''}
                />
                {formik.errors.cvv && (
                  <p className="text-sm text-red-600 mt-1">{formik.errors.cvv}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="cardholderName">Titulaire de la carte *</Label>
              <Input
                id="cardholderName"
                name="cardholderName"
                value={formik.values.cardholderName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Nom comme indiqué sur la carte"
                className={formik.errors.cardholderName ? 'border-red-500' : ''}
              />
              {formik.errors.cardholderName && (
                <p className="text-sm text-red-600 mt-1">{formik.errors.cardholderName}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="saveCard"
                name="saveCard"
                checked={formik.values.saveCard}
                onChange={formik.handleChange}
                className="h-4 w-4 text-tsa-blue dark:text-tsa-white focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="saveCard" className="text-sm">
                Enregistrer cette carte pour des paiements futurs
              </Label>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderMobileMoneyPayment = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Paiement Mobile Money
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Service de paiement *</Label>
          <Select
            value={formik.values.mobileProvider}
            onValueChange={(value: MobileMoneyProvider) => {
              formik.setFieldValue('payment_method', value);
              formik.setFieldValue('mobileProvider', value);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mtn_mobile_money">MTN Mobile Money</SelectItem>
              <SelectItem value="orange_money">Orange Money</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Numéro de téléphone *</Label>
          <PhoneInput
            country={'cm'}
            onlyCountries={['cm']}
            value={formik.values.mobilePhone}
            onChange={handlePhoneChange}
            placeholder="237 6 55 55 55 55"
            enableSearch={false}
            disableDropdown={false}
            masks={{
              cm: '... ... ...',
            }}
            inputStyle={{
              width: '100%',
              height: '40px',
              fontSize: '14px',
              border: formik.errors.mobilePhone ? '1px solid #ef4444' : '1px solid #e2e8f0',
              borderRadius: '6px',
              paddingLeft: '48px',
            }}
            containerStyle={{
              width: '100%',
            }}
            buttonStyle={{
              border: '1px solid #e2e8f0',
              borderRight: 'none',
              borderRadius: '6px 0 0 6px',
            }}
          />
          {formik.errors.mobilePhone && (
            <p className="text-sm text-red-600 mt-1">{formik.errors.mobilePhone}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Assurez-vous d'entrer un numéro camerounais valide
          </p>
        </div>

        <div>
          <Label htmlFor="receiverName">Nom du bénéficiaire *</Label>
          <Input
            id="receiverName"
            name="receiverName"
            value={formik.values.receiverName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Nom complet du bénéficiaire"
            className={formik.errors.receiverName ? 'border-red-500' : ''}
          />
          {formik.errors.receiverName && (
            <p className="text-sm text-red-600 mt-1">{formik.errors.receiverName}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Le nom doit correspondre au compte Mobile Money
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Instructions:</strong> Vous recevrez un SMS avec les détails de la transaction.
            Suivez les instructions pour confirmer le paiement sur votre téléphone.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderCashPayment = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Paiement en espèces
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 mb-2">
            <strong>Paiement à la livraison</strong>
          </p>
          <p className="text-sm text-yellow-700">
            Vous paierez en espèces lors de la réception de votre commande. Assurez-vous d'avoir le
            montant exact: <strong>{amount.toLocaleString()} FCFA</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      {formik.errors.paymentMethod && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{formik.errors.paymentMethod}</span>
        </div>
      )}

      {renderPaymentMethodSelector()}

      {paymentMethod === 'card' && renderCardPayment()}
      {paymentMethod === 'mobile' && renderMobileMoneyPayment()}
      {paymentMethod === 'cash' && renderCashPayment()}

      <div className="pt-4">
        <Button
          type="submit"
          disabled={isProcessing || !formik.isValid}
          className="w-full h-12 text-base font-semibold"
          style={{ backgroundColor: 'var(--tsa-blue)' }}
        >
          {isProcessing ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {formik.values.paymentMethod === 'mtn_mobile_money' ||
              formik.values.paymentMethod === 'orange_money'
                ? 'Envoi de la demande...'
                : formik.values.paymentMethod === 'bank_transfer' ||
                    formik.values.paymentMethod === 'wave'
                  ? 'Traitement du paiement...'
                  : 'Confirmation...'}
            </>
          ) : (
            `${formik.values.paymentMethod === 'cash_on_delivery' ? 'Confirmer la commande' : 'Payer'} ${amount.toLocaleString()} $FCFA`
          )}
        </Button>
      </div>
    </form>
  );
};

export default PaymentForm;
