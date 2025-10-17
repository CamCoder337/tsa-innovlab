import { useCategoryStore } from '@/stores/categoryStore';
import type { CategoryFilterParams, CategoryTreeItem } from '@/types/category.types';
import type { PaginatedMetaResponse } from '@/types/common.types';
import { useAuth } from './useAuth';
import { useCallback, useEffect } from 'react';
import { shopService } from '@/services/shop.service';
import type { Category } from '@/types/category.types';
import { adminService } from '@/services/admin.service';

export function useCategories() {
  const { user } = useAuth();

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

  const handleAdminGetAllCategories = useCallback(async () => {
    let page: number = 1;
    let next: boolean = true;
    let categoriesList: PaginatedMetaResponse<Category, 'categories'> = {
      categories: {
        data: [],
        meta: {
          total: 0,
          perPage: 20,
          currentPage: 1,
          lastPage: 1,
          firstPage: 1,
          firstPageUrl: null,
          lastPageUrl: null,
          nextPageUrl: null,
          previousPageUrl: null,
        },
      },
      pagination: {
        currentPage: 1,
        hasNext: false,
        hasPrev: false,
        perPage: 20,
        total: 0,
        lastPage: 1,
      },
    };

    while (next) {
      try {
        const response = await adminService.adminGetCategories({ page });

        if (response.error) {
          console.error('API error:', response.error);
          next = false;
          break;
        }

        if (response.data) {
          if (page === 1) {
            categoriesList = response.data;
          } else {
            categoriesList = {
              categories: {
                data: [...categoriesList.categories.data, ...response.data.categories.data],
                meta: response.data.categories.meta,
              },
              pagination: { ...response.data.pagination },
            };
          }

          setCategories(categoriesList.categories.data);
          next = response.data.pagination.hasNext || false;
          if (next) page += 1;
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [setCategories]);

  const handleGetAllCategories = useCallback(async () => {
    let categoriesList: CategoryTreeItem[] = [];

    try {
      const response = await shopService.getCategories();

      if (response.data) {
        categoriesList = response.data.tree;
        setCategories(categoriesList);
      }
    } catch (error) {
      console.error(error);
    }
  }, [setCategories]);

  useEffect(() => {
    if (user && user.role == 'admin') handleAdminGetAllCategories();
    else handleGetAllCategories();
  }, [handleGetAllCategories, handleAdminGetAllCategories, user]);

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

export function useCategoryFilters(filters: CategoryFilterParams) {
  const filterCategories = useCategoryStore((s) => s.filterCategories);
  return filterCategories(filters);
}
