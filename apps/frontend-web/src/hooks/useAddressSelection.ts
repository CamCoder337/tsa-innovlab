import { useState, useCallback } from 'react';
import type { AddressDetails } from '@/components/maps/AddressPicker';

export interface DeliveryAddress {
  formatted_address: string;
  street: string;
  city: string;
  region: string;
  country: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  place_id: string;
  label: string;
}

interface UseAddressSelectionReturn {
  selectedAddress: DeliveryAddress | null;
  isAddressSelected: boolean;
  selectAddress: (address: AddressDetails) => void;
  clearAddress: () => void;
  getFormattedAddress: () => string;
  getAddressComponents: () => {
    street: string;
    city: string;
    region: string;
    country: string;
    postal_code: string;
  };
}

export function useAddressSelection(): UseAddressSelectionReturn {
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);

  const selectAddress = useCallback((address: AddressDetails) => {
    // Convert AddressDetails to DeliveryAddress format
    const deliveryAddress: DeliveryAddress = {
      formatted_address: address.formatted_address,
      street: buildStreetAddress(address.street_number, address.route),
      city: address.locality || '',
      region: address.administrative_area_level_1 || '',
      country: address.country || '',
      postal_code: address.postal_code || '',
      latitude: address.latitude,
      longitude: address.longitude,
      place_id: address.place_id,
      label: address.label || '',
    };

    setSelectedAddress(deliveryAddress);
  }, []);

  const clearAddress = useCallback(() => {
    setSelectedAddress(null);
  }, []);

  const getFormattedAddress = useCallback(() => {
    return selectedAddress?.label || selectedAddress?.formatted_address || '';
  }, [selectedAddress]);

  const getAddressComponents = useCallback(() => {
    if (!selectedAddress) {
      return {
        street: '',
        city: '',
        region: '',
        country: '',
        postal_code: '',
      };
    }

    return {
      street: selectedAddress.street,
      city: selectedAddress.city,
      region: selectedAddress.region,
      country: selectedAddress.country,
      postal_code: selectedAddress.postal_code,
    };
  }, [selectedAddress]);

  const isAddressSelected = selectedAddress !== null;

  return {
    selectedAddress,
    isAddressSelected,
    selectAddress,
    clearAddress,
    getFormattedAddress,
    getAddressComponents,
  };
}

// Helper function to build street address from components
function buildStreetAddress(streetNumber?: string, route?: string): string {
  const parts = [];

  if (streetNumber) {
    parts.push(streetNumber);
  }

  if (route) {
    parts.push(route);
  }

  return parts.join(' ') || '';
}

// Hook for managing multiple saved addresses (for future use)
export function useSavedAddresses() {
  const [savedAddresses, setSavedAddresses] = useState<DeliveryAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const saveAddress = useCallback((address: DeliveryAddress, label?: string) => {
    const addressWithLabel = {
      ...address,
      label: label || address.formatted_address,
    };

    setSavedAddresses((prev) => {
      // Check if address already exists
      const exists = prev.some((addr) => addr.place_id === address.place_id);
      if (exists) {
        return prev.map((addr) => (addr.place_id === address.place_id ? addressWithLabel : addr));
      }
      return [...prev, addressWithLabel];
    });
  }, []);

  const removeAddress = useCallback((placeId: string) => {
    setSavedAddresses((prev) => prev.filter((addr) => addr.place_id !== placeId));
  }, []);

  const loadSavedAddresses = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to load saved addresses
      // const addresses = await addressService.getSavedAddresses();
      // setSavedAddresses(addresses);
    } catch (error) {
      console.error('Failed to load saved addresses:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    savedAddresses,
    isLoading,
    saveAddress,
    removeAddress,
    loadSavedAddresses,
  };
}
