import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  Product,
  ProductStats,
  ProductStoreExtended,
  ProductFilterParams,
  CreateProduct,
  UpdateProduct,
} from '@/types/product.types';
import { adminService } from '@/services/admin.service';
import { shopService } from '@/services/shop.service';
import type { PaginatedMetaResponse, Paginator } from '@/types/common.types';

const initialState = {
  products: [] as Product[],
  currentProduct: null as Product | null,
  isLoading: false,
  error: null as string | null,
  stats: {
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
  } as ProductStats,
};

export const useProductStore = create<ProductStoreExtended>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Basic actions
      setProducts: (products: Product[] = []) => {
        set({ products });
      },

      setCurrentProduct: (product: Product | null) => {
        set({ currentProduct: product });
      },

      setStats: (stats: ProductStats) => {
        set({ stats });
      },

      // Data fetching actions
      fetchAdminProducts: async () => {
        let page: number = 1;
        let next: boolean = true;
        let retryAttempts: number = 0;
        let productsList: PaginatedMetaResponse<Product, 'products'> = {
          products: {
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

            const response = await adminService.adminGetProducts({ page });

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
                productsList = response.data;
              } else {
                productsList = {
                  products: {
                    data: [...productsList.products.data, ...response.data.products.data],
                    meta: response.data.products.meta,
                  },
                  pagination: { ...response.data.pagination },
                };
              }

              set({
                products: productsList.products.data,
                isLoading: false,
                error: null,
              });

              next = productsList.pagination.hasNext;
              if (next) page += 1;
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch products',
              isLoading: false,
            });
          }
        }
      },

      fetchProducts: async () => {
        let page: number = 1;
        let next: boolean = true;
        let retryAttempts: number = 0;
        let productsList: Paginator<Product> = {
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
        };

        while (next) {
          try {
            set({ isLoading: true, error: null });

            const response = await shopService.getProducts({ page });

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
                productsList = response.data;
              } else {
                productsList = {
                  data: [...productsList.data, ...response.data.data],
                  meta: response.data.meta,
                };
              }

              set({
                products: productsList.data || [],
                isLoading: false,
                error: null,
              });

              next = page < response.data.meta.lastPage;
              if (next) page += 1;
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch products',
              isLoading: false,
            });
          }
        }
      },

      fetchProduct: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await shopService.getProduct(id);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            set({
              currentProduct: response.data,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch product',
            isLoading: false,
          });
        }
      },

      createProduct: async (data: CreateProduct) => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.createProduct(data);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            const newProduct = Object.values(response.data)[0];
            const { products } = get();
            set({
              products: [newProduct, ...products],
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create product',
            isLoading: false,
          });
        }
      },

      updateProduct: async (id: string, data: UpdateProduct) => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.updateProduct(id, data);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            const updatedProduct = Object.values(response.data)[0];
            const { products } = get();
            const updatedProducts = products.map((product) =>
              product.id === id ? updatedProduct : product
            );
            set({
              products: updatedProducts,
              currentProduct:
                get().currentProduct?.id === id ? updatedProduct : get().currentProduct,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update product',
            isLoading: false,
          });
        }
      },

      deleteProduct: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.deleteProduct(id);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          const { products } = get();
          const updatedProducts = products.filter((product) => product.id !== id);
          set({
            products: updatedProducts,
            currentProduct: get().currentProduct?.id === id ? null : get().currentProduct,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete product',
            isLoading: false,
          });
        }
      },

      fetchProductStats: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.getAdminProductStats();

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            set({
              stats: response.data,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch product stats',
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

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },

      // Utility methods
      filterProducts: (filters: ProductFilterParams) => {
        const { products } = get();
        console.log(products);

        return products.filter((product) => {
          if (filters.search) {
            const query = filters.search.toLowerCase();
            const matchesName = product.name.toLowerCase().includes(query);
            const matchesDescription = product.description?.toLowerCase().includes(query) ?? false;
            const matchesCategory = product.category?.name.toLowerCase().includes(query) ?? false;

            if (!matchesName && !matchesDescription && !matchesCategory) {
              return false;
            }
          }

          // Category filter
          if (filters.categoryId && filters.categoryId.length > 0) {
            if (Array.isArray(filters.categoryId)) {
              if (!filters.categoryId.includes(product.categoryId ?? '')) {
                return false;
              }
            } else if (filters.categoryId !== product.categoryId) {
              return false;
            }
          }

          // Price range filter
          const productPrice = parseFloat(product.price);
          if (filters.minPrice !== undefined && productPrice < filters.minPrice) {
            return false;
          }
          if (filters.maxPrice !== undefined && productPrice > filters.maxPrice) {
            return false;
          }

          // Stock status filters
          if (filters.inStock && product.stock <= 0) {
            return false;
          }
          if (filters.lowStock && product.stock > product.stockAlert) {
            return false;
          }

          // Active status filter
          if (filters.isActive !== undefined && product.isActive !== filters.isActive) {
            return false;
          }
        });
      },

      searchProducts: (query: string) => {
        const { products } = get();
        const lowercaseQuery = query.toLowerCase();
        return products.filter(
          (product) =>
            product.name.toLowerCase().includes(lowercaseQuery) ||
            product.description?.toLowerCase().includes(lowercaseQuery) ||
            product.reference?.toLowerCase().includes(lowercaseQuery)
        );
      },

      getProductsByCategory: (categoryId: string) => {
        const { products } = get();
        return products.filter((product) => product.categoryId === categoryId);
      },

      getLowStockProducts: () => {
        const { products } = get();
        return products.filter((product) => product.stock <= product.stockAlert);
      },

      getOutOfStockProducts: () => {
        const { products } = get();
        return products.filter((product) => product.stock === 0);
      },
    }),
    {
      name: 'tsa_products',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        products: state.products,
        stats: state.stats,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.error = null;
        }
      },
    }
  )
);
