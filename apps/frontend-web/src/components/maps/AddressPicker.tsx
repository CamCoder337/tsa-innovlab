import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, X, AlertCircle } from 'lucide-react';
import { googleMapsLoader } from '@/lib/google-maps-loader';

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
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        console.log('🗺️ Chargement de Google Maps...');

        // Check if API key is available
        const apiKey =
          window._env_?.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error('Clé API Google Maps manquante');
        }

        console.log('🔑 Clé API Google Maps trouvée');

        await googleMapsLoader.load({ libraries: ['places', 'marker'] });

        // Verify Google Maps is actually loaded
        if (!window.google?.maps) {
          throw new Error('Google Maps API non disponible après le chargement');
        }

        console.log('✅ Google Maps chargé avec succès');
        setIsLoaded(true);
        setError(null);
      } catch (error) {
        console.error('❌ Erreur lors du chargement de Google Maps:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        setError(`Impossible de charger Google Maps: ${errorMessage}`);
      }
    };

    loadGoogleMaps();
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const extractAddressDetails = useCallback(
    (place: google.maps.places.PlaceResult): AddressDetails => {
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
    },
    []
  );

  const updateMapLocation = useCallback((lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;

    const position = { lat, lng };

    // Update map center
    mapInstanceRef.current.setCenter(position);
    mapInstanceRef.current.setZoom(15);

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }

    try {
      // Create marker element with custom styling
      const markerElement = document.createElement('div');
      markerElement.style.width = '32px';
      markerElement.style.height = '32px';
      markerElement.style.backgroundImage =
        'url(https://maps.google.com/mapfiles/kml/shapes/placemark_circle.png)';
      markerElement.style.backgroundSize = 'contain';
      markerElement.style.backgroundRepeat = 'no-repeat';
      markerElement.style.cursor = 'pointer';

      // Use AdvancedMarkerElement with custom content
      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        position,
        map: mapInstanceRef.current,
        title: 'Adresse de livraison',
        content: markerElement,
      });
    } catch (error) {
      console.error('Error creating AdvancedMarkerElement:', error);
      // If AdvancedMarkerElement fails, create a simple marker without custom content
      try {
        markerRef.current = new google.maps.marker.AdvancedMarkerElement({
          position,
          map: mapInstanceRef.current,
          title: 'Adresse de livraison',
        });
      } catch (fallbackError) {
        console.error('Error creating basic AdvancedMarkerElement:', fallbackError);
      }
    }
  }, []);

  // Initialize modern autocomplete with fallback
  useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled || error) return;

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        fields: ['formatted_address', 'address_components', 'geometry', 'place_id'],
        componentRestrictions: { country: ['ci', 'bf', 'ml', 'ne', 'sn'] },
      });

      autocompleteRef.current = autocomplete;

      const handlePlaceSelect = () => {
        const place = autocomplete.getPlace();

        if (!place.geometry?.location) {
          console.error('No geometry data for selected place');
          setError('Adresse invalide sélectionnée');
          return;
        }

        try {
          const addressDetails = extractAddressDetails(place);
          setInputValue(addressDetails.formatted_address);
          onAddressSelect(addressDetails);
          setError(null);

          if (showMap && mapInstanceRef.current) {
            updateMapLocation(addressDetails.latitude, addressDetails.longitude);
          }
        } catch (err) {
          console.error('Error processing selected address:', err);
          setError("Erreur lors du traitement de l'adresse");
        }
      };

      autocomplete.addListener('place_changed', handlePlaceSelect);

      return () => {
        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    } catch (err) {
      console.error('Error initializing autocomplete:', err);
      setError("Erreur d'initialisation de la recherche d'adresse. Utilisez la saisie manuelle.");
    }
  }, [
    isLoaded,
    disabled,
    error,
    extractAddressDetails,
    updateMapLocation,
    onAddressSelect,
    showMap,
  ]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !showMap || !mapRef.current || error) return;

    try {
      // Ensure the map container has proper dimensions
      const mapContainer = mapRef.current;
      mapContainer.style.width = '100%';
      mapContainer.style.height = '256px';
      mapContainer.style.minHeight = '256px';

      const map = new google.maps.Map(mapContainer, {
        center: { lat: 4.0511, lng: 9.7679 }, // Douala, Cameroun
        zoom: 12,
        mapId: 'TSA_LOGISTICS_MAP', // Add mapId to enable advanced markers
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'cooperative',
      });

      mapInstanceRef.current = map;

      // Force map resize after initialization
      setTimeout(() => {
        if (mapInstanceRef.current) {
          google.maps.event.trigger(mapInstanceRef.current, 'resize');
        }
      }, 100);

      return () => {
        mapInstanceRef.current = null;
        if (markerRef.current) {
          markerRef.current.map = null;
          markerRef.current = null;
        }
      };
    } catch (err) {
      console.error('Error initializing map:', err);
      setError("Erreur d'initialisation de la carte");
    }
  }, [isLoaded, showMap, error]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par ce navigateur");
      return;
    }

    setIsLoadingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        console.log(
          `Position détectée: ${latitude}, ${longitude} (précision: ±${Math.round(accuracy)}m)`
        );

        try {
          // Wait for Google Maps to be loaded
          if (!window.google?.maps?.Geocoder) {
            await googleMapsLoader.load({ libraries: ['places', 'marker'] });
          }

          // Reverse geocoding to get address
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({
            location: { lat: latitude, lng: longitude },
            region: 'CI', // Prioritize Côte d'Ivoire results
          });

          if (result.results && result.results.length > 0) {
            // Try to find the most specific address first
            let bestResult = result.results[0];

            // Look for a more specific address (with street number or route)
            for (const res of result.results) {
              const hasStreetInfo = res.address_components?.some(
                (comp) => comp.types.includes('street_number') || comp.types.includes('route')
              );
              if (hasStreetInfo) {
                bestResult = res;
                break;
              }
            }

            const place = bestResult;
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

            console.log('Adresse trouvée:', addressDetails);
            setInputValue(addressDetails.formatted_address);
            onAddressSelect(addressDetails);

            if (showMap && mapInstanceRef.current) {
              updateMapLocation(latitude, longitude);
            }
          } else {
            setError('Aucune adresse trouvée pour votre position');
          }
        } catch (error) {
          console.error('Erreur lors de la géolocalisation inverse:', error);
          setError("Impossible de récupérer l'adresse de votre position");
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        let errorMessage = "Impossible d'accéder à votre position";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permission de géolocalisation refusée';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position non disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Délai de géolocalisation dépassé';
            break;
        }

        setError(errorMessage);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 60000, // Reduced cache time for more accurate results
      }
    );
  }, [onAddressSelect, showMap, updateMapLocation]);

  const handleClear = useCallback(() => {
    setInputValue('');
    setError(null);

    if (onClear) {
      onClear();
    }

    // Clear map marker
    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }

    // Reset map center
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: 4.0511, lng: 9.7679 });
      mapInstanceRef.current.setZoom(12);
    }
  }, [onClear]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      if (error) setError(null); // Clear error when user starts typing
    },
    [error]
  );

  const handleManualSubmit = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && inputValue.trim() && error) {
        // Manual address submission when Google Maps is not available
        const manualAddress: AddressDetails = {
          formatted_address: inputValue.trim(),
          latitude: 4.0511, // Default to Douala coordinates
          longitude: 9.7679,
          place_id: `manual_${Date.now()}`,
        };

        console.log('📝 Adresse manuelle soumise:', manualAddress);
        onAddressSelect(manualAddress);
      }
    },
    [inputValue, error, onAddressSelect]
  );

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={
                error ? "Saisie manuelle de l'adresse (Entrée pour valider)..." : placeholder
              }
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleManualSubmit}
              disabled={disabled || (!isLoaded && !error)}
              className={`pl-10 pr-10 ${error ? 'border-orange-300 bg-orange-50' : ''}`}
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
            disabled={disabled || !isLoaded || isLoadingLocation || !!error}
            className="flex items-center gap-1 px-3"
          >
            <Navigation className={`h-4 w-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
            {isLoadingLocation ? 'Localisation...' : 'Ma position'}
          </Button>
        </div>

        {!isLoaded && !error && (
          <p className="text-xs text-gray-500 mt-1">Chargement de Google Maps...</p>
        )}

        {error && (
          <div className="flex items-center justify-between gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                setIsLoaded(false);
                // Retry loading Google Maps
                const loadGoogleMaps = async () => {
                  try {
                    console.log('🔄 Nouvelle tentative de chargement de Google Maps...');
                    await googleMapsLoader.load({ libraries: ['places', 'marker'] });
                    if (window.google?.maps) {
                      setIsLoaded(true);
                      setError(null);
                    }
                  } catch (retryError) {
                    console.error('❌ Échec de la nouvelle tentative:', retryError);
                    setError('Échec du rechargement. Vérifiez votre connexion internet.');
                  }
                };
                loadGoogleMaps();
              }}
              className="text-xs px-2 py-1 h-auto"
            >
              Réessayer
            </Button>
          </div>
        )}
      </div>

      {showMap && !error && (
        <Card>
          <CardContent className="p-0">
            <div ref={mapRef} className="w-full h-64 rounded-lg" style={{ minHeight: '256px' }} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
