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
  User,
  Building,
} from 'lucide-react';
import type { Mission } from '@/types/mission.types';
import {
  useMissionsTranslation,
  useCommonTranslation,
  usePaymentTranslation,
} from '@/hooks/useTranslation';
import { formatDate, getPaymentMethodLabel, getStatusColor, getStatusLabel } from '@/lib/utils';
import type { PaymentMethod, PaymentStatus } from '@/types/order.types';

interface MissionInvoiceProps {
  mission: Mission;
  financialData: {
    totalCost: number;
    transporterPayment: number;
    platformFee: number;
    taxes: number;
    additionalCosts: number;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    transactionId?: string;
  };
  onDownload?: () => void;
  onPrint?: () => void;
  onEmailSend?: () => void;
  onClose?: () => void;
  isDownloading?: boolean;
}

export const MissionInvoice: React.FC<MissionInvoiceProps> = ({
  mission,
  financialData,
  onDownload,
  onPrint,
  onEmailSend,
  onClose,
  isDownloading = false,
}) => {
  const { t: tCommon } = useCommonTranslation();
  const { t: tMissions } = useMissionsTranslation();
  const { t: tPayment } = usePaymentTranslation();

  return (
    <div className="max-w-4xl mx-auto p-3 bg-white">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {tMissions('financial.invoice.title')}
            </h1>
            <p className="text-gray-600">{tMissions('financial.invoice.subtitle')}</p>
          </div>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          <Button variant="outline" onClick={onDownload} className="gap-2" disabled={isDownloading}>
            {isDownloading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isDownloading ? tCommon('messages.downloading') : tCommon('actions.downloadPdf')}
          </Button>
          <Button variant="outline" onClick={onPrint} className="gap-2">
            <Printer className="h-4 w-4" />
            {tCommon('actions.print')}
          </Button>
          <Button variant="outline" onClick={onEmailSend} className="gap-2">
            <Mail className="h-4 w-4" />
            {tCommon('actions.sendByEmail')}
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <Card className="mb-3 py-3 gap-3">
        <CardHeader className="bg-blue-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-blue-900">
                {tMissions('financial.invoice.invoiceTitle')}
              </h2>
              <p className="text-blue-700">TSA Logistics</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {tMissions('financial.invoice.missionNumber')}
              </p>
              <p className="text-xl font-bold text-blue-900">#{mission.id}</p>
              <div className="mt-2">
                <Badge variant="secondary" className={`mt-2 ${getStatusColor(mission.status)}`}>
                  {getStatusLabel(mission.status, tCommon)}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-3">
          {/* Company & Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
                TSA Logistics
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Yaoundé, Cameroun</p>
                <p>Email: contact@tsa-logistics.com</p>
                <p>Tél: +237 6 XX XX XX XX</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                {tMissions('financial.invoice.billedTo')}
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium">
                  {mission.affreteur?.firstName + ' ' + mission.affreteur?.lastName || 'N/A'}
                </p>
                <p>{mission.affreteur?.email || 'N/A'}</p>
                <p>{mission.affreteur?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Mission Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {tMissions('financial.invoice.missionDetails')}
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                {financialData.transactionId && (
                  <p>
                    <span className="font-medium">
                      {tMissions('financial.invoice.transactionId')}:
                    </span>{' '}
                    {financialData.transactionId}
                  </p>
                )}
                <p>
                  <span className="font-medium">{tMissions('financial.invoice.createdDate')}:</span>{' '}
                  {formatDate(new Date(mission.createdAt))}
                </p>
                <p>
                  <span className="font-medium">{tMissions('mission')}:</span> {mission.title}
                </p>
                <p>
                  <span className="font-medium">
                    {tMissions('financial.invoice.paymentMethod')}:
                  </span>{' '}
                  {getPaymentMethodLabel(financialData.paymentMethod, tPayment)}
                </p>
                <p>
                  <span className="font-medium">
                    {tMissions('financial.invoice.paymentStatus')}:
                  </span>{' '}
                  <Badge
                    variant="secondary"
                    className={`mt-2 ${getStatusColor(financialData.paymentStatus)}`}
                  >
                    {getStatusLabel(financialData.paymentStatus, tCommon)}
                  </Badge>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {tMissions('financial.invoice.route')}
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex gap-1">
                  <p className="font-medium text-green-600">{tMissions('departure')}: </p>
                  <p> {mission.adresseDepart?.label || 'N/A'}</p>
                </div>
                <div className="mt-2 flex gap-1">
                  <p className="font-medium text-red-600">{tMissions('arrival')}: </p>
                  <p> {mission.adresseArrivee?.label || 'N/A'}</p>
                </div>
                <div className="mt-2">
                  <p className="font-medium text-blue-600">
                    {tMissions('financial.invoice.merchandise')}:{' '}
                    <span className="text-gray-600"> {mission.typeMarchandise}</span>
                  </p>
                  <p>
                    {mission.poids} kg • {mission.volume} m³
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Services Table */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-1">
              {tMissions('financial.invoice.servicesProvided')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-2 font-medium text-gray-700">
                      {tMissions('financial.invoice.service')}
                    </th>
                    <th className="text-center p-2 font-medium text-gray-700">
                      {tMissions('financial.invoice.quantity')}
                    </th>
                    <th className="text-right p-2 font-medium text-gray-700">
                      {tMissions('financial.invoice.unitPrice')}
                    </th>
                    <th className="text-right p-2 font-medium text-gray-700">{tCommon('total')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="p-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {tMissions('financial.invoice.transportService')}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {mission.typeMarchandise} - {mission.poids}kg - {mission.volume}m³
                        </p>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                        1
                      </span>
                    </td>
                    <td className="p-2 text-right font-medium">
                      {(financialData.totalCost - financialData.taxes).toLocaleString()} FCFA
                    </td>
                    <td className="p-2 text-right font-bold">
                      {(financialData.totalCost - financialData.taxes).toLocaleString()} FCFA
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Totals */}
          <div className="flex w-full">
            <div className="w-full space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>{tMissions('financial.invoice.subtotal')}</span>
                <span>{(financialData.totalCost - financialData.taxes).toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{tMissions('financial.platformFee')} (5%)</span>
                <span>{financialData.platformFee.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{tMissions('financial.vatPercent')} (18%)</span>
                <span>{financialData.taxes.toLocaleString()} FCFA</span>
              </div>
              {financialData.additionalCosts > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>{tMissions('financial.additionalCosts')}</span>
                  <span>{financialData.additionalCosts.toLocaleString()} FCFA</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>{tCommon('total')}</span>
                <span>{financialData.totalCost.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>{tMissions('financial.invoice.paymentStatus')}</span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {getStatusLabel(financialData.paymentStatus, tCommon)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          {/* {paymentRecord?.map((paymentRecord) => (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-900">
                  {tMissions('financial.invoice.paymentInformation')}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">{tMissions('financial.invoice.method')}:</span>{' '}
                  {paymentRecord.method}
                </p>
                <p>
                  <span className="font-medium">{tMissions('financial.invoice.amount')}:</span>{' '}
                  {paymentRecord.amount.toLocaleString()} FCFA
                </p>
                <p>
                  <span className="font-medium">{tMissions('financial.invoice.paymentDate')}:</span>{' '}
                  {formatDate(paymentRecord.date)}
                </p>
                <p>
                  <span className="font-medium">{tMissions('financial.invoice.reference')}:</span>{' '}
                  {paymentRecord.reference}
                </p>
                <p>
                  <span className="font-medium">{tMissions('financial.invoice.status')}:</span>{' '}
                  {getStatusLabel(paymentRecord.status, tCommon)}
                </p>
              </div>
            </div>
          ))} */}

          {/* Footer */}
          <div className="mt-2 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>{tMissions('financial.invoice.thankYou')}</p>
            <p className="mt-2">
              {tMissions('financial.invoice.contactSupport')}{' '}
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
          {tCommon('actions.close')}
        </Button>
        <Button
          onClick={() => (window.location.href = '/app/missions')}
          className="px-8"
          style={{ backgroundColor: 'var(--tsa-blue)' }}
        >
          {tMissions('financial.invoice.backToMissions')}
        </Button>
      </div>
    </div>
  );
};

export default MissionInvoice;
