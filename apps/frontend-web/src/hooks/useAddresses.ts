import { useAddressStore } from '../stores/address.store';

export const useAddresses = () => {
  const addresses = useAddressStore((s) => s.addresses);
  const isLoading = useAddressStore((s) => s.isLoading);
  const error = useAddressStore((s) => s.error);

  const setAddresses = useAddressStore((s) => s.setAddresses);
  const getAddress = useAddressStore((s) => s.getAddress);
  const addAddress = useAddressStore((s) => s.addAddress);
  const updateAddress = useAddressStore((s) => s.updateAddress);
  const deleteAddress = useAddressStore((s) => s.deleteAddress);
  const clearError = useAddressStore((s) => s.clearError);

  // Fetch addresses on mount if not already loaded
  //   useEffect(() => {
  //     if (addresses.length === 0) {
  //       fetchAddresses().catch(console.error);
  //     }
  //   }, [fetchAddresses, addresses.length]);

  return {
    // State
    addresses,
    isLoading,
    error,

    // Actions
    setAddresses,
    getAddress,
    addAddress,
    updateAddress,
    deleteAddress,
    clearError,
  };
};
