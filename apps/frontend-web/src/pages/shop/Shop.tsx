import { useState, useMemo } from 'react';
import { ProductCard } from '@/components/shop/ProductCard';
import { ProductRecommendations } from '@/components/shop/ProductRecommendations';
import { VisualSearch } from '@/components/shop/VisualSearch';
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
import { AlertTriangle, Eye, Grid, List, Search, SlidersHorizontal } from 'lucide-react';
import type { Product } from '@/types/product.types';
import { useProducts } from '@/hooks/useProducts';
import type { ProductFilterParams } from '@/types/product.types';
import { ProductFilters } from '@/components/shop/ProductFilters';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useVisualRecognitionSearch } from '@/hooks/useVisualRecognitionSearch';
import toast from 'react-hot-toast';

export default function Shop() {
  // Store hooks
  const { products = [], isLoading } = useProducts();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { results, error: VisualError } = useVisualRecognitionSearch();
  const lowStockProducts = products?.filter((p) => p.stock <= p.stockAlert);

  // Local state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
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

  const handleAddToCart = (product: Product, quantity: number) => {
    addToCart(product, quantity);
    toast.success(`${product.name} a été ajouté à votre panier`);
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleQuickView = (product: Product) => {
    console.log('Quick view:', product.name);
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

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-tsa-blue/90 mb-2">TSA MARKET</h1>
        <p className="text-gray-600">
          Parcourez notre collection de pièces reconditionnées de qualité par tous vos fournisseurs
        </p>
      </div>

      {/* AI Recommendations */}
      <div className="mb-8 space-y-6">
        <ProductRecommendations type={isAuthenticated ? 'personalized' : 'popular'} limit={4} />
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h3 className="font-medium text-orange-800">Alerte Stock Faible</h3>
            </div>
            <div className="space-y-1">
              {lowStockProducts.map((product) => (
                <p key={product.id} className="text-sm text-orange-700">
                  <strong>{product.name}</strong> - Plus que {product.stock} en stock!
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
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

      {/* Mobile Filters */}
      <div className="md:hidden flex items-center justify-between gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filtres {hasActiveFilters && '•'}
        </Button>
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <VisualSearch className="animate-in slide-in-from-top-2 duration-300 absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Select
          value={filters.sortBy || 'updatedAt'}
          onValueChange={(value: string) => setFilters({ ...filters, sortBy: value })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updatedAt">Nouveautés</SelectItem>
            <SelectItem value="price">Prix croissant</SelectItem>
            <SelectItem value="name">Nom (A-Z)</SelectItem>
            <SelectItem value="stock">Stock disponible</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Desktop Filters */}
        <div
          className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-80 flex-shrink-0`}
        >
          <ProductFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <p className="text-sm text-gray-500">
              {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé
              {filteredProducts.length !== 1 ? 's' : ''}
            </p>
            <div className="hidden md:flex items-center gap-4 w-full md:w-auto">
              <Select
                value={filters.sortBy || 'updatedAt'}
                onValueChange={(value: string) => setFilters({ ...filters, sortBy: value })}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Nouveautés</SelectItem>
                  <SelectItem value="price">Prix croissant</SelectItem>
                  <SelectItem value="name">Nom (A-Z)</SelectItem>
                  <SelectItem value="stock">Stock disponible</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 border rounded-md p-1">
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

          {/* Products */}
          {!isLoading && (
            <div
              className={cn(
                'grid gap-6',
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1'
              )}
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode={viewMode}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  onQuickView={handleQuickView}
                  isInWishlist={wishlist.includes(product.id)}
                />
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading &&
            filteredProducts.length === 0 &&
            (results ? (
              <div className="text-center py-8 text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun produit similaire trouvé</p>
                <p className="text-sm">Essayez avec une autre image</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Aucun produit trouvé</p>
                <Button onClick={clearFilters} variant="outline">
                  Effacer les filtres
                </Button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
