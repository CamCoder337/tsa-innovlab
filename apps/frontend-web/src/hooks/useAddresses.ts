import { useAddressStore } from '../stores/address.store';

export const useAddresses = () => {
  const store = useAddressStore();

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
    updateAddress: store.updateAddress,
    deleteAddress: store.deleteAddress,

    // Utility actions
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
    reset: store.reset,

    // Basic actions
    setAddresses: store.setAddresses,
    setCurrentAddress: store.setCurrentAddress,

    // Utility methods
    getAddress: store.getAddress,
    searchAddresses: store.searchAddresses,
    getAddressesByCity: store.getAddressesByCity,
    getAddressesByRegion: store.getAddressesByRegion,
    convertAddress: store.convertAddress,
  };
};
