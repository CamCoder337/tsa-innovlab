import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Truck,
  Shield,
  ArrowLeft,
  MapPin,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { Label } from '@/components/ui/label';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import AddressPicker from '@/components/maps/AddressPicker';
import PaymentForm from '@/components/forms/PaymentForm';
import Facture from '@/components/invoice/Facture';
import type { Payment } from '@/types/payment.types';
import { useOrders } from '@/hooks/useOrders';
import { PaymentMethod, type Order } from '@/types/order.types';
import { useAddresses } from '@/hooks/useAddresses';
import {
  useErrorsTranslation,
  useFormsTranslation,
  useShopTranslation,
} from '@/hooks/useTranslation';
import { ProductRecommendations } from '@/components/shop/ProductRecommendations';
import { cn } from '@/lib/utils';
import { useOrderStore } from '@/stores/orderStore';
import { toast } from 'sonner';

const OrderSchema = (tForms: (key: string) => string) =>
  Yup.object().shape({
    deliveryAddress: Yup.object({
      street: Yup.string().nullable(),
      city: Yup.string().required(tForms('validation.required')),
      postalCode: Yup.string().nullable(),
      country: Yup.string().required(tForms('validation.required')),
      label: Yup.string().required(tForms('validation.required')),
      region: Yup.string().required(tForms('validation.required')),
      latitude: Yup.number().required(tForms('validation.coordinatesRequired')),
      longitude: Yup.number().required(tForms('validation.coordinatesRequired')),
    }).required(tForms('validation.addressRequired')),
    deliveryNotes: Yup.string().max(200, tForms('validation.notesMaxLength')),
  });

export default function CartSummaryPage() {
  const { addresses, currentAddress, setCurrentAddress, convertAddress } = useAddresses();
  const { t: tErrors } = useErrorsTranslation();
  const { t: tForms } = useFormsTranslation();
  const { t: tShop } = useShopTranslation();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [useManualAddress, setUseManualAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH_ON_DELIVERY);

  const {
    cart,
    fetchCart,
    updateQuantity,
    removeFromCart,
    getTotalPrice,
    getTotalItems,
    isEmpty,
    isLoading,
    error,
    clearCart,
  } = useCart();

  const { createOrder } = useOrders();

  const formik = useFormik({
    initialValues: {
      deliveryAddress: {
        street: '',
        city: '',
        region: '',
        country: '',
        postalCode: '',
        label: '',
        latitude: null,
        longitude: null,
        id: null,
      },
      deliveryNotes: '',
    },
    validationSchema: OrderSchema(tForms),
    onSubmit: async (values) => {
      console.log('Order submission:', { ...values });
      setShowPayment(true);
    },
  });

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
  };

  const handleCreateOrder = async (payment: Payment): Promise<Order | null> => {
    try {
      // Map payment method from Payment to OrderPaymentMethod
      const getPaymentMethod = (method: string): string => {
        // If method is already a valid payment method string, return it directly
        if (
          method === 'orange_money' ||
          method === 'mtn_mobile_money' ||
          method === 'moov_money' ||
          method === 'wave' ||
          method === 'bank_transfer' ||
          method === 'cash_on_delivery'
        ) {
          return method;
        }

        // Legacy mapping for backward compatibility
        switch (method) {
          case 'mobile':
            return 'mtn_mobile_money';
          case 'card':
            return 'bank_transfer';
          case 'cash':
            return 'cash_on_delivery';
          default:
            return 'mtn_mobile_money';
        }
      };

      // Create shipping address first
      const shippingAddressData = {
        street: formik.values.deliveryAddress.street,
        city: formik.values.deliveryAddress.city,
        region: formik.values.deliveryAddress.region, // Using city as region for now
        country: formik.values.deliveryAddress.country || 'Cameroun', // Default country
        postalCode: formik.values.deliveryAddress.postalCode || '',
        latitude: formik.values.deliveryAddress.latitude || 0,
        longitude: formik.values.deliveryAddress.longitude || 0,
        label: formik.values.deliveryAddress.label, // Store Google Places ID separately
      };

      // For billing, use the same address data but with different ID and label
      const billingAddressData = {
        street: formik.values.deliveryAddress.street,
        city: formik.values.deliveryAddress.city,
        region: formik.values.deliveryAddress.region, // Using city as region for now
        country: formik.values.deliveryAddress.country || 'Cameroun', // Default country
        postalCode: formik.values.deliveryAddress.postalCode || '',
        latitude: formik.values.deliveryAddress.latitude || 0,
        longitude: formik.values.deliveryAddress.longitude || 0,
        label: formik.values.deliveryAddress.label,
      };

      const orderData = {
        shippingAddressId: formik.values.deliveryAddress.id, // Use the generated UUID
        billingAddressId: formik.values.deliveryAddress.id,
        shippingAddress: shippingAddressData, // Use the generated UUID
        billingAddress: billingAddressData, // Use the generated UUID
        paymentMethod: getPaymentMethod(payment.method),
        notes: formik.values.deliveryNotes || undefined,
      };
      const order = await createOrder(orderData);

      const { error } = useOrderStore.getState();

      if (error) {
        console.error(error);
        toast.error(error || tErrors('general.somethingWentWrong'));
        return null;
      }

      return order;
    } catch (error) {
      console.error('Failed to create order:', error);
      return null;
    }
  };

  const subtotal = getTotalPrice();
  const totalWeight = cart.items.reduce((sum, item) => {
    const weight = item.product?.specifications?.weight;
    const weightValue = weight ? parseFloat(String(weight)) : 0.5;
    return sum + (isNaN(weightValue) ? 0.5 : weightValue) * item.quantity;
  }, 0);
  const deliveryFee =
    deliveryOption === 'express' ? 5000 : deliveryOption === 'same-day' ? 10000 : 2000;
  const total = subtotal + deliveryFee;

  if (paymentSuccess && completedPayment && createdOrder) {
    return (
      <main className="mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-10">
        <Facture
          payment={completedPayment}
          order={createdOrder}
          deliveryAddress={currentAddress!}
          deliveryOption={deliveryOption}
          deliveryFee={deliveryFee}
          onDownload={() => {
            console.log('Download PDF');
            // Implement PDF download functionality
          }}
          onPrint={() => {
            window.print();
          }}
          onEmailSend={() => {
            console.log('Send email');
            // Implement email sending functionality
          }}
          onClose={() => {
            setPaymentSuccess(false);
            setCompletedPayment(null);
            setCreatedOrder(null);
            setOrderNumber('');
            // Clear cart after successful order
            clearCart();
            navigate('/app/shop/orders/' + createdOrder.id);
          }}
        />
      </main>
    );
  }

  const clearAddress = () => {
    formik.setFieldValue('deliveryAddress', {
      street: '',
      city: '',
      region: '',
      country: '',
      postalCode: '',
      label: '',
      latitude: null,
      longitude: null,
      id: null,
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 flex-1 flex-col p-3 sm:p-4 lg:p-6">
      <div className="w-full">
        <div className="container mx-auto px-2 sm:px-4">
          {/* Header */}
          <div className="mb-3">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <Link to="/shop">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent text-xs sm:text-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{tShop('cart.continueShopping')}</span>
                </Button>
              </Link>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {tShop('cart.title')}
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              {tShop('cart.reviewItems')}
            </p>
          </div>

          {error && (
            <div className="mb-3 sm:mb-4 p-3 bg-red-50 border dark:border-gray-800 border-red-200 rounded text-red-600 text-xs sm:text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {isEmpty() ? (
                <Card>
                  <CardContent className="p-8 sm:p-12 text-center">
                    <ShoppingCart className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {tShop('cart.empty.title')}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
                      {tShop('cart.empty.message')}
                    </p>
                    <Link to="/app/shop">
                      <Button
                        style={{ backgroundColor: 'var(--tsa-blue)' }}
                        className="w-full sm:w-auto"
                      >
                        {tShop('cart.empty.browseProducts')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {cart.items.map((item) => (
                    <Card key={item.productId} className="py-3">
                      <CardContent className="p-2 lg:p-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={item.product?.images[0] || item.product?.imageUrl || ''}
                            alt={item.product?.name || ''}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex flex-1 flex-col sm:min-w-0 text-left gap-1">
                            <h3 className="font-semibold text-base sm:text-lg mb-1">
                              {item.product?.name || ''}
                            </h3>
                            <div className="flex flex-wrap items-center justify-start gap-2 mb-3">
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {tShop('cart.item.reference')}: {item.product?.reference || ''}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {item.product?.unit || ''}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1 || isLoading}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleUpdateQuantity(
                                      item.id,
                                      Number.parseInt(e.target.value) || 1
                                    )
                                  }
                                  className="w-12 sm:w-16 text-center text-sm"
                                  min="1"
                                  max={item.product?.stock || 0}
                                  disabled={isLoading}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                  disabled={
                                    item.quantity >= (item.product?.stock || 0) || isLoading
                                  }
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="sm:hidden w-full flex justify-betwween">
                              <div className="flex flex-col gap-1 mb-2 w-full relative">
                                <p className="text-base sm:text-lg font-bold">
                                  {(parseFloat(item.priceAtAdd) * item.quantity).toLocaleString()}{' '}
                                  FCFA
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {parseFloat(item.priceAtAdd)} FCFA {tShop('cart.item.each')}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 w-auto"
                                disabled={isLoading}
                              >
                                <Trash2 className="h-4 w-4 mr-0" />
                              </Button>
                            </div>
                          </div>

                          <div className="hidden sm:flex text-right w-auto">
                            <div className="flex flex-col sm:items-end gap-1 mb-2">
                              <p className="text-base sm:text-lg font-bold">
                                {(parseFloat(item.priceAtAdd) * item.quantity).toLocaleString()}{' '}
                                FCFA
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {item.priceAtAdd.toLocaleString()} FCFA {tShop('cart.item.each')}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 w-auto"
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4 mr-0" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Adresse de livraison */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="text-base sm:text-lg">
                            {tShop('cart.delivery.title')}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUseManualAddress(!useManualAddress);
                            if (!useManualAddress) {
                              clearAddress();
                            }
                          }}
                          className="text-xs w-auto"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">
                            {useManualAddress
                              ? tShop('cart.delivery.useGoogleMaps')
                              : tShop('cart.delivery.manualEntry')}
                          </span>
                          <span className="sm:hidden">
                            {useManualAddress ? 'Google Maps' : 'Manuel'}
                          </span>
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      {!useManualAddress ? (
                        <>
                          <div>
                            <Label className="text-xs sm:text-sm">
                              {tShop('cart.delivery.searchAddress')} *
                            </Label>
                            <AddressPicker
                              selectedAddress={formik.values.deliveryAddress}
                              onAddressSelect={(addressDetails) => {
                                formik.setFieldTouched('deliveryAddress', true);
                                const convertedAddress = convertAddress(addressDetails);
                                formik.setFieldValue('deliveryAddress', convertedAddress);
                              }}
                              onClear={clearAddress}
                              placeholder={tShop('cart.delivery.addressPlaceholder')}
                              showMap={true}
                              className="mt-2"
                            />
                            {formik.touched.deliveryAddress && formik.errors.deliveryAddress && (
                              <p className="text-xs sm:text-sm text-red-600 mt-1">
                                {tForms('validation.addressRequired')}
                              </p>
                            )}
                          </div>
                          {formik.values.deliveryAddress && (
                            <div className="p-3 bg-green-50 border dark:border-gray-800 border-green-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {formik.values.deliveryAddress.label}
                                  </p>
                                  <p className="truncate">{formik.values.deliveryAddress.street}</p>
                                  <p className="truncate">
                                    {formik.values.deliveryAddress.postalCode}{' '}
                                    {formik.values.deliveryAddress.city}
                                  </p>
                                  {formik.values.deliveryAddress.region && (
                                    <p className="truncate">
                                      {formik.values.deliveryAddress.region}
                                    </p>
                                  )}
                                  <p className="truncate">
                                    {formik.values.deliveryAddress.country}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 truncate">
                                    {tForms('labels.coordinates')}:{' '}
                                    {Number(formik.values.deliveryAddress.latitude)?.toFixed(6)},{' '}
                                    {Number(formik.values.deliveryAddress.longitude)?.toFixed(6)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          <Label htmlFor="deliveryAddress" className="text-xs sm:text-sm">
                            {tShop('cart.delivery.address')} *
                          </Label>
                          <Select
                            value={formik.values.deliveryAddress.id || ''}
                            onValueChange={(value) => {
                              const selectedAddress = addresses.find((addr) => addr.id === value);
                              if (selectedAddress)
                                formik.setFieldValue('deliveryAddress', selectedAddress);
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                'pl-10',
                                'w-full',
                                formik.touched.deliveryAddress &&
                                  formik.errors.deliveryAddress &&
                                  'border-red-500'
                              )}
                            >
                              <SelectValue
                                placeholder={
                                  formik.values.deliveryAddress?.label ||
                                  tForms('placeholders.selectAddress')
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 text-primary"
                                  onClick={() => {
                                    setUseManualAddress(!useManualAddress);
                                    clearAddress();
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                  <span>{tForms('labels.newAddress')}</span>
                                </button>
                              </div>
                              {addresses.map((address) => (
                                <SelectItem key={address.id} value={address.id}>
                                  {address.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formik.touched.deliveryAddress && formik.errors.deliveryAddress && (
                            <p className="text-xs sm:text-sm text-red-600 mt-1">
                              {tForms('validation.addressRequired')}
                            </p>
                          )}
                        </div>
                      )}
                      <div>
                        <Label htmlFor="deliveryNotes" className="text-xs sm:text-sm">
                          {tShop('cart.delivery.instructions')}
                        </Label>
                        <Input
                          id="deliveryNotes"
                          name="deliveryNotes"
                          placeholder={tShop('cart.delivery.instructionsPlaceholder')}
                          value={formik.values.deliveryNotes}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className={`text-sm ${
                            formik.touched.deliveryNotes && formik.errors.deliveryNotes
                              ? 'border-red-500'
                              : ''
                          }`}
                        />
                        {formik.touched.deliveryNotes && formik.errors.deliveryNotes && (
                          <p className="text-xs sm:text-sm text-red-600 mt-1">
                            {formik.errors.deliveryNotes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{tShop('cart.orderSummary.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>{tShop('cart.orderSummary.subtotal', { count: getTotalItems() })}</span>
                    <span>{subtotal.toLocaleString()} FCFA</span>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {tShop('cart.orderSummary.deliveryOptions.label')}
                    </label>
                    <Select value={deliveryOption} onValueChange={setDeliveryOption}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">
                          {tShop('cart.orderSummary.deliveryOptions.standard')}
                        </SelectItem>
                        <SelectItem value="express">
                          {tShop('cart.orderSummary.deliveryOptions.express')}
                        </SelectItem>
                        <SelectItem value="same-day">
                          {tShop('cart.orderSummary.deliveryOptions.sameDay')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between">
                    <span>{tShop('cart.orderSummary.delivery')}</span>
                    <span>{deliveryFee.toLocaleString()} FCFA</span>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>{tShop('cart.orderSummary.totalWeight')}</span>
                    <span>{totalWeight.toFixed(1)} kg</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>{tShop('cart.orderSummary.total')}</span>
                    <span>{total.toLocaleString()} FCFA</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder={tShop('cart.orderSummary.promoCode')}
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                      />
                      <Button variant="outline">{tShop('cart.orderSummary.apply')}</Button>
                    </div>

                    <Button
                      className="w-full gap-2"
                      type="button"
                      style={{ backgroundColor: 'var(--tsa-blue)' }}
                      disabled={isEmpty() || isLoading || Object.keys(formik.errors).length > 0}
                      onClick={() => {
                        const validationErrors = formik.validateForm();
                        console.error(validationErrors);
                        if (Object.keys(validationErrors).length === 0) {
                          formik.handleSubmit();
                        } else {
                          formik.setFieldTouched('deliveryAddress', true);
                        }
                      }}
                    >
                      <CreditCard className="h-4 w-4" />
                      {tShop('cart.orderSummary.proceedToCheckout')}
                    </Button>
                    {formik.touched.deliveryAddress && formik.errors.deliveryAddress && (
                      <p className="text-xs text-amber-600 text-center mt-1">
                        {tShop('cart.delivery.selectAddressRequired')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {tShop('cart.deliveryInfo.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>{tShop('cart.deliveryInfo.qualityTested')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-tsa-blue dark:text-tsa-white" />
                    <span>{tShop('cart.deliveryInfo.freeReturns')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    <span>{tShop('cart.deliveryInfo.securePayment')}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Parts */}
              <ProductRecommendations type="cart" limit={3} view="compact" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogDescription className="hidden"> Finaliser le paiement </DialogDescription>
        <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader className="space-y-4 flex flex-1">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {tShop('payment.title')}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex flex-col flex-1">
            {/* Order Summary in Dialog */}
            <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-2 sm:p-4">
              <h3 className="font-semibold text-lg mb-3">{tShop('payment.orderSummary')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{tShop('payment.subtotal', { count: getTotalItems() })}</span>
                  <span>{subtotal.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>{tShop('payment.delivery', { option: deliveryOption })}</span>
                  <span>{deliveryFee.toLocaleString()} FCFA</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{total.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <PaymentForm
              amount={total}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              orderId={orderNumber}
              onSuccess={async (payment) => {
                console.log('Payment successful:', payment);

                // Create order after successful payment
                const order = await handleCreateOrder(payment);

                if (order) {
                  setCreatedOrder(order);
                  setOrderNumber(order.orderNumber);
                  setCurrentAddress(order.shippingAddress);
                  setCompletedPayment(payment);
                  setPaymentSuccess(true);
                  setShowPayment(false);
                } else {
                  console.error('Failed to create order');
                  // Handle order creation failure
                  setShowPayment(false);
                }
              }}
              onError={(error) => {
                console.error('Payment error:', error);
                setShowPayment(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
