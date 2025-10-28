import type { Category } from './category.types';
import type { Timestamps } from './common.types';
import type { User } from './auth.types';
import type { VehicleType } from './vehicle.types';

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface Product extends Timestamps {
  id: string;
  name: string;
  description: string | null;
  reference: string | null;
  price: string;
  stock: number;
  stockAlert: number;
  unit: string;
  imageUrl: string | null;
  images: string[];
  specifications: Record<string, string | number | boolean | null>;
  isActive: boolean;
  categoryId: string | null;
  category?: Category;
  createdBy: string | null;
  creator?: Partial<User>;
  preferredVehicleType: VehicleType | null;
}

export interface CreateProduct {
  name: string;
  description?: string | null;
  categoryId?: string | null;
  price: number;
  stock: number;
  reference?: string | null;
  stockAlert?: number;
  unit?: string;
  imageUrl?: string | null;
  images?: string[];
  specifications?: Record<string, string | number | boolean | null>;
  isActive?: boolean;
  preferredVehicleType?: VehicleType | null;
}

export interface UpdateProduct {
  id: string;
  name?: string;
  description?: string | null;
  categoryId?: string | null;
  price?: number;
  stock?: number;
  reference?: string | null;
  stockAlert?: number;
  unit?: string;
  imageUrl?: string | null;
  images?: string[];
  specifications?: Record<string, string | number | boolean | null>;
  isActive?: boolean;
  preferredVehicleType?: VehicleType | null;
}

export interface ProductFilterParams {
  search?: string;
  categoryId?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  lowStock?: boolean;
  isActive?: boolean;
  preferredVehicleType?: VehicleType | VehicleType[];
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
  recommendationContext?: 'popular' | 'personalized' | 'similar';
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
  setCurrentProduct: (product: Product | null) => void;
  setStats: (stats: ProductStats) => void;

  fetchAdminProducts: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  createProduct: (product: CreateProduct) => Promise<void>;
  updateProduct: (id: string, data: UpdateProduct) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  fetchProductStats: () => Promise<void>;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;

  filterProducts: (filters: ProductFilterParams) => Product[];
  searchProducts: (query: string) => Product[];
  getProductsByCategory: (categoryId: string) => Product[];
  getLowStockProducts: () => Product[];
  getOutOfStockProducts: () => Product[];
}

export type ProductStoreExtended = ProductState & ProductActions;
