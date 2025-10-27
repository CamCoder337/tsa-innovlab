import type { Timestamps } from './common.types';

export interface Category extends Timestamps {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  slug: string;
  products?: Array<{
    id: string;
    name: string;
    categoryId: string;
  }>;
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
}

export interface CategoryResponse {
  categories: Category[];
  tree: CategoryTreeItem[];
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

export interface CategoryState {
  categories: Category[];
  currentCategory: Category | null;
  isLoading: boolean;
  error: string | null;
}

export interface CategoryActions {
  setCategories: (categories: Category[]) => void;
  setCurrentCategory: (category: Category | null) => void;

  fetchAdminCategories: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchCategory: (id: string) => Promise<void>;
  createCategory: (category: CreateCategory) => Promise<void>;
  updateCategory: (id: string, data: UpdateCategory) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export interface CategoryStoreExtended extends CategoryState, CategoryActions {
  // Utility methods
  filterCategories: (filters: CategoryFilterParams) => Category[];
  searchCategories: (query: string) => Category[];
  getCategoryPath: (categoryId: string) => Category[];
}
