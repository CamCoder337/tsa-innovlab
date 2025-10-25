import { useCategoryStore } from '@/stores/categoryStore';

export function useCategories() {
  const store = useCategoryStore();

  return {
    // State
    categories: store.categories,
    currentCategory: store.currentCategory,
    isLoading: store.isLoading,
    error: store.error,

    // Basic actions
    setCategories: store.setCategories,
    setCurrentCategory: store.setCurrentCategory,

    // Async actions
    fetchCategories: store.fetchCategories,
    fetchAdminCategories: store.fetchAdminCategories,
    fetchCategory: store.fetchCategory,
    createCategory: store.createCategory,
    updateCategory: store.updateCategory,
    deleteCategory: store.deleteCategory,

    // Utility actions
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
    reset: store.reset,

    // Utility methods
    filterCategories: store.filterCategories,
    searchCategories: store.searchCategories,
    getCategoryPath: store.getCategoryPath,
  };
}
