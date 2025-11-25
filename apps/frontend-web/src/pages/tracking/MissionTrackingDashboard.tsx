import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import DeliveryQRCode from '@/components/tracking/DeliveryQRCode';
import LiveGPSTracker from '@/components/tracking/LiveGPSTracker';
import MissionIssuesList from '@/components/tracking/MissionIssuesList';
import MissionPaymentActions from '@/components/tracking/MissionPaymentActions';

// TODO: Import du service missions pour récupérer les détails
// import { missionService } from '@/services/mission.service';

interface Mission {
  id: string;
  title: string;
  description: string;
  status: string;
  trackingLinkToken?: string;
  trackingPin?: string;
  budgetMin?: number;
  budgetMax?: number;
  adresseDepart?: {
    latitude: number;
    longitude: number;
    city: string;
  };
  adresseArrivee?: {
    latitude: number;
    longitude: number;
    city: string;
  };
  transporteur?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  published: 'Publiée',
  assigned: 'Assignée',
  ready_to_start: 'Prête à démarrer',
  in_progress: 'En cours',
  delivered: 'Livrée',
  paid: 'Payée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const statusColors: Record<string, string> = {
  draft: 'secondary',
  published: 'default',
  assigned: 'default',
  ready_to_start: 'default',
  in_progress: 'default',
  delivered: 'default',
  paid: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
};

export default function MissionTrackingDashboard() {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMissionDetails();
  }, [missionId]);

  const fetchMissionDetails = async () => {
    if (!missionId) return;

    setLoading(true);
    try {
      // TODO: Remplacer par l'appel API réel
      // const response = await missionService.getMissionById(missionId);
      // setMission(response.data);

      // Mock data pour démo
      const mockMission: Mission = {
        id: missionId,
        title: 'Livraison Douala - Yaoundé',
        description: 'Transport de marchandises diverses',
        status: 'in_progress',
        trackingLinkToken: 'abc123def456',
        trackingPin: '123456',
        budgetMin: 50000,
        budgetMax: 75000,
        adresseDepart: {
          latitude: 4.0511,
          longitude: 9.7679,
          city: 'Douala',
        },
        adresseArrivee: {
          latitude: 3.8480,
          longitude: 11.5021,
          city: 'Yaoundé',
        },
        transporteur: {
          firstName: 'Jean',
          lastName: 'Mbarga',
          phone: '+237 6 XX XX XX XX',
        },
      };
      setMission(mockMission);
    } catch (error: any) {
      toast.error('Erreur lors du chargement de la mission', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center space-y-4 p-4">
        <p className="text-lg text-muted-foreground">Mission introuvable</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold sm:text-3xl">{mission.title}</h1>
          </div>
          <p className="text-muted-foreground">{mission.description}</p>
        </div>
        <Badge variant={statusColors[mission.status] as any} className="text-sm">
          {statusLabels[mission.status]}
        </Badge>
      </div>

      {/* Informations mission */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Départ</p>
          <p className="font-medium">{mission.adresseDepart?.city}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Arrivée</p>
          <p className="font-medium">{mission.adresseArrivee?.city}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Transporteur</p>
          <p className="font-medium">
            {mission.transporteur
              ? `${mission.transporteur.firstName} ${mission.transporteur.lastName}`
              : 'Non assigné'}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Budget</p>
          <p className="font-medium">
            {mission.budgetMin && mission.budgetMax
              ? `${mission.budgetMin.toLocaleString()} - ${mission.budgetMax.toLocaleString()} FCFA`
              : 'Non spécifié'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tracking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="tracking">Suivi GPS</TabsTrigger>
          <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          <TabsTrigger value="issues">Problèmes</TabsTrigger>
          <TabsTrigger value="payment">Paiement</TabsTrigger>
        </TabsList>

        {/* Tab: Suivi GPS */}
        <TabsContent value="tracking" className="space-y-4">
          <LiveGPSTracker
            missionId={mission.id}
            departureLocation={
              mission.adresseDepart
                ? {
                    lat: mission.adresseDepart.latitude,
                    lng: mission.adresseDepart.longitude,
                  }
                : undefined
            }
            arrivalLocation={
              mission.adresseArrivee
                ? {
                    lat: mission.adresseArrivee.latitude,
                    lng: mission.adresseArrivee.longitude,
                  }
                : undefined
            }
            autoStart={mission.status === 'in_progress'}
          />
        </TabsContent>

        {/* Tab: QR Code */}
        <TabsContent value="qrcode" className="space-y-4">
          <DeliveryQRCode
            missionId={mission.id}
            missionTitle={mission.title}
            trackingToken={mission.trackingLinkToken}
            trackingPin={mission.trackingPin}
          />
        </TabsContent>

        {/* Tab: Problèmes */}
        <TabsContent value="issues" className="space-y-4">
          <MissionIssuesList missionId={mission.id} autoRefresh={true} />
        </TabsContent>

        {/* Tab: Paiement */}
        <TabsContent value="payment" className="space-y-4">
          <MissionPaymentActions
            missionId={mission.id}
            missionStatus={mission.status}
            budgetMin={mission.budgetMin}
            budgetMax={mission.budgetMax}
            onStatusChange={fetchMissionDetails}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
