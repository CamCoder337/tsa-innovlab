import { create } from 'zustand';
import type { Product, ProductStats, ProductStoreExtended } from '@/types/product.types';

function persistProductsToLocalStorage(products: Product[]) {
  try {
    localStorage.setItem('tsa_products', JSON.stringify(products));
  } catch (error) {
    console.error('Failed to persist products to localStorage:', error);
  }
}

function loadProductsFromLocalStorage(): Product[] {
  try {
    const raw = localStorage.getItem('tsa_products');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Failed to load products from localStorage:', error);
  }
  return [];
}

function persistProductsStatsToLocalStorage(stats: ProductStats) {
  try {
    localStorage.setItem('tsa_products_stats', JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to persist products to localStorage:', error);
  }
}

function loadProductsStatsFromLocalStorage(): ProductStats {
  try {
    const raw = localStorage.getItem('tsa_products_stats');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Failed to load products from localStorage:', error);
  }
  return {
    products: {
      totalProducts: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      outOfStockProducts: 0,
      lowStockProducts: 0,
      totalValue: 0,
      categoriesWithProducts: 0,
    },
    inventory: {},
    topCategories: [],
  };
}

export const useProductStore = create<ProductStoreExtended>((set, get) => ({
  // State
  products: loadProductsFromLocalStorage(),
  currentProduct: null,
  isLoading: false,
  error: null,
  stats: loadProductsStatsFromLocalStorage(),

  // Basic actions
  setProducts: (products: Product[] = []) => {
    persistProductsToLocalStorage(products);
    set({ products });
  },

  addProduct: (product: Product) => {
    const products = get().products;
    const updatedProducts = [...products, product];
    persistProductsToLocalStorage(updatedProducts);
    set({ products: updatedProducts });
  },

  updateProduct: (id: string, updates: Partial<Product>) => {
    const products = get().products;
    const updatedProducts = products.map((product) =>
      product.id === id ? { ...product, ...updates } : product
    );
    persistProductsToLocalStorage(updatedProducts);
    set({ products: updatedProducts });
  },

  deleteProduct: (id: string) => {
    const products = get().products;
    const updatedProducts = products.filter((product) => product.id !== id);
    persistProductsToLocalStorage(updatedProducts);
    set({ products: updatedProducts });
  },

  setCurrentProduct: (product: Product | null) => {
    set({ currentProduct: product });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setStats: (stats: ProductStats) => {
    persistProductsStatsToLocalStorage(stats);
    set({ stats });
  },
}));
