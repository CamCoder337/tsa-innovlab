import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Address,
  AddressDetails,
  AddressStore,
  CreateAddressDto,
  UpdateAddressDto,
} from '../types/address.types';
import { addressService } from '@/services/address.service';

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
        set({
          isLoading: true,
          error: null,
        });

        try {
          const response = await addressService.getAddresses();

          if (response.error) {
            set({ error: response.error.message, isLoading: false });
            return;
          }

          if (response.data) set({ addresses: response.data || [], isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch addresses',
            isLoading: false,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchAddress: async (id: string) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const response = await addressService.getAddress(id);

          if (response.error) {
            set({ error: response.error.message, isLoading: false });
            return;
          }

          if (response.data) {
            set({ currentAddress: response.data, isLoading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch address',
            isLoading: false,
          });
        }
      },

      createAddress: async (addressData: CreateAddressDto) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const response = await addressService.createAddress(addressData);

          if (response.error) {
            set({ error: response.error.message, isLoading: false });
            return;
          }

          if (response.data) {
            set((state) => ({
              addresses: [...state.addresses, response.data as Address],
              isLoading: false,
              error: null,
            }));
            return;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create address',
            isLoading: false,
          });
          return;
        }
      },

      updateAddress: async (id: string, updates: UpdateAddressDto) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const response = await addressService.updateAddress(id, updates);

          if (response.error) {
            set({ error: response.error.message, isLoading: false });
            return;
          }

          if (response.data) {
            set((state) => ({
              addresses: state.addresses.map((address) =>
                address.id === id ? (response.data as Address) : address
              ),
              currentAddress:
                state.currentAddress?.id === id ? (response.data as Address) : state.currentAddress,
              isLoading: false,
              error: null,
            }));
            return;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update address',
            isLoading: false,
          });
          return;
        }
      },

      deleteAddress: async (id: string) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const response = await addressService.deleteAddress(id);

          if (response.error) {
            set({ error: response.error.message, isLoading: false });
            return;
          }

          if (response.data) {
            set((state) => ({
              addresses: state.addresses.filter((address) => address.id !== id),
              currentAddress: state.currentAddress?.id === id ? null : state.currentAddress,
              isLoading: false,
              error: null,
            }));
            return;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete address',
            isLoading: false,
          });
          return;
        }
      },

      // Basic actions
      setAddresses: (addresses: Address[]) => {
        set({ addresses });
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

      convertAddress: (addressDetails: AddressDetails): CreateAddressDto => {
        return {
          label: addressDetails.label || addressDetails.formatted_address || 'Nouvelle adresse',
          street: `${addressDetails.street_number || ''}`.trim() || '',
          city: addressDetails.locality || '',
          region: addressDetails.administrative_area_level_1 || '',
          country: addressDetails.country || '',
          postalCode: addressDetails.postal_code || '',
          latitude: addressDetails.latitude,
          longitude: addressDetails.longitude,
        };
      },
    }),
    {
      name: 'tsa_addresses',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        addresses: state.addresses,
        currentAddress: state.currentAddress,
      }),
    }
  )
);
