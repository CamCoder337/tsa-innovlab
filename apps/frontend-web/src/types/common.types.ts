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
