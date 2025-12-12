import { useState, useEffect } from 'react';
import { Download, RefreshCw, QrCode, Share2, Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import missionTrackingService from '@/services/mission-tracking.service';

interface DeliveryQRCodeProps {
  missionId: string;
  missionTitle: string;
}

export default function DeliveryQRCode({ missionId, missionTitle }: DeliveryQRCodeProps) {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Auto-generate QR code when component mounts
  useEffect(() => {
    if (!qrCodeData && !loading) {
      generateQRCode();
    }
  }, [missionId]);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const response = await missionTrackingService.generateDeliveryQRCode(missionId);
      setQrCodeData(response.qrCode);
      toast.success('QR code généré avec succès');
    } catch (error: unknown) {
      toast.error('Erreur lors de la génération du QR code', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setLoading(false);
    }
  };

  const regenerateQRCode = async () => {
    setRegenerating(true);
    try {
      const response = await missionTrackingService.regenerateQRCode(missionId);
      setQrCodeData(response.qrCode);
      toast.success('QR code régénéré avec succès', {
        description: 'Ancien QR code invalidé',
      });
    } catch (error: unknown) {
      toast.error('Erreur lors de la régénération du QR code', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setRegenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeData) return;

    const link = document.createElement('a');
    link.href = qrCodeData;
    link.download = `qr-code-mission-${missionId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code téléchargé');
  };

  const shareQRCode = async () => {
    if (!qrCodeData) return;

    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeData);
      const blob = await response.blob();
      const file = new File([blob], `qr-code-mission-${missionId}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `QR Code - ${missionTitle}`,
          text: `QR Code de livraison pour la mission: ${missionTitle}`,
          files: [file],
        });
        toast.success('QR code partagé');
      } else {
        // Fallback: copy to clipboard
        await copyQRCodeToClipboard();
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      toast.error('Erreur lors du partage');
    }
  };

  const copyQRCodeToClipboard = async () => {
    if (!qrCodeData) return;

    try {
      const response = await fetch(qrCodeData);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);
      toast.success('QR code copié dans le presse-papiers');
    } catch (error) {
      console.error('Error copying QR code:', error);
      toast.error('Erreur lors de la copie');
    }
  };

  // Note: copyCredentials retiré - les credentials ne sont plus affichés pour l'affréteur

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code de Livraison
        </CardTitle>
        <CardDescription>
          Scannez ce QR code pour valider la livraison de la mission : {missionTitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alert avec instructions */}
        <Alert>
          <AlertDescription>
            <strong>Instructions :</strong> Le chauffeur doit scanner ce QR code pour confirmer la livraison.
          </AlertDescription>
        </Alert>

        {/* Note: Les credentials Token/PIN ne sont PAS affichés ici */}
        {/* Ils sont affichés uniquement dans l'interface TRANSPORTEUR via DriverCredentialsDisplay */}

        {/* QR Code */}
        <div className="flex flex-col items-center gap-4">
          {qrCodeData ? (
            <>
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 bg-white shadow-sm">
                <img 
                  src={qrCodeData} 
                  alt="QR Code de livraison" 
                  className="h-64 w-64 mx-auto" 
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={downloadQRCode} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
                <Button onClick={shareQRCode} variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Partager
                </Button>
                <Button onClick={copyQRCodeToClipboard} variant="outline" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Copier
                </Button>
                <Button onClick={regenerateQRCode} variant="outline" size="sm" disabled={regenerating}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                  Régénérer
                </Button>
              </div>

              {/* Avertissement régénération */}
              <Alert variant="destructive" className="text-sm">
                <AlertDescription>
                  <strong>Attention :</strong> Régénérer le QR code invalidera l'ancien. Utilisez
                  cette fonction uniquement en cas de perte ou de suspicion de fuite.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <Button onClick={generateQRCode} size="lg" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Générer le QR Code
                </>
              )}
            </Button>
          )}
        </div>

        {/* Instructions supplémentaires */}
        {qrCodeData && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium">Comment ça marche ?</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>Le transporteur transmet les credentials (Token + PIN) au chauffeur</li>
              <li>Le chauffeur se connecte à l'application mobile avec ses credentials</li>
              <li>Le chauffeur démarre la mission et envoie sa position GPS en temps réel</li>
              <li>
                Arrivé à destination, le chauffeur scanne ce QR code pour valider
                la livraison
              </li>
              <li>La mission passe automatiquement au statut "Livrée"</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
