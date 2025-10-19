import { useCategoryStore } from '@/stores/categoryStore';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export function useCategories() {
  const { user } = useAuth();
  const store = useCategoryStore();

  // Auto-initialize on first use
  useEffect(() => {
    if (user && user.role === 'admin') store.fetchAdminCategories();
    else store.fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
