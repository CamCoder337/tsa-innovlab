import type { Timestamps } from './common.types';

export interface Address extends Partial<Timestamps> {
  id: string;
  userId: string;
  street: string | null;
  city: string;
  region: string;
  country: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  label: string;
}

export interface CreateAddressDto {
  street?: string;
  city: string;
  region: string;
  postalCode?: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  label: string;
}

export interface UpdateAddressDto extends Partial<CreateAddressDto> {
  id: string;
}

export interface AddressDetails {
  formatted_address: string;
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  country?: string;
  postal_code?: string;
  label?: string;
  latitude: number;
  longitude: number;
  place_id: string;
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
  createAddress: (addressData: CreateAddressDto) => Promise<void>;
  updateAddress: (id: string, updates: UpdateAddressDto) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;

  // Basic actions
  setAddresses: (addresses: Address[]) => void;
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
  convertAddress: (details: AddressDetails) => CreateAddressDto;
}

export type AddressStore = AddressState & AddressActions;
