import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, X, AlertCircle, RefreshCw } from 'lucide-react';
import { googleMapsLoader } from '@/lib/google-maps-loader';
import {
  useErrorsTranslation,
  useFormsTranslation,
  useMapsTranslation,
} from '@/hooks/useTranslation';
import i18n from '@/i18n';
import { toast } from 'sonner';

export interface AddressDetails {
  formatted_address: string;
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  country?: string;
  postal_code?: string;
  label?: string;
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
  placeholder,
  value = '',
  showMap = false,
  disabled = false,
}: AddressPickerProps) {
  const { t: tForms } = useFormsTranslation();
  const { t: tErrors } = useErrorsTranslation();
  const { t: tMaps } = useMapsTranslation();
  const defaultPlaceholder = placeholder || tMaps('placeholders.searchAddress');
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
        // console.log('🗺️ Chargement de Google Maps...');

        // Check if API key is available
        const apiKey =
          window._env_?.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error(tErrors('maps.googleMapsApiKeyMissing'));
        }

        // console.log('🔑 Clé API Google Maps trouvée');

        await googleMapsLoader.load({ libraries: ['places', 'marker'] });

        // Verify Google Maps is actually loaded
        if (!window.google?.maps) {
          throw new Error(tErrors('maps.googleMapsNotAvailable'));
        }

        // console.log('✅ Google Maps chargé avec succès');
        setIsLoaded(true);
        setError(null);
      } catch (error) {
        console.error('❌ Erreur lors du chargement de Google Maps:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        setError(tErrors('maps.googleMapsLoadError', { error: errorMessage }));
      }
    };

    loadGoogleMaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        label: place.name || '',
      };

      components.forEach((component) => {
        const types = component.types;

        if (types.includes('street_number')) {
          details.street_number = component.long_name;
        } else if (types.includes('plus_code')) {
          details.street_number = component.long_name;
        } else details.street_number = place.plus_code?.global_code;
        if (types.includes('route')) {
          details.route = component.long_name;
        }
        if (types.includes('locality')) {
          details.locality = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          details.administrative_area_level_1 = component.long_name;
        }
        if (types.includes('country')) {
          details.country = component.long_name;
        }
        if (types.includes('postal_code')) {
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
          title: tForms('labels.deliveryAddress'),
        });
      } catch (fallbackError) {
        console.error('Error creating basic AdvancedMarkerElement:', fallbackError);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize modern autocomplete with fallback
  useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled || error) return;
    if (!window.google?.maps?.places?.Autocomplete) {
      setError(tErrors('maps.googleMapsNotAvailable'));
      return;
    }

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment'],
        fields: [
          'name',
          'formatted_address',
          'vicinity',
          'address_components',
          'geometry',
          'place_id',
        ],
        componentRestrictions: { country: ['cm'] },
        bounds: new google.maps.LatLngBounds(
          { lat: 1.5, lng: 8.2 }, // SW corner
          { lat: 13.5, lng: 16.2 } // NE corner
        ),
      });

      autocompleteRef.current = autocomplete;

      const handlePlaceSelect = () => {
        const place = autocomplete.getPlace();

        if (!place.geometry?.location) {
          setError(tErrors('maps.invalidAddressSelected'));
          return;
        }

        // console.log(place);

        try {
          const addressDetails = extractAddressDetails(place);
          setInputValue(addressDetails.label || addressDetails.formatted_address);
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
      console.error('Autocomplete init error:', err);
      setError(tErrors('maps.addressSearchInitError'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Double-check that Google Maps API is available before initializing
    if (!window.google?.maps?.Map) {
      console.error('Google Maps Map constructor not available');
      setError(tErrors('maps.googleMapsNotAvailable'));
      return;
    }

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
      setError(tErrors('maps.mapInitError'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, showMap, error]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(tErrors('maps.geolocationNotSupported'));
      return;
    }

    setIsLoadingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // Check accuracy but be more lenient
        if (!accuracy || accuracy <= 0) {
          setError(tErrors('maps.geolocationTooLowAccuracy', { accuracy: accuracy }));
          setIsLoadingLocation(false);
          return;
        }

        // Show warning for moderate accuracy but continue
        if (accuracy > 1000) {
          toast.warning(tErrors('maps.geolocationLowAccuracy', { accuracy: Math.round(accuracy) }));
          console.warn(`⚠️ Low GPS accuracy: ${Math.round(accuracy)}m`);
        }

        try {
          const geocoder = new google.maps.Geocoder();
          const { results } = await geocoder.geocode({
            language: i18n.language,
            location: { lat: latitude, lng: longitude },
            region: 'cm',
          });

          // console.log(results);

          const place = results[0];

          console.log(place);
          if (!place) throw new Error();

          const details = extractAddressDetails(place);
          details.latitude = latitude;
          details.longitude = longitude;

          setInputValue(details.formatted_address);
          onAddressSelect(details);

          if (showMap && mapInstanceRef.current) {
            updateMapLocation(latitude, longitude);
          }
        } catch {
          setError(tErrors('maps.cannotGetAddress'));
        } finally {
          setIsLoadingLocation(false);
        }
      },
      () => {
        setError(tErrors('maps.cannotAccessLocation'));
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true, // Enable GPS for better accuracy
        timeout: 30000, // Increase timeout for GPS lock
        maximumAge: 0, // Ne jamais utiliser de cache - toujours demander une nouvelle position
      }
    );
  }, [onAddressSelect, showMap, updateMapLocation, tErrors, extractAddressDetails]);

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

        // console.log('📝 Adresse manuelle soumise:', manualAddress);
        onAddressSelect(manualAddress);
      }
    },
    [inputValue, error, onAddressSelect]
  );

  if (error) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm sm:text-base font-medium text-red-800">Erreur de géolocalisation</span>
          </div>
          <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
        </div>
        <Button
          onClick={() => {
            setError(null);
            setIsLoaded(false);
            // Retry loading Google Maps
            const loadGoogleMaps = async () => {
              try {
                // console.log('🔄 Nouvelle tentative de chargement de Google Maps...');
                await googleMapsLoader.load({ libraries: ['places', 'marker'] });
                if (window.google?.maps) {
                  setIsLoaded(true);
                  setError(null);
                }
              } catch (retryError) {
                console.error('❌ Échec de la nouvelle tentative:', retryError);
                setError(tErrors('maps.retryGoogleMaps'));
              }
            };
            loadGoogleMaps();
          }}
          className="w-full sm:w-auto flex items-center gap-2 text-sm sm:text-base"
        >
          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Réessayer</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* En-tête avec titre et bouton position */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            {tMaps('selectAddress')}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {tMaps('searchOrSelectOnMap')}
          </p>
        </div>
        <Button
          onClick={getCurrentLocation}
          disabled={isLoadingLocation}
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base"
        >
          {isLoadingLocation ? (
            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-500" />
          ) : (
            <Navigation className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
          <span className="hidden sm:inline">{tMaps('myPosition')}</span>
          <span className="sm:hidden">Position</span>
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={error ? tMaps('placeholders.manualAddressEntry') : defaultPlaceholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleManualSubmit}
            disabled={disabled || (!isLoaded && !error)}
            className={`pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base ${error ? 'border-orange-300 bg-orange-50' : ''}`}
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

        {/* Suggestions d'adresses */}
        {/* {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm sm:text-base"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {suggestion.structured_formatting?.main_text || suggestion.description}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {suggestion.structured_formatting?.secondary_text || ''}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )} */}

        {!isLoaded && !error && (
          <p className="text-xs text-gray-500 mt-1">{tMaps('messages.loadingGoogleMaps')}</p>
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
                    // console.log('🔄 Nouvelle tentative de chargement de Google Maps...');
                    await googleMapsLoader.load({ libraries: ['places', 'marker'] });
                    if (window.google?.maps) {
                      setIsLoaded(true);
                      setError(null);
                    }
                  } catch (retryError) {
                    console.error('❌ Échec de la nouvelle tentative:', retryError);
                    setError(tErrors('maps.retryGoogleMaps'));
                  }
                };
                loadGoogleMaps();
              }}
              className="text-xs px-2 py-1 h-auto"
            >
              {tMaps('buttons.retry')}
            </Button>
          </div>
        )}
      </div>

      {/* Carte interactive */}
      {showMap && !error && (
        <Card>
          <CardContent className="p-0">
            <div
              ref={mapRef}
              className="w-full h-64 sm:h-80 lg:h-96 rounded-lg border border-gray-200"
              style={{ minHeight: '200px' }}
            />

            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center p-4 sm:p-6">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500 mx-auto mb-2 sm:mb-3"></div>
                  <p className="text-xs sm:text-sm text-gray-600">{tMaps('loadingMap')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informations sur l'adresse sélectionnée */}
      {/* {selectedAddress && (
        <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2 sm:gap-3">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm sm:text-base font-medium text-blue-900 mb-1">
                {t('selectedAddress')}
              </h4>
              <p className="text-xs sm:text-sm text-blue-700 break-words">
                {selectedAddress.formatted_address}
              </p>
              {selectedAddress.geometry?.location && (
                <p className="text-xs text-blue-600 mt-1">
                  {t('coordinates')}: {selectedAddress.geometry.location.lat().toFixed(6)}, {selectedAddress.geometry.location.lng().toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>
      )} */}

      {/* Actions */}
      {/* <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button
          onClick={handleConfirm}
          disabled={!selectedAddress}
          className="flex-1 sm:flex-none text-sm sm:text-base"
        >
          <span className="hidden sm:inline">{t('confirmAddress')}</span>
          <span className="sm:hidden">Confirmer</span>
        </Button>
        <Button
          onClick={handleClear}
          variant="outline"
          className="flex-1 sm:flex-none text-sm sm:text-base"
        >
          <span className="hidden sm:inline">{t('clearSelection')}</span>
          <span className="sm:hidden">Effacer</span>
        </Button>
      </div> */}

      {/* État de chargement pour les opérations */}
      {isLoadingLocation && (
        <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-yellow-500"></div>
            <span className="text-xs sm:text-sm text-yellow-800">{tMaps('gettingLocation')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
