import { create } from 'zustand';
import { shopService } from '@/services/shop.service';
import type { Product, ProductFilters, ProductStats } from '@/types/product.types';

export interface ProductState {
    products: Product[];
    currentProduct: Product | null;
    isLoading: boolean;
    error: string | null;
    stats: ProductStats | null;
}

export interface ProductListParams {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    lowStock?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ProductActions {
    fetchProducts: (params?: ProductListParams) => Promise<void>;
    fetchProduct: (id: string) => Promise<void>;
    createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
    deleteProduct: (id: string) => Promise<boolean>;
    setCurrentProduct: (product: Product | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setStats: (stats: ProductStats | null) => void;
}

export interface ProductStoreExtended extends ProductState, ProductActions {
    // Filter methods
    filterProducts: (filters: ProductFilters) => Product[];
}

// Initial state
const initialState: ProductState = {
    products: [],
    currentProduct: null,
    isLoading: false,
    error: null,
    stats: null,
};

export const useProductStore = create<ProductStoreExtended>((set, get) => ({
    ...initialState,

    // API Actions
    fetchProducts: async (params = {}) => {
        try {
            set({ isLoading: true, error: null });
            const response = await shopService.getProducts(params);
            if (response.data?.success) {
                set({ products: response.data.data as Product[] });
            } else {
                set({ error: response.error?.message || 'Failed to fetch products' });
            }
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'An error occurred' });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchProduct: async (id: string) => {
        try {
            set({ isLoading: true, error: null });
            const response = await shopService.getProduct(id);
            if (response.data?.success) {
                set({ currentProduct: response.data.data as Product });
            } else {
                set({ error: response.error?.message || 'Product not found' });
            }
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to fetch product' });
        } finally {
            set({ isLoading: false });
        }
    },

    createProduct: async (productData) => {
        try {
            set({ isLoading: true, error: null });
            // Implementation will be added when the API endpoint is available
            console.log('Creating product:', productData);
            return false;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to create product' });
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    updateProduct: async (id: string, updates: Partial<Product>) => {
        try {
            set({ isLoading: true, error: null });
            // Implementation will be added when the API endpoint is available
            console.log('Updating product:', id, updates);
            return false;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update product' });
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteProduct: async (id: string) => {
        try {
            set({ isLoading: true, error: null });
            // Implementation will be added when the API endpoint is available
            console.log('Deleting product:', id);
            return false;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to delete product' });
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    // State setters
    setCurrentProduct: (product) => set({ currentProduct: product }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setStats: (stats) => set({ stats }),

    // Filter methods
    filterProducts: (filters: ProductFilters) => {
        const { products } = get();
        return products.filter((product) => {
            if (filters.categoryId && product.categoryId !== filters.categoryId) return false;
            if (filters.isActive !== undefined && product.isActive !== filters.isActive) return false;
            if (filters.minPrice && product.price < filters.minPrice) return false;
            if (filters.maxPrice && product.price > filters.maxPrice) return false;
            if (filters.inStock && (product.stock || 0) <= 0) return false;
            if (filters.lowStock && (product.stock || 0) > (product.stockAlert || 0)) return false;
            return true;
        });
    },

    searchProducts: async (query: string) => {
        try {
            const response = await shopService.searchProducts(query);
            if (response.data?.success) {
                return response.data.data as Product[];
            }
            return [];
        } catch (error) {
            console.error('Search failed:', error);
            return [];
        }
    },
}));

// Selector hooks for common use cases
export const useActiveProducts = () => {
    return useProductStore((state) => state.products.filter((product) => product.isActive));
};

export const useLowStockProducts = () => {
    return useProductStore((state) =>
        state.products.filter((product) => (product.stock || 0) <= (product.stockAlert || 0) && (product.stock || 0) > 0)
    );
};

export const useOutOfStockProducts = () => {
    return useProductStore((state) => state.products.filter((product) => (product.stock || 0) <= 0));
};

export const useProductsByCategory = (categoryId: string) => {
    return useProductStore((state) =>
        state.products.filter((product) => product.categoryId === categoryId)
    );
};
