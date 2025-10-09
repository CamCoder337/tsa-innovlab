import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, Search as SearchIcon } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import type { ProductFilterParams } from '@/types/product.types';

type ProductFilter = Omit<ProductFilterParams, 'page' | 'limit' | 'sortBy' | 'sortOrder'>;

interface ProductFiltersProps {
  filters: ProductFilter;
  onFiltersChange: (filters: ProductFilter) => void;
  className?: string;
}

const PRICE_RANGE = { min: 0, max: 100000, step: 1000 } as const;

export function ProductFilters({ filters, onFiltersChange, className = '' }: ProductFiltersProps) {
  const { categories = [], isLoading: isLoadingCategories } = useCategories();
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice ?? PRICE_RANGE.min,
    filters.maxPrice ?? PRICE_RANGE.max,
  ]);

  // Memoize filtered categories to prevent unnecessary re-renders
  const visibleCategories = useMemo(
    () => categories.filter((cat) => cat.isActive !== false),
    [categories]
  );

  // Update internal state when filters prop changes
  useEffect(() => {
    setPriceRange([filters.minPrice ?? PRICE_RANGE.min, filters.maxPrice ?? PRICE_RANGE.max]);
  }, [filters.minPrice, filters.maxPrice]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleCategoryChange = useCallback(
    (categoryId: string, checked: boolean) => {
      const currentCategoryIds = Array.isArray(filters.categoryId) ? filters.categoryId : [];

      onFiltersChange({
        ...filters,
        categoryId: checked
          ? [...currentCategoryIds, categoryId]
          : currentCategoryIds.filter((id) => id !== categoryId),
      });
    },
    [filters, onFiltersChange]
  );

  const handlePriceRangeChange = useCallback(
    (value: number[]) => {
      const [min, max] = value;
      setPriceRange([min, max]);
      onFiltersChange({
        ...filters,
        minPrice: min === PRICE_RANGE.min ? undefined : min,
        maxPrice: max === PRICE_RANGE.max ? undefined : max,
      });
    },
    [filters, onFiltersChange]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({ ...filters, search: e.target.value || undefined });
    },
    [filters, onFiltersChange]
  );

  // const handleStockToggle = useCallback(
  //   (checked: boolean) => {
  //     onFiltersChange({ ...filters, inStock: checked || undefined });
  //   },
  //   [filters, onFiltersChange]
  // );

  const handleLowStockToggle = useCallback(
    (checked: boolean) => {
      onFiltersChange({ ...filters, lowStock: checked || undefined });
    },
    [filters, onFiltersChange]
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange({
      search: undefined,
      categoryId: [],
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
      lowStock: undefined,
      isActive: undefined,
    });
    setPriceRange([PRICE_RANGE.min, PRICE_RANGE.max]);
  }, [onFiltersChange]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    return [
      filters.search ? 1 : 0,
      Array.isArray(filters.categoryId) ? filters.categoryId.length : 0,
      (filters.minPrice ?? 0) > PRICE_RANGE.min ? 1 : 0,
      (filters.maxPrice ?? PRICE_RANGE.max) < PRICE_RANGE.max ? 1 : 0,
      filters.inStock ? 1 : 0,
      filters.lowStock ? 1 : 0,
      filters.isActive !== undefined ? 1 : 0,
    ].reduce((sum, count) => sum + count, 0);
  }, [filters]);

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Filtres</CardTitle>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="gap-1.5 text-sm h-8 px-2.5"
              disabled={activeFiltersCount === 0}
            >
              <X className="h-3.5 w-3.5" />
              {`Réinitialiser (${activeFiltersCount})`}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="md:flex flex-col space-y-2 hidden">
          <h3 className="font-medium">Recherche</h3>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des produits..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="w-full pl-9"
            />
          </div>
        </div>

        <Separator className="md:flex hidden" />

        {/* Categories */}
        <div>
          <h3 className="font-medium mb-3">Catégories</h3>
          {isLoadingCategories ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 h-8">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
              ))}
            </div>
          ) : visibleCategories.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {visibleCategories.map((category) => (
                <div key={category.id} className="flex items-center gap-2 group">
                  <Checkbox
                    id={`cat-${category.id}`}
                    checked={
                      Array.isArray(filters.categoryId) && filters.categoryId.includes(category.id)
                    }
                    onCheckedChange={(checked) =>
                      handleCategoryChange(category.id, checked === true)
                    }
                    className="h-4 w-4 rounded"
                  />
                  <label
                    htmlFor={`cat-${category.id}`}
                    className="text-sm cursor-pointer select-none group-hover:text-primary transition-colors"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune catégorie disponible</p>
          )}
        </div>

        <Separator />

        {/* Price Range */}
        <div className="space-y-4">
          <h3 className="font-medium">Fourchette de prix</h3>
          <div className="px-1">
            <Slider
              value={priceRange}
              onValueChange={handlePriceRangeChange}
              max={PRICE_RANGE.max}
              min={PRICE_RANGE.min}
              step={PRICE_RANGE.step}
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{filters.minPrice?.toLocaleString()} FCFA</span>
            <span>{filters.maxPrice?.toLocaleString()} FCFA</span>
          </div>
        </div>

        <Separator />

        {/* Stock Status */}
        <div className="space-y-3">
          <h3 className="font-medium">Disponibilité</h3>
          <div className="space-y-2">
            {/* <div className="flex items-center gap-2">
              <Checkbox
                id="in-stock"
                checked={!!filters.inStock}
                onCheckedChange={(checked) => handleStockToggle(checked === true)}
                className="h-4 w-4 rounded"
              />
              <label htmlFor="in-stock" className="text-sm cursor-pointer select-none">
                En stock
              </label>
            </div> */}

            <div className="flex items-center gap-2">
              <Checkbox
                id="low-stock"
                checked={!!filters.lowStock}
                onCheckedChange={(checked) => handleLowStockToggle(checked === true)}
                className="h-4 w-4 rounded"
              />
              <label htmlFor="low-stock" className="text-sm cursor-pointer select-none">
                Stock faible
              </label>
            </div>

            {/* <div className="flex items-center gap-2">
              <Checkbox
                id="active-products"
                checked={filters.isActive !== false}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, isActive: checked as boolean })
                }
                className="h-4 w-4 rounded"
              />
              <label htmlFor="active-products" className="text-sm cursor-pointer select-none">
                Produits actifs uniquement
              </label>
            </div> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
