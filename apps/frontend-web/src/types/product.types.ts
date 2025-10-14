import type { Category } from './category.types';
import type { Timestamps } from './common.types';
import type { User } from './auth.types';

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface Product extends Timestamps {
  id: string;
  name: string;
  description: string;
  reference: string;
  price: string;
  stock: number;
  stockAlert: number;
  unit: string;
  imageUrl: string | null;
  images: string[];
  specifications: Record<string, string | number | boolean | null>;
  isActive: boolean;
  categoryId: string;
  category?: Category;
  createdBy: string;
  creator?: Partial<User>;
}

export interface CreateProduct {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  stock: number;
  reference?: string;
  stockAlert?: number;
  unit?: string;
  imageUrl?: string | null;
  images?: string[];
  specifications?: Record<string, string | number | boolean | null>;
  isActive?: boolean;
}

export interface UpdateProduct {
  id: string;
  name?: string;
  description?: string;
  categoryId?: string | null;
  price?: number;
  stock?: number;
  reference?: string;
  stockAlert?: number;
  unit?: string;
  imageUrl?: string | null;
  images?: string[];
  specifications?: Record<string, string | number | boolean | null>;
  isActive?: boolean;
}

export interface ProductFilterParams {
  search?: string;
  categoryId?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  lowStock?: boolean;
  isActive?: boolean;
  sortBy?: 'name' | 'price' | 'stock' | 'createdAt' | 'updatedAt' | string | null;
  sortOrder?: 'asc' | 'desc' | null;
  page?: number | null;
  limit?: number | null;
}

export interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onAddToCart?: (product: Product, quantity: number) => void;
  onToggleWishlist?: (productId: string) => void;
  onQuickView?: (product: Product) => void;
  isInWishlist?: boolean;
  className?: string;
}

export interface BulkUpdateProducts {
  productIds: string[];
  action: 'activate' | 'deactivate' | 'delete';
}

export interface ProductStat {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  totalValue: number;
  categoriesWithProducts: number;
}

export interface ProductStats {
  products: ProductStat;
  inventory: Record<string, number>;
  topCategories: Record<string, string | number>[];
}

export interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  stats: ProductStats;
}

export interface ProductActions {
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  setCurrentProduct: (product: Product | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStats: (stats: ProductStats) => void;
}

export type ProductStoreExtended = ProductState & ProductActions;
