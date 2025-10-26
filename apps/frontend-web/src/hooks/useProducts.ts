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
