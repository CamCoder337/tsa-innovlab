import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMissions } from '@/hooks/useMissions';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, QrCode, Loader2, MapPin, FileText, AlertTriangle, Activity, Download, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Mission = {
  id: string;
  status: string;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  pickupDate?: string | null;
  deliveryDate?: string | null;
  deliveredAt?: string | null;
  trackingNumber?: string | null;
  trackingLinkToken?: string | null;
  qrCodeToken?: string | null;
  lastUpdated?: string | null;
};

// Fonction utilitaire pour obtenir l'icône en fonction du type d'événement
const getEventIcon = (type: string) => {
  switch (type) {
    case 'status_update':
      return <RefreshCw className="h-4 w-4" />;
    case 'location_update':
      return <MapPin className="h-4 w-4" />;
    case 'document_uploaded':
      return <FileText className="h-4 w-4" />;
    case 'incident_reported':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <QrCode className="h-4 w-4" />;
  }
};

// Fonction pour obtenir le titre localisé de l'événement
const getLocalizedEventTitle = (event: { type: string; timestamp: string; message: string; details?: string }, tMissions: (key: string) => string) => {
  switch (event.type) {
    case 'status_update':
      return tMissions('events.status_updated');
    case 'location_update':
      return tMissions('events.location_updated');
    case 'document_uploaded':
      return tMissions('events.document_uploaded');
    case 'incident_reported':
      return tMissions('events.incident_reported');
    default:
      return event.type;
  }
};

export default function MissionTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { myMissions: missions, fetchMission } = useMissions();
  const [mission, setMission] = useState<Mission | null>(null);
  const [events] = useState<Array<{
    type: string;
    timestamp: string;
    message: string;
    details?: string;
  }>>([]);
  const [activeTab, setActiveTab] = useState('status');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  
  const { t } = useTranslation();
  const tCommon = (key: string) => t(`common.${key}`);
  const tMissions = (key: string) => t(`missions.${key}`);
  
  // Fonction pour rafraîchir les données de la mission
  const handleRefresh = async (): Promise<void> => {
    if (!id) return;
    try {
      const result = await fetchMission(id);
      setMission(result as unknown as Mission);
      console.log('Mission rafraîchie:', result);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      toast.error(tCommon('errors.refresh_failed'));
    }
  };

  // Charger les données de la mission et l'historique
  useEffect(() => {
    const loadMissionData = async () => {
      if (!id) return;
      
      // Charger la mission depuis la liste des missions
      const foundMission = missions.find((m: Mission) => m.id === id);
      if (foundMission) {
        setMission(foundMission as unknown as Mission);
      }
      
      // Essayer de rafraîchir les données
      await handleRefresh();
    };

    loadMissionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, missions]);
  
  // Fonction pour générer le QR code
  const generateQRCode = async () => {
    if (!mission?.id) return;
    
    try {
      setIsGeneratingQR(true);
      console.log('Génération du QR code pour la mission:', mission.id);
      
      // Ici, vous devriez appeler votre service pour générer le QR code
      // Par exemple: const qrCode = await missionService.generateQRCode(mission.id);
      // setQrCodeData(qrCode.data);
      
      // Simulation pour le débogage
      setTimeout(() => {
        console.log('QR code généré avec succès');
        setQrCodeData('data:image/png;base64,simulated_qr_code_data');
        setIsGeneratingQR(false);
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors de la génération du QR code:', error);
      toast.error(tMissions('qr_code_generation_failed'));
      setIsGeneratingQR(false);
    }
  };

  if (!mission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{tCommon('loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {tMissions('tracking.title')} - {mission.id}
          </h1>
          <p className="text-muted-foreground">
            {tMissions('status')}: <span className="capitalize">{mission.status}</span>
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {tCommon('refresh')}
        </Button>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="status">
            <Activity className="h-4 w-4 mr-2" />
            {tMissions('status')}
          </TabsTrigger>
          <TabsTrigger value="map">
            <MapPin className="h-4 w-4 mr-2" />
            {tMissions('map')}
          </TabsTrigger>
          <TabsTrigger value="qrcode">
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tMissions('mission_details')}</CardTitle>
              <CardDescription>
                {tMissions('mission_details_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">{tMissions('pickup')}</h3>
                    <p className="text-muted-foreground">
                      {mission.pickupAddress || tMissions('no_address_provided')}
                    </p>
                    {mission.pickupDate && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(mission.pickupDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">{tMissions('delivery')}</h3>
                    <p className="text-muted-foreground">
                      {mission.deliveryAddress || tMissions('no_address_provided')}
                    </p>
                    {mission.deliveryDate && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(mission.deliveryDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">{tMissions('tracking_information')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {tMissions('tracking_number')}:
                      </p>
                      <p className="font-mono">{mission.trackingNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {tMissions('last_updated')}:
                      </p>
                      <p>
                        {mission.lastUpdated 
                          ? new Date(mission.lastUpdated).toLocaleString() 
                          : tCommon('never')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{tMissions('activity_log')}</CardTitle>
              <CardDescription>
                {tMissions('activity_log_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getEventIcon(event.type)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {getLocalizedEventTitle(event, tMissions)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                        {event.details && (
                          <p className="text-sm mt-1">{event.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{tMissions('no_activity_yet')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tMissions('live_location')}</CardTitle>
              <CardDescription>
                {tMissions('live_location_description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <div className="h-full bg-muted/50 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">
                  {tMissions('map_placeholder')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="qrcode" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tMissions('delivery_qr_code')}</CardTitle>
              <CardDescription>
                {tMissions('delivery_qr_code_description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {qrCodeData ? (
                <>
                  <div className="p-4 border rounded-lg bg-white">
                    <img 
                      src={qrCodeData} 
                      alt="QR Code de livraison" 
                      className="w-64 h-64"
                    />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      {tCommon('download')}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={generateQRCode}
                      disabled={isGeneratingQR}
                      className="gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isGeneratingQR ? 'animate-spin' : ''}`} />
                      {isGeneratingQR ? tCommon('generating') : tCommon('regenerate')}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center max-w-md">
                    {tMissions('qr_code_instructions')}
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="mb-4">{tMissions('no_qr_code_generated')}</p>
                  <Button 
                    onClick={generateQRCode}
                    disabled={isGeneratingQR}
                    className="gap-2"
                  >
                    {isGeneratingQR ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {tCommon('generating')}...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4" />
                        {tMissions('generate_qr_code')}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{tMissions('delivery_confirmation')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {tMissions('delivery_confirmation_instructions')}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>{tMissions('verify_identity')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>{tMissions('scan_qr_code')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>{tMissions('confirm_delivery')}</span>
                  </div>
                </div>
                
                <Button className="w-full mt-4" size="lg">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {tMissions('confirm_delivery')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
