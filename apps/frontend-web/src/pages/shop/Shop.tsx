import { useState, useMemo } from 'react';
import { ProductFilters } from '@/components/shop/product-filters';
import { ProductCard } from '@/components/shop/product-card';
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
    Grid,
    List,
    Search,
    SlidersHorizontal,
    Camera,
    ShoppingCart,
    AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/product.types';
import { useProducts } from '@/hooks/useProducts';
import type { ProductFilter } from '@/types/shop.types';

function Shop() {
    // Store hooks
    const { products, isLoading } = useProducts();

    // Local state
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState('newest');
    const [showFilters, setShowFilters] = useState(false);
    const [showPhotoSearch, setShowPhotoSearch] = useState(false);
    const [wishlist, setWishlist] = useState<string[]>([]);

    const defaultFilters: ProductFilter = {
        categories: [],
        priceRange: [0, 200000],
        conditions: [],
        brands: [],
        inStockOnly: false,
        compatibility: '',
    };

    const [filters, setFilters] = useState<ProductFilter>(defaultFilters);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        const filtered = products.filter((product) => {
            // Search query filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (
                    !product.name.toLowerCase().includes(query) &&
                    !product.description.toLowerCase().includes(query) &&
                    !product.categoryId.toLowerCase().includes(query)
                ) {
                    return false;
                }
            }

            // Category
            if (filters.categories.length > 0 && !filters.categories.includes(product.categoryId)) {
                return false;
            }

            // Price range
            if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
                return false;
            }

            // Condition
            // if (filters.conditions.length > 0 && !filters.conditions.includes(product.condition)) {
            //     return false;
            // }

            // // Brand
            // if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
            //     return false;
            // }

            // // In stock
            // if (filters.inStockOnly && !product.inStock) {
            //     return false;
            // }

            // // Compatibility
            // if (
            //     filters.compatibility &&
            //     !product.compatibility.some((comp) =>
            //         comp.toLowerCase().includes(filters.compatibility.toLowerCase())
            //     )
            // ) {
            //     return false;
            // }

            return true;
        });

        // Sort
        switch (sortBy) {
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
            default:
                break;
        }

        return filtered;
    }, [products, searchQuery, filters, sortBy]);

    const handleAddToCart = (product: Product) => {
        // Convert shop product back to product store format
        const productForCart: Product = {
            id: product.id,
            name: product.name,
            description: product.description,
            reference: product.id,
            price: product.price,
            stock: product.stock,
            stockAlert: 5,
            unit: 'pièce',
            imageUrl: product.images[0],
            images: product.images,
            isActive: product.isActive,
            categoryId: product.categoryId,
            createdBy: product.createdBy,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            specifications: {
                color: '',
                weight: ''
            }
        };
        console.log(productForCart);
        // toast.success('Produit ajouté au panier', `${product.name} a été ajouté à votre panier`);
    };

    const handleToggleWishlist = (product: Product) => {
        setWishlist((prev) =>
            prev.includes(product.id) ? prev.filter((id) => id !== product.id) : [...prev, product.id]
        );
    };

    const handleQuickView = (product: Product) => {
        console.log('Quick view:', product.name);
    };

    const clearFilters = () => {
        setFilters(defaultFilters);
        setSearchQuery('');
    };

    const lowStockProducts = products.filter((p) => p.stock <= 5);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Catalogue de Pièces</h1>
                        <p className="text-muted-foreground">
                            Parcourez notre collection de pièces reconditionnées de qualité
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="gap-2 bg-transparent"
                            onClick={() => setShowPhotoSearch(!showPhotoSearch)}
                        >
                            <Camera className="h-4 w-4" />
                            Recherche Photo
                        </Button>
                        <Button className="gap-2 relative" style={{ backgroundColor: 'var(--tsa-blue)' }}>
                            <ShoppingCart className="h-4 w-4" />
                            Panier
                            {/* {totalItems > 0 && (
                                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5">
                                    {totalItems}
                                </Badge>
                            )} */}
                        </Button>
                    </div>
                </div>
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

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Rechercher des pièces..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Filtres
                        </Button>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Plus récent</SelectItem>
                                <SelectItem value="price-low">Prix croissant</SelectItem>
                                <SelectItem value="price-high">Prix décroissant</SelectItem>
                                <SelectItem value="rating">Mieux noté</SelectItem>
                                <SelectItem value="quality">Meilleure qualité</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex border rounded-md">
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className="rounded-r-none"
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className="rounded-l-none"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {showFilters && (
                    <ProductFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                        onClearFilters={clearFilters}
                    />
                )}
            </div>

            {/* Results */}
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {filteredProducts.length} produit(s) trouvé(s)
                </p>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-8">
                    <p>Chargement des produits...</p>
                </div>
            )}

            {/* Products Grid */}
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
            {!isLoading && filteredProducts.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">Aucun produit trouvé</p>
                    <Button onClick={clearFilters} variant="outline">
                        Effacer les filtres
                    </Button>
                </div>
            )}
        </div>
    );
}

export default Shop;
