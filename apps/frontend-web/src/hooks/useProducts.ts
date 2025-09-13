import { useProductStore } from '@/stores/productStore';
import type { ProductFilters } from '@/types/product.types';

export function useProducts() {
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

    // Filter methods
    const filterProducts = useProductStore((s) => s.filterProducts);
    const searchProducts = useProductStore((s) => s.searchProducts);

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

        // Filter methods
        filterProducts,
        searchProducts,
    };
}

// Specialized hooks for common use cases
export function useActiveProducts() {
    return useProductStore((state) => state.products.filter((product) => product.isActive));
}

export function useLowStockProducts() {
    return useProductStore((state) =>
        state.products.filter((product) => product.stock <= product.stockAlert)
    );
}

export function useOutOfStockProducts() {
    return useProductStore((state) => state.products.filter((product) => product.stock <= 0));
}

export function useProductsByCategory(categoryId: string) {
    return useProductStore((state) =>
        state.products.filter((product) => product.categoryId === categoryId)
    );
}

export function useProductSearch(query: string) {
    const searchProducts = useProductStore((s) => s.searchProducts);
    return searchProducts(query);
}

export function useProductFilters(filters: ProductFilters) {
    const filterProducts = useProductStore((s) => s.filterProducts);
    return filterProducts(filters);
}
