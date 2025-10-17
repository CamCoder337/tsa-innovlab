import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Mission } from '@/types/mission.types';
import type { Proposition } from '@/types/proposition.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PropositionForm } from '@/components/forms/PropositionForm';
import { Package, CheckCircle, Search, Filter, Truck, DollarSign } from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import { useAddresses } from '@/hooks/useAddresses';
import { missionService } from '@/services/mission.service';
import toast from 'react-hot-toast';
import { usePropositions } from '@/hooks/usePropositions';
import MissionCard from '@/components/missions/MissionCard';
// import { Calendar } from '@/components/ui/calendar';

interface FormValues {
  id: string;
  amount: number;
  delai: number;
  message: string;
}

export default function MissionsTransporteurPage() {
  const { missions, myMissions, currentMission, setCurrentMission, deleteMission } = useMissions();
  const { myPropositions, addProposition } = usePropositions();
  const { addresses } = useAddresses();
  const [activeTab, setActiveTab] = useState('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredMissions = (() => {
    if (activeTab === 'all') {
      return [...missions, ...myMissions, ...myPropositions];
    }

    if (activeTab === 'available') {
      return missions.filter((mission) => mission.status === 'published');
    }

    if (activeTab === 'pending')
      return myPropositions.filter((proposition) => proposition.status === 'pending');

    // For other tabs, filter myMissions by status
    return myMissions.filter((mission) => {
      if (activeTab === 'completed') return mission.status === 'completed';
      if (activeTab === 'assigned') return mission.status === 'assigned';
      return true;
    });
  })();

  const applyProposition = async (data: FormValues) => {
    const payload = {
      prixPropose: data.amount,
      delaiPropose: data.delai,
      commentaire: data.message,
    };

    try {
      const response = await missionService.applyForMission(data.id, payload);

      if (response.error) {
        console.log(response.error);
        toast.error(response.error.message || 'Erreur lors de la soumission ');
        return;
      }

      if (response.data) {
        addProposition(response.data);
        deleteMission(data.id);
        toast.success('Contre-proposition envoyée');
        setIsDialogOpen(false);
        setCurrentMission(null);
      }
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error('Failed to perform action');
    }
  };

  const handleApplyToMission = (mission: Mission) => {
    setCurrentMission(mission);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 p-6">
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Missions Disponibles</h1>
          <p className="text-gray-600">Trouvez et acceptez des missions de transport</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Missions Disponibles</p>
                  <p className="text-2xl font-bold">
                    {missions.filter((m) => m.status === 'published').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Truck className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">En Cours</p>
                  <p className="text-2xl font-bold">
                    {myMissions.filter((m) => m.status !== 'completed' || 'cancelled').length}
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
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenus Potentiels</p>
                  <p className="text-2xl font-bold">
                    {myMissions
                      .filter((m) => m.status === 'assigned')
                      .reduce((sum, m) => sum + (m.budgetMin ?? 0), 0)
                      .toLocaleString()}{' '}
                    FCFA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par titre, origine ou adresseArriveeId..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filterOrigin} onValueChange={setFilterOrigin}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrer par origine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les origines</SelectItem>
                  {addresses.map((adresseDepart) => (
                    <SelectItem
                      key={adresseDepart.id || 'unknown'}
                      value={adresseDepart.id || 'unknown'}
                    >
                      {adresseDepart.label || 'Non spécifiée'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrer par urgence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes urgences</SelectItem>
                  <SelectItem value="high">Urgent</SelectItem>
                  <SelectItem value="medium">Prioritaire</SelectItem>
                  <SelectItem value="low">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Missions de Transport
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="available">Disponibles</TabsTrigger>
                <TabsTrigger value="pending">En attente</TabsTrigger>
                <TabsTrigger value="assigned">En Cours</TabsTrigger>
                <TabsTrigger value="completed">Terminées</TabsTrigger>
                <TabsTrigger value="all">Toutes</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <div className="space-y-4">
                  {filteredMissions.map((item: Mission | Proposition) => {
                    // Type guard to check if the item is a Mission
                    const isMission = 'title' in item;
                    const mission = isMission ? (item as Mission) : (item as Proposition).mission;

                    // Only render MissionCard for actual missions, skip propositions for now
                    if (!mission) return null;

                    return (
                      <MissionCard
                        key={item.id}
                        mission={mission}
                        onApply={handleApplyToMission}
                        showApplyButton={isMission && activeTab === 'available'}
                        showPublishButton={false}
                        showTrackingButton={true}
                      />
                    );
                  })}
                </div>

                {filteredMissions.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune mission trouvée
                    </h3>
                    <p className="text-gray-600">
                      Aucune mission ne correspond aux critères de recherche actuels
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Action Dialog */}
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setCurrentMission(null);
                }
                setIsDialogOpen(open);
              }}
            >
              <DialogContent>
                <DialogDescription className="hidden">
                  Vous allez postuler à une mission
                </DialogDescription>
                <DialogHeader>
                  <DialogTitle>Postuler à la mission</DialogTitle>
                </DialogHeader>

                <PropositionForm
                  action={'offer'}
                  mission={currentMission as Mission}
                  onSubmit={applyProposition}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
