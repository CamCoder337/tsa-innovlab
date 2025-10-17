import { useProductStore } from '@/stores/productStore';
import { useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { shopService } from '@/services/shop.service';
import type { Product, ProductFilterParams } from '@/types/product.types';
import type { PaginatedMetaResponse, Paginator } from '@/types/common.types';
import { adminService } from '@/services/admin.service';

export function useProducts() {
  const { user } = useAuth();

  const products = useProductStore((s) => s.products);
  const currentProduct = useProductStore((s) => s.currentProduct);
  const isLoading = useProductStore((s) => s.isLoading);
  const error = useProductStore((s) => s.error);
  const stats = useProductStore((s) => s.stats);

  // Actions
  const setProducts = useProductStore((s) => s.setProducts);
  const addProduct = useProductStore((s) => s.addProduct);
  const updateProduct = useProductStore((s) => s.updateProduct);
  const deleteProduct = useProductStore((s) => s.deleteProduct);
  const setCurrentProduct = useProductStore((s) => s.setCurrentProduct);
  const setLoading = useProductStore((s) => s.setLoading);
  const setError = useProductStore((s) => s.setError);
  const setStats = useProductStore((s) => s.setStats);

  const handleAdminGetAllProducts = useCallback(async () => {
    let page: number = 1;
    let next: boolean = true;
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
        const response = await adminService.adminGetProducts({ page });

        if (response.error) {
          console.error('API error:', response.error);
          next = false;
          break;
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

          setProducts(productsList.products.data);
          next = response.data.pagination.hasNext;
          if (next) page += 1;
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [setProducts]);

  const handleGetAllProducts = useCallback(async () => {
    let page: number = 1;
    let next: boolean = true;
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
        const response = await shopService.getProducts({ page });

        if (response.error) {
          console.error('API error:', response.error);
          next = false;
          break;
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

          setProducts(productsList.data);

          // Check if there are more pages to fetch
          next = page < response.data.meta.lastPage;
          if (next) {
            page += 1;
          }
        } else {
          // No data received, stop the loop
          next = false;
        }
      } catch (error) {
        console.error(error);
        next = false; // Stop the loop on error
      }
    }
  }, [setProducts]);

  const handleFetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminService.getAdminProductStats();

      if (response.error) {
        setError(response.error.message);
        return;
      }

      if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product stats');
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setStats]);

  const filterProducts = (filters: ProductFilterParams) => {
    return products.filter((product) => {
      const searchTerm = filters.search?.toLowerCase();
      const matchesName = searchTerm ? product.name.toLowerCase().includes(searchTerm) : true;
      const matchesDescription =
        searchTerm && product.description
          ? product.description.toLowerCase().includes(searchTerm)
          : true;
      const matchesCategory =
        searchTerm && product.category
          ? product.category.name.toLowerCase().includes(searchTerm)
          : true;

      return (
        (matchesName || matchesDescription || matchesCategory) &&
        (!filters.categoryId ||
          filters.categoryId.length === 0 ||
          filters.categoryId.includes(product.categoryId)) &&
        (filters.isActive === undefined || product.isActive === filters.isActive) &&
        (!filters.minPrice || Number(product.price) >= filters.minPrice) &&
        (!filters.maxPrice || Number(product.price) <= filters.maxPrice) &&
        (!filters.inStock || product.stock > 0) &&
        (!filters.lowStock || product.stock <= product.stockAlert)
      );
    });
  };

  useEffect(() => {
    if (user && user.role == 'admin') {
      handleAdminGetAllProducts();
      handleFetchStats();
    } else handleGetAllProducts();
  }, [handleAdminGetAllProducts, handleFetchStats, handleGetAllProducts, user]);

  return {
    // State
    products,
    currentProduct,
    isLoading,
    error,
    stats,

    // Actions
    setProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    setCurrentProduct,
    setLoading,
    setError,
    setStats,
    filterProducts,
  };
}

// export const useSearchProducts = (query: string) => {
//     const products = useProductStore((state) => state.products);
//     const lowercaseQuery = query.toLowerCase();
//     return products.filter(
//         (product) =>
//             product.name.toLowerCase().includes(lowercaseQuery) ||
//             product.description?.toLowerCase().includes(lowercaseQuery) ||
//             product.reference?.toLowerCase().includes(lowercaseQuery)
//     );
// };

// export const useActiveProducts = () => {
//     return useProductStore((state) => state.products.filter((product) => product.isActive));
// };

// export const useLowStockProducts = () => {
//     return useProductStore((state) =>
//         state.products.filter((product) => product.stock <= product.stockAlert)
//     );
// };

// export const useOutOfStockProducts = () => {
//     return useProductStore((state) => state.products.filter((product) => product.stock <= 0));
// };

// export const useProductsByCategory = (categoryId: string) => {
//     return useProductStore((state) =>
//         state.products.filter((product) => product.categoryId === categoryId)
//     );
// };
