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
import { toast } from 'sonner';
import MissionCard from '@/components/missions/MissionCard';
import { VehicleTypeLabels } from '@/types/vehicle.types';
import { useMissionsTranslation } from '@/hooks/useTranslation';
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
  const { t } = useMissionsTranslation();

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
      toast.error(t('messages.selectVehicleError'));
      return;
    }

    try {
      await applyMission(currentMission.id, selectedVehicleId);

      if (error) {
        console.error(error);
        toast.error(error || t('messages.applicationError'));
        return;
      }

      toast.success(t('messages.applicationSentSuccess'));
      setIsDialogOpen(false);
      setCurrentMission(null);
      setSelectedVehicleId('');
    } catch (error) {
      console.error('Error applying for mission:', error);
      toast.error(t('messages.applicationError'));
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('myMissions.transporteur.title')}
          </h1>
          <p className="text-gray-600">{t('myMissions.transporteur.subtitle')}</p>
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
                    {t('myMissions.transporteur.stats.availableMissions')}
                  </p>
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
                  <p className="text-sm text-gray-600">
                    {t('myMissions.transporteur.stats.inProgress')}
                  </p>
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
                  <p className="text-sm text-gray-600">
                    {t('myMissions.transporteur.stats.completed')}
                  </p>
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
                  <p className="text-sm text-gray-600">
                    {t('myMissions.transporteur.stats.potentialRevenue')}
                  </p>
                  <p className="text-2xl font-bold">0 FCFA</p>
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
                    placeholder={t('myMissions.transporteur.search.placeholder')}
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filterOrigin} onValueChange={setFilterOrigin}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={t('myMissions.transporteur.search.filterOrigin')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('myMissions.transporteur.search.allOrigins')}
                  </SelectItem>
                  {addresses.map((adresseDepart, index) => (
                    <SelectItem
                      key={`${adresseDepart.id || 'unknown'}-${index}`}
                      value={adresseDepart.id || 'unknown'}
                    >
                      {adresseDepart.label || t('myMissions.transporteur.search.unspecified')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={t('myMissions.transporteur.search.filterUrgency')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('myMissions.transporteur.search.allUrgencies')}
                  </SelectItem>
                  <SelectItem value="high">{t('myMissions.transporteur.search.urgent')}</SelectItem>
                  <SelectItem value="medium">
                    {t('myMissions.transporteur.search.priority')}
                  </SelectItem>
                  <SelectItem value="low">
                    {t('myMissions.transporteur.search.standard')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t('myMissions.transporteur.transportMissions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="available">
                  {t('myMissions.transporteur.tabs.available')}
                </TabsTrigger>
                <TabsTrigger value="assigned">
                  {t('myMissions.transporteur.tabs.assigned')}
                </TabsTrigger>
                <TabsTrigger value="completed">
                  {t('myMissions.transporteur.tabs.completed')}
                </TabsTrigger>
                <TabsTrigger value="all">{t('myMissions.transporteur.tabs.all')}</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <div className="space-y-4">
                  {filteredMissions.map((mission: Mission) => (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      onApply={handleApplyToMission}
                      showApplyButton={activeTab === 'available'}
                    />
                  ))}
                </div>

                {filteredMissions.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t('myMissions.transporteur.emptyStates.noMissions')}
                    </h3>
                    <p className="text-gray-600">
                      {t('myMissions.transporteur.emptyStates.noMatchingCriteria')}
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
                  {t('myMissions.transporteur.apply.dialogDescription')}
                </DialogDescription>
                <DialogHeader>
                  <DialogTitle>{t('myMissions.transporteur.apply.dialogTitle')}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {currentMission && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900">{currentMission.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{currentMission.description}</p>
                      {currentMission.requiredVehicleType && (
                        <p className="text-sm text-tsa-blue mt-2">
                          {t('myMissions.transporteur.apply.requiredVehicleType')}{' '}
                          {VehicleTypeLabels[currentMission.requiredVehicleType]}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('myMissions.transporteur.apply.selectVehicle')}
                    </label>
                    {vehiclesLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-gray-600">
                          {t('myMissions.transporteur.apply.loadingVehicles')}
                        </span>
                      </div>
                    ) : availableVehicles.length === 0 ? (
                      <div className="p-4 text-center text-gray-600 bg-yellow-50 rounded-lg">
                        <p>{t('myMissions.transporteur.apply.noVehiclesAvailable')}</p>
                        <p className="text-sm mt-1">
                          {t('myMissions.transporteur.apply.noVehiclesMessage')}
                        </p>
                      </div>
                    ) : (
                      <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('myMissions.transporteur.apply.chooseVehicle')}
                          />
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
                      {t('myMissions.transporteur.apply.cancel')}
                    </Button>
                    <Button
                      onClick={applyForMission}
                      disabled={!selectedVehicleId || availableVehicles.length === 0}
                    >
                      {t('myMissions.transporteur.apply.apply')}
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
