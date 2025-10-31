import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Download,
  Maximize2,
  MapPin,
  Package,
  Truck,
  Phone,
  DollarSign,
  Calendar,
  User,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMissions } from '@/hooks/useMissions';
import { useCommonTranslation, useTrackingTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import MissionTrackingMap from '@/components/tracking/MissionTrackingMap';

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

const getStatusLabel = (status: string, tCommon: (key: string) => string) => {
  switch (status) {
    case 'published':
      return tCommon('status.published');
    case 'assigned':
      return tCommon('status.assigned');
    case 'in_progress':
      return tCommon('status.in_progress');
    case 'completed':
      return tCommon('status.completed');
    case 'cancelled':
      return tCommon('status.cancelled');
    default:
      return status;
  }
};

export default function MissionTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { myMissions: missions } = useMissions();
  const { t: tCommon } = useCommonTranslation();
  const { t: tTracking } = useTrackingTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mission = missions.find((m) => m.id === id);

  if (!mission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{tTracking('mission.notFound')}</h1>
          <p className="text-gray-600 mb-8">{tTracking('mission.notFoundMessage', { id })}</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {tTracking('navigation.backToDashboard')}
          </Button>
        </div>
      </div>
    );
  }

  const handleExportPDF = () => {
    toast.success(tTracking('actions.exportPdf'));
  };

  const timeline = [
    {
      status: 'published',
      label: tTracking('timeline.published.label'),
      date: mission.createdAt,
      completed: true,
      description: tTracking('timeline.published.description'),
    },
    {
      status: 'assigned',
      label: tTracking('timeline.assigned.label'),
      date: mission.transporteurId ? new Date().toISOString() : null,
      completed: !!mission.transporteurId,
      description: mission.transporteurId
        ? tTracking('timeline.assigned.description')
        : tTracking('timeline.assigned.pending'),
    },
    {
      status: 'assigned',
      label: tTracking('timeline.inProgress.label'),
      date: mission.status === 'assigned' ? new Date().toISOString() : null,
      completed: mission.status === 'assigned' || mission.status === 'completed',
      description: tTracking('timeline.inProgress.description'),
    },
    {
      status: 'completed',
      label: tTracking('timeline.completed.label'),
      date: mission.status === 'completed' ? mission.dateArriveePrevue : null,
      completed: mission.status === 'completed',
      description: tTracking('timeline.completed.description'),
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
              {tCommon('actions.back')}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{mission.title}</h1>
              <p className="text-gray-600">{tTracking('navigation.detailedTracking')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {tTracking('actions.share')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              {tTracking('actions.exportPdf')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
              <Maximize2 className="w-4 h-4 mr-2" />
              {tTracking('actions.fullscreen')}
            </Button>
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{tTracking('mission.status')}</p>
                  <Badge className={getStatusBadgeColor(mission.status)}>
                    {getStatusLabel(mission.status, tCommon)}
                  </Badge>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${getStatusBadgeColor(mission.status).includes('blue') ? 'bg-tsa-blue/90' : getStatusBadgeColor(mission.status).includes('yellow') ? 'bg-yellow-500' : getStatusBadgeColor(mission.status).includes('orange') ? 'bg-orange-500' : getStatusBadgeColor(mission.status).includes('green') ? 'bg-green-500' : 'bg-red-500'}`}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{tTracking('mission.price')}</p>
                  <p className="text-lg font-bold text-green-600">
                    {mission.budgetMin?.toLocaleString() || 0} FCFA
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
                  <p className="text-sm font-medium text-gray-600">
                    {tTracking('mission.merchandise')}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {tTracking('mission.weight', { weight: mission.poids })}
                  </p>
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
                  <p className="text-sm font-medium text-gray-600">
                    {tTracking('mission.deliveryScheduled')}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(mission.dateArriveePrevue || '').toLocaleDateString()}
                  </p>
                </div>
                <Calendar className="w-6 h-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tracking" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tracking">{tTracking('tabs.realTimeTracking')}</TabsTrigger>
            <TabsTrigger value="details">{tTracking('tabs.missionDetails')}</TabsTrigger>
            <TabsTrigger value="timeline">{tTracking('tabs.timeline')}</TabsTrigger>
            <TabsTrigger value="documents">{tTracking('tabs.documents')}</TabsTrigger>
          </TabsList>

          <TabsContent value="tracking" className="space-y-4">
            <Card className={isFullscreen ? 'fixed inset-0 z-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {tTracking('map.title')}
                  </div>
                  {isFullscreen && (
                    <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)}>
                      {tTracking('map.close')}
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
                  <CardTitle>{tTracking('mission.information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {tTracking('mission.description')}
                    </label>
                    <p className="text-gray-900">{mission.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        {tTracking('mission.merchandiseType')}
                      </label>
                      <p className="text-gray-900">{mission.typeMarchandise}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        {tTracking('mission.weight', { weight: '' })}
                      </label>
                      <p className="text-gray-900">
                        {tTracking('mission.weight', { weight: mission.poids })}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        {tTracking('mission.estimatedDeparture')}
                      </label>
                      <p className="text-gray-900">
                        {new Date(mission.dateDepartEstime || '').toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        {tTracking('mission.expectedArrival')}
                      </label>
                      <p className="text-gray-900">
                        {new Date(mission.dateArriveePrevue || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {/* <div>
                    <label className="text-sm font-medium text-gray-600">Priorité</label>
                    <Badge className={getPriorityColor(mission.budgetMax)}>
                      {mission.budgetMax > 200000 ? 'Urgent' : 'Normal'}
                    </Badge>
                  </div> */}
                </CardContent>
              </Card>

              {mission.transporteurId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      {tTracking('transporter.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-tsa-blue" />
                      </div>
                      <div>
                        <p className="font-medium">Transporteur #{mission.transporteurId}</p>
                        <p className="text-sm text-gray-600">{tTracking('transporter.verified')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" size="sm">
                        <Phone className="w-4 h-4 mr-2" />
                        {tTracking('transporter.call')}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="w-4 h-4 mr-2" />
                        {tTracking('transporter.message')}
                      </Button>
                    </div>
                    {mission.currentPosition && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          {tTracking('transporter.lastPosition')}
                        </label>
                        <p className="text-gray-900">
                          {mission.lastPositionUpdate
                            ? tTracking('transporter.positionUpdate', {
                                date: new Date(mission.lastPositionUpdate).toLocaleString(),
                              })
                            : tTracking('transporter.realTimePosition')}
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
                <CardTitle>{tTracking('timeline.title')}</CardTitle>
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
                <CardTitle>{tTracking('documents.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>{tTracking('documents.noDocuments')}</p>
                  <p className="text-sm">{tTracking('documents.documentsWillShow')}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
