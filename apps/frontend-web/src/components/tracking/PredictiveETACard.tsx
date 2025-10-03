import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { PredictiveETA } from '@/types/tracking.types';
import { formatETA, getDelayRiskColor, getDelayMessage } from '@/services/predictiveETAService';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PredictiveETACardProps {
  predictiveETA: PredictiveETA;
  className?: string;
}

/**
 * Predictive ETA Card - Shows intelligent ETA prediction with risk assessment
 */
export function PredictiveETACard({ predictiveETA, className = '' }: PredictiveETACardProps) {
  const delayMessage = getDelayMessage(predictiveETA);
  const riskColor = getDelayRiskColor(predictiveETA.delayRisk.probability);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          ⏰ Estimation intelligente d'arrivée
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main ETA Display */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Arrivée prévue</p>
          <p className="text-3xl font-bold text-blue-600">
            {new Date(predictiveETA.currentETA).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="text-xs text-gray-500 mt-1">Confiance: {predictiveETA.confidence}%</p>
        </div>

        {/* Delay Risk Alert */}
        {predictiveETA.delayRisk.probability > 30 && (
          <div
            className={`p-3 rounded-lg border ${
              predictiveETA.delayRisk.probability >= 85
                ? 'bg-red-50 border-red-200'
                : predictiveETA.delayRisk.probability >= 70
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className={`h-5 w-5 mt-0.5 ${riskColor}`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${riskColor}`}>{delayMessage}</p>
                {predictiveETA.delayRisk.totalEstimatedDelay > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    Retard estimé: {predictiveETA.delayRisk.totalEstimatedDelay} minutes
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ETA Range */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Optimiste</span>
            <span>Pessimiste</span>
          </div>
          <div className="relative">
            <Progress value={50} className="h-2" />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-green-600">
                {formatETA(predictiveETA.optimisticETA)}
              </span>
              <span className="text-xs font-medium text-blue-600">
                {formatETA(predictiveETA.currentETA)}
              </span>
              <span className="text-xs text-red-600">
                {formatETA(predictiveETA.pessimisticETA)}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Delay Reasons */}
        {predictiveETA.delayRisk.primaryReasons.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Facteurs principaux:</h4>
            <div className="space-y-2">
              {predictiveETA.delayRisk.primaryReasons.map((reason, index) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <div className="flex-shrink-0 w-1 h-1 rounded-full bg-orange-500 mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-gray-700">{reason.reason}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-orange-600">+{reason.impact} min</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">{reason.probability}% probable</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Factors */}
        <div className="space-y-2 border-t pt-3">
          <h4 className="text-sm font-medium text-gray-700">Tous les facteurs:</h4>
          <div className="space-y-1.5">
            {predictiveETA.factors.map((factor, index) => {
              const Icon =
                factor.impact === 'positive'
                  ? TrendingDown
                  : factor.impact === 'negative'
                    ? TrendingUp
                    : Minus;

              const color =
                factor.impact === 'positive'
                  ? 'text-green-600'
                  : factor.impact === 'negative'
                    ? 'text-red-600'
                    : 'text-gray-600';

              return (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <Icon className={`h-3 w-3 ${color}`} />
                  <span className="flex-1 text-gray-700">{factor.description}</span>
                  <span className={`font-medium ${color}`}>
                    {factor.impact === 'positive' ? '-' : '+'}
                    {Math.abs(factor.impactMinutes)} min
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Base ETA Reference */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          ETA de base (sans conditions): {formatETA(predictiveETA.baseETA)}
        </div>
      </CardContent>
    </Card>
  );
}
