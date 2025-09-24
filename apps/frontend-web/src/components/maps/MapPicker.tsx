import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

interface MapPickerProps {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
  zoom?: number;
  className?: string;
}

export function MapPicker({
  position,
  onPositionChange,
  zoom = 13,
  className = '',
}: MapPickerProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const markerRef = useRef<L.Marker>(null);

  // Update map view when position changes
  const updateMapView = useCallback(() => {
    if (map && position) {
      map.setView(position, zoom);
      if (markerRef.current) {
        markerRef.current.setLatLng(position);
      }
    }
  }, [map, position, zoom]);

  useEffect(() => {
    updateMapView();
  }, [updateMapView]);

  // Handle map click to update position
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        onPositionChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
      },
    });
    return null;
  };

  // Set initial position to Yaoundé, Cameroon if no position is provided
  const initialPosition: [number, number] = position || [3.848, 11.5021];

  return (
    <div className={`h-64 w-full rounded-md overflow-hidden ${className}`}>
      <MapContainer
        center={initialPosition}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={(ref) => {
          if (ref) {
            setMap(ref);
          }
        }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler />
        <Marker
          position={initialPosition}
          icon={defaultIcon}
          ref={markerRef}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              if (marker != null) {
                const position = marker.getLatLng();
                onPositionChange(Number(position.lat.toFixed(6)), Number(position.lng.toFixed(6)));
              }
            },
          }}
        >
          <Popup>Position sélectionnée</Popup>
        </Marker>
      </MapContainer>
      <div className="mt-2 text-sm text-gray-500 text-center">
        Cliquez sur la carte ou faites glisser le marqueur pour sélectionner une position
      </div>
    </div>
  );
}

export default MapPicker;
