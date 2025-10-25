import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Smartphone, CreditCard, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import type { PaymentMethod, OrderPaymentRequest, PaymentSimulation } from '@/types/payment.types';
import { paymentService } from '@/services/payment.service';
import toast from 'react-hot-toast';

interface MTNPaymentFormProps {
  orderId: string;
  amount: string;
  currency?: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}

interface PaymentFormData {
  method: PaymentMethod;
  phoneNumber: string;
  payerMessage: string;
}

export const MTNPaymentForm: React.FC<MTNPaymentFormProps> = ({
  orderId,
  amount,
  currency = 'XOF',
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    method: 'mtn_mobile_money',
    phoneNumber: '',
    payerMessage: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [simulationResult, setSimulationResult] = useState<PaymentSimulation | null>(null);
  const [step, setStep] = useState<'form' | 'processing' | 'confirmation'>('form');

  const paymentMethods = [
    {
      id: 'mtn_mobile_money' as PaymentMethod,
      name: 'MTN Mobile Money',
      icon: Smartphone,
      color: 'bg-yellow-500',
      description: 'Paiement via MTN Mobile Money',
    },
    {
      id: 'orange_money' as PaymentMethod,
      name: 'Orange Money',
      icon: Smartphone,
      color: 'bg-orange-500',
      description: 'Paiement via Orange Money',
    },
    {
      id: 'wave' as PaymentMethod,
      name: 'Wave',
      icon: Smartphone,
      color: 'bg-blue-500',
      description: 'Paiement via Wave',
    },
    {
      id: 'bank_transfer' as PaymentMethod,
      name: 'Virement Bancaire',
      icon: CreditCard,
      color: 'bg-green-500',
      description: 'Virement bancaire traditionnel',
    },
    {
      id: 'cash_on_delivery' as PaymentMethod,
      name: 'Paiement à la livraison',
      icon: CreditCard,
      color: 'bg-gray-500',
      description: 'Paiement en espèces à la réception',
    },
  ];

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic validation for West African phone numbers
    const phoneRegex = /^(\+225|\+226|\+223|\+227|\+221)?[0-9]{8,10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSimulatePayment = async () => {
    if (!validatePhoneNumber(formData.phoneNumber)) {
      toast.error('Numéro de téléphone invalide');
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      // For MTN Mobile Money, simulate the payment first
      if (formData.method === 'mtn_mobile_money') {
        const simulation = await paymentService.simulateMTNPayment(
          formData.phoneNumber,
          Number(amount)
        );

        setSimulationResult(simulation);

        if (simulation.success) {
          setStep('confirmation');
          toast.success('Simulation de paiement réussie');
        } else {
          throw new Error(simulation.message);
        }
      } else {
        // For other payment methods, create payment directly
        await handleCreatePayment();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de simulation';
      toast.error(errorMessage);
      onPaymentError(errorMessage);
      setStep('form');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreatePayment = async () => {
    setIsProcessing(true);

    try {
      const paymentData: OrderPaymentRequest = {
        orderId,
        paymentMethod: formData.method,
        phoneNumber:
          formData.method !== 'cash_on_delivery' && formData.method !== 'bank_transfer'
            ? formData.phoneNumber
            : undefined,
      };

      const payment = await paymentService.createOrderPayment(paymentData);

      toast.success('Paiement créé avec succès');
      onPaymentSuccess(payment.id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur de création du paiement';
      toast.error(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!simulationResult) return;

    setIsProcessing(true);

    try {
      await handleCreatePayment();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de confirmation';
      toast.error(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedMethod = paymentMethods.find((m) => m.id === formData.method);
  const requiresPhone = ['mtn_mobile_money', 'orange_money', 'wave'].includes(formData.method);

  if (step === 'processing') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Traitement du paiement</h3>
          <p className="text-gray-600 text-center">
            Veuillez patienter pendant que nous traitons votre paiement...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (step === 'confirmation' && simulationResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Confirmation de Paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Simulation réussie</span>
            </div>
            <p className="text-green-700 text-sm">{simulationResult.message}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Montant:</span>
              <span className="font-medium">
                {parseFloat(amount).toLocaleString()} {currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Méthode:</span>
              <span className="font-medium">{selectedMethod?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Numéro:</span>
              <span className="font-medium">{formData.phoneNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-sm">{simulationResult.transactionId}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={() => setStep('form')} variant="outline" className="flex-1">
              Retour
            </Button>
            <Button onClick={handleConfirmPayment} disabled={isProcessing} className="flex-1">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Confirmation...
                </>
              ) : (
                'Confirmer le Paiement'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Méthode de Paiement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Method Selection */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Choisissez votre méthode de paiement
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = formData.method === method.id;

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => handleInputChange('method', method.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${method.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{method.name}</div>
                      <div className="text-xs text-gray-500">{method.description}</div>
                    </div>
                    {isSelected && <CheckCircle className="h-5 w-5 text-blue-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Phone Number Input for Mobile Money */}
        {requiresPhone && (
          <div>
            <Label htmlFor="phoneNumber" className="text-sm font-medium">
              Numéro de téléphone *
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+225 XX XX XX XX XX"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Format: +225XXXXXXXX ou XXXXXXXX</p>
          </div>
        )}

        {/* Message (Optional) */}
        <div>
          <Label htmlFor="payerMessage" className="text-sm font-medium">
            Message (optionnel)
          </Label>
          <Textarea
            id="payerMessage"
            placeholder="Message pour le destinataire..."
            value={formData.payerMessage}
            onChange={(e) => handleInputChange('payerMessage', e.target.value)}
            rows={3}
            className="mt-1"
          />
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Résumé du Paiement</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Montant:</span>
              <span className="font-medium">
                {parseFloat(amount).toLocaleString()} {currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Méthode:</span>
              <Badge variant="secondary">{selectedMethod?.name}</Badge>
            </div>
            {formData.method === 'cash_on_delivery' && (
              <div className="flex items-start gap-2 mt-3 p-3 bg-yellow-50 rounded">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Paiement à la livraison</p>
                  <p>Vous paierez en espèces lors de la réception de votre commande.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={
            formData.method === 'mtn_mobile_money' ? handleSimulatePayment : handleCreatePayment
          }
          disabled={isProcessing || (requiresPhone && !formData.phoneNumber)}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Traitement...
            </>
          ) : (
            <>
              {formData.method === 'mtn_mobile_money' ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Simuler le Paiement
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmer le Paiement
                </>
              )}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
