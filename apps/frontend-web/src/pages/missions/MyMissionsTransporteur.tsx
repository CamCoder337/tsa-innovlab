import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Mission } from '@/types/mission.types';
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
import { Button } from '@/components/ui/button';
import { Package, CheckCircle, Search, Filter, Truck, DollarSign } from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import { useAddresses } from '@/hooks/useAddresses';
import { useVehicles } from '@/hooks/useVehicles';
import toast from 'react-hot-toast';
import MissionCard from '@/components/missions/MissionCard';
import { VehicleTypeLabels } from '@/types/vehicle.types';
// import { Calendar } from '@/components/ui/calendar';

export default function MissionsTransporteurPage() {
  const { missions, myMissions, currentMission, error, setCurrentMission, applyMission } =
    useMissions();
  const { addresses } = useAddresses();
  const { availableVehicles, isLoading: vehiclesLoading } = useVehicles();
  const [activeTab, setActiveTab] = useState('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const filteredMissions = (() => {
    if (activeTab === 'all') {
      return [...missions, ...myMissions];
    }

    if (activeTab === 'available') {
      return missions.filter((mission) => mission.status === 'published');
    }

    // For other tabs, filter myMissions by status
    return myMissions.filter((mission) => {
      if (activeTab === 'completed') return mission.status === 'completed';
      if (activeTab === 'assigned') return mission.status === 'assigned';
      return true;
    });
  })();

  const applyForMission = async () => {
    if (!currentMission || !selectedVehicleId) {
      toast.error('Veuillez sélectionner un véhicule');
      return;
    }

    try {
      await applyMission(currentMission.id, selectedVehicleId);

      if (error) {
        console.error(error);
        toast.error(error || 'Erreur lors de la candidature');
        return;
      }

      toast.success('Candidature envoyée avec succès');
      setIsDialogOpen(false);
      setCurrentMission(null);
      setSelectedVehicleId('');
    } catch (error) {
      console.error('Error applying for mission:', error);
      toast.error('Erreur lors de la candidature');
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="available">Disponibles</TabsTrigger>
                <TabsTrigger value="assigned">En Cours</TabsTrigger>
                <TabsTrigger value="completed">Terminées</TabsTrigger>
                <TabsTrigger value="all">Toutes</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <div className="space-y-4">
                  {filteredMissions.map((mission: Mission) => (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      onApply={handleApplyToMission}
                      showApplyButton={activeTab === 'available'}
                      showPublishButton={false}
                      showTrackingButton={true}
                    />
                  ))}
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

            {/* Vehicle Selection Dialog */}
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setCurrentMission(null);
                  setSelectedVehicleId('');
                }
                setIsDialogOpen(open);
              }}
            >
              <DialogContent>
                <DialogDescription className="hidden">
                  Sélectionnez un véhicule pour postuler à cette mission
                </DialogDescription>
                <DialogHeader>
                  <DialogTitle>Postuler à la mission</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {currentMission && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900">{currentMission.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{currentMission.description}</p>
                      {currentMission.requiredVehicleType && (
                        <p className="text-sm text-blue-600 mt-2">
                          Type de véhicule requis:{' '}
                          {VehicleTypeLabels[currentMission.requiredVehicleType]}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sélectionnez un véhicule disponible *
                    </label>
                    {vehiclesLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-gray-600">Chargement des véhicules...</span>
                      </div>
                    ) : availableVehicles.length === 0 ? (
                      <div className="p-4 text-center text-gray-600 bg-yellow-50 rounded-lg">
                        <p>Aucun véhicule disponible</p>
                        <p className="text-sm mt-1">
                          Vous devez avoir au moins un véhicule disponible pour postuler à une
                          mission.
                        </p>
                      </div>
                    ) : (
                      <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un véhicule" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              <div className="flex items-center gap-2">
                                <span>{vehicle.registration}</span>
                                <span className="text-sm text-gray-500">
                                  ({VehicleTypeLabels[vehicle.type]})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setSelectedVehicleId('');
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={applyForMission}
                      disabled={!selectedVehicleId || availableVehicles.length === 0}
                    >
                      Postuler
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
