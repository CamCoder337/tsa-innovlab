import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Minus,
  Plus,
  Star,
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Info,
  User,
  Calendar,
  Package,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { ProductRecommendations } from '@/components/shop/ProductRecommendations';

function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { products } = useProducts();

  const [qty, setQty] = useState(1);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isWritingComment, setIsWritingComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const listProduct = useMemo(() => products?.find((p) => p.id === id), [id, products]);

  const product = listProduct;

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAddingToCart(true);
    try {
      await addToCart(product, qty);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const shareProduct = () => {
    if (navigator.share && product) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const getStockStatus = () => {
    if (!product)
      return {
        status: 'unavailable',
        label: 'Indisponible',
        color: 'bg-red-50 text-red-700 border-red-200',
      };

    if (product.stock === 0) {
      return {
        status: 'out-of-stock',
        label: 'Rupture de stock',
        color: 'bg-red-50 text-red-700 border-red-200',
      };
    } else if (product.stock <= 5) {
      return {
        status: 'low-stock',
        label: `Plus que ${product.stock} en stock`,
        color: 'bg-orange-50 text-orange-700 border-orange-200',
      };
    } else {
      return {
        status: 'in-stock',
        label: 'En stock',
        color: 'bg-green-50 text-green-700 border-green-200',
      };
    }
  };

  if (!product) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardContent className="text-center py-16">
            <Package className="h-16 w-16 text-zinc-300 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Produit introuvable</h1>
            <p className="text-zinc-600 mb-6">Ce produit n'existe pas ou n'est plus disponible</p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to="/app/shop">Retour au catalogue</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const stockStatus = getStockStatus();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <Link
            to="/app/shop"
            className="flex items-center gap-1 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Catalogue
          </Link>
          <span>/</span>
          {product.category?.name && (
            <>
              <span>{product.category.name}</span>
              <span>/</span>
            </>
          )}
          <span className="text-zinc-900">{product.name}</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-2xl border bg-zinc-50">
            <img
              src={product.imageUrl || product.images?.[activeImageIndex] || product.images?.[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          </div>

          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    idx === activeImageIndex
                      ? 'border-green-500 ring-2 ring-green-200'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-zinc-900 mb-3">{product.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {product.category?.name && (
                    <Badge variant="secondary" className="text-sm">
                      {product.category.name}
                    </Badge>
                  )}
                  <Badge className={`${stockStatus.color} border text-sm`}>
                    {stockStatus.status === 'in-stock' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {stockStatus.status === 'low-stock' && <AlertCircle className="h-3 w-3 mr-1" />}
                    {stockStatus.status === 'out-of-stock' && (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {stockStatus.label}
                  </Badge>
                </div>
                {product.creator && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <User className="h-4 w-4" />
                    <span>
                      Vendu par {product.creator.firstName} {product.creator.lastName}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFavorite}
                  className={isFavorite ? 'text-red-600 border-red-200' : ''}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
                <Button variant="outline" size="sm" onClick={shareProduct}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-3xl font-bold text-green-600 mb-4">
              {parseFloat(product.price).toLocaleString('fr-FR')} FCFA
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-zinc-700 leading-relaxed">
              {showFullDescription || product.description.length <= 200
                ? product.description
                : `${product.description.slice(0, 200)}...`}
            </p>
            {product.description.length > 200 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-green-600 hover:text-green-700 text-sm font-medium mt-2"
              >
                {showFullDescription ? 'Voir moins' : 'Voir plus'}
              </button>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-zinc-700">Quantité:</span>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  disabled={qty <= 1}
                  className="h-10 w-10 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={product.stock}
                  value={qty}
                  onChange={(e) => {
                    const value = Math.max(1, Math.min(product.stock, Number(e.target.value) || 1));
                    setQty(value);
                  }}
                  className="w-16 text-center border-0 focus-visible:ring-0 h-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  disabled={qty >= product.stock}
                  className="h-10 w-10 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-zinc-500">
                {product.stock} disponible{product.stock > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || isAddingToCart}
                className="flex-1 bg-green-600 hover:bg-green-700 h-12"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isAddingToCart ? 'Ajout...' : 'Ajouter au panier'}
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center justify-center w-10 h-10 bg-green-50 rounded-lg">
                <Truck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">Livraison rapide</p>
                <p className="text-zinc-600">2-3 jours ouvrés</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">Garantie</p>
                <p className="text-zinc-600">12 mois</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center justify-center w-10 h-10 bg-orange-50 rounded-lg">
                <RotateCcw className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">Retour</p>
                <p className="text-zinc-600">30 jours</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-12">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Avis (0)
            </TabsTrigger>
            <TabsTrigger value="seller" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Vendeur
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations détaillées</CardTitle>
                <CardDescription>Toutes les informations techniques sur ce produit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-lg">
                      <Package className="h-5 w-5 text-zinc-600" />
                      <div>
                        <p className="font-medium text-zinc-900">Référence</p>
                        <p className="text-sm text-zinc-600">{product.id}</p>
                      </div>
                    </div>

                    {product.category && (
                      <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-lg">
                        <Package className="h-5 w-5 text-zinc-600" />
                        <div>
                          <p className="font-medium text-zinc-900">Catégorie</p>
                          <p className="text-sm text-zinc-600">{product.category.name}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-lg">
                      <Package className="h-5 w-5 text-zinc-600" />
                      <div>
                        <p className="font-medium text-zinc-900">Unité de vente</p>
                        <p className="text-sm text-zinc-600">{product.unit}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-lg">
                      <Package className="h-5 w-5 text-zinc-600" />
                      <div>
                        <p className="font-medium text-zinc-900">Stock disponible</p>
                        <p className="text-sm text-zinc-600">
                          {product.stock} unité{product.stock > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {product.createdAt && (
                      <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-zinc-600" />
                        <div>
                          <p className="font-medium text-zinc-900">Ajouté le</p>
                          <p className="text-sm text-zinc-600">
                            {new Date(product.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {product.updatedAt && (
                      <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-zinc-600" />
                        <div>
                          <p className="font-medium text-zinc-900">Dernière mise à jour</p>
                          <p className="text-sm text-zinc-600">
                            {new Date(product.updatedAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Avis clients</CardTitle>
                <CardDescription>Partagez votre expérience avec ce produit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {!isWritingComment ? (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-zinc-900 mb-2">
                        Aucun avis pour le moment
                      </h3>
                      <p className="text-zinc-600 mb-4">
                        Soyez le premier à donner votre avis sur ce produit
                      </p>
                      <Button
                        onClick={() => setIsWritingComment(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Écrire un avis
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-zinc-700 mb-2 block">
                          Votre note
                        </label>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedRating(i + 1)}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  (selectedRating ?? 0) > i
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-zinc-200 text-zinc-300'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-zinc-600">
                            {selectedRating ? `${selectedRating}/5` : 'Cliquez pour noter'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-zinc-700 mb-2 block">
                          Votre avis
                        </label>
                        <Textarea
                          placeholder="Partagez votre expérience avec ce produit..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            console.log({ rating: selectedRating, comment: commentText });
                            setIsWritingComment(false);
                            setCommentText('');
                            setSelectedRating(0);
                          }}
                          disabled={!selectedRating || commentText.length < 10}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Publier l'avis
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsWritingComment(false);
                            setCommentText('');
                            setSelectedRating(0);
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seller" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations vendeur</CardTitle>
                <CardDescription>À propos du vendeur de ce produit</CardDescription>
              </CardHeader>
              <CardContent>
                {product.creator ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">
                          {product.creator.firstName} {product.creator.lastName}
                        </h3>
                        <p className="text-zinc-600">Vendeur vérifié</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-zinc-50 rounded-lg">
                        <Package className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
                        <p className="text-sm text-zinc-600">Produits vendus</p>
                        <p className="text-lg font-semibold text-zinc-900">-</p>
                      </div>
                      <div className="text-center p-4 bg-zinc-50 rounded-lg">
                        <Star className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
                        <p className="text-sm text-zinc-600">Note moyenne</p>
                        <p className="text-lg font-semibold text-zinc-900">-</p>
                      </div>
                      <div className="text-center p-4 bg-zinc-50 rounded-lg">
                        <Calendar className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
                        <p className="text-sm text-zinc-600">Membre depuis</p>
                        <p className="text-lg font-semibold text-zinc-900">-</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-600">Informations vendeur non disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Similar Products Recommendations */}
        {product && (
          <div className="mt-8">
            <ProductRecommendations type="similar" productId={product.id} limit={4} />
          </div>
        )}
      </div>
    </main>
  );
}

export default ProductPage;
