'use client';

import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { lazy } from 'react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-gray-600">Chargement des informations de suivi...</p>
    </div>
  </div>
);
// Dynamically import the ShipmentTrackingPage component with no SSR
const ShipmentTrackingPage = lazy(() => import('@/pages/tracking/ShipmentTrackingPage'));

const TrackingPage = () => {
  const [searchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get tracking number from URL params if it exists
  useEffect(() => {
    const tn = searchParams?.get('trackingNumber');
    if (tn) {
      setTrackingNumber(tn);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError('Veuillez entrer un numéro de suivi');
      return;
    }
    setIsSubmitting(true);
    // Navigate to the tracking page with the tracking number
    navigate(`/tracking/${encodeURIComponent(trackingNumber.trim())}`);
  };

  // If no tracking number in URL, show a form to enter it
  if (!trackingNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Suivi de colis
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Entrez votre numéro de suivi pour suivre votre envoi en temps réel
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="trackingNumber" className="sr-only">
                  Numéro de suivi
                </label>
                <input
                  id="trackingNumber"
                  name="trackingNumber"
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => {
                    setTrackingNumber(e.target.value);
                    if (error) setError('');
                  }}
                  className={`appearance-none rounded-md relative block w-full px-3 py-3 border ${
                    error ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Ex: TS123456789"
                  autoComplete="off"
                />
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Recherche en cours...
                  </>
                ) : (
                  'Suivre mon colis'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Show the tracking page with the tracking number
  return (
    <Suspense fallback={<LoadingFallback />}>
      <div>
        <ShipmentTrackingPage />
      </div>
    </Suspense>
  );
};

export default TrackingPage;
