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
import { useVehicles } from '@/hooks/useVehicles';
import { toast } from 'sonner';
import MissionCard from '@/components/missions/MissionCard';
import { VehicleTypeLabels } from '@/types/vehicle.types';
import {
  useMissionsTranslation,
  useErrorsTranslation,
  useCommonTranslation,
} from '@/hooks/useTranslation';
import { useSearchParams } from 'react-router-dom';
import { useMissionStore } from '@/stores/missionStore';

export default function MissionsTransporteurPage() {
  const {
    missions,
    myMissions,
    currentMission,
    setCurrentMission,
    applyMission,
    updateMissionStatus,
  } = useMissions();
  const { availableVehicles, isLoading: vehiclesLoading } = useVehicles();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'available');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('all');
  const [filterDestination, setFilterDestination] = useState('all');
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const { t: tMissions } = useMissionsTranslation();
  const { t: tCommon } = useCommonTranslation();
  const { t: tErrors } = useErrorsTranslation();

  // Create unique lists of origin and destination cities from all missions
  const allMissions = [...missions, ...myMissions];

  const uniqueOrigin = Array.from(
    new Set(
      allMissions
        .map((mission) => mission.adresseDepart?.city)
        .filter((city) => city && city.trim() !== '')
    )
  ).sort();

  const uniqueDestination = Array.from(
    new Set(
      allMissions
        .map((mission) => mission.adresseArrivee?.city)
        .filter((city) => city && city.trim() !== '')
    )
  ).sort();

  const filteredMissions = (() => {
    let baseMissions: Mission[] = [];

    if (activeTab === 'all') {
      baseMissions = [...missions, ...myMissions];
    } else if (activeTab === 'available') {
      baseMissions = missions.filter((mission) => mission.status === 'published');
    } else {
      // For other tabs, filter myMissions by status
      baseMissions = myMissions.filter((mission) => {
        if (activeTab === 'completed') return mission.status === 'completed';
        if (activeTab === 'active') return ['assigned', 'in_progress'].includes(mission.status);
        return true;
      });
    }

    // Apply additional filters
    return baseMissions.filter((mission) => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          mission.title?.toLowerCase().includes(searchLower) ||
          mission.description?.toLowerCase().includes(searchLower) ||
          mission.typeMarchandise?.toLowerCase().includes(searchLower) ||
          mission.adresseDepart?.label?.toLowerCase().includes(searchLower) ||
          mission.adresseArrivee?.label?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Origin filter
      if (filterOrigin !== 'all') {
        if (mission.adresseDepart?.city !== filterOrigin) return false;
      }

      // Destination filter
      if (filterDestination !== 'all') {
        if (mission.adresseArrivee?.city !== filterDestination) return false;
      }

      return true;
    });
  })();

  const applyForMission = async () => {
    if (!currentMission) {
      setIsApplyDialogOpen(false);
      return;
    }

    if (!selectedVehicleId) {
      toast.error(tErrors('missions.selectVehicleError'));
      return;
    }

    try {
      await applyMission(currentMission.id, selectedVehicleId);

      const { error } = useMissionStore.getState();

      if (error) {
        console.error(error);
        toast.error(error || tErrors('missions.applicationError'));
        return;
      }

      toast.success(tMissions('messages.applicationSentSuccess'));
      setIsApplyDialogOpen(false);
      setCurrentMission(null);
      setSelectedVehicleId('');
    } catch (error) {
      console.error('Error applying for mission:', error);
      toast.error(tErrors('missions.applicationError'));
    }
  };

  const startMission = async () => {
    if (!currentMission) {
      setIsStartDialogOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      await updateMissionStatus(currentMission.id, { status: 'in_progress' });

      const { error } = useMissionStore.getState();

      if (error) {
        toast.error(tErrors('missions.statusUpdateFailed'));
        return;
      }

      toast.success(tMissions('messages.statusUpdatedSuccess'));
      setIsStartDialogOpen(false);
      setCurrentMission(null);
    } catch (error) {
      console.error('Error updating mission status:', error);
      toast.error(tErrors('missions.statusUpdateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-gray-50 dark:bg-gray-950 p-3 sm:p-4 lg:p-6">
      <div className="flex-1 p-3 sm:p-4 lg:p-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {tMissions('myMissions.transporteur.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            {tMissions('myMissions.transporteur.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-tsa-blue dark:text-tsa-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                    {tMissions('myMissions.transporteur.stats.availableMissions')}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {missions.filter((m) => m.status === 'published').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                    {tMissions('myMissions.transporteur.stats.activeMissions')}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {
                      myMissions.filter((m) => ['assigned', 'in_progress'].includes(m.status))
                        .length
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
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                    {tMissions('myMissions.transporteur.stats.completedMissions')}
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
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                    {tMissions('myMissions.transporteur.stats.potentialRevenue')}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold">0 FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={tMissions('myMissions.transporteur.search.placeholder')}
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filterOrigin} onValueChange={setFilterOrigin}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue
                    placeholder={tMissions('myMissions.transporteur.search.filterOrigin')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {tMissions('myMissions.transporteur.search.allOrigins')}
                  </SelectItem>
                  {uniqueOrigin.map((city) => (
                    <SelectItem key={city} value={city!}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDestination} onValueChange={setFilterDestination}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue
                    placeholder={tMissions('myMissions.transporteur.search.filterDestination')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {tMissions('myMissions.transporteur.search.allDestinations')}
                  </SelectItem>
                  {uniqueDestination.map((city) => (
                    <SelectItem key={city} value={city!}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              {tMissions('myMissions.transporteur.transportMissions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 sm:mb-6">
                <TabsTrigger value="available" className="text-xs sm:text-sm">
                  {tCommon('status.available')}
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs sm:text-sm">
                  {tCommon('status.active')}
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs sm:text-sm">
                  {tCommon('status.completed')}
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  {tMissions('myMissions.transporteur.tabs.all')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4 sm:mt-6">
                <div className="space-y-3 sm:space-y-4">
                  {filteredMissions.map((mission: Mission) => (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      onApply={() => {
                        setCurrentMission(mission);
                        setIsApplyDialogOpen(true);
                      }}
                      onStart={() => {
                        setCurrentMission(mission);
                        setIsStartDialogOpen(true);
                      }}
                    />
                  ))}
                </div>

                {filteredMissions.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {tMissions('myMissions.transporteur.emptyStates.noMissions')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                      {tMissions('myMissions.transporteur.emptyStates.noMatchingCriteria')}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Vehicle Selection Dialog */}
            <Dialog
              open={isApplyDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setCurrentMission(null);
                  setSelectedVehicleId('');
                }
                setIsApplyDialogOpen(open);
              }}
            >
              <DialogContent className="sm:max-w-md">
                <DialogDescription className="hidden">
                  {tMissions('myMissions.transporteur.apply.dialogDescription')}
                </DialogDescription>
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">
                    {tMissions('myMissions.transporteur.apply.dialogTitle')}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {currentMission && (
                    <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-950 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                        {currentMission.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {currentMission.description}
                      </p>
                      {currentMission.requiredVehicleType && (
                        <p className="text-xs sm:text-sm text-tsa-blue dark:text-tsa-white mt-2">
                          {tMissions('myMissions.transporteur.apply.requiredVehicleType')}{' '}
                          {VehicleTypeLabels[currentMission.requiredVehicleType]}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      {tMissions('myMissions.transporteur.apply.selectVehicle')}
                    </label>
                    {vehiclesLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="w-6 h-6 border dark:border-gray-800-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                          {tMissions('myMissions.transporteur.apply.loadingVehicles')}
                        </span>
                      </div>
                    ) : availableVehicles.length === 0 ? (
                      <div className="p-4 text-center text-gray-600 dark:text-gray-300 bg-yellow-50 rounded-lg">
                        <p className="text-xs sm:text-sm">
                          {tMissions('myMissions.transporteur.apply.noVehiclesAvailable')}
                        </p>
                        <p className="text-xs mt-1">
                          {tMissions('myMissions.transporteur.apply.noVehiclesMessage')}
                        </p>
                      </div>
                    ) : (
                      <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={tMissions('myMissions.transporteur.apply.chooseVehicle')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm">{vehicle.registration}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ({VehicleTypeLabels[vehicle.type]})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setIsApplyDialogOpen(false);
                        setSelectedVehicleId('');
                      }}
                    >
                      {tCommon('actions.cancel')}
                    </Button>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={applyForMission}
                      disabled={!selectedVehicleId || availableVehicles.length === 0}
                    >
                      {tCommon('actions.apply')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Mission Start Dialog */}
            <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">
                    {tMissions('actions.start')}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <p className="text-sm sm:text-base">
                    {tCommon('actions.warning.confirmAction')}{' '}
                    {tMissions('actions.start').toLowerCase()} ?
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setIsStartDialogOpen(false)}
                    disabled={isLoading}
                  >
                    {tCommon('actions.cancel')}
                  </Button>
                  <Button
                    variant="default"
                    className="w-full sm:w-auto"
                    onClick={startMission}
                    disabled={isLoading}
                  >
                    {isLoading ? tCommon('messages.processing') : tCommon('actions.confirm')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
