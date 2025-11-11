import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Maximize2,
  MapPin,
  Package,
  Truck,
  Phone,
  Calendar,
  User,
  Mail,
  Minimize2,
  Navigation,
  Route,
  RefreshCw,
  X,
  Activity,
  CheckCircle,
  Info,
  AlertTriangle,
  Clock,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMissions } from '@/hooks/useMissions';
import { useCommonTranslation, useErrorsTranslation, useMissionsTranslation, useTrackingTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import MissionTrackingMap from '@/components/tracking/MissionTrackingMap';
import { useAuth } from '@/hooks/useAuth';
import { useVehicles } from '@/hooks/useVehicles';
import { missionService } from '@/services/mission.service';
import type { MissionUpdate } from '@/types/mission.types';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';

export default function MissionTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { myMissions: missions, fetchMission } = useMissions();
  const { getVehicleById } = useVehicles();
  const { t: tCommon } = useCommonTranslation();
  const { t: tTracking } = useTrackingTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vehicleRegistration, setVehicleRegistration] = useState<string>('');
  const [events, setEvents] = useState<MissionUpdate[]>([]);
  const { t: tMissions } = useMissionsTranslation();
  const { t: tErrors } = useErrorsTranslation();

  const mission = missions.find((m) => m.id === id);

  // Fetch user names and vehicle info
  useEffect(() => {
    const fetchInfo = async () => {
      if (user?.role === 'transporteur' && mission?.vehicleId) {
        const vehicle = await getVehicleById(mission.vehicleId);
        setVehicleRegistration(vehicle?.registration || '');
      }
    };

    fetchInfo();
  }, [mission?.vehicleId, user?.role, getVehicleById]);

  useEffect(() => {
    const fetchMissionHistory = async () => {
      try {
        if (!mission) return;

        // Fetch mission history from API
        const response =
          user?.role === 'transporteur'
            ? await missionService.getTransporteurMissionHistory(mission.id)
            : await missionService.getMissionHistory(mission.id);

        if (response.data) {
          console.log(response.data)
          setEvents(response.data.updates.data);
        }
      } catch {
        toast.error(tErrors('missions.timelineLoadingError'));
      }
    };

    if (mission) fetchMissionHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission]);

  const getEventIcon = (event: MissionUpdate) => {
    switch (event.type) {
      case 'status_change':
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />;
      case 'location_update':
        return <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />;
      case 'proof_upload':
        return <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />;
      case 'note':
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />;
      case 'issue':
        return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getLocalizedEventTitle = (event: MissionUpdate) => {
    if (event.type === 'status_change' && event.oldStatus && event.newStatus) {
      const oldStatusTranslated = tCommon(`status.${event.oldStatus}`, event.oldStatus);
      const newStatusTranslated = tCommon(`status.${event.newStatus}`, event.newStatus);

      return tMissions('timeline.statusChangeTitle', {
        oldStatus: oldStatusTranslated,
        newStatus: newStatusTranslated
      });
    }

    return event.title;
  };

  if (!mission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {tTracking('mission.notFound')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            {tTracking('mission.notFoundMessage', { id })}
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {tTracking('navigation.backToDashboard')}
          </Button>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    fetchMission(mission.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-3 sm:p-6 w-full">
      <div className="mx-auto space-y-4 sm:space-y-6">
        {/* En-tête avec informations mission */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                {tTracking('actions.back')}
              </Button>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${getStatusColor(mission.status)}`}>
                  {getStatusLabel(mission.status, tCommon)}
                </Badge>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {mission?.title || tTracking('mission.loading')}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>
                  {mission?.adresseDepart?.city} → {mission?.adresseArrivee?.city}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>
                  {mission?.dateDepartEstime
                    ? new Date(mission.dateDepartEstime).toLocaleDateString()
                    : tTracking('mission.noDate')}
                </span>
              </div>
              {vehicleRegistration && (
                <div className="flex items-center gap-2">
                  <Truck className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{vehicleRegistration}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
              {isFullscreen ? tTracking('actions.exitFullscreen') : tTracking('actions.fullscreen')}
            </Button>
            {/* <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              {tTracking('actions.export')}
            </Button> */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={false} // Add loading state here
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4`} />
              {tTracking('actions.refresh')}
            </Button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white p-3 sm:p-6' : ''}`}>
          {isFullscreen && (
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">{mission?.title}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="text-xs sm:text-sm"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          )}

          <Tabs defaultValue="tracking" className="space-y-4">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
              <TabsTrigger value="tracking" className="text-xs sm:text-sm">
                {tTracking('tabs.realTimeTracking')}
              </TabsTrigger>
              <TabsTrigger value="details" className="text-xs sm:text-sm">
                {tTracking('tabs.missionDetails')}
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs sm:text-sm">
                {tTracking('tabs.timeline')}
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs sm:text-sm">
                {tTracking('tabs.documents')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tracking" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Carte de suivi */}
                <div className="lg:col-span-3">
                  <Card className='gap-2'>
                    <CardHeader>
                      <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-base sm:text-lg">
                            {tTracking('tracking.liveTracking')}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Button variant="outline" size="sm" className="text-xs">
                            <Navigation className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            {tTracking('tracking.centerOnVehicle')}
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs">
                            <Route className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            {tTracking('tracking.showRoute')}
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MissionTrackingMap
                        className={`${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[400px] sm:h-[500px] lg:h-[600px]'}`}
                        missions={mission ? [mission] : []}
                        selectedMission={mission}
                        showUserLocation={true}
                        showRoutes={true}
                        showLegend={true}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Panneau d'informations */}
                <div className="space-y-4">
                  <Card className='gap-2'>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                        {tTracking('tracking.liveStatus')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            {tTracking('tracking.currentSpeed')}
                          </span>
                          <span className="font-medium text-xs sm:text-sm">65 km/h</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            {tTracking('tracking.estimatedArrival')}
                          </span>
                          <span className="font-medium text-xs sm:text-sm">14:30</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            {tTracking('tracking.remainingDistance')}
                          </span>
                          <span className="font-medium text-xs sm:text-sm">125 km</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            {tTracking('tracking.progress')}
                          </span>
                          <span className="font-medium text-green-600 text-xs sm:text-sm">68%</span>
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-tsa-blue h-2 rounded-full"
                          style={{ width: '68%' }}
                        ></div>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs sm:text-sm font-medium text-green-600">
                            {tTracking('tracking.vehicleOnline')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {tTracking('tracking.lastUpdate')}: {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='gap-2'>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                        {tTracking('alerts.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="p-2 sm:p-3 bg-green-50 border dark:border-gray-800 border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                            <span className="text-xs sm:text-sm text-green-800">
                              {tTracking('alerts.onSchedule')}
                            </span>
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 bg-blue-50 border dark:border-gray-800 border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Info className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                            <span className="text-xs sm:text-sm text-blue-800">
                              {tTracking('alerts.normalTraffic')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className='gap-2'>
                  <CardHeader>
                    <CardTitle>{tTracking('mission.information')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mission.description && <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {tTracking('mission.description')}
                      </label>
                      <p className="text-gray-900 dark:text-white">{mission.description}</p>
                    </div>}
                    <div className="grid grid-cols-2 gap-4">

                      {mission.typeMarchandise && <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {tTracking('mission.merchandiseType')}
                        </label>
                        <p className="text-gray-900 dark:text-white">{mission.typeMarchandise}</p>
                      </div>}
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {tTracking('realTime.weight')}
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {tTracking('mission.weight', { weight: mission.poids })}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {tTracking('mission.estimatedDeparture')}
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(mission.dateDepartEstime || '').toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {tTracking('mission.expectedArrival')}
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(mission.dateArriveePrevue || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {/* <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Priorité</label>
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
                          <User className="w-6 h-6 text-tsa-blue dark:text-tsa-white" />
                        </div>
                        <div>
                          <p className="font-medium">{tCommon('roles.transporteur') + ' ' + mission.transporteur?.firstName + ' ' + mission.transporteur?.lastName}</p>
                          <p className="font-base">#{mission.transporteurId}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {tTracking('transporter.verified')}
                          </p>
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
                  {events.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-6 sm:py-8 text-xs sm:text-sm">
                      {tMissions('timeline.noEvents')}
                    </p>
                  ) : (
                    <ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4">
                      <div className="space-y-4 sm:space-y-6">
                        {events.map((event) => (
                          <div
                            key={event.id}
                            className="relative pb-4 sm:pb-6 pl-6 sm:pl-8 border-l-2 border-gray-200 dark:border-gray-700"
                          >
                            <div className="absolute -left-2 sm:-left-2.5 mt-1 sm:mt-1.5 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-tsa-blue/90 flex items-center justify-center">
                              {getEventIcon(event)}
                            </div>
                            <div className="space-y-1 sm:space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                                <h4 className="text-xs sm:text-sm font-medium leading-tight">
                                  {getLocalizedEventTitle(event)}
                                </h4>
                                <time className="text-xs text-muted-foreground flex-shrink-0">
                                  {format(new Date(event.createdAt), 'PPPp', { locale: fr })}
                                </time>
                              </div>
                              {event.description && (
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                  {event.description}
                                </p>
                              )}
                              {event.transporteur && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {tCommon('by')} {event.transporteur.firstName + ' ' + event.transporteur.lastName}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{tTracking('documents.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
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
    </div>
  );
}
