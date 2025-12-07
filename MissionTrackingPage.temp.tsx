import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMissions } from '@/hooks/useMissions';
import { toast } from 'sonner';
import DeliveryQRCode from '@/components/tracking/DeliveryQRCode';
import { Button } from '@/components/ui/button';

export default function MissionTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { myMissions: missions, fetchMission } = useMissions();
  const [mission, setMission] = useState(() => missions.find(m => m.id === id));

  // Charger les données de la mission
  useEffect(() => {
    const loadMission = async () => {
      if (!id) return;
      
      try {
        // Vérifier si la mission est déjà dans la liste
        let missionData = missions.find(m => m.id === id);
        
        // Si la mission n'est pas dans la liste, essayer de la récupérer via l'API
        if (!missionData) {
          console.log('Mission non trouvée dans la liste, récupération via API...');
          const fetchedMission = await fetchMission(id);
          if (fetchedMission) {
            missionData = fetchedMission;
          } else {
            console.error('Mission non trouvée via API');
            return;
          }
        }
        
        // Mettre à jour l'état de la mission
        setMission(missionData);
        console.log('Mission chargée:', {
          id: missionData.id,
          status: missionData.status,
          hasTrackingToken: !!missionData.trackingLinkToken,
          hasPin: !!missionData.trackingPin
        });
        
      } catch (error) {
        console.error('Erreur lors du chargement de la mission:', error);
        toast.error('Erreur lors du chargement des détails de la mission');
      }
    };

    loadMission();
  }, [id, missions, fetchMission]);

  if (!mission) {
    return <div className="p-4">Chargement de la mission en cours...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Suivi de mission #{mission.id}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Détails de la mission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><span className="font-medium">Statut:</span> {mission.status}</p>
            {mission.trackingLinkToken && (
              <p><span className="font-medium">Token de suivi:</span> {mission.trackingLinkToken}</p>
            )}
            {mission.trackingPin && (
              <p><span className="font-medium">Code PIN:</span> {mission.trackingPin}</p>
            )}
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                Rafraîchir les données
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>QR Code de livraison</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <DeliveryQRCode 
              missionId={mission.id}
              missionTitle={`Mission ${mission.id}`}
              trackingToken={mission.trackingLinkToken || undefined}
              trackingPin={mission.trackingPin || undefined}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
