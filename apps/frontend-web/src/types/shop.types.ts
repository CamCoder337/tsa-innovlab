
import type { Product } from '@/types/product.types';

export type ProductCondition =
    | 'New'
    | 'Like New'
    | 'Good'
    | 'Fair'
    | 'Neuf'
    | 'Comme Neuf'
    | 'Bon'
    | 'Correct';

export type ViewMode = 'grid' | 'list';

export interface ProductCardProps {
    product: Product;
    viewMode: ViewMode;
    onAddToCart: (product: Product) => void;
    onToggleWishlist: (product: Product) => void;
    onQuickView: (product: Product) => void;
    isInWishlist?: boolean;
    cartQuantity?: number;
}

export interface ProductFilter {
    categories: string[];
    priceRange: [number, number];
    conditions: ProductCondition[];
    brands: string[];
    inStockOnly: boolean;
    compatibility: string;
}

export interface CartItem {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    quantity: number;
    inStock: boolean;
    stockQuantity: number;
    qualityScore?: number;
    warranty: string;
    weight: number;
}
