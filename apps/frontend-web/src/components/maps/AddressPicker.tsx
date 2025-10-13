import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, X } from 'lucide-react';
import { getGoogleMapsApiKey } from '@/config/env';

export interface AddressDetails {
  formatted_address: string;
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  country?: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  place_id: string;
}

interface AddressPickerProps {
  onAddressSelect: (address: AddressDetails) => void;
  onClear?: () => void;
  placeholder?: string;
  value?: string;
  className?: string;
  showMap?: boolean;
  disabled?: boolean;
}

export default function AddressPicker({
  onAddressSelect,
  onClear,
  placeholder = 'Rechercher une adresse...',
  value = '',
  className = '',
  showMap = false,
  disabled = false,
}: AddressPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (window.google?.maps?.places) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${getGoogleMapsApiKey()}&libraries=places&v=weekly`;
      script.async = true;
      script.defer = true;

      script.onload = () => setIsLoaded(true);
      script.onerror = () => console.error('Failed to load Google Maps script');

      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['formatted_address', 'address_components', 'geometry', 'place_id'],
      componentRestrictions: { country: ['ci', 'bf', 'ml', 'ne', 'sn'] }, // West Africa focus
    });

    autocompleteRef.current = autocomplete;

    const handlePlaceSelect = () => {
      const place = autocomplete.getPlace();

      if (!place.geometry?.location) {
        console.error('No geometry data for selected place');
        return;
      }

      const addressDetails = extractAddressDetails(place);
      setInputValue(addressDetails.formatted_address);
      onAddressSelect(addressDetails);

      // Update map if shown
      if (showMap && mapInstanceRef.current) {
        updateMapLocation(addressDetails.latitude, addressDetails.longitude);
      }
    };

    autocomplete.addListener('place_changed', handlePlaceSelect);

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onAddressSelect, showMap, disabled]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !showMap || !mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 5.36, lng: -4.0083 }, // Abidjan, Côte d'Ivoire
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    return () => {
      mapInstanceRef.current = null;
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [isLoaded, showMap]);

  const extractAddressDetails = (place: google.maps.places.PlaceResult): AddressDetails => {
    const components = place.address_components || [];
    const details: Partial<AddressDetails> = {
      formatted_address: place.formatted_address || '',
      latitude: place.geometry!.location!.lat(),
      longitude: place.geometry!.location!.lng(),
      place_id: place.place_id || '',
    };

    components.forEach((component) => {
      const types = component.types;

      if (types.includes('street_number')) {
        details.street_number = component.long_name;
      } else if (types.includes('route')) {
        details.route = component.long_name;
      } else if (types.includes('locality')) {
        details.locality = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        details.administrative_area_level_1 = component.long_name;
      } else if (types.includes('country')) {
        details.country = component.long_name;
      } else if (types.includes('postal_code')) {
        details.postal_code = component.long_name;
      }
    });

    return details as AddressDetails;
  };

  const updateMapLocation = (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;

    const position = { lat, lng };

    // Update map center
    mapInstanceRef.current.setCenter(position);
    mapInstanceRef.current.setZoom(15);

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Add new marker
    markerRef.current = new google.maps.Marker({
      position,
      map: mapInstanceRef.current,
      title: 'Adresse de livraison',
      icon: {
        url: 'https://maps.google.com/mapfiles/kml/shapes/placemark_circle.png',
        scaledSize: new google.maps.Size(32, 32),
      },
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par ce navigateur");
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocoding to get address
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({
            location: { lat: latitude, lng: longitude },
          });

          if (result.results && result.results[0]) {
            const place = result.results[0];
            const addressDetails: AddressDetails = {
              formatted_address: place.formatted_address,
              latitude,
              longitude,
              place_id: place.place_id || '',
            };

            // Extract components
            place.address_components?.forEach((component) => {
              const types = component.types;

              if (types.includes('street_number')) {
                addressDetails.street_number = component.long_name;
              } else if (types.includes('route')) {
                addressDetails.route = component.long_name;
              } else if (types.includes('locality')) {
                addressDetails.locality = component.long_name;
              } else if (types.includes('administrative_area_level_1')) {
                addressDetails.administrative_area_level_1 = component.long_name;
              } else if (types.includes('country')) {
                addressDetails.country = component.long_name;
              } else if (types.includes('postal_code')) {
                addressDetails.postal_code = component.long_name;
              }
            });

            setInputValue(addressDetails.formatted_address);
            onAddressSelect(addressDetails);

            if (showMap) {
              updateMapLocation(latitude, longitude);
            }
          }
        } catch (error) {
          console.error('Erreur lors de la géolocalisation inverse:', error);
          alert("Impossible de récupérer l'adresse de votre position");
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        alert("Impossible d'accéder à votre position");
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const handleClear = () => {
    setInputValue('');
    if (onClear) {
      onClear();
    }

    // Clear map marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    // Reset map center
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: 5.36, lng: -4.0083 });
      mapInstanceRef.current.setZoom(12);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={inputValue}
              onChange={handleInputChange}
              disabled={disabled || !isLoaded}
              className="pl-10 pr-10"
            />
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={disabled || !isLoaded || isLoadingLocation}
            className="flex items-center gap-1 px-3"
          >
            <Navigation className={`h-4 w-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
            {isLoadingLocation ? 'Localisation...' : 'Ma position'}
          </Button>
        </div>

        {!isLoaded && <p className="text-xs text-gray-500 mt-1">Chargement de Google Maps...</p>}
      </div>

      {showMap && (
        <Card>
          <CardContent className="p-0">
            <div ref={mapRef} className="w-full h-64 rounded-lg" style={{ minHeight: '256px' }} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
