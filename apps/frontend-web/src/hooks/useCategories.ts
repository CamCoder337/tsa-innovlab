import { useCategoryStore } from '@/stores/categoryStore';
import type { CategoryFilters } from '@/types/category.types';

export function useCategories() {
    const categories = useCategoryStore((s) => s.categories);
    const currentCategory = useCategoryStore((s) => s.currentCategory);
    const isLoading = useCategoryStore((s) => s.isLoading);
    const error = useCategoryStore((s) => s.error);

    // Actions
    const setCategories = useCategoryStore((s) => s.setCategories);
    const addCategory = useCategoryStore((s) => s.addCategory);
    const updateCategory = useCategoryStore((s) => s.updateCategory);
    const deleteCategory = useCategoryStore((s) => s.deleteCategory);
    const setCurrentCategory = useCategoryStore((s) => s.setCurrentCategory);
    const setLoading = useCategoryStore((s) => s.setLoading);
    const setError = useCategoryStore((s) => s.setError);

    // Utility methods
    const filterCategories = useCategoryStore((s) => s.filterCategories);
    const searchCategories = useCategoryStore((s) => s.searchCategories);
    const getCategoryPath = useCategoryStore((s) => s.getCategoryPath);

    return {
        // State
        categories,
        currentCategory,
        isLoading,
        error,

        // Actions
        setCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        setCurrentCategory,
        setLoading,
        setError,

        // Utility methods
        filterCategories,
        searchCategories,
        getCategoryPath,
    };
}

// Specialized hooks for common use cases
export function useRootCategories() {
    return useCategoryStore((state) =>
        state.categories.filter((category) => !category.parentId && category.isActive)
    );
}

export function useActiveCategories() {
    return useCategoryStore((state) => state.categories.filter((category) => category.isActive));
}

export function useCategoryChildren(parentId: string) {
    return useCategoryStore((state) =>
        state.categories.filter((category) => category.parentId === parentId && category.isActive)
    );
}

export function useCategoryBySlug(slug: string) {
    return useCategoryStore((state) => state.categories.find((category) => category.slug === slug));
}

export function useCategorySearch(query: string) {
    const searchCategories = useCategoryStore((s) => s.searchCategories);
    return searchCategories(query);
}

export function useCategoryFilters(filters: CategoryFilters) {
    const filterCategories = useCategoryStore((s) => s.filterCategories);
    return filterCategories(filters);
}
