import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MissionTrackingMap from '../../components/tracking/MissionTrackingMap';
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  AlertTriangle,
  DollarSign,
  User,
  Calendar,
  Phone,
  Mail,
  Download,
  Share2,
  Maximize2,
} from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import { getStatusColor } from '@/lib/functions';
import { useState } from 'react';

const getPriorityColor = (budgetMax: number) => {
  if (budgetMax > 200000) return 'bg-red-100 text-red-800';
  if (budgetMax > 100000) return 'bg-orange-100 text-orange-800';
  if (budgetMax > 50000) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'bg-blue-100 text-blue-800';
    case 'assigned':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
      return 'bg-orange-100 text-orange-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'published':
      return 'Publiée';
    case 'assigned':
      return 'Assignée';
    case 'in_progress':
      return 'En cours';
    case 'completed':
      return 'Terminée';
    case 'cancelled':
      return 'Annulée';
    default:
      return status;
  }
};

export default function MissionTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { missions } = useMissions();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mission = missions.find((m) => m.id === id);

  if (!mission) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Mission non trouvée</h1>
            <p className="text-gray-600 mb-6">La mission avec l'ID "{id}" n'existe pas.</p>
            <Button onClick={() => navigate('/app/tracking-dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const timeline = [
    {
      status: 'published',
      label: 'Mission publiée',
      date: mission.createdAt,
      completed: true,
      description: 'Mission créée et publiée sur la plateforme',
    },
    {
      status: 'assigned',
      label: 'Transporteur assigné',
      date: mission.transporteurId ? new Date().toISOString() : null,
      completed: !!mission.transporteurId,
      description: mission.transporteurId
        ? 'Un transporteur a été assigné à cette mission'
        : "En attente d'assignation",
    },
    {
      status: 'assigned',
      label: 'Transport en cours',
      date: mission.status === 'assigned' ? new Date().toISOString() : null,
      completed: mission.status === 'assigned' || mission.status === 'completed',
      description: 'Le transport est en cours de réalisation',
    },
    {
      status: 'completed',
      label: 'Mission terminée',
      date: mission.status === 'completed' ? mission.dateArriveePrevue : null,
      completed: mission.status === 'completed',
      description: 'Mission terminée avec succès',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête avec breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/app/tracking-dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{mission.titre}</h1>
              <p className="text-gray-600">Suivi détaillé de la mission</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
              <Maximize2 className="w-4 h-4 mr-2" />
              Plein écran
            </Button>
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Statut</p>
                  <Badge className={getStatusBadgeColor(mission.status)}>
                    {getStatusLabel(mission.status)}
                  </Badge>
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(mission.status)}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Budget</p>
                  <p className="text-lg font-bold text-green-600">
                    {mission.budgetMin.toLocaleString()}-{mission.budgetMax.toLocaleString()} FCFA
                  </p>
                </div>
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Marchandise</p>
                  <p className="text-lg font-bold text-gray-900">{mission.poids} kg</p>
                  <p className="text-sm text-gray-600">{mission.typeMarchandise}</p>
                </div>
                <Package className="w-6 h-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Livraison prévue</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(mission.dateArriveePrevue).toLocaleDateString()}
                  </p>
                </div>
                <Calendar className="w-6 h-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tracking" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tracking">Suivi en temps réel</TabsTrigger>
            <TabsTrigger value="details">Détails mission</TabsTrigger>
            <TabsTrigger value="timeline">Chronologie</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="tracking" className="space-y-4">
            <Card className={isFullscreen ? 'fixed inset-0 z-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Suivi en Temps Réel
                  </div>
                  {isFullscreen && (
                    <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)}>
                      Fermer
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MissionTrackingMap
                  className={isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[500px]'}
                  missions={[mission]}
                  selectedMission={mission}
                  onMissionClick={() => {}}
                  showUserLocation={true}
                  showRoutes={true}
                  showLegend={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations de la mission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900">{mission.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Type de marchandise
                      </label>
                      <p className="text-gray-900">{mission.typeMarchandise}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Poids</label>
                      <p className="text-gray-900">{mission.poids} kg</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Date de départ estimée
                      </label>
                      <p className="text-gray-900">
                        {new Date(mission.dateDepartEstime).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Date d'arrivée prévue
                      </label>
                      <p className="text-gray-900">
                        {new Date(mission.dateArriveePrevue).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Priorité</label>
                    <Badge className={getPriorityColor(mission.budgetMax)}>
                      {mission.budgetMax > 200000 ? 'Urgent' : 'Normal'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {mission.transporteurId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Informations transporteur
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Transporteur #{mission.transporteurId}</p>
                        <p className="text-sm text-gray-600">Professionnel vérifié</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" size="sm">
                        <Phone className="w-4 h-4 mr-2" />
                        Appeler
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                    {mission.currentPosition && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Dernière position
                        </label>
                        <p className="text-gray-900">
                          {mission.lastPositionUpdate
                            ? `Mise à jour: ${new Date(mission.lastPositionUpdate).toLocaleString()}`
                            : 'Position en temps réel'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chronologie de la mission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {timeline.map((step, index) => (
                    <div key={step.status} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step.completed ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          {step.completed ? (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          ) : (
                            <div className="w-2 h-2 bg-gray-500 rounded-full" />
                          )}
                        </div>
                        {index < timeline.length - 1 && (
                          <div
                            className={`w-0.5 h-12 ${
                              step.completed ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between">
                          <h3
                            className={`font-medium ${
                              step.completed ? 'text-gray-900' : 'text-gray-500'
                            }`}
                          >
                            {step.label}
                          </h3>
                          {step.date && (
                            <span className="text-sm text-gray-500">
                              {new Date(step.date).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documents de la mission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Aucun document disponible pour cette mission</p>
                  <p className="text-sm">Les documents seront affichés ici une fois uploadés</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
