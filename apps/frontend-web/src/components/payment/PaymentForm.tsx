import React, { useState } from 'react';
import type { Payment, PaymentMethod } from '@/types/payment.types';

interface PaymentFormProps {
  amount: number;
  currency?: string;
  missionId: string;
  onSuccess: (payment: Payment) => void;
  onError: (error: Error) => void;
  savedCards?: PaymentMethod[];
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency = 'eur',
  missionId,
  onSuccess,
  onError,
  savedCards = [],
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useSavedCard, setUseSavedCard] = useState<string | null>(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    saveCard: false,
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCardDetails((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      if (!useSavedCard) {
        if (
          !cardDetails.cardNumber ||
          !cardDetails.expiryDate ||
          !cardDetails.cvv ||
          !cardDetails.cardholderName
        ) {
          throw new Error('Veuillez remplir tous les champs obligatoires');
        }
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockPayment: Payment = {
        id: `pay_${Math.random().toString(36).substr(2, 9)}`,
        missionId,
        amount,
        currency,
        status: 'completed',
        paymentMethod: useSavedCard ? 'saved_card' : 'credit_card',
        paymentIntentId: `pi_${Math.random().toString(36).substr(2, 17)}`,
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onSuccess(mockPayment);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors du traitement du paiement';
      setError(errorMessage);
      onError(new Error(errorMessage));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {savedCards.length > 0 && (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Paiement enregistré</label>
          <select
            className="block w-full p-2 border rounded"
            value={useSavedCard || ''}
            onChange={(e) => setUseSavedCard(e.target.value || null)}
          >
            <option value="">Sélectionner une carte enregistrée</option>
            {savedCards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.brand} •••• {card.last4} (Exp: {card.expMonth}/{card.expYear})
              </option>
            ))}
          </select>
        </div>
      )}

      {!useSavedCard && (
        <>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cardNumber">
              Numéro de carte
            </label>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              value={cardDetails.cardNumber}
              onChange={(e) => {
                const formatted = formatCardNumber(e.target.value);
                setCardDetails((prev) => ({
                  ...prev,
                  cardNumber: formatted,
                }));
              }}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required={!useSavedCard}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="expiryDate">
                Date d'expiration
              </label>
              <input
                type="text"
                id="expiryDate"
                name="expiryDate"
                value={cardDetails.expiryDate}
                onChange={(e) => {
                  const formatted = formatExpiryDate(e.target.value);
                  setCardDetails((prev) => ({
                    ...prev,
                    expiryDate: formatted,
                  }));
                }}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="MM/AA"
                maxLength={5}
                required={!useSavedCard}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cvv">
                CVV
              </label>
              <input
                type="text"
                id="cvv"
                name="cvv"
                value={cardDetails.cvv}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="123"
                maxLength={4}
                required={!useSavedCard}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cardholderName">
              Titulaire de la carte
            </label>
            <input
              type="text"
              id="cardholderName"
              name="cardholderName"
              value={cardDetails.cardholderName}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Nom comme indiqué sur la carte"
              required={!useSavedCard}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="saveCard"
              name="saveCard"
              checked={cardDetails.saveCard}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="saveCard" className="ml-2 block text-sm text-gray-700">
              Enregistrer cette carte pour des paiements futurs
            </label>
          </div>
        </>
      )}

      <div className="mt-6">
        <button
          type="submit"
          disabled={isProcessing}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isProcessing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Traitement...
            </>
          ) : (
            `Payer ${amount.toFixed(2)} ${currency.toUpperCase()}`
          )}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;
