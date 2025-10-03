import React, { useState } from 'react';
import type { Payment, PaymentStatus } from '@/types/payment.types';

const PaymentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pay' | 'history'>('pay');
  const [paymentSuccess, setPaymentSuccess] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate API call
    try {
      // Replace with actual payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newPayment: Payment = {
        id: `pay_${Math.random().toString(36).substr(2, 9)}`,
        missionId: 'mission_1',
        amount: 2500, // 25.00 in cents
        currency: 'eur',
        status: 'completed' as PaymentStatus,
        paymentMethod: 'card',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setPaymentSuccess(newPayment);
      setActiveTab('history');
    } catch (error) {
      console.error('Payment error:', error);
      alert('Une erreur est survenue lors du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Paiement sécurisé</h1>
          <p className="mt-3 text-xl text-gray-500">Effectuez vos paiements en toute sécurité</p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('pay')}
                className={`${
                  activeTab === 'pay'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Effectuer un paiement
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Historique des paiements
              </button>
            </nav>
          </div>

          <div className="p-6">
            {paymentSuccess && activeTab === 'history' && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414 1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0L13.414 12l4.293 4.293a1 1 0 001.414 0L16 10.586z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Paiement de {(paymentSuccess.amount / 100).toFixed(2)}{' '}
                      {paymentSuccess.currency.toUpperCase()} effectué avec succès !
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pay' ? (
              <div className="max-w-lg mx-auto">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Informations de paiement
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label
                        htmlFor="cardNumber"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Numéro de carte
                      </label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        placeholder="1234 5678 9012 3456"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="expiryDate"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Date d'expiration
                        </label>
                        <input
                          type="text"
                          id="expiryDate"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          placeholder="MM/AA"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                          CVV
                        </label>
                        <input
                          type="text"
                          id="cvv"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          placeholder="123"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="cardName" className="block text-sm font-medium text-gray-700">
                        Nom sur la carte
                      </label>
                      <input
                        type="text"
                        id="cardName"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        placeholder="JEAN DUPONT"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isProcessing ? 'Traitement en cours...' : 'Payer 25,00 €'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Historique des paiements</h3>
                {paymentSuccess ? (
                  <div className="border rounded-md p-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Paiement #{paymentSuccess.id}</p>
                        <p className="text-sm text-gray-500">
                          {(paymentSuccess.amount / 100).toFixed(2)}{' '}
                          {paymentSuccess.currency.toUpperCase()}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Payé
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Aucun paiement récent</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
