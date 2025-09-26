import { create } from 'zustand';
import type { Address, AddressStore } from '../types/address.types';

// const mockAddresses: Address[] = [
//     {
//         "id": "1b5e5b85-105f-42e4-8074-086611953bb6",
//         "label": "Entrepôt Douala Bonabéri",
//         "street": "Rue des Industries",
//         "city": "Douala",
//         "region": "Littoral",
//         "country": "Cameroon",
//         "postalCode": "12345",
//         "latitude": 4.0667,
//         "longitude": 9.7,
//         "createdAt": "2025-09-24T05:25:33.651+01:00"
//     },
//     {
//         "id": "58702ea1-d151-450b-9020-b238ecbeff7a",
//         "label": "Chantier Yaoundé Centre",
//         "street": "Avenue Kennedy",
//         "city": "Yaoundé",
//         "region": "Centre",
//         "country": "Cameroon",
//         "postalCode": "12345",
//         "latitude": 3.8667,
//         "longitude": 11.5167,
//         "createdAt": "2025-09-24T05:25:33.653+01:00"
//     }
//   ];

function persistAddressesToLocalStorage(addresses: Address[]) {
  try {
    localStorage.setItem('tsa_addresses', JSON.stringify(addresses));
  } catch (error) {
    console.error('Failed to persist addresses to localStorage:', error);
  }
}

function loadAddressesFromLocalStorage(): Address[] {
  try {
    const raw = localStorage.getItem('tsa_addresses');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Failed to load missions from localStorage:', error);
  }
  return [];
}

export const useAddressStore = create<AddressStore>((set, get) => ({
  addresses: loadAddressesFromLocalStorage(),
  isLoading: false,
  error: null,

  setAddresses: async (addresses: Address[]) => {
    persistAddressesToLocalStorage(addresses);
    set({ addresses });
  },

  getAddress: async (id: string) => {
    return get().addresses.find((addr) => addr.id === id);
  },

  addAddress: async (address: Address) => {
    const addresses = get().addresses;
    const updatedAddresses = [...addresses, address];
    persistAddressesToLocalStorage(updatedAddresses);
    set({ addresses: updatedAddresses });
  },

  updateAddress: async (id: string, updates: Partial<Address>) => {
    const addresses = get().addresses;
    const updatedAddresses = addresses.map((addr) =>
      addr.id === id ? { ...addr, ...updates } : addr
    );
    persistAddressesToLocalStorage(updatedAddresses);
    set({ addresses: updatedAddresses });
  },

  deleteAddress: async (id: string) => {
    const addresses = get().addresses;
    const updatedAddresses = addresses.filter((addr) => addr.id !== id);
    persistAddressesToLocalStorage(updatedAddresses);
    set({ addresses: updatedAddresses });
  },

  clearError: () => {
    set({ error: null });
  },
}));
