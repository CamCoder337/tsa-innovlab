import { useState, useMemo } from 'react';
import { ProductCard } from '@/components/shop/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Grid, List, Package, Search, SlidersHorizontal } from 'lucide-react';
import type { Product } from '@/types/product.types';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import type { ProductFilterParams } from '@/types/product.types';

export default function Shop() {
  // Store hooks
  const { products = [], isLoading } = useProducts();
  const { categories = [] } = useCategories();

  // Local state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [filters, setFilters] = useState<Omit<ProductFilterParams, 'page' | 'limit' | 'sortOrder'>>(
    {
      search: '',
      categoryId: [],
      minPrice: 0,
      maxPrice: 100000,
      inStock: false,
      lowStock: false,
      isActive: true,
      sortBy: 'updatedAt',
    }
  );

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
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
        const categoryIds = Array.isArray(filters.categoryId)
          ? filters.categoryId
          : [filters.categoryId].filter(Boolean);

        if (
          categoryIds.length > 0 &&
          !(product.categoryId && categoryIds.includes(product.categoryId))
        ) {
          return false;
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
        if (filters.lowStock && product.stock > 10) {
          return false;
        }

        // Active status filter
        if (filters.isActive !== undefined && product.isActive !== filters.isActive) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort products
        if (!filters.sortBy) return 0;

        switch (filters.sortBy) {
          case 'price':
            return parseFloat(a.price) - parseFloat(b.price);
          case 'name':
            return a.name.localeCompare(b.name);
          case 'stock':
            return a.stock - b.stock;
          default:
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
      });
  }, [products, filters]);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFilters((prev) => {
      const currentIds = Array.isArray(prev.categoryId) ? prev.categoryId : [];
      const newIds = checked
        ? [...currentIds, categoryId]
        : currentIds.filter((id) => id !== categoryId);

      return { ...prev, categoryId: newIds };
    });
  };

  const handlePriceChange = (values: number[]) => {
    setFilters((prev) => ({
      ...prev,
      minPrice: values[0],
      maxPrice: values[1],
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categoryId: [],
      minPrice: 0,
      maxPrice: 100000,
      inStock: false,
      lowStock: false,
      isActive: true,
      sortBy: 'updatedAt',
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Boutique en ligne</h1>
        <p className="text-gray-600">Découvrez nos pièces détachées de qualité</p>
      </div>

      {/* Mobile Filters */}
      <div className="md:hidden flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filtres {hasActiveFilters && '•'}
        </Button>
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
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filtres</h2>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-sm text-primary"
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>

              {/* Search */}
              <div className="space-y-2">
                <h3 className="font-medium">Recherche</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-9"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h3 className="font-medium">Catégories</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`cat-${category.id}`}
                        checked={filters.categoryId?.includes(category.id) || false}
                        onCheckedChange={(checked) =>
                          handleCategoryChange(category.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`cat-${category.id}`}
                        className="text-sm cursor-pointer select-none"
                      >
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <h3 className="font-medium">Fourchette de prix</h3>
                <div className="px-1">
                  <Slider
                    min={0}
                    max={100000}
                    step={1000}
                    value={[filters.minPrice || 0, filters.maxPrice || 100000]}
                    onValueChange={handlePriceChange}
                    minStepsBetweenThumbs={1}
                    className="py-4"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{filters.minPrice?.toLocaleString()} FCFA</span>
                  <span>{filters.maxPrice?.toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* Stock Status */}
              <div className="space-y-2">
                <h3 className="font-medium">État du stock</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="in-stock"
                      checked={filters.inStock}
                      onCheckedChange={(checked) => setFilters({ ...filters, inStock: !!checked })}
                    />
                    <label htmlFor="in-stock" className="text-sm cursor-pointer">
                      En stock
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="low-stock"
                      checked={filters.lowStock}
                      onCheckedChange={(checked) => setFilters({ ...filters, lowStock: !!checked })}
                    />
                    <label htmlFor="low-stock" className="text-sm cursor-pointer">
                      Stock faible
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <p className="text-sm text-gray-500">
              {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé
              {filteredProducts.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-4 w-full md:w-auto">
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
              <div className="hidden md:flex items-center gap-1 border rounded-md p-1">
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
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun produit trouvé</h3>
              <p className="text-gray-500">Essayez de modifier vos filtres de recherche</p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  onQuickView={handleQuickView}
                  isInWishlist={wishlist.includes(product.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
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
        </div>
      </div>
    </div>
  );

  function handleAddToCart(productId: string) {
    console.log('Add to cart:', productId);
    // Implement add to cart logic
  }

  function handleToggleWishlist(productId: string) {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }

  function handleQuickView(product: Product) {
    console.log('Quick view:', product);
    // Implement quick view logic
  }
}
