import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { DriverProximity, ShipmentDetails } from '@/types/tracking.types';
import { Phone, MapPin } from 'lucide-react';

interface DriverProximityTrackerProps {
  driverProximity: DriverProximity;
  driver: ShipmentDetails['carrier']['driver'];
  onContactDriver?: () => void;
  className?: string;
}

/**
 * Driver Proximity Tracker - Shows real-time driver location and proximity
 * "Votre livreur est à 200m, préparez les CFA !"
 */
export function DriverProximityTracker({
  driverProximity,
  driver,
  onContactDriver,
  className = '',
}: DriverProximityTrackerProps) {
  const distanceKm = driverProximity.distanceToDestination / 1000;
  const distanceDisplay =
    distanceKm < 1
      ? `${Math.round(driverProximity.distanceToDestination)}m`
      : `${distanceKm.toFixed(1)} km`;

  // Calculate proximity percentage for progress bar (inverse: closer = higher %)
  const maxDistance = 50000; // 50km
  const proximityPercentage = Math.max(
    0,
    Math.min(100, ((maxDistance - driverProximity.distanceToDestination) / maxDistance) * 100)
  );

  const getProximityStatus = () => {
    if (driverProximity.isNearby) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        status: 'Tout proche ! 🎯',
        message: 'Votre livreur est à proximité. Préparez les CFA !',
        icon: '🎉',
      };
    } else if (driverProximity.isApproaching) {
      return {
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        status: 'En approche 🚚',
        message: `Votre livreur arrive dans ${driverProximity.estimatedArrivalMinutes} minutes`,
        icon: '🚚',
      };
    } else {
      return {
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        status: 'En route 📍',
        message: 'Votre livreur est en route vers vous',
        icon: '🛣️',
      };
    }
  };

  const proximityStatus = getProximityStatus();

  // Get direction emoji based on bearing
  const getDirectionEmoji = (bearing: number) => {
    if (bearing >= 337.5 || bearing < 22.5) return '⬆️'; // North
    if (bearing >= 22.5 && bearing < 67.5) return '↗️'; // Northeast
    if (bearing >= 67.5 && bearing < 112.5) return '➡️'; // East
    if (bearing >= 112.5 && bearing < 157.5) return '↘️'; // Southeast
    if (bearing >= 157.5 && bearing < 202.5) return '⬇️'; // South
    if (bearing >= 202.5 && bearing < 247.5) return '↙️'; // Southwest
    if (bearing >= 247.5 && bearing < 292.5) return '⬅️'; // West
    return '↖️'; // Northwest
  };

  const directionEmoji = getDirectionEmoji(driverProximity.bearing);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">📍 Position du livreur</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Banner */}
        <div
          className={`p-4 rounded-lg border ${proximityStatus.bgColor} ${proximityStatus.borderColor}`}
        >
          <div className="text-center">
            <div className="text-3xl mb-2">{proximityStatus.icon}</div>
            <h3 className={`font-bold text-lg ${proximityStatus.color}`}>
              {proximityStatus.status}
            </h3>
            <p className="text-sm text-gray-700 mt-1">{proximityStatus.message}</p>
          </div>
        </div>

        {/* Distance Display */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-600">Distance restante</p>
              <p className="text-2xl font-bold text-gray-900">{distanceDisplay}</p>
            </div>
          </div>
          <div className="text-4xl">{directionEmoji}</div>
        </div>

        {/* Proximity Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Distance</span>
            <span className={proximityPercentage > 80 ? 'text-green-600 font-medium' : ''}>
              {proximityPercentage > 80
                ? 'Très proche !'
                : proximityPercentage > 50
                  ? 'Approche'
                  : 'En route'}
            </span>
          </div>
          <Progress value={proximityPercentage} className="h-2" />
        </div>

        {/* ETA and Speed */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600">Arrivée dans</p>
            <p className="text-lg font-bold text-blue-600">
              {driverProximity.estimatedArrivalMinutes < 60
                ? `${driverProximity.estimatedArrivalMinutes} min`
                : `${Math.floor(driverProximity.estimatedArrivalMinutes / 60)}h${driverProximity.estimatedArrivalMinutes % 60}min`}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="text-xs text-gray-600">Vitesse actuelle</p>
            <p className="text-lg font-bold text-indigo-600">{driverProximity.currentSpeed} km/h</p>
          </div>
        </div>

        {/* Driver Info */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              {driver.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{driver.name}</h4>
              <div className="flex items-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(driver.rating) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-1 text-xs text-gray-500">{driver.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <Button onClick={onContactDriver} className="w-full" variant="outline">
            <Phone className="mr-2 h-4 w-4" />
            Appeler le chauffeur
          </Button>
        </div>

        {/* Last Update */}
        <div className="text-xs text-gray-500 text-center">
          Dernière mise à jour:{' '}
          {new Date(driverProximity.lastLocationUpdate).toLocaleTimeString('fr-FR')}
        </div>
      </CardContent>
    </Card>
  );
}
