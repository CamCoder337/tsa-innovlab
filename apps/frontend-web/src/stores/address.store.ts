import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Address, AddressStore } from '../types/address.types';

export const useAddressStore = create<AddressStore>()(
  persist(
    (set, get) => ({
      // State
      addresses: [],
      currentAddress: null,
      isLoading: false,
      error: null,

      // Async actions (placeholder for future API integration)
      fetchAddresses: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Replace with actual API call when address service is available
          // const response = await addressService.getAddresses();
          // if (response.error) {
          //   set({ error: response.error.message, isLoading: false });
          // } else {
          //   set({ addresses: response.data || [], isLoading: false });
          // }

          // For now, just set loading to false
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch addresses',
            isLoading: false,
          });
        }
      },

      fetchAddress: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Replace with actual API call when address service is available
          // const response = await addressService.getAddress(id);
          // if (response.error) {
          //   set({ error: response.error.message, isLoading: false });
          // } else {
          //   set({ currentAddress: response.data, isLoading: false });
          // }

          // For now, find in local store
          const address = get().addresses.find((addr) => addr.id === id);
          set({ currentAddress: address || null, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch address',
            isLoading: false,
          });
        }
      },

      createAddress: async (addressData: Omit<Address, 'createdAt'>) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Replace with actual API call when address service is available
          // const response = await addressService.createAddress(addressData);
          // if (response.error) {
          //   set({ error: response.error.message, isLoading: false });
          //   return false;
          // } else {
          //   const addresses = get().addresses;
          //   set({ addresses: [...addresses, response.data], isLoading: false });
          //   return true;
          // }

          // For now, create locally with mock ID
          const newAddress: Address = {
            ...addressData,
            createdAt: new Date().toISOString(),
          };
          const addresses = get().addresses;
          set({ addresses: [...addresses, newAddress], isLoading: false });
          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create address',
            isLoading: false,
          });
          return false;
        }
      },

      updateAddressAsync: async (id: string, updates: Partial<Address>) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Replace with actual API call when address service is available
          // const response = await addressService.updateAddress(id, updates);
          // if (response.error) {
          //   set({ error: response.error.message, isLoading: false });
          //   return false;
          // } else {
          //   const addresses = get().addresses;
          //   const updatedAddresses = addresses.map((addr) =>
          //     addr.id === id ? { ...addr, ...response.data } : addr
          //   );
          //   set({ addresses: updatedAddresses, isLoading: false });
          //   return true;
          // }

          // For now, update locally
          const addresses = get().addresses;
          const updatedAddresses = addresses.map((addr) =>
            addr.id === id ? { ...addr, ...updates } : addr
          );
          set({ addresses: updatedAddresses, isLoading: false });
          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update address',
            isLoading: false,
          });
          return false;
        }
      },

      deleteAddressAsync: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Replace with actual API call when address service is available
          // const response = await addressService.deleteAddress(id);
          // if (response.error) {
          //   set({ error: response.error.message, isLoading: false });
          //   return false;
          // } else {
          //   const addresses = get().addresses;
          //   const updatedAddresses = addresses.filter((addr) => addr.id !== id);
          //   set({ addresses: updatedAddresses, isLoading: false });
          //   return true;
          // }

          // For now, delete locally
          const addresses = get().addresses;
          const updatedAddresses = addresses.filter((addr) => addr.id !== id);
          set({ addresses: updatedAddresses, isLoading: false });
          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete address',
            isLoading: false,
          });
          return false;
        }
      },

      // Basic actions
      setAddresses: (addresses: Address[]) => {
        set({ addresses });
      },

      addAddress: (address: Address) => {
        const addresses = get().addresses;
        set({ addresses: [...addresses, address] });
      },

      updateAddress: (id: string, updates: Partial<Address>) => {
        const addresses = get().addresses;
        const updatedAddresses = addresses.map((addr) =>
          addr.id === id ? { ...addr, ...updates } : addr
        );
        set({ addresses: updatedAddresses });
      },

      deleteAddress: (id: string) => {
        const addresses = get().addresses;
        const updatedAddresses = addresses.filter((addr) => addr.id !== id);
        set({ addresses: updatedAddresses });
      },

      setCurrentAddress: (address: Address | null) => {
        set({ currentAddress: address });
      },

      // Utility actions
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({ addresses: [], currentAddress: null, isLoading: false, error: null });
      },

      // Utility methods
      getAddress: (id: string) => {
        return get().addresses.find((addr) => addr.id === id);
      },

      searchAddresses: (query: string) => {
        const lowercaseQuery = query.toLowerCase();
        return get().addresses.filter(
          (addr) =>
            addr.label?.toLowerCase().includes(lowercaseQuery) ||
            addr.street?.toLowerCase().includes(lowercaseQuery) ||
            addr.city?.toLowerCase().includes(lowercaseQuery) ||
            addr.region?.toLowerCase().includes(lowercaseQuery) ||
            addr.country?.toLowerCase().includes(lowercaseQuery)
        );
      },

      getAddressesByCity: (city: string) => {
        return get().addresses.filter((addr) => addr.city?.toLowerCase() === city.toLowerCase());
      },

      getAddressesByRegion: (region: string) => {
        return get().addresses.filter(
          (addr) => addr.region?.toLowerCase() === region.toLowerCase()
        );
      },
    }),
    {
      name: 'tsa-address-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        addresses: state.addresses,
        currentAddress: state.currentAddress,
      }),
    }
  )
);
