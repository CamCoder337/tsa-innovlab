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
  CreditCard,
  MapPin,
  Package,
  User,
} from 'lucide-react';
import type { Payment } from '@/types/payment.types';
import type { CartItem } from '@/types/cart.types';

interface FactureProps {
  payment: Payment;
  orderNumber: string;
  items: CartItem[];
  deliveryAddress: {
    address: string;
    city: string;
    postalCode: string;
    country?: string;
  };
  deliveryOption: string;
  deliveryFee: number;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  onDownload?: () => void;
  onPrint?: () => void;
  onEmailSend?: () => void;
  onClose?: () => void;
}

export const Facture: React.FC<FactureProps> = ({
  payment,
  orderNumber,
  items,
  deliveryAddress,
  deliveryOption,
  deliveryFee,
  customerInfo,
  onDownload,
  onPrint,
  onEmailSend,
  onClose,
}) => {
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0);
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

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'card':
        return 'Carte bancaire';
      case 'mobile':
        return 'Mobile Money';
      case 'cash':
        return 'Espèces à la livraison';
      default:
        return method;
    }
  };

  const getDeliveryOptionLabel = (option: string) => {
    switch (option) {
      case 'standard':
        return 'Standard (3-5 jours)';
      case 'express':
        return 'Express (1-2 jours)';
      case 'same-day':
        return 'Livraison le jour même';
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
            <h1 className="text-3xl font-bold text-gray-900">Paiement Confirmé</h1>
            <p className="text-gray-600">Merci pour votre commande !</p>
          </div>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          <Button variant="outline" onClick={onDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Button>
          <Button variant="outline" onClick={onPrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
          <Button variant="outline" onClick={onEmailSend} className="gap-2">
            <Mail className="h-4 w-4" />
            Envoyer par email
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <Card className="mb-6">
        <CardHeader className="bg-blue-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-blue-900">FACTURE</h2>
              <p className="text-blue-700">TSA Logistics</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Numéro de commande</p>
              <p className="text-xl font-bold text-blue-900">{orderNumber}</p>
              <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                {payment.status === 'completed' ? 'Payé' : 'En attente'}
              </Badge>
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
                <p>Société de transport et logistique</p>
                <p>Yaoundé, Cameroun</p>
                <p>Email: contact@tsa-logistics.com</p>
                <p>Tél: +237 6 XX XX XX XX</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Facturé à
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium">{customerInfo.name}</p>
                <p>{customerInfo.email}</p>
                {customerInfo.phone && <p>{customerInfo.phone}</p>}
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Détails de la commande
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Date:</span>{' '}
                  {formatDate(new Date(payment.createdAt))}
                </p>
                <p>
                  <span className="font-medium">ID Paiement:</span> {payment.id}
                </p>
                <p>
                  <span className="font-medium">Méthode:</span>{' '}
                  {getPaymentMethodLabel(payment.method)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adresse de livraison
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{deliveryAddress.address}</p>
                <p>
                  {deliveryAddress.city}, {deliveryAddress.postalCode}
                </p>
                <p>{deliveryAddress.country || 'Cameroun'}</p>
                <p className="font-medium text-blue-600">
                  {getDeliveryOptionLabel(deliveryOption)}
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Articles commandés</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Article</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700">Quantité</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">
                      Prix unitaire
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-4 px-2">
                        <div>
                          <p className="font-medium text-gray-900">{item.product?.name}</p>
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
                        {(parseFloat(item.unitPrice) * item.quantity).toLocaleString()} FCFA
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
                <span>Sous-total ({items.length} articles)</span>
                <span>{subtotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frais de livraison</span>
                <span>{deliveryFee.toLocaleString()} FCFA</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>{total.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Statut du paiement</span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Confirmé
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Informations de paiement</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Méthode:</span>{' '}
                {getPaymentMethodLabel(payment.method)}
              </p>
              <p>
                <span className="font-medium">Montant:</span> {payment.amount.toLocaleString()} FCFA
              </p>
              <p>
                <span className="font-medium">Date de paiement:</span>{' '}
                {formatDate(new Date(payment.createdAt))}
              </p>
              <p>
                <span className="font-medium">ID de transaction:</span> {payment.transactionId}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Merci pour votre confiance en TSA Logistics !</p>
            <p className="mt-2">
              Pour toute question concernant votre commande, contactez-nous à{' '}
              <a href="mailto:support@tsa-logistics.com" className="text-blue-600 hover:underline">
                support@tsa-logistics.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button onClick={onClose} variant="outline" className="px-8">
          Fermer
        </Button>
        <Button
          onClick={() => (window.location.href = '/app/shop')}
          className="px-8"
          style={{ backgroundColor: 'var(--tsa-blue)' }}
        >
          Continuer mes achats
        </Button>
      </div>
    </div>
  );
};

export default Facture;
