import type { AddressDetails } from '@/components/maps/AddressPicker';
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

// Types
interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface Result extends Coords {
  formatted_address?: string;
  addressDetails?: AddressDetails;
  timestamp: number;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  requireAddress?: boolean; // Whether to reverse geocode
  minAccuracy?: number; // Minimum acceptable accuracy (meters)
  maxAttempts?: number;
  tErrors?: (key: string, params?: Record<string, unknown>) => string;
  tMaps?: (key: string, params?: Record<string, unknown>) => string; // i18n function
  onAddressSelect?: (details: AddressDetails | undefined) => void;
  extractAddressDetails?: (place: google.maps.GeocoderResult) => AddressDetails;
}

interface UseGeolocationReturn {
  getLocation: () => void;
  reset: () => void;
  location: Result | null;
  isLoading: boolean;
  error: string | null;
  accuracy: number | null;
}

// Default options
const DEFAULT_OPTIONS: Partial<UseGeolocationOptions> = {
  enableHighAccuracy: true,
  timeout: 20000,
  requireAddress: true,
  minAccuracy: 100,
  maxAttempts: 2,
};

export const useGeolocation = (options: UseGeolocationOptions = {}): UseGeolocationReturn => {
  const {
    enableHighAccuracy = true,
    timeout = 90000,
    requireAddress = true,
    minAccuracy = 100,
    maxAttempts = 3,
    tErrors,
    tMaps,
    onAddressSelect,
    extractAddressDetails,
  } = { ...DEFAULT_OPTIONS, ...options };

  const [location, setLocation] = useState<Result | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const watchId = useRef<number | null>(null);
  const attempts = useRef(0);
  const timerId = useRef<NodeJS.Timeout | null>(null);
  const bestAcc = useRef<number>(Infinity);

  const cleanup = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (timerId.current) {
      clearTimeout(timerId.current);
      timerId.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cleanup();
    attempts.current = 0;
    bestAcc.current = Infinity;
    setLocation(null);
    setError(null);
    setAccuracy(null);
    setIsLoading(false);
  }, [cleanup]);

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!requireAddress || !window.google?.maps) return null;

    const geocoder = new google.maps.Geocoder();
    const { results } = await geocoder.geocode({
      location: { lat, lng },
      language: navigator.language || 'en',
      region: 'cm',
    });

    const place = results[0];
    if (!place) throw new Error('No address found');

    const details = extractAddressDetails
      ? extractAddressDetails(place)
      : { formatted_address: place.formatted_address };

    return { formatted_address: place.formatted_address, addressDetails: details };
  };

  const finish = async (coords: Coords) => {
    cleanup();
    setAccuracy(coords.accuracy);
    setIsLoading(false);

    try {
      const address = requireAddress ? await reverseGeocode(coords.latitude, coords.longitude) : {};
      const result: Result = {
        ...coords,
        timestamp: Date.now(),
        ...address,
      };
      setLocation(result);
      onAddressSelect?.(result.addressDetails);
    } catch {
      setError(tErrors!('maps.cannotGetAddress'));
    }
  };

  /** Start a **single** watch – stops automatically when good enough */
  const startWatch = () => {
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy;
        if (acc < bestAcc.current) {
          bestAcc.current = acc;
          if (acc <= minAccuracy) {
            finish({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: acc,
            });
          } else {
            toast.loading(tMaps!('messages.improvingAccuracy', { accuracy: Math.round(acc) }), {
              id: 'acc',
            });
          }
        }
      },
      (err) => {
        cleanup();
        // **Do NOT retry automatically** – just fail
        const msg =
          err.code === 1
            ? tErrors!('maps.permissionDenied')
            : err.code === 2
              ? tErrors!('maps.positionUnavailable')
              : tErrors!('maps.cannotAccessLocation');
        setError(msg);
        setIsLoading(false);
      },
      { enableHighAccuracy, timeout, maximumAge: 0 }
    );

    // Hard stop after `timeout + 5s` – prevents infinite watch
    timerId.current = setTimeout(() => {
      cleanup();
      toast.dismiss();
      setError(tErrors!('maps.geolocationTimeout'));
      setIsLoading(false);
    }, timeout + 5_000);
  };

  /** First attempt – fast `getCurrentPosition` */
  const tryOnce = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const acc = pos.coords.accuracy;
        if (acc <= minAccuracy) {
          finish({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: acc });
        } else {
          // Accuracy not good enough → start a **single** watch
          startWatch();
        }
      },
      (err) => {
        cleanup();
        if (attempts.current < maxAttempts) {
          attempts.current++;
          // One automatic retry with watch
          startWatch();
        } else {
          const msg =
            err.code === 1
              ? tErrors!('maps.permissionDenied')
              : err.code === 2
                ? tErrors!('maps.positionUnavailable')
                : tErrors!('maps.cannotAccessLocation');
          setError(msg);
          setIsLoading(false);
        }
      },
      { enableHighAccuracy, timeout, maximumAge: 0 }
    );
  };

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(tErrors!('maps.geolocationNotSupported'));
      return;
    }

    reset(); // <-- guarantees clean slate
    setIsLoading(true);
    tryOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enableHighAccuracy,
    timeout,
    minAccuracy,
    maxAttempts,
    requireAddress,
    tErrors,
    onAddressSelect,
    extractAddressDetails,
    reset,
  ]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  return { getLocation, reset, location, isLoading, error, accuracy };
};
