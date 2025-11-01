import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
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
import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { Label } from '@/components/ui/label';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import AddressPicker from '@/components/maps/AddressPicker';
import { useAddressSelection } from '@/hooks/useAddressSelection';
import PaymentForm from '@/components/forms/PaymentForm';
import Facture from '@/components/invoice/Facture';
import type { Payment, PaymentMethodType } from '@/types/payment.types';
import { useOrders } from '@/hooks/useOrders';
import { type Order, PaymentMethod } from '@/types/order.types';
import { useAddresses } from '@/hooks/useAddresses';
import { useShopTranslation } from '@/hooks/useTranslation';
import { ProductRecommendations } from '@/components/shop/ProductRecommendations';

const OrderSchema = Yup.object().shape({
  deliveryAddress: Yup.string().required('validation.addressRequired'),
  deliveryCity: Yup.string().required('validation.cityRequired'),
  deliveryPostalCode: Yup.string(),
  deliveryNotes: Yup.string().max(200, 'validation.notesMaxLength'),
  // Google Maps coordinates
  latitude: Yup.number(),
  longitude: Yup.number(),
  placeId: Yup.string(),
});

export default function CartSummaryPage() {
  const { t: tShop } = useShopTranslation();
  const [promoCode, setPromoCode] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [useManualAddress, setUseManualAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');

  const {
    cart,
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
  const { createAddress } = useAddresses();

  const {
    selectedAddress,
    isAddressSelected,
    selectAddress,
    clearAddress,
    getFormattedAddress,
    getAddressComponents,
  } = useAddressSelection();

  const formik = useFormik({
    initialValues: {
      deliveryAddress: '',
      deliveryCity: '',
      deliveryPostalCode: '',
      deliveryNotes: '',
      latitude: 0,
      longitude: 0,
      placeId: '',
    },
    validationSchema: OrderSchema,
    onSubmit: async (values) => {
      console.log('Order submission:', {
        ...values,
        selectedAddress,
        coordinates: selectedAddress
          ? {
              lat: selectedAddress.latitude,
              lng: selectedAddress.longitude,
            }
          : null,
      });
      setShowPayment(true);
    },
  });

  // Update form when address is selected from Google Maps
  useEffect(() => {
    if (selectedAddress && !useManualAddress) {
      const components = getAddressComponents();
      formik.setValues({
        ...formik.values,
        deliveryAddress: getFormattedAddress(),
        deliveryCity: components.city,
        deliveryPostalCode: components.postal_code,
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
        placeId: selectedAddress.place_id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddress, useManualAddress]);

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
  };

  const handleCreateOrder = async (payment: Payment): Promise<Order | null> => {
    try {
      // Map payment method from Payment to OrderPaymentMethod
      const getPaymentMethod = (method: string): PaymentMethod => {
        switch (method) {
          case 'mobile':
            return PaymentMethod.MTN_MOMO; // Default to MTN for mobile
          case 'card':
            return PaymentMethod.BANK_TRANSFER;
          case 'cash':
            return PaymentMethod.CASH_ON_DELIVERY;
          default:
            return PaymentMethod.MTN_MOMO;
        }
      };

      // Generate UUIDs for addresses (since we don't have real API yet)
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c == 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      const shippingAddressId = generateUUID();
      const billingAddressId = generateUUID();

      // Create shipping address first
      const shippingAddressData = {
        id: shippingAddressId,
        street: formik.values.deliveryAddress,
        city: formik.values.deliveryCity,
        region: formik.values.deliveryCity, // Using city as region for now
        country: 'Cameroun', // Default country
        postalCode: formik.values.deliveryPostalCode || '',
        latitude: formik.values.latitude || 0,
        longitude: formik.values.longitude || 0,
        label: formik.values.deliveryAddress,
        placeId: formik.values.placeId, // Store Google Places ID separately
      };

      const shippingAddressCreated = await createAddress(shippingAddressData);
      if (!shippingAddressCreated) {
        throw new Error('Failed to create shipping address');
      }

      // For billing, use the same address data but with different ID and label
      const billingAddressData = {
        id: billingAddressId,
        street: formik.values.deliveryAddress,
        city: formik.values.deliveryCity,
        region: formik.values.deliveryCity,
        country: 'Cameroun',
        postalCode: formik.values.deliveryPostalCode || '',
        latitude: formik.values.latitude || 0,
        longitude: formik.values.longitude || 0,
        label: 'Billing Address',
        placeId: formik.values.placeId,
      };

      const billingAddressCreated = await createAddress(billingAddressData);
      if (!billingAddressCreated) {
        throw new Error('Failed to create billing address');
      }

      const orderData = {
        shippingAddressId: shippingAddressId, // Use the generated UUID
        billingAddressId: billingAddressId, // Use the generated UUID
        paymentMethod: getPaymentMethod(payment.method),
        notes: formik.values.deliveryNotes || undefined,
      };

      const order = await createOrder(orderData);
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
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Facture
          payment={completedPayment}
          order={createdOrder}
          orderNumber={createdOrder.orderNumber}
          items={cart.items}
          deliveryAddress={{
            address: selectedAddress?.formatted_address || formik.values.deliveryAddress,
            city: formik.values.deliveryCity,
            postalCode: formik.values.deliveryPostalCode,
            country: 'Cameroun',
          }}
          deliveryOption={deliveryOption}
          deliveryFee={deliveryFee}
          customerInfo={{
            name: 'Client TSA', // You can get this from auth context
            email: 'client@example.com', // You can get this from auth context
            phone: '+237 6XX XXX XXX', // You can get this from form or auth context
          }}
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
          }}
        />
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 flex-1 flex-col p-6">
      <div className="w-full">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/shop">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <ArrowLeft className="h-4 w-4" />
                  {tShop('cart.continueShopping')}
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{tShop('cart.title')}</h1>
            <p className="text-gray-600">{tShop('cart.reviewItems')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {isEmpty() ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {tShop('cart.empty.title')}
                    </h3>
                    <p className="text-gray-600 mb-4">{tShop('cart.empty.message')}</p>
                    <Link to="/app/shop">
                      <Button style={{ backgroundColor: 'var(--tsa-blue)' }}>
                        {tShop('cart.empty.browseProducts')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {cart.items.map((item) => (
                    <Card key={item.productId}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <img
                            src={item.product?.images[0] || item.product?.imageUrl || ''}
                            alt={item.product?.name || ''}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">
                              {item.product?.name || ''}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-green-100 text-green-800">
                                {tShop('cart.item.reference')}: {item.product?.reference || ''}
                              </Badge>
                              <Badge variant="outline">{item.product?.unit || ''}</Badge>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1 || isLoading}
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
                                  className="w-16 text-center"
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
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              {/* <p className="text-sm text-gray-500">{item.product.stock} available</p> */}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              <p className="text-lg font-bold">
                                {(parseFloat(item.priceAtAdd) * item.quantity).toLocaleString()}{' '}
                                FCFA
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.priceAtAdd.toLocaleString()} FCFA {tShop('cart.item.each')}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Adresse de livraison */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="h-5 w-5" />
                          {tShop('cart.delivery.title')}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUseManualAddress(!useManualAddress);
                            if (!useManualAddress) {
                              clearAddress();
                              formik.setValues({
                                ...formik.values,
                                deliveryAddress: '',
                                deliveryCity: '',
                                deliveryPostalCode: '',
                                latitude: 0,
                                longitude: 0,
                                placeId: '',
                              });
                            }
                          }}
                          className="text-xs"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          {useManualAddress
                            ? tShop('cart.delivery.useGoogleMaps')
                            : tShop('cart.delivery.manualEntry')}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!useManualAddress ? (
                        <>
                          <div>
                            <Label>{tShop('cart.delivery.searchAddress')} *</Label>
                            <AddressPicker
                              onAddressSelect={selectAddress}
                              onClear={clearAddress}
                              placeholder={tShop('cart.delivery.addressPlaceholder')}
                              value={getFormattedAddress()}
                              showMap={true}
                              className="mt-2"
                            />
                            {formik.touched.deliveryAddress &&
                              formik.errors.deliveryAddress &&
                              !isAddressSelected && (
                                <p className="text-sm text-red-600 mt-1">
                                  {formik.errors.deliveryAddress}
                                </p>
                              )}
                          </div>

                          {isAddressSelected && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-green-800">
                                    {tShop('cart.delivery.addressSelected')}
                                  </p>
                                  <p className="text-sm text-green-700">{selectedAddress?.label}</p>
                                  <p className="text-sm text-green-700">
                                    {selectedAddress?.formatted_address}
                                  </p>
                                  <div className="mt-1 text-xs text-green-600">
                                    {tShop('cart.delivery.coordinates')}:{' '}
                                    {selectedAddress?.latitude.toFixed(6)},{' '}
                                    {selectedAddress?.longitude.toFixed(6)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div>
                            <Label htmlFor="deliveryAddress">
                              {tShop('cart.delivery.address')} *
                            </Label>
                            <Textarea
                              id="deliveryAddress"
                              name="deliveryAddress"
                              placeholder={tShop('cart.delivery.fullAddress')}
                              value={formik.values.deliveryAddress}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              rows={3}
                              className={
                                formik.touched.deliveryAddress && formik.errors.deliveryAddress
                                  ? 'border-red-500'
                                  : ''
                              }
                            />
                            {formik.touched.deliveryAddress && formik.errors.deliveryAddress && (
                              <p className="text-sm text-red-600 mt-1">
                                {formik.errors.deliveryAddress}
                              </p>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="deliveryCity">{tShop('cart.delivery.city')} *</Label>
                              <Input
                                id="deliveryCity"
                                name="deliveryCity"
                                placeholder={tShop('cart.delivery.cityPlaceholder')}
                                value={formik.values.deliveryCity}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={
                                  formik.touched.deliveryCity && formik.errors.deliveryCity
                                    ? 'border-red-500'
                                    : ''
                                }
                              />
                              {formik.touched.deliveryCity && formik.errors.deliveryCity && (
                                <p className="text-sm text-red-600 mt-1">
                                  {formik.errors.deliveryCity}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="deliveryPostalCode">
                                {tShop('cart.delivery.postalCode')} *
                              </Label>
                              <Input
                                id="deliveryPostalCode"
                                name="deliveryPostalCode"
                                placeholder={tShop('cart.delivery.postalCodePlaceholder')}
                                value={formik.values.deliveryPostalCode}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={
                                  formik.touched.deliveryPostalCode &&
                                  formik.errors.deliveryPostalCode
                                    ? 'border-red-500'
                                    : ''
                                }
                              />
                              {formik.touched.deliveryPostalCode &&
                                formik.errors.deliveryPostalCode && (
                                  <p className="text-sm text-red-600 mt-1">
                                    {formik.errors.deliveryPostalCode}
                                  </p>
                                )}
                            </div>
                          </div>
                        </>
                      )}
                      <div>
                        <Label htmlFor="deliveryNotes">{tShop('cart.delivery.instructions')}</Label>
                        <Input
                          id="deliveryNotes"
                          name="deliveryNotes"
                          placeholder={tShop('cart.delivery.instructionsPlaceholder')}
                          value={formik.values.deliveryNotes}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className={
                            formik.touched.deliveryNotes && formik.errors.deliveryNotes
                              ? 'border-red-500'
                              : ''
                          }
                        />
                        {formik.touched.deliveryNotes && formik.errors.deliveryNotes && (
                          <p className="text-sm text-red-600 mt-1">{formik.errors.deliveryNotes}</p>
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

                  <div className="flex justify-between text-sm text-gray-600">
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
                      disabled={isEmpty() || isLoading || (!useManualAddress && !isAddressSelected)}
                      onClick={() => {
                        console.log('Test');
                        const validationErrors = formik.validateForm();
                        console.error(validationErrors);
                        if (Object.keys(validationErrors).length === 0) {
                          formik.handleSubmit();
                        } else {
                          formik.setTouched({
                            deliveryAddress: true,
                            deliveryCity: true,
                            deliveryPostalCode: true,
                          });
                        }
                      }}
                    >
                      <CreditCard className="h-4 w-4" />
                      {tShop('cart.orderSummary.proceedToCheckout')}
                    </Button>
                    {!useManualAddress && !isAddressSelected && (
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
                    <Truck className="h-4 w-4 text-tsa-blue" />
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {tShop('payment.title')}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Order Summary in Dialog */}
            <div className="bg-gray-50 rounded-lg p-4">
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
