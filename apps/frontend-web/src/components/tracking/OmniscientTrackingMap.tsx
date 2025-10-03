import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ShipmentDetails, RoadCheckpoint } from '@/types/tracking.types';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface OmniscientTrackingMapProps {
  shipment: ShipmentDetails;
  showRoute?: boolean;
  showCheckpoints?: boolean;
  showWeather?: boolean;
  showTraffic?: boolean;
  className?: string;
}

/**
 * Component to auto-fit map bounds
 */
function MapBounds({ shipment }: { shipment: ShipmentDetails }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([]);

    // Add origin
    bounds.extend([shipment.origin.coordinates.lat, shipment.origin.coordinates.lng]);

    // Add destination
    bounds.extend([shipment.destination.coordinates.lat, shipment.destination.coordinates.lng]);

    // Add current location
    if (shipment.currentLocation) {
      bounds.extend([shipment.currentLocation.lat, shipment.currentLocation.lng]);
    }

    // Add route points
    if (shipment.route) {
      shipment.route.forEach((segment) => {
        bounds.extend([segment.start.lat, segment.start.lng]);
        bounds.extend([segment.end.lat, segment.end.lng]);
      });
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, shipment]);

  return null;
}

/**
 * Omniscient Tracking Map - Google Maps-style interactive map
 */
export function OmniscientTrackingMap({
  shipment,
  showRoute = true,
  showCheckpoints = true,
  showWeather = true,
  showTraffic = true,
  className = '',
}: OmniscientTrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Create custom icons
  const createCustomIcon = (emoji: string, size: [number, number] = [32, 32]) => {
    return L.divIcon({
      html: `<div style="font-size: 24px;">${emoji}</div>`,
      iconSize: size,
      className: 'custom-map-icon',
    });
  };

  const truckIcon = createCustomIcon('🚚', [40, 40]);
  const originIcon = createCustomIcon('🏭', [35, 35]);
  const destinationIcon = createCustomIcon('📍', [35, 35]);
  const checkpointIcon = (type: RoadCheckpoint['type']) => {
    const icons = {
      police: '👮',
      customs: '🛃',
      toll: '💰',
      weighstation: '⚖️',
      border: '🚧',
    };
    return createCustomIcon(icons[type], [30, 30]);
  };

  // Route line with traffic color coding
  const getRouteColor = (segment: ShipmentDetails['route'][0]) => {
    if (!showTraffic || !segment.trafficData) return '#3B82F6'; // Blue

    const colors = {
      free_flow: '#10B981', // Green
      light: '#3B82F6', // Blue
      moderate: '#F59E0B', // Orange
      heavy: '#EF4444', // Red
      blocked: '#991B1B', // Dark red
    };

    return colors[segment.trafficData.severity];
  };

  // Weather overlay circles
  const getWeatherColor = (riskLevel: string) => {
    const colors = {
      low: '#10B981',
      moderate: '#F59E0B',
      high: '#EF4444',
      severe: '#991B1B',
    };
    return colors[riskLevel as keyof typeof colors] || '#3B82F6';
  };

  const center: [number, number] = shipment.currentLocation
    ? [shipment.currentLocation.lat, shipment.currentLocation.lng]
    : [shipment.destination.coordinates.lat, shipment.destination.coordinates.lng];

  return (
    <div className={`relative ${className}`}>
      <MapContainer center={center} zoom={10} className="h-full w-full rounded-lg z-0" ref={mapRef}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds shipment={shipment} />

        {/* Origin Marker */}
        <Marker
          position={[shipment.origin.coordinates.lat, shipment.origin.coordinates.lng]}
          icon={originIcon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-sm">🏭 Point de départ</h3>
              <p className="text-xs">{shipment.origin.name}</p>
              <p className="text-xs text-gray-500">{shipment.origin.address}</p>
            </div>
          </Popup>
        </Marker>

        {/* Destination Marker */}
        <Marker
          position={[shipment.destination.coordinates.lat, shipment.destination.coordinates.lng]}
          icon={destinationIcon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-sm">📍 Destination</h3>
              <p className="text-xs">{shipment.destination.name}</p>
              <p className="text-xs text-gray-500">{shipment.destination.address}</p>
              {shipment.predictiveETA && (
                <p className="text-xs font-medium text-blue-600 mt-1">
                  ETA:{' '}
                  {new Date(shipment.predictiveETA.currentETA).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </Popup>
        </Marker>

        {/* Current Location Marker (Truck) */}
        {shipment.currentLocation && (
          <>
            <Marker
              position={[shipment.currentLocation.lat, shipment.currentLocation.lng]}
              icon={truckIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-sm">🚚 Position actuelle</h3>
                  <p className="text-xs">{shipment.currentLocation.address}</p>
                  <p className="text-xs text-gray-500">Vitesse: {shipment.speed} km/h</p>
                  <p className="text-xs text-gray-500">
                    Dernière mise à jour:{' '}
                    {new Date(shipment.currentLocation.timestamp).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Driver proximity circle */}
            {shipment.driverProximity?.isApproaching && (
              <Circle
                center={[shipment.currentLocation.lat, shipment.currentLocation.lng]}
                radius={shipment.driverProximity.distanceToDestination}
                pathOptions={{
                  color: shipment.driverProximity.isNearby ? '#10B981' : '#3B82F6',
                  fillColor: shipment.driverProximity.isNearby ? '#10B981' : '#3B82F6',
                  fillOpacity: 0.1,
                }}
              />
            )}
          </>
        )}

        {/* Route Polyline with traffic colors */}
        {showRoute && shipment.route && shipment.route.length > 0 && (
          <>
            {shipment.route.map((segment, index) => (
              <Polyline
                key={`segment-${index}`}
                positions={[
                  [segment.start.lat, segment.start.lng],
                  [segment.end.lat, segment.end.lng],
                ]}
                pathOptions={{
                  color: getRouteColor(segment),
                  weight: 5,
                  opacity: 0.7,
                }}
              >
                <Popup>
                  <div className="p-2 text-xs">
                    <p className="font-medium">Segment {index + 1}</p>
                    <p>Distance: {(segment.distance / 1000).toFixed(1)} km</p>
                    <p>Durée: {Math.round(segment.duration / 60)} min</p>
                    {segment.trafficData && (
                      <p className="text-orange-600">Trafic: {segment.trafficData.severity}</p>
                    )}
                  </div>
                </Popup>
              </Polyline>
            ))}
          </>
        )}

        {/* Checkpoints */}
        {showCheckpoints &&
          shipment.roadCheckpoints &&
          shipment.roadCheckpoints.map((checkpoint) => (
            <Marker
              key={checkpoint.id}
              position={[checkpoint.location.lat, checkpoint.location.lng]}
              icon={checkpointIcon(checkpoint.type)}
              opacity={checkpoint.isPassed ? 0.5 : 1}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-sm">{checkpoint.name}</h3>
                  <p className="text-xs text-gray-500">{checkpoint.location.address}</p>
                  {checkpoint.isPassed ? (
                    <p className="text-xs text-green-600 font-medium">✓ Passé</p>
                  ) : (
                    <>
                      <p className="text-xs">Attente moyenne: {checkpoint.averageWaitTime} min</p>
                      {checkpoint.currentWaitTime && (
                        <p className="text-xs text-orange-600">
                          Attente actuelle: {checkpoint.currentWaitTime} min
                        </p>
                      )}
                    </>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Horaires: {checkpoint.operatingHours}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Weather overlays */}
        {showWeather && shipment.currentWeather && shipment.currentLocation && (
          <Circle
            center={[shipment.currentLocation.lat, shipment.currentLocation.lng]}
            radius={10000}
            pathOptions={{
              color: getWeatherColor(shipment.currentWeather.riskLevel),
              fillColor: getWeatherColor(shipment.currentWeather.riskLevel),
              fillOpacity: 0.15,
              weight: 2,
              dashArray: '5, 5',
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  {shipment.currentWeather.icon} Météo actuelle
                </h3>
                <p className="text-xs">{shipment.currentWeather.description}</p>
                <p className="text-xs">Température: {shipment.currentWeather.temperature}°C</p>
                <p className="text-xs">Vent: {shipment.currentWeather.windSpeed} km/h</p>
                {shipment.currentWeather.precipitation > 0 && (
                  <p className="text-xs">
                    Précipitations: {shipment.currentWeather.precipitation} mm
                  </p>
                )}
              </div>
            </Popup>
          </Circle>
        )}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs z-10">
        <h4 className="font-bold mb-2">Légende</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span>🚚</span>
            <span>Position actuelle</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🏭</span>
            <span>Point de départ</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span>Destination</span>
          </div>
          {showCheckpoints && (
            <>
              <div className="flex items-center gap-2">
                <span>👮</span>
                <span>Contrôle police</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💰</span>
                <span>Péage</span>
              </div>
            </>
          )}
          {showTraffic && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 bg-green-500 rounded"></div>
                <span>Trafic fluide</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 bg-orange-500 rounded"></div>
                <span>Trafic modéré</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 bg-red-500 rounded"></div>
                <span>Trafic dense</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
