import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Link } from 'react-router-dom';

interface CartDrawerProps {
  children: React.ReactNode;
}

function CartDrawer({ children }: CartDrawerProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearAllItems,
    getTotalItems,
    getFormattedTotalPrice,
    isEmpty,
    isLoading,
    error,
  } = useCart();

  const handleUpdateQuantity = useCallback(
    async (productId: string, newQuantity: number) => {
      updateQuantity(productId, newQuantity);

      // TODO: When Cart API is available, sync with server for authenticated users
      if (user) {
        console.log('Would sync cart update with server for user:', user.id);
        // const response = await cartApi.updateItem(itemId, newQuantity);
        // Handle server response
      }
    },
    [updateQuantity, user]
  );

  const handleRemoveItem = useCallback(
    async (productId: string) => {
      removeFromCart(productId);

      // TODO: When Cart API is available, sync with server for authenticated users
      if (user) {
        console.log('Would sync cart removal with server for user:', user.id);
        // const response = await cartApi.removeItem(itemId);
        // Handle server response
      }
    },
    [removeFromCart, user]
  );

  // Auto-remove items with zero quantity
  useEffect(() => {
    const zeroQuantityItem = cart.items.find((item) => item.quantity <= 0);
    if (zeroQuantityItem) {
      handleRemoveItem(zeroQuantityItem.productId);
    }
  }, [cart.items, handleRemoveItem]);

  const handleClearCart = useCallback(async () => {
    clearAllItems();

    // TODO: When Cart API is available, sync with server for authenticated users
    if (user) {
      console.log('Would sync cart clear with server for user:', user.id);
      // const response = await cartApi.clearCart();
      // Handle server response
    }
  }, [clearAllItems, user]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-4">
        <SheetHeader>
          <SheetTitle>
            <h1 className="text-xl font-semibold">Mon panier</h1>
          </SheetTitle>
        </SheetHeader>
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}
        <div className="mt-4 grid gap-4">
          {isEmpty() ? (
            <p className=" text-tsa-gray text-center">Votre panier est vide.</p>
          ) : (
            <ul className="grid gap-4">
              {cart.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <img
                    src={item.product.images[0]}
                    alt={`Image de ${item.product.name}`}
                    className="h-16 w-16 rounded object-cover border"
                    loading="lazy"
                  />
                  <div className="flex-1">
                    <p
                      className="text-sm font-medium"
                      style={{ fontFamily: 'Rounded, sans-serif' }}
                    >
                      {item.product.name}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {item.priceAtTime.toLocaleString()} FCFA
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Diminuer la quantité"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateQuantity(item.productId, item.quantity - 1);
                      }}
                      disabled={item.quantity <= 1 || isLoading}
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Input
                      aria-label="Quantité"
                      className="w-12 text-center px-0.5"
                      type="number"
                      min={1}
                      max={item.product.stock}
                      value={item.quantity}
                      onChange={(e) => {
                        e.stopPropagation();
                        const newQuantity = parseInt(e.target.value || '1', 10);
                        if (newQuantity > 0) {
                          handleUpdateQuantity(item.productId, newQuantity);
                        }
                      }}
                      disabled={isLoading}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Augmenter la quantité"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateQuantity(item.productId, item.quantity + 1);
                      }}
                      disabled={item.quantity >= item.product.stock || isLoading}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Supprimer l'article"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(item.productId);
                      }}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <SheetFooter className="mt-6">
          <div className="w-full grid gap-3">
            <div className="flex items-center justify-between text-sm">
              <span>Total Articles</span>
              <span className="font-medium">{getTotalItems()}</span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span>Total Prix</span>
              <span className="font-semibold">{getFormattedTotalPrice()}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearCart();
                }}
                disabled={isEmpty() || isLoading}
              >
                Vider
              </Button>
              <Link to={'/app/cart'}>
                <Button
                  className="flex-1 bg-tsa-blue hover:bg-tsa-blue/80"
                  onClick={(e) => e.stopPropagation()}
                  disabled={isEmpty() || isLoading}
                >
                  Passer au paiement
                </Button>
              </Link>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default CartDrawer;
