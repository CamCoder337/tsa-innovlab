import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Download,
  Printer,
  Mail,
  Calendar,
  MapPin,
  Package,
  User,
} from 'lucide-react';
import type { Payment } from '@/types/payment.types';
import { type Order, OrderStatus, PaymentMethod, PaymentStatus } from '@/types/order.types';
import type { Address } from '@/types/address.types';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCommonTranslation, usePaymentTranslation } from '@/hooks/useTranslation';

interface FactureProps {
  payment: Payment;
  order: Order;
  deliveryAddress: Address;
  deliveryOption: string;
  deliveryFee: number;
  onDownload?: () => void;
  onPrint?: () => void;
  onEmailSend?: () => void;
  onClose?: () => void;
}

export const Facture: React.FC<FactureProps> = ({
  payment,
  order,
  deliveryAddress,
  deliveryOption,
  deliveryFee,
  onDownload,
  onPrint,
  onEmailSend,
  onClose,
}) => {
  const { user } = useAuth();
  const { t: tPayment } = usePaymentTranslation();
  const { t: tCommon } = useCommonTranslation();

  const subtotal = order.items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
  const total = subtotal + deliveryFee;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.BANK_TRANSFER:
        return tPayment('labels.bank_transfer');
      case PaymentMethod.MTN_MOMO:
        return tPayment('labels.mtn_mobile_money');
      case PaymentMethod.ORANGE_MONEY:
        return tPayment('labels.orange_money');
      case PaymentMethod.CASH_ON_DELIVERY:
        return tPayment('labels.cash_on_delivery');
      default:
        return method;
    }
  };

  const getDeliveryOptionLabel = (option: string) => {
    switch (option) {
      case 'standard':
        return tPayment('labels.standardDelivery', { defaultValue: 'Standard (3-5 jours)' });
      case 'express':
        return tPayment('labels.expressDelivery', { defaultValue: 'Express (1-2 jours)' });
      case 'same-day':
        return tPayment('labels.sameDayDelivery', { defaultValue: 'Livraison le jour même' });
      default:
        return option;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {tPayment('messages.paymentConfirmed')}
            </h1>
            <p className="text-gray-600">{tPayment('messages.thankYouOrder')}</p>
          </div>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          <Button variant="outline" onClick={onDownload} className="gap-2">
            <Download className="h-4 w-4" />
            {tPayment('buttons.downloadPdf')}
          </Button>
          <Button variant="outline" onClick={onPrint} className="gap-2">
            <Printer className="h-4 w-4" />
            {tPayment('buttons.print')}
          </Button>
          <Button variant="outline" onClick={onEmailSend} className="gap-2">
            <Mail className="h-4 w-4" />
            {tPayment('buttons.sendByEmail')}
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <Card className="mb-6">
        <CardHeader className="bg-blue-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-blue-900">{tPayment('labels.invoice')}</h2>
              <p className="text-blue-700">TSA Logistics</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{tPayment('labels.orderNumber')}</p>
              <p className="text-xl font-bold text-blue-900">{order?.orderNumber}</p>
              {order && (
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(order.status as OrderStatus)}`}
                  >
                    {getStatusLabel(order.status as OrderStatus, tCommon)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Company & Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                TSA Logistics
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  {tPayment('labels.companyDescription', {
                    defaultValue: 'Société de transport et logistique',
                  })}
                </p>
                <p>{tPayment('labels.companyLocation', { defaultValue: 'Yaoundé, Cameroun' })}</p>
                <p>Email: contact@tsa-logistics.com</p>
                <p>{tPayment('labels.phone', { defaultValue: 'Tél' })}: +237 6 XX XX XX XX</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                {tPayment('labels.billedTo')}
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium">{user?.firstName + ' ' + user?.lastName}</p>
                <p>{user?.email}</p>
                {user?.phone && <p>{user?.phone}</p>}
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {tPayment('labels.orderDetails')}
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">{tPayment('labels.date')}:</span>{' '}
                  {formatDate(new Date(order?.createdAt || payment.createdAt))}
                </p>
                <p>
                  <span className="font-medium">{tPayment('labels.orderId')}:</span>{' '}
                  {order?.id || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">{tPayment('labels.method')}:</span>{' '}
                  {getPaymentMethodLabel(order?.paymentMethod)}
                </p>

                <p>
                  <span className="font-medium">{tPayment('labels.paymentStatus')}:</span>{' '}
                  {getStatusLabel(order?.paymentStatus as PaymentStatus, tCommon)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {tPayment('labels.deliveryAddress')}
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{deliveryAddress.label}</p>
                <p>
                  {deliveryAddress.city}, {deliveryAddress.postalCode}
                </p>
                <p>
                  {deliveryAddress.country ||
                    tPayment('labels.defaultCountry', { defaultValue: 'Cameroun' })}
                </p>
                <p className="font-medium text-tsa-blue dark:text-tsa-white">
                  {getDeliveryOptionLabel(deliveryOption)}
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">{tPayment('labels.orderedItems')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">
                      {tPayment('labels.item')}
                    </th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700">
                      {tPayment('labels.quantity')}
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">
                      {tPayment('labels.unitPrice')}
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">
                      {tPayment('labels.total')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order?.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-4 px-2">
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          {item.product?.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {item.product?.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right font-medium">
                        {item.unitPrice.toLocaleString()} FCFA
                      </td>
                      <td className="py-4 px-2 text-right font-bold">
                        {item.totalPrice.toLocaleString()} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>
                  {tPayment('labels.subtotal')} ({order?.items.length} {tPayment('labels.items')})
                </span>
                <span>{subtotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{tPayment('labels.deliveryFee')}</span>
                <span>{deliveryFee.toLocaleString()} FCFA</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>{tPayment('labels.total')}</span>
                <span>{total.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>{tPayment('labels.paymentStatus')}</span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {tPayment('labels.confirmed')}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>{tPayment('messages.thankYouTrust')}</p>
            <p className="mt-2">
              {tPayment('messages.questionOrder')}{' '}
              <a
                href="mailto:support@tsa-logistics.com"
                className="text-tsa-blue dark:text-tsa-white hover:underline"
              >
                support@tsa-logistics.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button onClick={onClose} variant="outline" className="px-8">
          {tPayment('buttons.close')}
        </Button>
        <Button
          onClick={() => (window.location.href = '/app/shop')}
          className="px-8"
          style={{ backgroundColor: 'var(--tsa-blue)' }}
        >
          {tPayment('buttons.continueShopping')}
        </Button>
      </div>
    </div>
  );
};

export default Facture;
