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
    if (activeTab === 'actives') return ['assigned', 'in_progress'].includes(mission.status);
    if (activeTab === 'completed') return mission.status === 'completed';
    if (activeTab === 'draft') return mission.status === 'draft';
    return true;
  });

  return (
    <div className="flex flex-1 flex-col p-3 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 truncate">
            {tMissions('myMissions.affreteur.title')}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {tMissions('myMissions.affreteur.subtitle')}
          </p>
        </div>
        <Link to="/app/missions/create" className="w-full sm:w-auto">
          <Button className="gap-2 w-full sm:w-auto" style={{ backgroundColor: 'var(--tsa-blue)' }}>
            <Plus className="h-4 w-4" />
            <span>{tMissions('myMissions.affreteur.newMission')}</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-tsa-blue" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {tMissions('myMissions.affreteur.stats.totalMissions')}
                </p>
                <p className="text-lg sm:text-2xl font-bold">{myMissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {tCommon('status.in_progress')}
                </p>
                <p className="text-lg sm:text-2xl font-bold">
                  {
                    myMissions.filter((m) =>
                      ['published', 'assigned', 'in_progress'].includes(m.status)
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {tCommon('status.completed')}s
                </p>
                <p className="text-lg sm:text-2xl font-bold">
                  {myMissions.filter((m) => m.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {tMissions('myMissions.affreteur.stats.totalOffers')}
                </p>
                <p className="text-lg sm:text-2xl font-bold">{0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">
            {tMissions('myMissions.affreteur.history')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-4 sm:mb-6">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                {tMissions('myMissions.affreteur.tabs.all')}
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm">
                {tCommon('status.pending')}
              </TabsTrigger>
              <TabsTrigger value="actives" className="text-xs sm:text-sm">
                {tCommon('status.active')}s
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm">
                {tCommon('status.completed')}s
              </TabsTrigger>
              <TabsTrigger value="draft" className="text-xs sm:text-sm">
                {tCommon('status.draft')}s
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 sm:mt-6">
              <div className="space-y-3 sm:space-y-4">
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
                <div className="text-center py-8 sm:py-12">
                  <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    {tMissions('myMissions.affreteur.emptyStates.noMissions')}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
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
