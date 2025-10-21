import { useProductStore } from '@/stores/productStore';

export function useProducts() {
  const store = useProductStore();

  return {
    // State
    products: store.products,
    currentProduct: store.currentProduct,
    isLoading: store.isLoading,
    error: store.error,
    stats: store.stats,

    // Async actions
    fetchAdminProducts: store.fetchAdminProducts,
    fetchProducts: store.fetchProducts,
    fetchProduct: store.fetchProduct,
    createProduct: store.createProduct,
    updateProduct: store.updateProduct,
    deleteProduct: store.deleteProduct,
    fetchProductStats: store.fetchProductStats,

    // Utility actions
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
    reset: store.reset,

    // Basic actions
    setProducts: store.setProducts,
    setCurrentProduct: store.setCurrentProduct,
    setStats: store.setStats,

    // Utility methods
    filterProducts: store.filterProducts,
    searchProducts: store.searchProducts,
    getProductsByCategory: store.getProductsByCategory,
    getLowStockProducts: store.getLowStockProducts,
    getOutOfStockProducts: store.getOutOfStockProducts,
  };
}

// Helper hooks for specific use cases
export const useProductLoading = () => useProductStore((state) => state.isLoading);
export const useProductError = () => useProductStore((state) => state.error);
export const useProductStats = () => useProductStore((state) => state.stats);
export const useCurrentProduct = () => useProductStore((state) => state.currentProduct);

export const useSearchProducts = (query: string) => {
  const products = useProductStore((state) => state.products);
  const lowercaseQuery = query.toLowerCase();
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.description?.toLowerCase().includes(lowercaseQuery) ||
      product.reference?.toLowerCase().includes(lowercaseQuery)
  );
};

export const useActiveProducts = () => {
  const products = useProductStore((state) => state.products);
  return products.filter((product) => product.isActive);
};

export const useLowStockProducts = () => {
  const products = useProductStore((state) => state.products);
  return products.filter((product) => product.stock <= product.stockAlert);
};

export const useOutOfStockProducts = () => {
  const products = useProductStore((state) => state.products);
  return products.filter((product) => product.stock === 0);
};

export const useProductsByCategory = (categoryId: string) => {
  const products = useProductStore((state) => state.products);
  return products.filter((product) => product.categoryId === categoryId);
};
