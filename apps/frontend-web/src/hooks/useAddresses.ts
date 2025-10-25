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
