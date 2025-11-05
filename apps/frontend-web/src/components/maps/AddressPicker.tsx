import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, X, AlertCircle, RefreshCw } from 'lucide-react';
import { googleMapsLoader } from '@/lib/google-maps-loader';
import {
  useCommonTranslation,
  useErrorsTranslation,
  useFormsTranslation,
  useMapsTranslation,
} from '@/hooks/useTranslation';
import { useGeolocation } from '@/hooks/useGeolocation';
import { toast } from 'sonner';
import type { Address } from '@/types/address.types';

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
  selectedAddress?: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>;
  onAddressSelect: (address: AddressDetails) => void;
  onClear?: () => void;
  placeholder?: string;
  value?: string;
  className?: string;
  showMap?: boolean;
  disabled?: boolean;
}

export default function AddressPicker({
  selectedAddress,
  onAddressSelect,
  onClear,
  placeholder,
  value = '',
  showMap = false,
  disabled = false,
}: AddressPickerProps) {
  const { t: tCommon } = useCommonTranslation();
  const { t: tErrors } = useErrorsTranslation();
  const { t: tForms } = useFormsTranslation();
  const { t: tMaps } = useMapsTranslation();
  const defaultPlaceholder = placeholder || tMaps('placeholders.searchAddress');
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<{ key: string; options?: Record<string, unknown> } | null>(
    null
  );

  // Extract address details function for useGeolocation
  // const extractAddressDetailsFromGeocoderResult = useCallback(
  //   (place: google.maps.GeocoderResult): AddressDetails => {
  //     const components = place.address_components || [];
  //     const details: Partial<AddressDetails> = {
  //       formatted_address: place.formatted_address || '',
  //       latitude: place.geometry!.location!.lat(),
  //       longitude: place.geometry!.location!.lng(),
  //       place_id: place.place_id || '',
  //       label: place.formatted_address || '',
  //     };

  //     components.forEach((component) => {
  //       const types = component.types;

  //       if (types.includes('street_number')) {
  //         details.street_number = component.long_name;
  //       } else if (types.includes('plus_code')) {
  //         details.street_number = component.long_name;
  //       } else details.street_number = place.plus_code?.global_code;
  //       if (types.includes('route')) {
  //         details.route = component.long_name;
  //       }
  //       if (types.includes('locality')) {
  //         details.locality = component.long_name;
  //       }
  //       if (types.includes('administrative_area_level_1')) {
  //         details.administrative_area_level_1 = component.long_name;
  //       }
  //       if (types.includes('country')) {
  //         details.country = component.long_name;
  //       }
  //       if (types.includes('postal_code')) {
  //         details.postal_code = component.long_name;
  //       }
  //     });

  //     return details as AddressDetails;
  //   },
  //   []
  // );

  // Initialize useGeolocation hook with proper configuration
  const {
    getLocation,
    reset,
    isLoading,
    error: geolocationError,
  } = useGeolocation({
    tErrors,
    tMaps,
    onAddressSelect: (addressDetails) => {
      if (addressDetails) {
        setInputValue(addressDetails.formatted_address);
        onAddressSelect(addressDetails);
        if (showMap && mapInstanceRef.current) {
          updateMapLocation(addressDetails.latitude, addressDetails.longitude);
        }
      }
    },
    minAccuracy: 80,
    maxAttempts: 3,
  });

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const apiKey =
          window._env_?.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error(tErrors('maps.googleMapsApiKeyMissing'));
        }

        await googleMapsLoader.load({ libraries: ['places', 'marker'] });

        if (!window.google?.maps) {
          throw new Error(tErrors('maps.googleMapsNotAvailable'));
        }

        setIsLoaded(true);
        setError(null);
      } catch (error) {
        console.error(tErrors('maps.googleMapsLoadError'), error);
        const errorMessage = error instanceof Error ? error.message : tErrors('errors.unknown');
        setError({ key: 'maps.googleMapsLoadError', options: { error: errorMessage } });
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
        } else details.street_number = place.plus_code?.global_code || place.vicinity;
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
        title: tForms('labels.deliveryAddress'),
        content: markerElement,
      });
    } catch (error) {
      console.error(tErrors('maps.markerCreationError'), error);
      // If AdvancedMarkerElement fails, create a simple marker without custom content
      try {
        markerRef.current = new google.maps.marker.AdvancedMarkerElement({
          position,
          map: mapInstanceRef.current,
          title: tForms('labels.deliveryAddress'),
        });
      } catch (fallbackError) {
        console.error(tErrors('maps.markerCreationFallbackError'), fallbackError);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize modern autocomplete with fallback
  useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled || error) return;
    if (!window.google?.maps?.places?.Autocomplete) {
      setError({ key: 'maps.googleMapsNotAvailable' });
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
          setError({ key: 'maps.invalidAddressSelected' });
          return;
        }

        try {
          const addressDetails = extractAddressDetails(place);
          setInputValue(addressDetails.label || addressDetails.formatted_address);
          onAddressSelect(addressDetails);
          setError(null);

          if (showMap && mapInstanceRef.current) {
            updateMapLocation(addressDetails.latitude, addressDetails.longitude);
          }
        } catch (err) {
          console.error(tErrors('maps.addressProcessingError'), err);
          setError({ key: 'maps.addressProcessingError' });
        }
      };

      autocomplete.addListener('place_changed', handlePlaceSelect);

      return () => {
        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    } catch (err) {
      console.error(tErrors('maps.autocompleteInitError'), err);
      setError({ key: 'maps.addressSearchInitError' });
    }
  }, [
    isLoaded,
    disabled,
    error,
    extractAddressDetails,
    updateMapLocation,
    onAddressSelect,
    showMap,
    tErrors,
  ]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !showMap || !mapRef.current || error) return;

    // Double-check that Google Maps API is available before initializing
    if (!window.google?.maps?.Map) {
      console.error(tErrors('maps.mapConstructorNotAvailable'));
      setError({ key: 'maps.googleMapsNotAvailable' });
      return;
    }

    try {
      // Ensure the map container has proper dimensions
      const mapContainer = mapRef.current;
      mapContainer.style.width = '100%';
      mapContainer.style.height = '256px';
      mapContainer.style.minHeight = '256px';

      // Default center (Cameroon center)
      const defaultCenter = { lat: 4.0511, lng: 9.7679 };
      const initialCenter = selectedAddress?.latitude && selectedAddress?.longitude
        ? { lat: Number(selectedAddress.latitude), lng: Number(selectedAddress.longitude) }
        : defaultCenter;

      const map = new google.maps.Map(mapContainer, {
        center: initialCenter,
        zoom: selectedAddress?.latitude && selectedAddress?.longitude ? 15 : 12,
        mapId: 'TSA_LOGISTICS_MAP', // Add mapId to enable advanced markers
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'cooperative',
      });

      mapInstanceRef.current = map;

      // Create marker for initial selected address if it exists
      if (selectedAddress?.latitude && selectedAddress?.longitude) {
        updateMapLocation(Number(selectedAddress.latitude), Number(selectedAddress.longitude));
      }

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
      console.error(tErrors('maps.mapInitError'), err);
      setError({ key: 'maps.mapInitError' });
    }
  }, [isLoaded, showMap, error, tErrors, selectedAddress, updateMapLocation]);

  // Handle geolocation button click
  const handleGetCurrentLocation = useCallback(() => {
    getLocation();
  }, [getLocation]);

  const handleClear = useCallback(() => {
    setInputValue('');
    setError(null);
    reset();

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
  }, [onClear, reset]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      if (error) setError(null); // Clear error when user starts typing
    },
    [error]
  );

  // Show geolocation error if present
  useEffect(() => {
    if (geolocationError) {
      toast.error(geolocationError);
    }
  }, [geolocationError]);

  if (error) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm sm:text-base font-medium text-red-800">
              {tErrors('maps.geolocationError')}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-red-600 mt-1">
            {tErrors(error.key, error.options!)}
          </p>
        </div>
        <Button
          onClick={() => {
            setError(null);
            setIsLoaded(false);
            // Retry loading Google Maps
            const loadGoogleMaps = async () => {
              try {
                await googleMapsLoader.load({ libraries: ['places', 'marker'] });
                if (window.google?.maps) {
                  setIsLoaded(true);
                  setError(null);
                }
              } catch (retryError) {
                console.error(tErrors('maps.retryFailed'), retryError);
                setError({ key: 'maps.retryGoogleMaps' });
              }
            };
            loadGoogleMaps();
          }}
          className="w-full sm:w-auto flex items-center gap-2 text-sm sm:text-base"
        >
          <RefreshCw className="w-3 h-3 sm:w-4" />
          <span>{tCommon('actions.retry')}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search bar */}
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={error ? tMaps('placeholders.manualAddressEntry') : defaultPlaceholder}
            value={inputValue}
            onChange={handleInputChange}
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

        {!isLoaded && !error && (
          <p className="text-xs text-gray-500 mt-1">{tMaps('messages.loadingGoogleMaps')}</p>
        )}
      </div>

      {/* Header with title and position button */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-start sm:items-center">
        <Button
          onClick={handleGetCurrentLocation}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2 w-full text-sm sm:text-base"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-500" />
              <span>{tMaps('messages.locating')}</span>
            </>
          ) : (
            <>
              <Navigation className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{tMaps('labels.myLocation')}</span>
            </>
          )}
        </Button>
      </div>

      {/* Interactive map */}
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
                  <p className="text-xs sm:text-sm text-gray-600">
                    {tMaps('messages.loadingGoogleMaps')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
