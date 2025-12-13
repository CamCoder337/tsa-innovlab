import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMissions } from '@/hooks/useMissions';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, QrCode, Loader2, MapPin, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Mission } from '@/types/mission.types';
import DeliveryQRCode from '@/components/tracking/DeliveryQRCode';
import SimpleMapFallback from '@/components/tracking/SimpleMapFallback';
import { missionService } from '@/services/mission.service';


export default function MissionTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { myMissions: missions, currentMission } = useMissions();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('status');

  const { t } = useTranslation();
  const tCommon = (key: string) => t(`common.${key}`);
  
  // Fonction pour charger les données de la mission
  const loadMission = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Charger depuis le serveur
      const response = await missionService.getAffreteurMission(id);
      
      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors du chargement de la mission');
      }
      
      if (response.data) {
        setMission(response.data);
      } else {
        // Fallback: chercher dans le store
        const foundMission = missions.find((m: any) => m.id === id) || currentMission;
        if (foundMission && foundMission.id === id) {
          setMission(foundMission as Mission);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la mission:', error);
      toast.error(tCommon('errors.load_failed'));
      
      // Fallback: chercher dans le store
      const foundMission = missions.find((m: any) => m.id === id) || currentMission;
      if (foundMission && foundMission.id === id) {
        setMission(foundMission as Mission);
      }
    } finally {
      setLoading(false);
    }
  };

  // Charger les données de la mission au montage et quand l'ID change
  useEffect(() => {
    loadMission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  
  // Mettre à jour la mission quand elle change dans le store
  useEffect(() => {
    if (id && (currentMission?.id === id || missions.some((m: any) => m.id === id))) {
      const foundMission = currentMission?.id === id ? currentMission : missions.find((m: any) => m.id === id);
      if (foundMission) {
        setMission(foundMission as Mission);
      }
    }
  }, [id, currentMission, missions]);

  if (loading || !mission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }
  
  // Helper pour formater l'adresse
  const formatAddress = (address: any): string => {
    if (!address) return 'Adresse non fournie';
    if (typeof address === 'string') return address;
    const parts = [
      address.street,
      address.city,
      address.postalCode,
      address.country
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : address.label || 'Adresse non fournie';
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {mission.title}
          </h1>
          <p className="text-muted-foreground">
            Statut: <span className="capitalize">{mission.status}</span>
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadMission}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
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
            Statut
          </TabsTrigger>
          <TabsTrigger value="map">
            <MapPin className="h-4 w-4 mr-2" />
            Carte
          </TabsTrigger>
          <TabsTrigger value="qrcode">
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Détails de la mission</CardTitle>
              <CardDescription>
                Informations sur les points de départ et d'arrivée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Départ</h3>
                    <p className="text-muted-foreground">
                      {formatAddress(mission.adresseDepart)}
                    </p>
                    {mission.dateDepartEstime && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(mission.dateDepartEstime).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Arrivée</h3>
                    <p className="text-muted-foreground">
                      {formatAddress(mission.adresseArrivee)}
                    </p>
                    {mission.dateArriveePrevue && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(mission.dateArriveePrevue).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Informations de suivi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Numéro de suivi:
                      </p>
                      <p className="font-mono">{mission.trackingPin || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Dernière mise à jour:
                      </p>
                      <p>
                        {mission.lastPositionUpdate 
                          ? new Date(mission.lastPositionUpdate).toLocaleString() 
                          : 'Jamais'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Journal d'activité</CardTitle>
              <CardDescription>
                Historique des événements de la mission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucune activité pour le moment</p>
                <p className="text-sm mt-2">
                  L'historique des activités sera bientôt disponible
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="map" className="space-y-4">
          {/* Debug info */}
          <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
            Debug: Départ={mission.adresseDepart ? 'OK' : 'MANQUANT'}, 
            Arrivée={mission.adresseArrivee ? 'OK' : 'MANQUANT'},
            Coords départ={mission.adresseDepart?.latitude ? `${mission.adresseDepart.latitude},${mission.adresseDepart.longitude}` : 'MANQUANT'},
            Coords arrivée={mission.adresseArrivee?.latitude ? `${mission.adresseArrivee.latitude},${mission.adresseArrivee.longitude}` : 'MANQUANT'}
          </div>
          
          {mission.adresseDepart && mission.adresseArrivee ? (
            <>
              {/* Use simple map fallback for now since Google Maps API might not be configured */}
              <SimpleMapFallback
                missionId={mission.id}
                departureLocation={
                  mission.adresseDepart
                    ? {
                        lat: Number(mission.adresseDepart.latitude),
                        lng: Number(mission.adresseDepart.longitude),
                      }
                    : undefined
                }
                arrivalLocation={
                  mission.adresseArrivee
                    ? {
                        lat: Number(mission.adresseArrivee.latitude),
                        lng: Number(mission.adresseArrivee.longitude),
                      }
                    : undefined
                }
                departureAddress={formatAddress(mission.adresseDepart)}
                arrivalAddress={formatAddress(mission.adresseArrivee)}
              />
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Suivi GPS</CardTitle>
                <CardDescription>
                  Informations de localisation de la mission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Données de localisation manquantes</p>
                    <p className="text-sm text-muted-foreground">
                      Les coordonnées de départ et d'arrivée sont nécessaires pour afficher la carte
                    </p>
                  </div>
                  
                  {/* Show available address info */}
                  {(mission.adresseDepart || mission.adresseArrivee) && (
                    <div className="space-y-3">
                      {mission.adresseDepart && (
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium text-green-700">Point de départ</h4>
                          <p className="text-sm text-muted-foreground">{formatAddress(mission.adresseDepart)}</p>
                        </div>
                      )}
                      {mission.adresseArrivee && (
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium text-red-700">Point d'arrivée</h4>
                          <p className="text-sm text-muted-foreground">{formatAddress(mission.adresseArrivee)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="qrcode" className="space-y-4">
          <DeliveryQRCode missionId={mission.id} missionTitle={mission.title} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
