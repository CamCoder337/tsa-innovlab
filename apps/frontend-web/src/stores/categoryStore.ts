import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  Category,
  CategoryFilterParams,
  CategoryStoreExtended,
  CategoryTreeItem,
  CreateCategory,
  UpdateCategory,
} from '@/types/category.types';
import { adminService } from '@/services/admin.service';
import type { PaginatedMetaResponse } from '@/types/common.types';
import { shopService } from '@/services/shop.service';

function getPersistedData(): Partial<CategoryStoreExtended> | null {
  try {
    const persistedData = localStorage.getItem('tsa_categories');
    if (persistedData) {
      const parsed = JSON.parse(persistedData);
      return parsed.state || null;
    }
  } catch (error) {
    console.error('Error loading persisted category data:', error);
  }
  return null;
}

const initialState = {
  categories: getPersistedData()?.categories || [],
  currentCategory: null,
  isLoading: false,
  error: null,
};

export const useCategoryStore = create<CategoryStoreExtended>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Basic actions
      setCategories: (categories: Category[]) => {
        set({ categories });
      },

      setCurrentCategory: (category: Category | null) => {
        set({ currentCategory: category });
      },

      // Data fetching actions
      fetchAdminCategories: async () => {
        let page: number = 1;
        let next: boolean = true;
        let retryAttempts: number = 0;
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
            set({ isLoading: true, error: null });

            const response = await adminService.adminGetCategories({ page });

            if (response.error) {
              retryAttempts += 1;
              if (retryAttempts > 3) {
                next = false;
              }
              set({
                error: response.error.message,
                isLoading: false,
              });
              return;
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

              set({
                categories: categoriesList.categories.data,
                isLoading: false,
                error: null,
              });

              next = categoriesList.pagination.hasNext;
              if (next) page += 1;
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch categories',
              isLoading: false,
            });
          }
        }
      },

      fetchCategories: async () => {
        let categoriesList: CategoryTreeItem[] = [];

        try {
          set({ isLoading: true, error: null });

          const response = await shopService.getCategories();

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            categoriesList = response.data.tree;
            set({
              categories: categoriesList,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          console.error(error);
        }
      },

      fetchCategory: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.getCategory(id);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            set({
              currentCategory: response.data.category,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch category',
            isLoading: false,
          });
        }
      },

      createCategory: async (data: CreateCategory) => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.createCategory(data);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            const newCategory = Object.values(response.data)[0];
            const currentCategories = get().categories;

            set({
              categories: [newCategory, ...currentCategories],
              currentCategory: newCategory,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create category',
            isLoading: false,
          });
        }
      },

      updateCategory: async (id: string, data: UpdateCategory) => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.updateCategory(id, data);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            const updatedCategory = Object.values(response.data)[0];
            const currentCategories = get().categories;

            set({
              categories: currentCategories.map((category) =>
                category.id === id ? updatedCategory : category
              ),
              currentCategory:
                get().currentCategory?.id === id ? updatedCategory : get().currentCategory,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update category',
            isLoading: false,
          });
        }
      },

      deleteCategory: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.deleteCategory(id);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            const currentCategories = get().categories;
            const categoriesToDelete = [id];

            // Find all child categories recursively
            const findChildren = (parentId: string) => {
              currentCategories.forEach((cat) => {
                if (cat.parentId === parentId) {
                  categoriesToDelete.push(cat.id);
                  findChildren(cat.id);
                }
              });
            };
            findChildren(id);

            set({
              categories: currentCategories.filter(
                (category) => !categoriesToDelete.includes(category.id)
              ),
              currentCategory: get().currentCategory?.id === id ? null : get().currentCategory,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete category',
            isLoading: false,
          });
        }
      },

      // Utility actions

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => set({ error: null }),

      reset: () => set(initialState),

      filterCategories: (filters: CategoryFilterParams) => {
        const categories = get().categories;
        return categories.filter((category) => {
          if (filters.parentId !== undefined && category.parentId !== filters.parentId)
            return false;
          if (filters.isActive !== undefined && category.isActive !== filters.isActive)
            return false;
          return true;
        });
      },

      searchCategories: (query: string) => {
        const categories = get().categories;
        const lowercaseQuery = query.toLowerCase();
        return categories.filter(
          (category) =>
            category.name.toLowerCase().includes(lowercaseQuery) ||
            category.description?.toLowerCase().includes(lowercaseQuery) ||
            category.slug.toLowerCase().includes(lowercaseQuery)
        );
      },

      getCategoryPath: (categoryId: string) => {
        const categories = get().categories;
        const path: Category[] = [];

        let currentId: string | null = categoryId;
        while (currentId) {
          const category = categories.find((cat) => cat.id === currentId);
          if (category) {
            path.unshift(category);
            currentId = category.parentId;
          } else {
            break;
          }
        }

        return path;
      },
    }),
    {
      name: 'tsa_categories',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        categories: state.categories,
      }),
    }
  )
);
