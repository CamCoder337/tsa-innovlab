import { useState, useEffect } from 'react';
import TrackingMap from './TrackingMap';
import { trackingService, type PositionUpdate } from '@/services/tracking.service';
import { MOCK_TRACKING_DATA, generateMockPositionUpdate } from '@/data/mock-tracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function TrackingDashboard() {
  const [isTracking, setIsTracking] = useState(false);
  const [positionUpdates, setPositionUpdates] = useState<PositionUpdate[]>([]);
  const [, setSelectedVehicle] = useState<string | null>(null);
  const [trackingData] = useState(MOCK_TRACKING_DATA);

  useEffect(() => {
    // Simuler des mises à jour de position toutes les 10 secondes
    const interval = setInterval(() => {
      if (isTracking) {
        try {
          const update = generateMockPositionUpdate('vehicle-001');
          setPositionUpdates((prev) => [...prev.slice(-9), update]); // Garder les 10 dernières
        } catch (error) {
          console.error('Erreur simulation position:', error);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isTracking]);

  const handleStartTracking = async () => {
    try {
      await trackingService.startTracking({
        vehicleId: 'vehicle-001',
        updateInterval: 30000, // 30 secondes
        enableHighAccuracy: true,
      });

      // S'abonner aux mises à jour
      trackingService.onPositionUpdate((update) => {
        setPositionUpdates((prev) => [...prev.slice(-9), update]);
      });

      trackingService.onError((error) => {
        console.error('Erreur tracking:', error);
        alert(`Erreur tracking: ${error}`);
      });

      setIsTracking(true);
    } catch (error) {
      console.error('Impossible de démarrer le tracking:', error);
      alert('Impossible de démarrer le tracking. Vérifiez les permissions de géolocalisation.');
    }
  };

  const handleStopTracking = () => {
    trackingService.stopTracking();
    setIsTracking(false);
  };

  const handleMarkerClick = (markerId: string, data: Record<string, unknown>) => {
    setSelectedVehicle(markerId);
    console.log('Véhicule sélectionné:', markerId, data);
  };

  const formatStatus = (status: string) => {
    const statusMap = {
      in_transit: { label: 'En transit', color: 'bg-blue-500' },
      delivered: { label: 'Livré', color: 'bg-green-500' },
      delayed: { label: 'Retardé', color: 'bg-yellow-500' },
      exception: { label: 'Exception', color: 'bg-red-500' },
    };
    return statusMap[status as keyof typeof statusMap] || { label: status, color: 'bg-gray-500' };
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tracking en Temps Réel</h1>
          <p className="text-gray-600 mt-1">Suivi des véhicules et livraisons TSA Logistics</p>
        </div>

        <div className="flex gap-3">
          {!isTracking ? (
            <Button onClick={handleStartTracking} className="bg-green-600 hover:bg-green-700">
              🚀 Démarrer le Tracking
            </Button>
          ) : (
            <Button onClick={handleStopTracking} variant="destructive">
              ⏹️ Arrêter le Tracking
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Véhicules Actifs</p>
                <p className="text-2xl font-bold text-green-600">3</p>
              </div>
              <div className="text-green-600">🚛</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Transit</p>
                <p className="text-2xl font-bold text-blue-600">2</p>
              </div>
              <div className="text-blue-600">📦</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Livrés Aujourd'hui</p>
                <p className="text-2xl font-bold text-purple-600">8</p>
              </div>
              <div className="text-purple-600">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alertes</p>
                <p className="text-2xl font-bold text-red-600">1</p>
              </div>
              <div className="text-red-600">⚠️</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Carte de Tracking</span>
                {isTracking && (
                  <Badge className="bg-green-100 text-green-800">🟢 Tracking Actif</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrackingMap
                className="h-[500px]"
                onMarkerClick={handleMarkerClick}
                vehicleUpdates={positionUpdates}
                showRoute={true}
                showUserLocation={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-4">
          {/* Détails de la livraison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Livraison en Cours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{trackingData.trackingNumber}</span>
                  <Badge className={formatStatus(trackingData.status).color}>
                    {formatStatus(trackingData.status).label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{trackingData.packageInfo.description}</p>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Progression</h4>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${trackingData.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {trackingData.progress}% - {trackingData.distanceRemaining / 1000}km restants
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Chauffeur</h4>
                <div className="flex items-center gap-3">
                  <img
                    src={trackingData.carrier.driver.photo}
                    alt={trackingData.carrier.driver.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{trackingData.carrier.driver.name}</p>
                    <p className="text-sm text-gray-600">
                      ⭐ {trackingData.carrier.driver.rating}/5
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">ETA</h4>
                <p className="text-lg font-semibold text-green-600">
                  {formatTime(trackingData.estimatedDelivery.earliest)} -{' '}
                  {formatTime(trackingData.estimatedDelivery.latest)}
                </p>
                <p className="text-sm text-gray-600">
                  Confiance: {trackingData.estimatedDelivery.confidence}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Alertes */}
          {trackingData.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>⚠️</span>
                  Alertes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trackingData.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-medium text-yellow-800">{alert.title}</h5>
                        <p className="text-sm text-yellow-700 mt-1">{alert.message}</p>
                        <p className="text-xs text-yellow-600 mt-2">
                          {formatTime(alert.timestamp)}
                        </p>
                      </div>
                      {alert.canDismiss && (
                        <button className="text-yellow-600 hover:text-yellow-800">✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Mises à jour récentes */}
          {positionUpdates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mises à Jour Récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {positionUpdates
                    .slice(-5)
                    .reverse()
                    .map((update, index) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{update.vehicleId}</span>
                          <span className="text-gray-500">{formatTime(update.timestamp)}</span>
                        </div>
                        <p className="text-gray-600">
                          📍 {update.position.lat.toFixed(4)}, {update.position.lng.toFixed(4)}
                        </p>
                        {update.speed && (
                          <p className="text-gray-600">🚗 {Math.round(update.speed)} km/h</p>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
