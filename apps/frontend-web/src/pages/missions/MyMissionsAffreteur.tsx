import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, Plus, Package, MessageSquare } from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import { toast } from 'sonner';
import MissionCard from '@/components/missions/MissionCard';
import { useMissionsTranslation, useCommonTranslation } from '@/hooks/useTranslation';
import { useMissionStore } from '@/stores/missionStore';

export default function MyMissionsAffreteur() {
  const { myMissions, publishMission, unpublishMission } = useMissions();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const { t: tMissions } = useMissionsTranslation();
  const { t: tCommon } = useCommonTranslation();

  const handlePublish = async (id: string) => {
    await publishMission(id);

    const { error } = useMissionStore.getState();

    if (error) {
      console.error(error);
      toast.error(error);
      return;
    }

    toast.success(tMissions('messages.publishedSuccess'));
    // setTimeout(() => {
    //   window.location.reload();
    // }, 2500);
  };

  const handleunpublish = async (id: string) => {
    await unpublishMission(id);

    const { error } = useMissionStore.getState();

    if (error) {
      console.error(error);
      toast.error(error);
      return;
    }

    toast.success(tMissions('messages.cancelledSuccess'));
  };

  const filteredMissions = myMissions.filter((mission) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return mission.status === 'published';
    if (activeTab === 'actives') return mission.status === 'assigned';
    if (activeTab === 'completed') return mission.status === 'completed';
    if (activeTab === 'draft') return mission.status === 'draft';
    return true;
  });

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {tMissions('myMissions.affreteur.title')}
          </h1>
          <p className="text-gray-600">{tMissions('myMissions.affreteur.subtitle')}</p>
        </div>
        <Link to="/app/missions/create">
          <Button className="gap-2" style={{ backgroundColor: 'var(--tsa-blue)' }}>
            <Plus className="h-4 w-4" />
            {tMissions('myMissions.affreteur.newMission')}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-tsa-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {tMissions('myMissions.affreteur.stats.totalMissions')}
                </p>
                <p className="text-2xl font-bold">{myMissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{tCommon('status.in_progress')}</p>
                <p className="text-2xl font-bold">
                  {myMissions.filter((m) => ['published', 'assigned'].includes(m.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{tCommon('status.completed')}s</p>
                <p className="text-2xl font-bold">
                  {myMissions.filter((m) => m.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {tMissions('myMissions.affreteur.stats.totalOffers')}
                </p>
                <p className="text-2xl font-bold">{0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tMissions('myMissions.affreteur.history')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">{tMissions('myMissions.affreteur.tabs.all')}</TabsTrigger>
              <TabsTrigger value="pending">{tCommon('status.pending')}</TabsTrigger>
              <TabsTrigger value="actives">{tCommon('status.active')}s</TabsTrigger>
              <TabsTrigger value="completed">{tCommon('status.completed')}s</TabsTrigger>
              <TabsTrigger value="draft">{tCommon('status.draft')}s</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-4">
                {filteredMissions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    onPublish={handlePublish}
                    onCancel={handleunpublish}
                  />
                ))}
              </div>

              {filteredMissions.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {tMissions('myMissions.affreteur.emptyStates.noMissions')}
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === 'draft'
                      ? tMissions('myMissions.affreteur.emptyStates.noDrafts')
                      : activeTab === 'completed'
                        ? tMissions('myMissions.affreteur.emptyStates.noCompleted')
                        : tMissions('myMissions.affreteur.emptyStates.noFiltered')}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
