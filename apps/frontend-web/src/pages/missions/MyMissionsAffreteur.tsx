import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, Plus, Package, MessageSquare } from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import { missionService } from '@/services/mission.service';
import { toast } from 'react-hot-toast';
import MissionCard from '@/components/missions/MissionCard';

export default function MyMissionsAffreteur() {
  const { myMissions, updateMission } = useMissions();
  const [activeTab, setActiveTab] = useState('all');

  const handlePublish = async (id: string) => {
    const response = await missionService.publishMission(id);
    console.log(response);

    if (response.error) {
      toast.error(response.error.message);
    }

    if (response.data) {
      updateMission(id, response.data);
      toast.success('Mission publiée avec succès');
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    }
  };

  const filteredMissions = myMissions.filter((mission) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'actives') return ['published', 'assigned'].includes(mission.status);
    if (activeTab === 'completed') return mission.status === 'completed';
    if (activeTab === 'draft') return mission.status === 'draft';
    return true;
  });

  return (
    <div className="flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Missions</h1>
          <p className="text-gray-600">Gérez et suivez vos missions de transport</p>
        </div>
        <Link to="/app/missions/create">
          <Button className="gap-2" style={{ backgroundColor: 'var(--tsa-blue)' }}>
            <Plus className="h-4 w-4" />
            Nouvelle Mission
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Missions</p>
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
                <p className="text-sm text-gray-600">En Cours</p>
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
                <p className="text-sm text-gray-600">Terminées</p>
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
                <p className="text-sm text-gray-600">Total Offres</p>
                <p className="text-2xl font-bold">{0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des Missions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="actives">Actives</TabsTrigger>
              <TabsTrigger value="completed">Terminées</TabsTrigger>
              <TabsTrigger value="draft">Brouillons</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-4">
                {filteredMissions.map((mission) => (
                  <MissionCard key={mission.id} mission={mission} onPublish={handlePublish} />
                ))}
              </div>

              {filteredMissions.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune mission trouvée</h3>
                  <p className="text-gray-600">
                    {activeTab === 'brouillons'
                      ? "Vous n'avez aucun brouillon de mission"
                      : activeTab === 'terminees'
                        ? 'Aucune mission terminée pour le moment'
                        : 'Aucune mission ne correspond au filtre actuel'}
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
