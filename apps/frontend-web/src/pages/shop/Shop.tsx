import { useState, useMemo, useEffect } from 'react';
import { ProductCard } from '@/components/shop/ProductCard';
import { ProductRecommendations } from '@/components/shop/ProductRecommendations';
import { VisualSearch } from '@/components/shop/VisualSearch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  AlertTriangle,
  Clock,
  Eye,
  Grid,
  List,
  Loader,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import type { Product } from '@/types/product.types';
import { useProducts } from '@/hooks/useProducts';
import type { ProductFilterParams } from '@/types/product.types';
import { ProductFilters } from '@/components/shop/ProductFilters';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useVisualRecognitionSearch } from '@/hooks/useVisualRecognitionSearch';
import { toast } from 'sonner';
import { useCommonTranslation, useShopTranslation } from '@/hooks/useTranslation';
import { matchesSearchQuery } from '@/utils/search.utils';

export default function ShopPage() {
  const { t: tCommon } = useCommonTranslation();
  const { t: tShop } = useShopTranslation();
  const { products, isLoading, error } = useProducts();
  const { addToCart, error: cartError } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { results, error: VisualError } = useVisualRecognitionSearch();
  const lowStockProducts = products?.filter((p) => p.stock <= p.stockAlert);

  // Local state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [filters, setFilters] = useState<ProductFilterParams>({
    search: '',
    categoryId: [],
    minPrice: 0,
    maxPrice: 100000,
    inStock: false,
    isActive: true,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  });

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (results && results.products.length > 0) {
          return results.products.includes(product);
        } else {
          // Search filter
          if (filters.search) {
            const matchesSearch = matchesSearchQuery(
              filters.search,
              product.name,
              product.description,
              product.category?.name
            );

            if (!matchesSearch) {
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
        }
        return true;
      })
      .sort((a, b) => {
        // Sort products
        if (!filters.sortBy) return 0;

        switch (filters.sortBy) {
          case 'price-low':
            return parseFloat(a.price) - parseFloat(b.price);
          case 'price-high':
            return parseFloat(b.price) - parseFloat(a.price);
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'stock':
            return a.stock - b.stock;
          default:
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
      });
  }, [products, filters, results]);

  // Pagination calculations
  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  // Reset to first page when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Update filters and reset pagination
  const updateFilters = (newFilters: ProductFilterParams) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('ellipsis-start');
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('ellipsis-end');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleAddToCart = async (product: Product, quantity: number) => {
    try {
      await addToCart(product, quantity);
      if (cartError) {
        toast.error(cartError);
        return;
      }
      toast.success(`${product.name} ${tShop('product.addedToCart')}`);
    } catch (error) {
      // toast.error(tShop('product.errorAddingToCart'));
      console.error(error);
    }
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categoryId: [],
      minPrice: 0,
      maxPrice: 100000,
      inStock: false,
      isActive: true,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
    });
  };

  const hasActiveFilters =
    filters.search ||
    (Array.isArray(filters.categoryId) && filters.categoryId.length > 0) ||
    (filters.minPrice !== undefined && filters.minPrice > 0) ||
    (filters.maxPrice !== undefined && filters.maxPrice < 100000) ||
    filters.inStock ||
    filters.lowStock;

  useEffect(() => {
    resetPagination();
  }, [filters]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {tShop('title')} TSA
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">{tShop('subtitle')}</p>
      </div>

      {/* AI Recommendations */}
      <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
        <ProductRecommendations type={isAuthenticated ? 'personalized' : 'popular'} limit={4} />
      </div>

      {/* Low Stock Alert */}
      {user?.role === 'admin' && lowStockProducts.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h3 className="font-medium text-orange-800">{tShop('alerts.lowStockTitle')}</h3>
            </div>
            <div className="space-y-1">
              {lowStockProducts.map((product) => (
                <p key={product.id} className="text-sm text-orange-700">
                  <strong>{product.name}</strong> -{' '}
                  {tShop('alerts.lowStockMessage', { count: product.stock })}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border dark:border-gray-800 border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {VisualError && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h3 className="font-medium text-orange-800">{`${VisualError}`}</h3>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {results && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              <h3 className="font-medium text-green-800">{tShop('visualSearch.title')}</h3>
            </div>
            <div className="space-y-1">
              <Clock className="h-5 w-5" />
              <p className="font-medium text-green-800">{results.processing_time_ms}ms</p>
            </div>
            <div className="space-y-1">
              {results.products.map((product) => (
                <p key={product.id} className="text-sm text-green-700">
                  {tShop('visualSearch.results.foundPlural', { count: product.stock })}
                </p>
              ))}
              <Badge variant="outline">
                {tCommon('search.results.foundPlural', {
                  count: results.total,
                  type: tShop('product.title').toLowerCase(),
                })}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Filters */}
      <div className="md:hidden mb-6">
        {/* Mobile Filter Toggle and Search Row */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {tShop('filters.title')} {hasActiveFilters && '•'}
          </Button>
          {/* Mobile Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={tShop('search.placeholder')}
              className="pl-9 pr-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <VisualSearch className="animate-in slide-in-from-top-2 duration-300 absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Mobile Sort and View Controls */}
        <div className="flex items-center justify-between gap-3">
          <Select
            value={filters.sortBy || 'updatedAt'}
            onValueChange={(value: string) => setFilters({ ...filters, sortBy: value })}
          >
            <SelectTrigger className="flex-1 min-w-0">
              <SelectValue placeholder={tShop('sorting.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">{tShop('sorting.newest')}</SelectItem>
              <SelectItem value="price">{tShop('sorting.priceAsc')}</SelectItem>
              <SelectItem value="name">{tShop('sorting.nameAZ')}</SelectItem>
              <SelectItem value="stock">{tShop('sorting.stockAvailable')}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 border dark:border-gray-800 rounded-md p-1 flex-shrink-0">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Desktop Filters */}
        <div
          className={`${showFilters ? 'block' : 'hidden'} md:block w-full lg:w-80 flex-shrink-0`}
        >
          <ProductFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1">
              {isLoading
                ? tCommon('loading')
                : totalProducts === 0
                  ? tCommon('search.results.noResults', {
                      type: tShop('product.title').toLowerCase(),
                    })
                  : totalProducts === 1
                    ? tCommon('search.results.found', {
                        count: totalProducts,
                        type: tShop('product.title').toLowerCase(),
                      })
                    : tCommon('search.pagination.showingResults', {
                        start: indexOfFirstProduct + 1,
                        end: Math.min(indexOfLastProduct, totalProducts),
                        total: totalProducts,
                      })}
            </p>

            <div className="hidden md:flex items-center gap-4 w-full sm:w-auto order-1 sm:order-2">
              <Select
                value={filters.sortBy || 'updatedAt'}
                onValueChange={(value: string) => updateFilters({ ...filters, sortBy: value })}
              >
                <SelectTrigger className="w-[180px] lg:w-[200px]">
                  <SelectValue placeholder={tShop('sorting.sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">{tShop('sorting.newest')}</SelectItem>
                  <SelectItem value="price">{tShop('sorting.priceAsc')}</SelectItem>
                  <SelectItem value="name">{tShop('sorting.nameAZ')}</SelectItem>
                  <SelectItem value="stock">{tShop('sorting.stockAvailable')}</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 border dark:border-gray-800 rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
              <Loader className="h-12 w-12 animate-spin text-tsa-blue dark:text-tsa-white" />
            </div>
          )}

          {/* Products */}
          {!isLoading && (
            <div
              className={cn(
                'grid gap-4 sm:gap-6',
                viewMode === 'grid'
                  ? 'grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              )}
            >
              {currentProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode={viewMode}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  isInWishlist={wishlist.includes(product.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalProducts > 0 && totalPages > 1 && (
            <div className="mt-8">
              <Pagination className="justify-center">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      label={tCommon('search.pagination.previous')}
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>

                  {getPageNumbers().map((pageNumber, index) => (
                    <PaginationItem key={index}>
                      {pageNumber === 'ellipsis-start' || pageNumber === 'ellipsis-end' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => paginate(pageNumber as number)}
                          isActive={currentPage === pageNumber}
                        >
                          {pageNumber}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      label={tCommon('search.pagination.next')}
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              {/* Pagination Info */}
              <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
                {tCommon('search.pagination.showingResults', {
                  start: indexOfFirstProduct + 1,
                  end: Math.min(indexOfLastProduct, totalProducts),
                  total: totalProducts,
                })}
              </div>
            </div>
          )}

          {/* No Results */}
          {!isLoading &&
            filteredProducts.length === 0 &&
            (results ? (
              <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-base sm:text-lg">{tShop('search.noVisualResults')}</p>
                <p className="text-sm">{tShop('search.tryAnotherImage')}</p>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-muted-foreground mb-4 text-base sm:text-lg">
                  {tShop('search.noResults')}
                </p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="sm:size-default"
                >
                  {tShop('filters.clearFilters')}
                </Button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
