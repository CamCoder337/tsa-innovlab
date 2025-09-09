import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Eye, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProductCardProps } from "@/types/shop.types"

export function ProductCard({
    product,
    viewMode,
    onAddToCart,
    onToggleWishlist,
    onQuickView,
    isInWishlist = false,
}: ProductCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const getConditionColor = (condition: string) => {
        switch (condition) {
            case "Neuf":
                return "bg-green-100 text-green-800"
            case "Comme Neuf":
                return "bg-blue-100 text-blue-800"
            case "Bon":
                return "bg-yellow-100 text-yellow-800"
            case "Correct":
                return "bg-orange-100 text-orange-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
    }

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
    }

    if (viewMode === "list") {
        return (
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <div className="relative w-32 h-32 flex-shrink-0">
                            <img
                                src={product.images[currentImageIndex] || "/placeholder.svg?height=128&width=128"}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-lg"
                            />
                            {product.images.length > 1 && (
                                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                    {currentImageIndex + 1}/{product.images.length}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg">{product.name}</h3>
                                    <p className="text-sm text-muted-foreground">{product.brand}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onToggleWishlist(product)}
                                    className={cn("p-2", isInWishlist && "text-red-500")}
                                >
                                    <Heart className={cn("h-4 w-4", isInWishlist && "fill-current")} />
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge className={getConditionColor(product.condition)}>{product.condition}</Badge>
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm">{product.rating}</span>
                                    <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold">{product.price.toLocaleString()} FCFA</span>
                                    {product.originalPrice && (
                                        <span className="text-sm text-muted-foreground line-through">
                                            {product.originalPrice.toLocaleString()} FCFA
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => onQuickView(product)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Aperçu Rapide
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => onAddToCart(product)}
                                        disabled={!product.inStock}
                                        style={{ backgroundColor: product.inStock ? "var(--tsa-blue)" : undefined }}
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        {product.inStock ? "Ajouter au Panier" : "Rupture de Stock"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-0">
                <div className="relative overflow-hidden">
                    <img
                        src={product.images[currentImageIndex] || "/placeholder.svg?height=200&width=300"}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Image navigation */}
                    {product.images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ←
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                →
                            </button>
                            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                {currentImageIndex + 1}/{product.images.length}
                            </div>
                        </>
                    )}

                    {/* Wishlist button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleWishlist(product)}
                        className={cn("absolute top-2 right-2 p-2 bg-white/80 hover:bg-white", isInWishlist && "text-red-500")}
                    >
                        <Heart className={cn("h-4 w-4", isInWishlist && "fill-current")} />
                    </Button>

                    {/* Stock indicator */}
                    {!product.inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge variant="destructive">Rupture de Stock</Badge>
                        </div>
                    )}
                </div>

                <div className="p-4 space-y-3">
                    <div className="space-y-1">
                        <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.brand}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge className={getConditionColor(product.condition)}>{product.condition}</Badge>
                        <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{product.rating}</span>
                            <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{product.price.toLocaleString()} FCFA</span>
                            {product.originalPrice && (
                                <span className="text-sm text-muted-foreground line-through">
                                    {product.originalPrice.toLocaleString()} FCFA
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">{product.warranty}</p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => onQuickView(product)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => onAddToCart(product)}
                            disabled={!product.inStock}
                            style={{ backgroundColor: product.inStock ? "var(--tsa-blue)" : undefined }}
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Ajouter au Panier
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
