import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Eye, EyeOff, Key, Smartphone, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleTrackingCredentialsProps {
  missionTitle: string;
  trackingPin?: string;
  vehicleRegistration?: string;
  vehicleType?: string;
  className?: string;
}

export default function VehicleTrackingCredentials({
  missionTitle,
  trackingPin,
  vehicleRegistration,
  vehicleType,
  className,
}: VehicleTrackingCredentialsProps) {
  const [showPin, setShowPin] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const handleCopyPin = async () => {
    if (!trackingPin) return;

    try {
      await navigator.clipboard.writeText(trackingPin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    } catch (error) {
      console.error('Failed to copy PIN:', error);
    }
  };

  // Affichage du PIN formaté (groupes de 3 caractères pour lisibilité)
  const displayPin = showPin
    ? trackingPin?.match(/.{1,3}/g)?.join(' ')
    : trackingPin?.replace(/./g, '•');

  return (
    <Card className={cn('border-2 border-blue-200 dark:border-blue-800', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Smartphone className="w-5 h-5 text-blue-600" />
          <span>Identifiants App Chauffeur</span>
          <Badge variant="outline" className="ml-auto bg-blue-50 text-blue-700 border-blue-200">
            GPS Tracking
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info véhicule */}
        {(vehicleRegistration || vehicleType) && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Truck className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {vehicleType || 'Véhicule'}
              </p>
              {vehicleRegistration && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{vehicleRegistration}</p>
              )}
            </div>
          </div>
        )}

        {/* Mission info */}
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p className="font-medium mb-1">Mission:</p>
          <p className="text-gray-900 dark:text-white">{missionTitle}</p>
        </div>

        {/* PIN de tracking */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            <Key className="w-4 h-4" />
            Code PIN (6-8 caractères alphanumériques)
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={displayPin || '••••••'}
                readOnly
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 font-mono text-center text-lg tracking-widest"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPin(!showPin)}
              disabled={!trackingPin}
              className="flex-shrink-0"
            >
              {showPin ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyPin}
              disabled={!trackingPin}
              className="flex-shrink-0"
            >
              {copiedPin ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-900 dark:text-blue-100 font-medium mb-2">
            📱 Instructions pour le chauffeur:
          </p>
          <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 pl-4 list-decimal">
            <li>Télécharger l'application mobile "TSA Driver"</li>
            <li>Saisir le <strong>Code PIN</strong> ci-dessus lors de la connexion</li>
            <li>Le suivi GPS sera activé automatiquement</li>
            <li>Scanner le QR code à l'arrivée pour valider la livraison</li>
          </ol>
        </div>

        {/* Status */}
        {trackingPin ? (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-700 dark:text-green-400 font-medium">
              Code PIN actif
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              En attente de génération du code PIN
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
