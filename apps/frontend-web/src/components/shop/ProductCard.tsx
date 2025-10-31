import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Eye, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductCardProps } from '@/types/product.types';
import { Input } from '../ui/input';
import { useShopTranslation } from '@/hooks/useTranslation';

export function ProductCard({
  product,
  viewMode,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  isInWishlist = false,
}: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const { t: tShop } = useShopTranslation();

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative w-32 h-32 flex-shrink-0">
              <Link to={`/app/shop/product/${product.id}`}>
                <img
                  src={product.images[currentImageIndex] || '/placeholder.svg?height=128&width=128'}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </Link>
              {product.images.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {currentImageIndex + 1}/{product.images.length}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <Link to={`/app/shop/product/${product.id}`}>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                  </Link>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleWishlist?.(product.id)}
                  className={cn('p-2', isInWishlist && 'text-red-500')}
                >
                  <Heart className={cn('h-4 w-4', isInWishlist && 'fill-current')} />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{product.price.toLocaleString()} FCFA</span>
                  {product.price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {product.price.toLocaleString()} FCFA
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => onQuickView?.(product)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {tShop('quickView')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onAddToCart?.(product, qty)}
                    disabled={!product.stock}
                    style={{ backgroundColor: product.stock ? 'var(--tsa-blue)' : undefined }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {product.stock ? tShop('addToCart') : tShop('product.outOfStock')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        <div className="relative overflow-hidden">
          <Link to={`/app/shop/product/${product.id}`}>
            <img
              src={product.images[currentImageIndex] || '/placeholder.svg?height=200&width=300'}
              alt={product.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

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
            onClick={() => onToggleWishlist?.(product.id)}
            className={cn(
              'absolute top-2 right-2 p-2 bg-white/80 hover:bg-white',
              isInWishlist && 'text-red-500'
            )}
          >
            <Heart className={cn('h-4 w-4', isInWishlist && 'fill-current')} />
          </Button>

          {/* Stock indicator */}
          {!product.stock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive">{tShop('product.outOfStock')}</Badge>
            </div>
          )}
        </div>

        <div className="p-2 space-y-4">
          <div className="space-y-1 h-12">
            <Link to={`/app/shop/product/${product.id}`}>
              <h3 className="font-semibold line-clamp-2">{product.name}</h3>
            </Link>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-end gap-2">
              <span className="text-lg font-bold">{product.price.toLocaleString()} FCFA</span>
            </div>
          </div>

          <div className="flex gap-2 justify-between">
            {/* <Button
              variant="outline"
              size="sm"
              className="w-fit bg-transparent"
              onClick={() => onQuickView?.(product)}
            >
              <Eye className="h-4 w-4" />
            </Button> */}
            <div className="flex items-center justify-end gap-2 w-2/3">
              <Button
                variant="outline"
                className="w-fit h-auto has-[>svg]:px-1"
                aria-label={tShop('product.decreaseQuantity')}
                onClick={(e) => {
                  e.stopPropagation();
                  setQty(qty - 1);
                }}
                disabled={qty <= 1}
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Input
                aria-label={tShop('product.quantity')}
                className="w-fit text-center h-auto"
                type="number"
                min={1}
                max={product.stock}
                value={qty}
                onChange={(e) => {
                  e.stopPropagation(); // Prevent change event from bubbling
                  const value = e.target.value;
                  if (Number(value) <= product.stock) setQty(Number(value));
                  else setQty(product.stock);
                }}
              />
              <Button
                className="w-fit h-auto has-[>svg]:px-1 "
                variant="outline"
                aria-label={tShop('product.increaseQuantity')}
                onClick={(e) => {
                  e.stopPropagation();
                  setQty(qty + 1);
                }}
                disabled={qty >= product.stock}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <Button
              size="sm"
              className="w-fit"
              onClick={() => onAddToCart?.(product, qty)}
              disabled={!product.stock}
              style={{ backgroundColor: product.stock ? 'var(--tsa-blue)' : undefined }}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
