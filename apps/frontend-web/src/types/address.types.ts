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
  isLoading: boolean;
  error: string | null;
}

interface AddressActions {
  setAddresses: (addresses: Address[]) => void;
  getAddress: (addressId: string) => void;
  addAddress: (address: Address) => void;
  updateAddress: (addressId: string, updates: Partial<Address>) => void;
  deleteAddress: (addressId: string) => void;
  clearError: () => void;
}

export type AddressStore = AddressState & AddressActions;
