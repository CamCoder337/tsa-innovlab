import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, TrendingUp, Users, ShoppingCart, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types/product.types';
import { shopService } from '@/services/shop.service';
import { toast } from 'sonner';
import { useShopTranslation } from '@/hooks/useTranslation';
import { Link } from 'react-router-dom';

interface ProductRecommendationsProps {
  type: 'popular' | 'personalized' | 'similar' | 'cart';
  productId?: string;
  limit?: number;
  className?: string;
  view?: 'grid' | 'compact';
}

interface RecommendationResponse {
  products: Product[];
  strategy: string;
  total: number;
}

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  type,
  productId,
  limit = 4,
  className = '',
  view = 'grid',
}) => {
  const { isAuthenticated } = useAuth();
  const { addToCart, isLoading: cartLoading } = useCart();
  const { t: tShop } = useShopTranslation();
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let response;

      switch (type) {
        case 'similar':
          if (!productId) {
            throw new Error('Product ID required for similar recommendations');
          }
          response = await shopService.getSimilarProducts(productId, limit);
          break;
        default:
          response = await shopService.getProductRecommendations(limit);
          break;
      }

      if (response.error) {
        throw new Error('Failed to fetch recommendations');
      }

      if (response.data) setRecommendations(response.data as RecommendationResponse);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [limit, productId, type]);

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product, 1);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(tShop('recommendations.addedToCart', { productName: product.name }));
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'popular':
        return tShop('recommendations.popularProducts');
      case 'personalized':
        return isAuthenticated
          ? tShop('recommendations.recommendedForYou')
          : tShop('recommendations.popularProducts');
      case 'similar':
        return tShop('recommendations.similarProducts');
      case 'cart':
        return tShop('cart.recommendations.title');
      default:
        return tShop('recommendations.title');
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'popular':
        return <TrendingUp className="h-5 w-5" />;
      case 'personalized':
        return <Sparkles className="h-5 w-5" />;
      case 'similar':
        return <Users className="h-5 w-5" />;
      default:
        return <Eye className="h-5 w-5" />;
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'popular':
        return tShop('recommendations.popularDescription');
      case 'personalized':
        return isAuthenticated
          ? tShop('recommendations.personalizedDescription')
          : tShop('recommendations.popularDescription');
      case 'similar':
        return tShop('recommendations.similarDescription');
      default:
        return tShop('recommendations.defaultDescription');
    }
  };

  if (error) {
    return null; // Fail silently for recommendations
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getIcon()}
          {getTitle()}
          {type === 'personalized' && isAuthenticated && (
            <Badge variant="secondary" className="ml-auto">
              <Sparkles className="h-3 w-3 mr-1" />
              {tShop('recommendations.ai')}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className={`${type === 'cart' ? 'hidden' : ''}`}>
          {getDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: limit }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : recommendations?.products?.length ? (
          view === 'compact' ? (
            <div className="space-y-3">
              {recommendations.products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2 border dark:border-gray-800 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <Link to={`/app/shop/product/${product.id}`} className="flex-shrink-0">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                        <Eye className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/app/shop/product/${product.id}`}>
                      <p className="text-sm font-medium truncate hover:text-tsa-blue dark:text-tsa-white transition-colors">
                        {product.name}
                      </p>
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {product.price.toLocaleString()} FCFA
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddToCart(product)}
                    disabled={cartLoading || product.stock === 0}
                    className="flex-shrink-0"
                  >
                    {product.stock === 0
                      ? tShop('product.outOfStock')
                      : tShop('cart.recommendations.add')}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {recommendations.products.map((product) => (
                <div
                  key={product.id}
                  className="group border dark:border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 overflow-hidden">
                    <Link to={`/app/shop/product/${product.id}`}>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Eye className="h-8 w-8" />
                        </div>
                      )}
                    </Link>
                  </div>

                  <div className="space-y-2">
                    <Link to={`/app/shop/product/${product.id}`}>
                      <h4 className="font-medium text-sm line-clamp-2 group-hover:text-tsa-blue dark:text-tsa-white transition-colors">
                        {product.name}
                      </h4>
                    </Link>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-bold text-lg text-tsa-blue dark:text-tsa-white">
                          {product.price.toLocaleString()} FCFA
                        </div>
                        {product.price && product.price > product.price && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-through">
                            {product.price.toLocaleString()} FCFA
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {tShop('product.stock')}: {product.stock}
                      </span>
                      {product.category && (
                        <Badge variant="outline" className="text-xs">
                          {product.category.name}
                        </Badge>
                      )}
                    </div>

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleAddToCart(product)}
                      disabled={cartLoading || product.stock === 0}
                    >
                      <ShoppingCart className="h-3 w-3 mr-2" />
                      {product.stock === 0
                        ? tShop('product.outOfStock')
                        : tShop('product.addToCart')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>{tShop('recommendations.noRecommendations')}</p>
          </div>
        )}

        {/* {recommendations?.reason && type === 'personalized' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Pourquoi ces recommandations ?</span>
            </div>
            <p className="text-sm text-tsa-blue dark:text-tsa-white mt-1">{recommendations.reason}</p>
            {recommendations.confidence && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-tsa-blue dark:text-tsa-white">
                  <span>Pertinence</span>
                  <span>{Math.round(recommendations.confidence * 100)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-tsa-blue h-1.5 rounded-full transition-all"
                    style={{ width: `${recommendations.confidence * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )} */}
      </CardContent>
    </Card>
  );
};
