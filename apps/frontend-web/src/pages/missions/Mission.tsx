import { useParams, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { missionService } from '@/services/mission.service';
import type { MissionStatus } from '@/types/mission.types';
import { MissionDetails } from '@/components/missions/MissionDetails';
import { MissionActions } from '@/components/missions/MissionActions';
import { MissionTimeline } from '@/components/missions/MissionTimeline';
import { MissionAppreciation } from '@/components/missions/MissionAppreciation';
import { MissionFinancial } from '@/components/missions/MissionFinancial';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMissions } from '@/hooks/useMissions';
import { useMissionsTranslation } from '@/hooks/useTranslation';

export default function MissionDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { currentMission, isLoading, error, fetchMission } = useMissions();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');
  const { t } = useMissionsTranslation();

  // Fetch mission data when component mounts or ID changes
  useEffect(() => {
    if (id && !currentMission) {
      fetchMission(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusUpdate = async (status: MissionStatus, commentaire?: string) => {
    if (!currentMission) return;

    try {
      const response = await missionService.updateMissionStatus(currentMission.id, {
        status,
        commentaire,
      });
      if (response.data) {
        toast.success(t('messages.statusUpdatedSuccess', { status }));
      }
    } catch (error) {
      console.error('Error updating mission status:', error);
      toast.error(t('messages.statusUpdateFailed'));
    }
  };

  if (isLoading && !error) {
    return (
      <div className="container mx-auto py-8 flex h-full justify-center items-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin h-12 w-12 text-tsa-blue" />
          <span>{t('details.loadingMessage')}</span>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error && !currentMission) {
    return (
      <div className="container mx-auto py-8 flex h-full justify-center items-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">{t('details.errorLoading', { error })}</p>
          <Button onClick={() => id && fetchMission(id)} variant="outline">
            {t('details.tryAgain')}
          </Button>
          <Button onClick={() => navigate('/app/missions')} variant="ghost">
            {t('details.backToMissions')}
          </Button>
        </div>
      </div>
    );
  }

  // Handle mission not found
  if (!isLoading && !currentMission && !error) {
    return <Navigate to="/app/missions" replace />;
  }

  // Handle missing mission (shouldn't happen but for safety)
  if (!currentMission) {
    return <Navigate to="/app/missions" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">
          {t('details.title', { title: currentMission.title })}
        </h1>
        <div className="ml-auto">
          <MissionActions
            mission={currentMission}
            userRole={user?.role}
            onStatusUpdate={handleStatusUpdate}
            onRefresh={() => fetchMission(id!)}
          />
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className={currentMission.status !== 'draft' ? 'space-y-4' : ''}
      >
        <TabsList className={currentMission.status !== 'draft' ? 'w-full grid grid-cols-4' : ''}>
          {currentMission.status !== 'draft' && (
            <>
              <TabsTrigger value="details">{t('details.tabs.details')}</TabsTrigger>
              {/* {user?.role !== 'transporteur' && <TabsTrigger value="offers">Offers</TabsTrigger>} */}
              <TabsTrigger value="timeline">{t('details.tabs.timeline')}</TabsTrigger>
              <TabsTrigger value="appreciation">{t('details.tabs.appreciation')}</TabsTrigger>
              {/* {currentMission.status === 'completed' && (
                <TabsTrigger value="appreciation">{t('details.tabs.appreciation')}</TabsTrigger>
              )} */}
              {(user?.role === 'affreteur' || user?.role === 'admin') && (
                <TabsTrigger value="financial">{t('details.tabs.financial')}</TabsTrigger>
              )}
            </>
          )}
        </TabsList>

        <TabsContent value="details">
          <MissionDetails mission={currentMission} />
        </TabsContent>

        {/* <TabsContent value="offers">
          <MissionOffers mission={currentMission} userRole={user?.role} onRefresh={fetchMission} />
        </TabsContent> */}

        <TabsContent value="timeline">
          <MissionTimeline mission={currentMission} />
        </TabsContent>

        <TabsContent value="appreciation">
          <MissionAppreciation mission={currentMission} onUpdate={() => fetchMission(id!)} />
        </TabsContent>

        <TabsContent value="financial">
          <MissionFinancial mission={currentMission} onUpdate={() => fetchMission(id!)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
