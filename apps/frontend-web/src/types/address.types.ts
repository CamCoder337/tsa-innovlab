import type { Timestamps } from './common.types';

export interface Address extends Timestamps {
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

export interface AddressSuggestion {
  placeId: string;
  formattedAddress: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
}
