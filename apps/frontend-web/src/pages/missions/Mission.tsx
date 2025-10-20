import { useParams, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useMissions } from '@/hooks/useMissions';

export default function MissionDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { currentMission, isLoading, fetchMission } = useMissions();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');

  useEffect(() => {
    if (id) {
      fetchMission(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle mission not found in useEffect to avoid setState during render
  useEffect(() => {
    if (!isLoading && !currentMission && id) {
      toast.error('Mission introuvable', { duration: 5000 });
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
        toast.success(`Mission ${status} successfully`);
      }
    } catch (error) {
      console.error('Error updating mission status:', error);
      toast.error('Failed to update mission status');
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-8">Loading mission details...</div>;
  }

  if (!currentMission) {
    return <Navigate to="/app/missions" />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Mission: {currentMission.title}</h1>
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
        <TabsList>
          {currentMission.status !== 'draft' && (
            <>
              <TabsTrigger value="details">Details</TabsTrigger>
              {/* {user?.role !== 'transporteur' && <TabsTrigger value="offers">Offers</TabsTrigger>} */}
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="appreciation">Appreciation</TabsTrigger>
              {/* {currentMission.status === 'completed' && (
                <TabsTrigger value="appreciation">Appreciation</TabsTrigger>
              )} */}
              {(user?.role === 'affreteur' || user?.role === 'admin') && (
                <TabsTrigger value="financial">Financial</TabsTrigger>
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
