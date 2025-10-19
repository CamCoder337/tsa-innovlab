// Common types
export type Timestamps = {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type ApiResponse<T> = {
  data?: T;
  error?: {
    success: false;
    status: number;
    message: string;
    errors: string[];
  };
};

export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
  firstPageUrl: string | null;
  lastPageUrl: string | null;
  nextPageUrl: string | null;
  previousPageUrl: string | null;
}

export type PaginatedKeyResponse<T, K extends string> = {
  [key in K]: T[];
} & {
  pagination: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type PaginatedMetaResponse<T, K extends string> = {
  [key in K]: {
    data: T[];
    meta: PaginationMeta;
  };
} & {
  pagination: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

// Simple Lucid paginator shape: { data: T[]; meta: PaginationMeta }
// Used by endpoints that return paginator.serialize() directly without an extra wrapper
export type Paginator<T> = {
  data: T[];
  meta: PaginationMeta;
};
