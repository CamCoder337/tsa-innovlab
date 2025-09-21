import type { Timestamps } from './common.types';

export interface Address extends Timestamps {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  type: 'shipping' | 'billing' | 'both';
  company: string | null;
  phone: string | null;
  notes: string | null;
  userId: string;
  formattedAddress: string;
}

export interface CreateAddressDto {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
  type?: 'shipping' | 'billing' | 'both';
  company?: string | null;
  phone?: string | null;
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
