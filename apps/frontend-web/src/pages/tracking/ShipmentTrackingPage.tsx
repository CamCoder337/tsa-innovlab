import { useNavigate, useParams } from 'react-router-dom';
import { useTracking } from '@/hooks/useTracking';
import { OmniscientTrackingMap } from '@/components/tracking/OmniscientTrackingMap';
import { ShipmentStatus } from '@/components/tracking/ShipmentStatus';
import { ShipmentTimeline } from '@/components/tracking/ShipmentTimeline';
import { PredictiveETACard } from '@/components/tracking/PredictiveETACard';
import { SmartAlertsPanel } from '@/components/tracking/SmartAlertsPanel';
import { DriverProximityTracker } from '@/components/tracking/DriverProximityTracker';
import { TripHistoryTimeline } from '@/components/tracking/TripHistoryTimeline';
import { generateShipmentAlerts } from '@/services/alertService';
import type { ShipmentDetails } from '@/types/tracking.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, ArrowLeft, RefreshCw, Phone } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

export default function ShipmentTrackingPage() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();

  const { tracking, isLoading, error, lastUpdated, trackShipment } = useTracking();

  const [activeTab, setActiveTab] = useState('overview');

  // Generate intelligent alerts from shipment data
  const intelligentAlerts = useMemo(() => {
    if (!tracking) return [];
    return generateShipmentAlerts(tracking);
  }, [tracking]);

  useEffect(() => {
    console.log('Tracking number:', trackingNumber);
    if (trackingNumber) {
      trackShipment(trackingNumber);
    }
  }, [trackingNumber, trackShipment]);

  const handleRefresh = () => {
    console.log('Refreshing shipment...');
    if (trackingNumber) {
      trackShipment(trackingNumber);
    }
  };

  const handleContactDriver = () => {
    if (shipment.carrier?.driver?.phone) {
      window.location.href = `tel:${shipment.carrier.driver.phone}`;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-9 w-64" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-96 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || (!tracking && !isLoading)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Suivi de colis</h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            {error || 'Impossible de charger les informations de suivi pour ce numéro de colis.'}
          </AlertDescription>
        </Alert>

        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate('/tracking')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la recherche
          </Button>
        </div>
      </div>
    );
  }

  if (!tracking) {
    return null; // Should never reach here due to above checks
  }

  // Type assertion after null check - tracking is guaranteed to be ShipmentDetails here
  const shipment: ShipmentDetails = tracking;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Suivi de colis #{shipment.trackingNumber}
          </h1>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          {lastUpdated && (
            <span>Dernière mise à jour: {new Date(lastUpdated).toLocaleTimeString()}</span>
          )}
          <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Map and Advanced Features */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enhanced Interactive Map */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                🗺️ Carte interactive - "Google Maps du fret"
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px] w-full rounded-b-lg">
                <OmniscientTrackingMap
                  shipment={shipment}
                  showRoute={true}
                  showCheckpoints={true}
                  showWeather={true}
                  showTraffic={true}
                  className="h-full w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
              <TabsTrigger value="details">Détails</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Predictive ETA */}
              {shipment.predictiveETA && (
                <PredictiveETACard predictiveETA={shipment.predictiveETA} />
              )}

              {/* Smart Alerts */}
              <SmartAlertsPanel
                alerts={intelligentAlerts}
                onDismissAlert={(id) => console.log('Dismiss alert:', id)}
                onAlertAction={(alert) => console.log('Alert action:', alert)}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <TripHistoryTimeline
                history={shipment.history}
                currentLocation={shipment.currentLocation}
                onTimelineChange={(point) => console.log('Timeline point:', point)}
              />
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <ShipmentTimeline shipment={shipment} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column - Status and Real-time Info */}
        <div className="space-y-6">
          <ShipmentStatus shipment={shipment} className="w-full" />

          {/* Driver Proximity Tracker */}
          {shipment.driverProximity && (
            <DriverProximityTracker
              driverProximity={shipment.driverProximity}
              driver={shipment.carrier.driver}
              onContactDriver={handleContactDriver}
            />
          )}

          {/* Weather & Traffic Info */}
          {(shipment.currentWeather || shipment.currentTraffic) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Conditions actuelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shipment.currentWeather && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{shipment.currentWeather.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">Météo</h4>
                        <p className="text-xs text-gray-600">
                          {shipment.currentWeather.description}
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          {shipment.currentWeather.temperature}°C
                        </p>
                      </div>
                    </div>
                    {shipment.currentWeather.impactOnDelivery && (
                      <p className="text-xs text-gray-600 mt-2">
                        {shipment.currentWeather.impactOnDelivery}
                      </p>
                    )}
                  </div>
                )}
                {shipment.currentTraffic && (
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">Trafic</h4>
                        <p className="text-xs text-gray-600 capitalize">
                          {shipment.currentTraffic.severity.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">
                          {shipment.currentTraffic.speedKmh} km/h
                        </p>
                        {shipment.currentTraffic.delayMinutes > 0 && (
                          <p className="text-xs text-gray-600">
                            +{shipment.currentTraffic.delayMinutes} min
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Contact */}
          {!shipment.driverProximity && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleContactDriver} className="w-full" variant="outline">
                  <Phone className="mr-2 h-4 w-4" />
                  Appeler le chauffeur
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Package details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Détails du colis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="mt-1">{shipment.packageInfo.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Poids</h4>
                    <p className="mt-1">{shipment.packageInfo.weight} kg</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Dimensions</h4>
                    <p className="mt-1">
                      {shipment.packageInfo.dimensions.length} ×{' '}
                      {shipment.packageInfo.dimensions.width} ×{' '}
                      {shipment.packageInfo.dimensions.height} cm
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Contenu</h4>
                  <ul className="mt-1 space-y-1">
                    {shipment.packageInfo.items.map((item, index) => (
                      <li key={index} className="flex justify-between">
                        <span>
                          {item.quantity} × {item.description}
                        </span>
                        <span className="font-medium">{item.value.toLocaleString()} FCFA</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between font-medium">
                    <span>Valeur totale</span>
                    <span>{shipment.packageInfo.value.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
