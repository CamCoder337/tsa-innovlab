import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';
import { useCartTranslation } from '@/hooks/useTranslation';

interface CartDrawerProps {
  children: React.ReactNode;
}

function CartDrawer({ children }: CartDrawerProps) {
  const [open, setOpen] = useState(false);
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getFormattedTotalPrice,
    isEmpty,
    isLoading,
    error,
  } = useCart();
  const { t: tCart } = useCartTranslation();
  const navigate = useNavigate();

  const handleUpdateQuantity = useCallback(
    async (itemId: string, newQuantity: number) => {
      updateQuantity(itemId, newQuantity);
    },
    [updateQuantity]
  );

  const handleRemoveItem = useCallback(
    async (productId: string) => {
      removeFromCart(productId);
    },
    [removeFromCart]
  );

  // Auto-remove items with zero quantity
  useEffect(() => {
    const zeroQuantityItem = cart.items.find((item) => item.quantity <= 0);
    if (zeroQuantityItem) {
      handleRemoveItem(zeroQuantityItem.id);
    }
  }, [cart.items, handleRemoveItem]);

  const handleClearCart = useCallback(async () => {
    clearCart();
  }, [clearCart]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetDescription className="hidden"> {tCart('title')} </SheetDescription>
      <SheetContent className="w-full sm:max-w-md p-4">
        <SheetHeader>
          <SheetTitle>
            <p className="text-xl font-semibold">{tCart('title')}</p>
          </SheetTitle>
        </SheetHeader>
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}
        <div className="mt-4 grid gap-4">
          {isEmpty() ? (
            <p className=" text-tsa-gray text-center">{tCart('empty')}</p>
          ) : (
            <ul className="grid gap-4">
              {cart.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <img
                    src={item.product?.images?.[0] || '/placeholder-product.png'}
                    alt={`${tCart('imageOf')} ${item.product?.name || tCart('product')}`}
                    className="h-16 w-16 rounded object-cover border"
                    loading="lazy"
                  />
                  <div className="flex-1">
                    <p
                      className="text-sm font-medium"
                      style={{ fontFamily: 'Rounded, sans-serif' }}
                    >
                      {item.product?.name || tCart('product')}
                    </p>
                    <p className="text-xs text-zinc-600">{item.priceAtAdd.toLocaleString()} FCFA</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label={tCart('decreaseQuantity')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateQuantity(item.id, item.quantity - 1);
                      }}
                      disabled={item.quantity <= 1 || isLoading}
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Input
                      aria-label={tCart('quantity')}
                      className="w-12 text-center px-0.5"
                      type="number"
                      min={1}
                      max={item.product?.stock || 99}
                      value={item.quantity}
                      onChange={(e) => {
                        e.stopPropagation();
                        const newQuantity = parseInt(e.target.value || '1', 10);
                        if (newQuantity > 0) {
                          handleUpdateQuantity(item.id, newQuantity);
                        }
                      }}
                      disabled={isLoading}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label={tCart('increaseQuantity')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateQuantity(item.id, item.quantity + 1);
                      }}
                      disabled={item.quantity >= (item.product?.stock || 0) || isLoading}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={tCart('removeItem')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(item.id);
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
              <span>{tCart('totalItems')}</span>
              <span className="font-medium">{getTotalItems()}</span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span>{tCart('totalPrice')}</span>
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
                {tCart('clear')}
              </Button>
              <Button
                className="flex-1 bg-tsa-blue hover:bg-tsa-blue/80"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/app/shop/cart');
                  setOpen(false);
                }}
                disabled={isEmpty() || isLoading}
              >
                {tCart('checkout')}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default CartDrawer;
