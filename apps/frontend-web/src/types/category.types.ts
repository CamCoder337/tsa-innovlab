import type { Timestamps } from './common.types';
import type { Product } from './product.types';

export interface Category extends Timestamps {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  slug: string;
  products: Product[];
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
}

export interface CreateCategory {
  name: string;
  description?: string | null;
  parentId?: string | null;
  slug?: string; // Auto-generated if not provided
  imageUrl?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateCategory {
  id: string;
  name?: string;
  description?: string | null;
  parentId?: string | null;
  slug?: string;
  imageUrl?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface CategoryTreeItem extends Category {
  children: CategoryTreeItem[];
  parent: CategoryTreeItem | null;
  expanded?: boolean;
  level?: number; // For UI purposes
}

export interface CategoryFilterParams {
  search?: string;
  parentId?: string | null;
  isActive?: boolean;
  sortBy?: 'name' | 'displayOrder' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}

export interface BulkCategoryActionDto {
  categoryIds: string[];
  action: 'activate' | 'deactivate' | 'move' | 'delete';
  parentId?: string | null;
}

export interface CategoryWithStats {
  category: Category;
  products: Record<string, number>;
}

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

export interface PaginatedResponse {
  categories: {
    data: Category[];
    meta: PaginationMeta;
  };
  pagination: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CategoryState {
  categories: Category[];
  currentCategory: Category | null;
  isLoading: boolean;
  error: string | null;
}

export interface CategoryActions {
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  setCurrentCategory: (category: Category | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface CategoryStoreExtended extends CategoryState, CategoryActions {
  // Utility methods
  filterCategories: (filters: CategoryFilterParams) => Category[];
  searchCategories: (query: string) => Category[];
  getCategoryPath: (categoryId: string) => Category[];
}

export type CategoriesResponse = PaginatedResponse;
