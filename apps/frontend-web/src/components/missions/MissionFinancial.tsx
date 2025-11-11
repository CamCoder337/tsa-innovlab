import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  AlertCircle,
  FileText,
  Download,
  Eye,
} from 'lucide-react';
import type { Mission } from '@/types/mission.types';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  useMissionsTranslation,
  useCommonTranslation,
  usePaymentTranslation,
} from '@/hooks/useTranslation';
import { generateInvoicePDF } from '@/lib/pdfUtils';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MissionInvoice } from './MissionInvoice';
import { PaymentMethod, PaymentStatus } from '@/types/order.types';
import { getStatusColor, getStatusIcon } from '@/lib/utils';

interface MissionFinancialProps {
  mission: Mission;
  onUpdate?: () => void;
}

interface FinancialData {
  totalCost: number;
  transporterPayment: number;
  platformFee: number;
  taxes: number;
  additionalCosts: number;
  paymentStatus: PaymentStatus;
  invoiceGenerated: boolean;
  paymentMethod: PaymentMethod;
  transactionId?: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: string;
  status: PaymentStatus;
  reference: string;
}

export const MissionFinancial: React.FC<MissionFinancialProps> = ({ mission, onUpdate }) => {
  const { user } = useAuth();
  const { t: tMissions } = useMissionsTranslation();
  const { t: tCommon } = useCommonTranslation();
  const { t: tPayment } = usePaymentTranslation();
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalCost: mission.budgetMin || 0,
    transporterPayment: 0,
    platformFee: 0,
    taxes: 0,
    additionalCosts: 0,
    paymentStatus: PaymentStatus.PENDING,
    invoiceGenerated: false,
    paymentMethod: PaymentMethod.ORANGE_MONEY,
  });

  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    loadFinancialData();
  }, [mission.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API calls to load financial data
      // const [financial, payments] = await Promise.all([
      //   missionService.getFinancialData(mission.id),
      //   missionService.getPaymentHistory(mission.id)
      // ]);

      // Mock data calculation
      const totalCost = mission.budgetMin || 0;
      const platformFeeRate = 0.05; // 5% platform fee
      const taxRate = 0.18; // 18% VAT

      const platformFee = totalCost * platformFeeRate;
      const transporterPayment = totalCost - platformFee;
      const taxes = totalCost * taxRate;

      setFinancialData({
        totalCost,
        transporterPayment,
        platformFee,
        taxes,
        additionalCosts: 0,
        paymentStatus:
          mission.status === 'completed' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
        invoiceGenerated: mission.status === 'completed',
        paymentMethod: PaymentMethod.ORANGE_MONEY,
      });

      // Mock payment history
      if (mission.status === 'completed') {
        setPaymentHistory([
          {
            id: '1',
            amount: totalCost,
            date: mission.dateArriveePrevue || new Date().toISOString(),
            method: 'Virement bancaire',
            status: PaymentStatus.COMPLETED,
            reference: `PAY-${mission.id}-001`,
          },
        ]);
      }
    } catch {
      toast.error(tMissions('financial.errors.loadingError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      // TODO: Implement invoice generation
      // await missionService.generateInvoice(mission.id);
      toast.success(tMissions('financial.success.invoiceGenerated'));
      setFinancialData((prev) => ({ ...prev, invoiceGenerated: true }));
      onUpdate?.();
    } catch {
      toast.error(tMissions('financial.errors.invoiceGenerationError'));
    }
  };

  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    try {
      await generateInvoicePDF(mission, financialData, tCommon, tMissions, tPayment);
      toast.success(tMissions('financial.success.downloadingInvoice'));
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error(tMissions('financial.errors.downloadError'));
    } finally {
      setIsDownloading(false);
    }
  };

  const canViewFinancials = () => {
    return user?.role === 'affreteur' || user?.role === 'admin';
  };

  if (!canViewFinancials()) {
    return (
      <Card>
        <CardContent className="text-center py-6 sm:py-8">
          <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
            {tMissions('financial.errors.accessDenied')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-6 sm:py-8">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 sm:mt-4 text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
            {tMissions('financial.loading')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                  {tMissions('financial.totalCost')}
                </p>
                <p className="text-lg sm:text-2xl font-bold truncate">
                  {financialData.totalCost.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">FCFA</p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-tsa-blue dark:text-tsa-white flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                  {tMissions('financial.transporterPayment')}
                </p>
                <p className="text-lg sm:text-2xl font-bold truncate">
                  {financialData.transporterPayment.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">FCFA</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                  {tMissions('financial.platformFee')}
                </p>
                <p className="text-lg sm:text-2xl font-bold truncate">
                  {financialData.platformFee.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">FCFA (5%)</p>
              </div>
              <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                  {tMissions('financial.taxes')}
                </p>
                <p className="text-lg sm:text-2xl font-bold truncate">
                  {financialData.taxes.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">FCFA (18%)</p>
              </div>
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status */}
      <Card className='gap-2'>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            {tMissions('financial.paymentStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              {getStatusIcon(financialData.paymentStatus)}
              <div className="flex-1 min-w-0">
                <Badge className={getStatusColor(financialData.paymentStatus)}>
                  {financialData.paymentStatus === 'completed' && tCommon('status.paid')}
                  {financialData.paymentStatus === 'pending' && tCommon('status.pending')}
                  {/* {financialData.paymentStatus === 'partial' && tCommon('status.partial')}
                  {financialData.paymentStatus === 'overdue' && tCommon('status.overdue')} */}
                </Badge>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
                  {tMissions('financial.paymentMethod')}:{' '}
                  {tPayment(`labels.${financialData.paymentMethod}`)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {!financialData.invoiceGenerated ? (
                <Button
                  onClick={handleGenerateInvoice}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span>{tMissions('financial.generateInvoice')}</span>
                </Button>
              ) : (
                <>
                  <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto text-xs sm:text-sm"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span>{tMissions('invoice.actions.view')}</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                      <DialogHeader>
                        <DialogTitle className='sr-only'>{tMissions('invoice.title')}</DialogTitle>
                      </DialogHeader>
                      <MissionInvoice
                        mission={mission}
                        financialData={financialData}
                        onDownload={handleDownloadInvoice}
                        onPrint={() => window.print()}
                        onEmailSend={() => toast.info(tMissions('invoice.actions.emailSent'))}
                        onClose={() => setShowInvoice(false)}
                        isDownloading={isDownloading}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    onClick={handleDownloadInvoice}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-current mr-1 sm:mr-2"></div>
                    ) : (
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    )}
                    <span>
                      {isDownloading
                        ? tCommon('messages.generating') || 'Génération...'
                        : tMissions('financial.downloadInvoice')
                      }
                    </span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {financialData.transactionId && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              {tMissions('financial.transactionId')}:{' '}
              <code className="bg-gray-100 dark:bg-gray-800 px-1 sm:px-2 py-1 rounded text-xs">
                {financialData.transactionId}
              </code>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className='gap-2'>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
            {tMissions('financial.paymentHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-2 sm:p-3 border dark:border-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    {getStatusIcon(payment.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">
                        {payment.amount.toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {new Date(payment.date).toLocaleDateString('fr-FR')} • {payment.method}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status === 'completed' && tCommon('status.completed')}
                      {payment.status === 'pending' && tCommon('status.pending')}
                      {payment.status === 'failed' && tCommon('status.failed')}
                    </Badge>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {tMissions('financial.reference')}: {payment.reference}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
              <Receipt className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-xs sm:text-sm">{tMissions('financial.noPayments')}</p>
              <p className="text-xs">{tMissions('financial.paymentsWillAppear')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card className='gap-2'>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            {tMissions('financial.costBreakdown')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                {tMissions('financial.baseCost')}
              </span>
              <span className="font-medium text-xs sm:text-sm">
                {(financialData.totalCost - financialData.taxes).toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                {tMissions('financial.platformFee')}
              </span>
              <span className="font-medium text-xs sm:text-sm">
                {financialData.platformFee.toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                {tMissions('financial.vatPercent')}
              </span>
              <span className="font-medium text-xs sm:text-sm">
                {financialData.taxes.toLocaleString()} FCFA
              </span>
            </div>
            {financialData.additionalCosts > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                  {tMissions('financial.additionalCosts')}
                </span>
                <span className="font-medium text-xs sm:text-sm">
                  {financialData.additionalCosts.toLocaleString()} FCFA
                </span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between items-center font-bold text-sm sm:text-lg">
              <span>{tCommon('total')}</span>
              <span>{financialData.totalCost.toLocaleString()} FCFA</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
