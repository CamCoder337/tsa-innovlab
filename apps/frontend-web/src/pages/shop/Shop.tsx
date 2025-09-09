import { useState, useMemo } from 'react'
import { ProductFilters } from "@/components/shop/product-filters"
import { ProductCard } from "@/components/shop/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Grid, List, Search, SlidersHorizontal, Camera, ShoppingCart, AlertTriangle, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Product, ProductFilter, ViewMode } from "@/types/shop.types"

const mockProducts: Product[] = [
    {
        id: "1",
        name: "Bosch Engine Oil Filter",
        description: "High-quality oil filter for diesel engines. Compatible with most European vehicles.",
        price: 15000,
        originalPrice: 18000,
        condition: "Like New",
        brand: "Bosch",
        category: "Engine Parts",
        subcategory: "Filters",
        images: ["/oil-filter.png"],
        inStock: true,
        stockQuantity: 25,
        rating: 4.5,
        reviewCount: 12,
        warranty: "6 months warranty",
        compatibility: ["Toyota Camry", "Honda Accord", "Nissan Altima"],
        specifications: {
            "Part Number": "F026407006",
            "Thread Size": "M20 x 1.5",
            Height: "95mm",
            Diameter: "76mm",
        },
        features: ["OEM Quality", "Long-lasting", "Easy Installation"],
        weight: 0.3,
        dimensions: { length: 10, width: 8, height: 9.5 },
        qualityScore: 92,
        // testingHistory: {
        //     testsPerformed: 3,
        //     passRate: 100,
        //     lastTested: "2025-01-15",
        // },
        // reliabilityRating: "Excellent",
    },
    {
        id: "2",
        name: "Continental Brake Pads Set",
        description: "Premium brake pads for enhanced stopping power and durability.",
        price: 45000,
        condition: "New",
        brand: "Continental",
        category: "Braking System",
        subcategory: "Brake Pads",
        images: ["/brake-pads-close-up.png"],
        inStock: true,
        stockQuantity: 2,
        rating: 4.8,
        reviewCount: 28,
        warranty: "12 months warranty",
        compatibility: ["BMW 3 Series", "Mercedes C-Class", "Audi A4"],
        specifications: {
            "Part Number": "P85020",
            Thickness: "17.5mm",
            Width: "155mm",
            Height: "52mm",
        },
        features: ["Low Dust", "Quiet Operation", "Temperature Resistant"],
        weight: 1.2,
        dimensions: { length: 15.5, width: 5.2, height: 1.75 },
        qualityScore: 96,
        // testingHistory: {
        //     testsPerformed: 5,
        //     passRate: 100,
        //     lastTested: "2025-01-18",
        // },
        // reliabilityRating: "Excellent",
    },
    {
        id: "3",
        name: "Michelin Truck Tire 315/80R22.5",
        description: "Heavy-duty truck tire for long-haul transportation. Excellent fuel efficiency.",
        price: 125000,
        originalPrice: 180000,
        condition: "Good",
        brand: "Michelin",
        category: "Tires & Wheels",
        subcategory: "Truck Tires",
        images: ["/truck-tire.png"],
        inStock: true,
        stockQuantity: 8,
        rating: 4.3,
        reviewCount: 15,
        warranty: "3 months warranty",
        compatibility: ["Volvo FH", "Mercedes Actros", "Scania R-Series"],
        specifications: {
            "Tire Size": "315/80R22.5",
            "Load Index": "156/150",
            "Speed Rating": "L",
            "Tread Depth": "12mm",
        },
        features: ["Fuel Efficient", "Long Lasting", "All Weather"],
        weight: 65,
        dimensions: { length: 100, width: 31.5, height: 100 },
        qualityScore: 78,
        // testingHistory: {
        //     testsPerformed: 2,
        //     passRate: 100,
        //     lastTested: "2025-01-10",
        // },
        // reliabilityRating: "Good",
    },
]

const defaultFilters: ProductFilter = {
    categories: [],
    priceRange: [0, 200000],
    conditions: [],
    brands: [],
    inStockOnly: false,
    compatibility: "",
}

export default function Shop() {
    const [searchQuery, setSearchQuery] = useState("")
    const [filters, setFilters] = useState<ProductFilter>(defaultFilters)
    const [viewMode, setViewMode] = useState<ViewMode>("grid")
    const [sortBy, setSortBy] = useState("newest")
    const [showFilters, setShowFilters] = useState(true)
    const [wishlist, setWishlist] = useState<string[]>([])
    const [cart, setCart] = useState<{ [key: string]: number }>({})
    const [showPhotoSearch, setShowPhotoSearch] = useState(false)

    const filteredProducts = useMemo(() => {
        const filtered = mockProducts.filter((product) => {
            // Search query
            if (
                searchQuery &&
                !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !product.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !product.brand.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !product.specifications["Part Number"]?.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
                return false
            }

            // Categories
            if (
                filters.categories.length > 0 &&
                !filters.categories.includes(product.category) &&
                !filters.categories.includes(product.subcategory || "")
            ) {
                return false
            }

            // Price range
            if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
                return false
            }

            // Conditions
            if (filters.conditions.length > 0 && !filters.conditions.includes(product.condition)) {
                return false
            }

            // Brands
            if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
                return false
            }

            // Stock
            if (filters.inStockOnly && !product.inStock) {
                return false
            }

            // Compatibility
            if (
                filters.compatibility &&
                !product.compatibility.some((comp) => comp.toLowerCase().includes(filters.compatibility.toLowerCase()))
            ) {
                return false
            }

            return true
        })

        // Sort
        switch (sortBy) {
            case "price-low":
                filtered.sort((a, b) => a.price - b.price)
                break
            case "price-high":
                filtered.sort((a, b) => b.price - a.price)
                break
            case "rating":
                filtered.sort((a, b) => b.rating - a.rating)
                break
            case "quality":
                filtered.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
                break
            case "newest":
            default:
                // Keep original order for newest
                break
        }

        return filtered
    }, [searchQuery, filters, sortBy])

    const handleAddToCart = (product: Product) => {
        setCart((prev) => ({
            ...prev,
            [product.id]: (prev[product.id] || 0) + 1,
        }))
    }

    const handleToggleWishlist = (product: Product) => {
        setWishlist((prev) => (prev.includes(product.id) ? prev.filter((id) => id !== product.id) : [...prev, product.id]))
    }

    const handleQuickView = (product: Product) => {
        // TODO: Implement quick view modal
        console.log("Quick view:", product.name)
    }

    const clearFilters = () => {
        setFilters(defaultFilters)
        setSearchQuery("")
    }

    const cartItemCount = Object.values(cart).reduce((sum, count) => sum + count, 0)
    const lowStockProducts = mockProducts.filter((p) => p.inStock && p.stockQuantity <= 5)

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Parts Catalog</h1>
                        <p className="text-muted-foreground">
                            Browse our collection of quality-tested reconditioned vehicle parts
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="gap-2 bg-transparent"
                            onClick={() => setShowPhotoSearch(!showPhotoSearch)}
                        >
                            <Camera className="h-4 w-4" />
                            Photo Search
                        </Button>
                        <Button className="gap-2 relative" style={{ backgroundColor: "var(--tsa-blue)" }}>
                            <ShoppingCart className="h-4 w-4" />
                            Cart
                            {cartItemCount > 0 && (
                                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5">
                                    {cartItemCount}
                                </Badge>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {lowStockProducts.length > 0 && (
                <Card className="mb-6 border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            <h3 className="font-medium text-orange-800">Low Stock Alert</h3>
                        </div>
                        <div className="space-y-1">
                            {lowStockProducts.map((product) => (
                                <p key={product.id} className="text-sm text-orange-700">
                                    <strong>{product.name}</strong> - Only {product.stockQuantity} left in stock!
                                    {product.stockQuantity <= 2 && " Order before 5 PM for guaranteed availability."}
                                </p>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {showPhotoSearch && (
                <Card className="mb-6 border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Camera className="h-5 w-5 text-blue-600" />
                            <h3 className="font-medium text-blue-800">Smart Photo Search</h3>
                        </div>
                        <p className="text-sm text-blue-700 mb-3">
                            Upload a photo of your part or scan the serial number for instant compatibility matching
                        </p>
                        <div className="flex gap-3">
                            <Button variant="outline" className="gap-2 bg-white">
                                <Camera className="h-4 w-4" />
                                Take Photo
                            </Button>
                            <Button variant="outline" className="gap-2 bg-white">
                                Upload Image
                            </Button>
                            <Button variant="outline" className="gap-2 bg-white">
                                Scan Serial Number
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search and Controls */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, part number, or serial..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="quality">Quality Score</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                    >
                        <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>

                <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                </Button>
            </div>

            <div className="flex gap-6">
                {/* Filters Sidebar */}
                {showFilters && (
                    <ProductFilters filters={filters} onFiltersChange={setFilters} onClearFilters={clearFilters} />
                )}

                {/* Products Grid/List */}
                <div className="flex-1">
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredProducts.length} of {mockProducts.length} products
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>Quality-tested parts with reliability scores</span>
                        </div>
                    </div>

                    <div
                        className={cn(
                            viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4",
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
                                cartQuantity={cart[product.id] || 0}
                            />
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No products found matching your criteria.</p>
                            <Button variant="outline" onClick={clearFilters} className="mt-4 bg-transparent">
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
