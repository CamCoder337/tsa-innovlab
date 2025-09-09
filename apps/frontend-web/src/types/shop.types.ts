export type ProductCondition = "New" | "Like New" | "Good" | "Fair" | "Neuf" | "Comme Neuf" | "Bon" | "Correct"
export type ViewMode = "grid" | "list"

export interface Product {
    id: string
    name: string
    description: string
    price: number
    originalPrice?: number
    condition: ProductCondition
    brand: string
    category: string
    subcategory?: string
    images: string[]
    inStock: boolean
    stockQuantity: number
    rating: number
    reviewCount: number
    warranty: string
    compatibility: string[]
    specifications: Record<string, string>
    features: string[]
    weight: number
    dimensions: {
        length: number
        width: number
        height: number
    }
    qualityScore: number
}

export interface ProductCardProps {
    product: Product
    viewMode: ViewMode
    onAddToCart: (product: Product) => void
    onToggleWishlist: (product: Product) => void
    onQuickView: (product: Product) => void
    isInWishlist?: boolean
    cartQuantity?: number
}

export interface ProductFilter {
    categories: string[]
    priceRange: [number, number]
    conditions: ProductCondition[]
    brands: string[]
    inStockOnly: boolean
    compatibility: string
}

export interface CartItem {
    id: string
    name: string
    price: number
    originalPrice?: number
    image: string
    quantity: number
    inStock: boolean
    stockQuantity: number
    qualityScore?: number
    warranty: string
    weight: number
}
