import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, TrendingUp, Users, ShoppingCart, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types/product.types';
import { shopService } from '@/services/shop.service';

interface ProductRecommendationsProps {
  type: 'popular' | 'personalized' | 'similar';
  productId?: string;
  limit?: number;
  className?: string;
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
}) => {
  const { isAuthenticated } = useAuth();
  const { addToCart, isLoading: cartLoading } = useCart();
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let response;

      switch (type) {
        case 'popular':
          response = await shopService.getProductRecommendations(limit);
          break;
        case 'personalized':
          response = await shopService.getPersonalizedRecommendations(limit, 'homepage');
          break;
        case 'similar':
          if (!productId) {
            throw new Error('Product ID required for similar recommendations');
          }
          response = await shopService.getSimilarProducts(productId, limit);
          break;
        default:
          throw new Error(`Unknown recommendation type: ${type}`);
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

  // Track product views when recommendations are loaded
  useEffect(() => {
    if (recommendations?.products && recommendations.products.length > 0 && isAuthenticated) {
      recommendations.products.forEach((product) => {
        // Track view event for each recommended product
        shopService.submitRecommendationFeedback(product.id, 'view', type);
      });
    }
  }, [recommendations, isAuthenticated, type]);

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product, 1);

      // Track add to cart event if user is authenticated
      if (isAuthenticated) {
        await shopService.submitRecommendationFeedback(product.id, 'add_to_cart', type);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleProductClick = (productId: string) => {
    if (isAuthenticated) {
      shopService.submitRecommendationFeedback(productId, 'click', type);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'popular':
        return 'Produits Populaires';
      case 'personalized':
        return isAuthenticated ? 'Recommandé pour vous' : 'Produits Populaires';
      case 'similar':
        return 'Produits Similaires';
      default:
        return 'Recommandations';
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
        return 'Les produits les plus demandés par nos clients';
      case 'personalized':
        return isAuthenticated
          ? 'Sélection personnalisée basée sur vos préférences'
          : 'Les produits les plus populaires';
      case 'similar':
        return "D'autres produits qui pourraient vous intéresser";
      default:
        return 'Découvrez nos recommandations';
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
              IA
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.products.map((product) => (
              <div
                key={product.id}
                className="group border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <Link
                  to={`/app/shop/product/${product.id}`}
                  onClick={() => handleProductClick(product.id)}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
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
                  </div>
                </Link>

                <div className="space-y-2">
                  <Link
                    to={`/app/shop/product/${product.id}`}
                    onClick={() => handleProductClick(product.id)}
                  >
                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h4>
                  </Link>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-bold text-lg text-tsa-blue">
                        {product.price.toLocaleString()} FCFA
                      </div>
                      {product.price && product.price > product.price && (
                        <div className="text-xs text-gray-500 line-through">
                          {product.price.toLocaleString()} FCFA
                        </div>
                      )}
                    </div>

                    {/* {product.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">{product.rating}</span>
                      </div>
                    )} */}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Stock: {product.stock}</span>
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
                    {product.stock === 0 ? 'Rupture' : 'Ajouter'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune recommandation disponible</p>
          </div>
        )}

        {/* {recommendations?.reason && type === 'personalized' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Pourquoi ces recommandations ?</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">{recommendations.reason}</p>
            {recommendations.confidence && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-blue-600">
                  <span>Pertinence</span>
                  <span>{Math.round(recommendations.confidence * 100)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
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
