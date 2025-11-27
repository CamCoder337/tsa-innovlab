import { useState } from 'react';
import { Copy, Check, Key, Lock, QrCode, Info, Truck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface VehicleTrackingCredentialsProps {
  missionTitle: string;
  trackingToken?: string | null;
  trackingPin?: string | null;
  vehicleRegistration?: string | null; // Immatriculation du véhicule
  vehicleType?: string; // Type de véhicule (optionnel)
}

export default function VehicleTrackingCredentials({
  missionTitle,
  trackingToken,
  trackingPin,
  vehicleRegistration,
  vehicleType,
}: VehicleTrackingCredentialsProps) {
  const [copied, setCopied] = useState(false);

  const copyCredentials = () => {
    if (!trackingToken || !trackingPin) {
      toast.error('Credentials non disponibles');
      return;
    }

    const credentials = `Mission: ${missionTitle}\nToken: ${trackingToken}\nPIN: ${trackingPin}`;
    navigator.clipboard.writeText(credentials);

    setCopied(true);
    toast.success('Credentials copiés dans le presse-papier');

    setTimeout(() => setCopied(false), 2000);
  };

  const copyToken = () => {
    if (!trackingToken) return;
    navigator.clipboard.writeText(trackingToken);
    toast.success('Token copié');
  };

  const copyPin = () => {
    if (!trackingPin) return;
    navigator.clipboard.writeText(trackingPin);
    toast.success('PIN copié');
  };

  if (!trackingToken || !trackingPin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Credentials de Tracking Véhicule
          </CardTitle>
          <CardDescription>
            Identifiants pour le suivi GPS en temps réel - Mission : {missionTitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Les credentials de tracking seront générés automatiquement lorsqu'un véhicule sera assigné à cette mission.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Credentials de Tracking Véhicule
              </CardTitle>
              <CardDescription>
                Transmettez ces identifiants au conducteur du véhicule assigné
              </CardDescription>
            </div>
          </div>
          {vehicleRegistration && (
            <Badge variant="default" className="flex items-center gap-2 w-fit">
              <Truck className="h-4 w-4" />
              <span className="font-mono font-bold text-sm">{vehicleRegistration}</span>
              {vehicleType && <span className="text-xs opacity-80">({vehicleType})</span>}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alert avec instructions */}
        <Alert>
          <QrCode className="h-4 w-4" />
          <AlertDescription>
            <strong>Important :</strong> Ces identifiants permettent au conducteur de ce véhicule
            d'accéder à l'application mobile TSA Driver et de démarrer le tracking GPS en temps réel.
          </AlertDescription>
        </Alert>

        {/* Affichage du Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Token d'Accès
            </label>
            <Button variant="ghost" size="sm" onClick={copyToken}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
            <code className="font-mono text-sm break-all">{trackingToken}</code>
          </div>
        </div>

        {/* Affichage du PIN */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              Code PIN (6 chiffres)
            </label>
            <Button variant="ghost" size="sm" onClick={copyPin}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
            <code className="text-2xl font-bold tracking-wider">{trackingPin}</code>
          </div>
        </div>

        {/* Bouton Copier Tout */}
        <Button onClick={copyCredentials} className="w-full" size="lg">
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copié !
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copier Token + PIN
            </>
          )}
        </Button>

        {/* Instructions */}
        <div className="space-y-2 rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Instructions pour le conducteur du véhicule {vehicleRegistration}
          </p>
          <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>Télécharger l'application mobile <strong>TSA Driver</strong></li>
            <li>Entrer le <strong>Token</strong> et le <strong>PIN</strong> fournis ci-dessus</li>
            <li>Accepter les permissions de localisation GPS</li>
            <li>Cliquer sur <strong>"Démarrer la mission"</strong></li>
            <li>
              Le véhicule sera tracké automatiquement (position GPS toutes les 5 secondes ou 10 mètres)
            </li>
            <li>À l'arrivée à destination, scanner le QR code pour confirmer la livraison</li>
          </ol>
        </div>

        {/* Avertissement sécurité */}
        <Alert variant="destructive">
          <AlertDescription className="text-xs">
            <strong>⚠️ Sécurité :</strong> Ne partagez ces identifiants qu'avec le conducteur
            du véhicule <strong>{vehicleRegistration}</strong> assigné à cette mission.
            Ils donnent accès au tracking GPS et aux informations de livraison.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
