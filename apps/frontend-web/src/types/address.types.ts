// ============================================================================
// ADDRESS TYPES - TSA Monolith API Compatible
// ============================================================================

export interface Address {
  id: string;
  label: string | null;
  street: string;
  city: string;
  region: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface CreateAddressRequest {
  label?: string;
  street: string;
  city: string;
  region?: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}
