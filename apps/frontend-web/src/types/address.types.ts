import type { Timestamps } from './common.types';

export interface Address extends Partial<Timestamps> {
  id: string;
  street: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  label: string;
}

export interface CreateAddressDto {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  type?: 'shipping' | 'billing' | 'both';
  company?: string;
  phone?: string;
  notes?: string | null;
}

export interface UpdateAddressDto extends Partial<CreateAddressDto> {
  id: string;
}

interface AddressState {
  addresses: Address[];
  currentAddress: Address | null;
  isLoading: boolean;
  error: string | null;
}

interface AddressActions {
  // Async actions
  fetchAddresses: () => Promise<void>;
  fetchAddress: (id: string) => Promise<void>;
  createAddress: (addressData: Omit<Address, 'id' | 'createdAt'>) => Promise<boolean>;
  updateAddressAsync: (id: string, updates: Partial<Address>) => Promise<boolean>;
  deleteAddressAsync: (id: string) => Promise<boolean>;

  // Basic actions
  setAddresses: (addresses: Address[]) => void;
  addAddress: (address: Address) => void;
  updateAddress: (id: string, updates: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  setCurrentAddress: (address: Address | null) => void;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;

  // Utility methods
  getAddress: (id: string) => Address | undefined;
  searchAddresses: (query: string) => Address[];
  getAddressesByCity: (city: string) => Address[];
  getAddressesByRegion: (region: string) => Address[];
}

export type AddressStore = AddressState & AddressActions;
