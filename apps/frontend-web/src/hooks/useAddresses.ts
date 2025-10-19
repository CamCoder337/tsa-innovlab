import { useAddressStore } from '../stores/address.store';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export const useAddresses = () => {
  const store = useAddressStore();
  const { user } = useAuth();

  // Auto-initialize on first use
  useEffect(() => {
    if (user) {
      store.fetchAddresses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return {
    // State
    addresses: store.addresses,
    currentAddress: store.currentAddress,
    isLoading: store.isLoading,
    error: store.error,

    // Async actions
    fetchAddresses: store.fetchAddresses,
    fetchAddress: store.fetchAddress,
    createAddress: store.createAddress,
    updateAddressAsync: store.updateAddressAsync,
    deleteAddressAsync: store.deleteAddressAsync,

    // Utility actions
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
    reset: store.reset,

    // Basic actions
    setAddresses: store.setAddresses,
    addAddress: store.addAddress,
    updateAddress: store.updateAddress,
    deleteAddress: store.deleteAddress,
    setCurrentAddress: store.setCurrentAddress,

    // Utility methods
    getAddress: store.getAddress,
    searchAddresses: store.searchAddresses,
    getAddressesByCity: store.getAddressesByCity,
    getAddressesByRegion: store.getAddressesByRegion,
  };
};

// Helper hooks for specific use cases
export const useAddressLoading = () => useAddressStore((state) => state.isLoading);
export const useAddressError = () => useAddressStore((state) => state.error);
export const useCurrentAddress = () => useAddressStore((state) => state.currentAddress);

export const useSearchAddresses = (query: string) => {
  const addresses = useAddressStore((state) => state.addresses);
  const lowercaseQuery = query.toLowerCase();
  return addresses.filter(
    (addr) =>
      addr.label?.toLowerCase().includes(lowercaseQuery) ||
      addr.street?.toLowerCase().includes(lowercaseQuery) ||
      addr.city?.toLowerCase().includes(lowercaseQuery) ||
      addr.region?.toLowerCase().includes(lowercaseQuery) ||
      addr.country?.toLowerCase().includes(lowercaseQuery)
  );
};

export const useAddressesByCity = (city: string) => {
  const addresses = useAddressStore((state) => state.addresses);
  return addresses.filter((addr) => addr.city?.toLowerCase() === city.toLowerCase());
};

export const useAddressesByRegion = (region: string) => {
  const addresses = useAddressStore((state) => state.addresses);
  return addresses.filter((addr) => addr.region?.toLowerCase() === region.toLowerCase());
};
