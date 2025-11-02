import { useParams, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { MissionStatus, UpdateMissionDto } from '@/types/mission.types';
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
import {
  useCommonTranslation,
  useErrorsTranslation,
  useMissionsTranslation,
} from '@/hooks/useTranslation';

export default function MissionDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    currentMission,
    isLoading,
    error,
    fetchMission,
    applyMission,
    updateMission,
    updateMissionStatus,
  } = useMissions();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');
  const { t: tCommon } = useCommonTranslation();
  const { t: tErrors } = useErrorsTranslation();
  const { t: tMissions } = useMissionsTranslation();

  // Fetch mission data when component mounts or ID changes
  useEffect(() => {
    if (id && !currentMission) {
      fetchMission(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleApply = async (selectedVehicleId: string) => {
    if (!currentMission) {
      return;
    }

    if (!selectedVehicleId) {
      toast.error(tErrors('missions.selectVehicleError'));
      return;
    }

    try {
      await applyMission(currentMission.id, selectedVehicleId);

      if (error) {
        console.error(error);
        toast.error(error || tErrors('missions.applicationError'));
        return;
      }

      toast.success(tMissions('messages.applicationSentSuccess'));
    } catch (error) {
      console.error('Error applying for mission:', error);
      toast.error(tErrors('missions.applicationError'));
    }
  };

  const handleUpdate = async (status: MissionStatus, commentaire?: string) => {
    if (!currentMission || user?.role === 'transporteur') return;

    const updateData: UpdateMissionDto = { status };

    if (user?.role !== 'admin') updateData.commentaireAffreteur = commentaire;

    try {
      await updateMission(currentMission.id, updateData);

      if (error) {
        toast.error(tErrors('missions.statusUpdateFailed'));
        return;
      }

      toast.success(tMissions('messages.statusUpdatedSuccess', { status }));
    } catch (error) {
      console.error('Error updating mission status:', error);
      toast.error(tErrors('missions.statusUpdateFailed'));
    }
  };

  const handleStatusUpdate = async (status: MissionStatus) => {
    if (!currentMission || user?.role === 'affreteur') return;

    try {
      await updateMissionStatus(currentMission.id, { status });

      if (error) {
        toast.error(tErrors('missions.statusUpdateFailed'));
        return;
      }

      toast.success(tMissions('messages.statusUpdatedSuccess', { status }));
    } catch (error) {
      console.error('Error updating mission status:', error);
      toast.error(tErrors('missions.statusUpdateFailed'));
    }
  };

  if (isLoading && !error) {
    return (
      <div className="container mx-auto py-8 flex h-full justify-center items-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin h-12 w-12 text-tsa-blue" />
          <span>{tMissions('details.loadingMessage')}</span>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error && !currentMission) {
    return (
      <div className="container mx-auto py-8 flex h-full justify-center items-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">{tErrors('missions.errorLoading', { error })}</p>
          <Button onClick={() => id && fetchMission(id)} variant="outline">
            {tCommon('actions.retry')}
          </Button>
          <Button onClick={() => navigate('/app/missions')} variant="ghost">
            {tMissions('details.backToMissions')}
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
          {tMissions('details.title', { title: currentMission.title })}
        </h1>
        <div className="ml-auto">
          <MissionActions
            mission={currentMission}
            userRole={user?.role}
            onApply={handleApply}
            onUpdate={handleUpdate}
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
        <TabsList className={currentMission.status !== 'draft' ? `w-full grid ${user?.role === 'transporteur' ? 'grid-cols-3' : 'grid-cols-4'}` : ''}>
          {currentMission.status !== 'draft' && (
            <>
              <TabsTrigger value="details">{tMissions('details.tabs.details')}</TabsTrigger>
              {/* {user?.role !== 'transporteur' && <TabsTrigger value="offers">Offers</TabsTrigger>} */}
              <TabsTrigger value="timeline">{tMissions('details.tabs.timeline')}</TabsTrigger>
              <TabsTrigger value="appreciation">
                {tMissions('details.tabs.appreciation')}
              </TabsTrigger>
              {/* {currentMission.status === 'completed' && (
                <TabsTrigger value="appreciation">{tMissions('details.tabs.appreciation')}</TabsTrigger>
              )} */}
              {(user?.role === 'affreteur' || user?.role === 'admin') && (
                <TabsTrigger value="financial">{tMissions('details.tabs.financial')}</TabsTrigger>
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
