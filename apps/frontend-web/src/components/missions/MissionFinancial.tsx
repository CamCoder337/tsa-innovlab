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
  CheckCircle,
  Clock,
  FileText,
  Download,
} from 'lucide-react';
import type { Mission } from '@/types/mission.types';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { useMissionsTranslation, useCommonTranslation } from '@/hooks/useTranslation';

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
  paymentStatus: 'pending' | 'partial' | 'completed' | 'overdue';
  invoiceGenerated: boolean;
  paymentMethod: string;
  transactionId?: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
}

export const MissionFinancial: React.FC<MissionFinancialProps> = ({ mission, onUpdate }) => {
  const { user } = useAuth();
  const { t: tMissions } = useMissionsTranslation();
  const { t: tCommon } = useCommonTranslation();
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalCost: mission.budgetMax || 0,
    transporterPayment: 0,
    platformFee: 0,
    taxes: 0,
    additionalCosts: 0,
    paymentStatus: 'pending',
    invoiceGenerated: false,
    paymentMethod: 'bank_transfer',
  });

  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const totalCost = mission.budgetMax || 0;
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
        paymentStatus: mission.status === 'completed' ? 'completed' : 'pending',
        invoiceGenerated: mission.status === 'completed',
        paymentMethod: 'bank_transfer',
      });

      // Mock payment history
      if (mission.status === 'completed') {
        setPaymentHistory([
          {
            id: '1',
            amount: totalCost,
            date: mission.dateFinReelle || new Date().toISOString(),
            method: 'Virement bancaire',
            status: 'completed',
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
    try {
      // TODO: Implement invoice download
      // const blob = await missionService.downloadInvoice(mission.id);
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `facture-mission-${mission.id}.pdf`;
      // a.click();
      toast.success(tMissions('financial.success.downloadingInvoice'));
    } catch {
      toast.error(tMissions('financial.errors.downloadError'));
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const canViewFinancials = () => {
    return user?.role === 'affreteur' || user?.role === 'admin';
  };

  if (!canViewFinancials()) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">{tMissions('financial.errors.accessDenied')}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{tMissions('financial.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{tMissions('financial.totalCost')}</p>
                <p className="text-2xl font-bold">{financialData.totalCost.toLocaleString()}</p>
                <p className="text-xs text-gray-500">FCFA</p>
              </div>
              <DollarSign className="h-8 w-8 text-tsa-blue" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{tMissions('financial.transporterPayment')}</p>
                <p className="text-2xl font-bold">
                  {financialData.transporterPayment.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">FCFA</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{tMissions('financial.platformFee')}</p>
                <p className="text-2xl font-bold">{financialData.platformFee.toLocaleString()}</p>
                <p className="text-xs text-gray-500">FCFA (5%)</p>
              </div>
              <Receipt className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{tMissions('financial.taxes')}</p>
                <p className="text-2xl font-bold">{financialData.taxes.toLocaleString()}</p>
                <p className="text-xs text-gray-500">FCFA (18%)</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {tMissions('financial.paymentStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getPaymentStatusIcon(financialData.paymentStatus)}
              <div>
                <Badge className={getPaymentStatusColor(financialData.paymentStatus)}>
                  {financialData.paymentStatus === 'completed' &&
                    tMissions('financial.status.paid')}
                  {financialData.paymentStatus === 'pending' &&
                    tMissions('financial.status.pending')}
                  {financialData.paymentStatus === 'partial' &&
                    tMissions('financial.status.partial')}
                  {financialData.paymentStatus === 'overdue' &&
                    tMissions('financial.status.overdue')}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">
                  {tMissions('financial.method')}: {financialData.paymentMethod}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {!financialData.invoiceGenerated ? (
                <Button onClick={handleGenerateInvoice} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  {tMissions('financial.generateInvoice')}
                </Button>
              ) : (
                <Button onClick={handleDownloadInvoice} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  {tMissions('financial.downloadInvoice')}
                </Button>
              )}
            </div>
          </div>

          {financialData.transactionId && (
            <p className="text-sm text-gray-600">
              {tMissions('financial.transactionId')}:{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">{financialData.transactionId}</code>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {tMissions('financial.paymentHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory.length > 0 ? (
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getPaymentStatusIcon(payment.status)}
                    <div>
                      <p className="font-medium">{payment.amount.toLocaleString()} FCFA</p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.date).toLocaleDateString('fr-FR')} • {payment.method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getPaymentStatusColor(payment.status)}>
                      {payment.status === 'completed' && tMissions('financial.status.completed')}
                      {payment.status === 'pending' && tMissions('financial.status.pending')}
                      {payment.status === 'failed' && tMissions('financial.status.failed')}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {tMissions('financial.reference')}: {payment.reference}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{tMissions('financial.noPayments')}</p>
              <p className="text-sm">{tMissions('financial.paymentsWillAppear')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {tMissions('financial.costBreakdown')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{tMissions('financial.baseAmount')}</span>
              <span className="font-medium">
                {(financialData.totalCost - financialData.taxes).toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{tMissions('financial.platformFeePercent')}</span>
              <span className="font-medium">{financialData.platformFee.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{tMissions('financial.vatPercent')}</span>
              <span className="font-medium">{financialData.taxes.toLocaleString()} FCFA</span>
            </div>
            {financialData.additionalCosts > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{tMissions('financial.additionalCosts')}</span>
                <span className="font-medium">
                  {financialData.additionalCosts.toLocaleString()} FCFA
                </span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between items-center font-bold text-lg">
              <span>{tCommon('total')}</span>
              <span>{financialData.totalCost.toLocaleString()} FCFA</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
