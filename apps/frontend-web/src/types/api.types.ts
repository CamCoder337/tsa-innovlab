// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// import type { Mission, Proposition } from './mission.types';
// import type { Product } from './product.types';
// import type { Category } from './category.types';
// import type { Address } from './address.types';

// Base API Response Structure
export interface ApiResponse<T = unknown> {
    data?: {
        success: boolean;
        message: string;
        data?: T;
    };
    error?: {
        success: boolean;
        message: string;
        status: number;
        errors?: string[];
    };
}

// Pagination Structure
export interface PaginationMeta {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: T & {
        pagination: PaginationMeta;
    };
    errors?: string[];
}

// Common List Parameters
export interface ListParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Specific Response Types
// export interface UserResponse extends ApiResponse<{ user: User }> { }
// export interface UsersResponse extends PaginatedResponse<{ users: User[] }> { }

// export interface MissionResponse extends ApiResponse<{ mission: Mission }> { }
// export interface MissionsResponse extends PaginatedResponse<{ missions: Mission[] }> { }

// export interface ProductResponse extends ApiResponse<{ product: Product }> { }
// export interface ProductsResponse extends PaginatedResponse<{ products: Product[] }> { }

// export interface CategoryResponse extends ApiResponse<{ category: Category }> { }
// export interface CategoriesResponse extends PaginatedResponse<{ categories: Category[] }> { }

// export interface PropositionResponse extends ApiResponse<{ proposition: Proposition }> { }
// export interface PropositionsResponse extends PaginatedResponse<{ propositions: Proposition[] }> { }

// export interface AddressResponse extends ApiResponse<{ address: Address }> { }
// export interface AddressesResponse extends PaginatedResponse<{ addresses: Address[] }> { }

// Error Response
export interface ErrorResponse {
    success: false;
    message: string;
    errors: string[];
}
