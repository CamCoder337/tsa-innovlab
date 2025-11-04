import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, Clock, CheckCircle, AlertTriangle, Package, Plus } from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import type { Mission, MissionStatus } from '@/types/mission.types';
import { VehicleType, VehicleTypeLabels } from '@/types/vehicle.types';
import { Link } from 'react-router-dom';
import MissionCard from '@/components/missions/MissionCard';
import { useAdminTranslation, useCommonTranslation } from '@/hooks/useTranslation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function MissionsManagement() {
  const { missions = [], isLoading, error } = useMissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<VehicleType | 'all'>('all');
  // const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<MissionStatus | 'all'>('all');
  const { t: tAdmin } = useAdminTranslation();
  const { t: tCommon } = useCommonTranslation();

  const filteredMissions = missions.filter((mission: Mission) => {
    const matchesSearch =
      mission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.adresseArrivee?.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.adresseDepart?.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.adresseArrivee?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.adresseDepart?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.adresseArrivee?.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.adresseDepart?.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mission.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesType =
      typeFilter === 'all' ||
      mission.requiredVehicleType === typeFilter ||
      mission.requiredVehicleType === null;
    const matchesTab = activeTab === 'all' || mission.status === activeTab;

    return matchesSearch && matchesType && matchesTab;
  });

  const exportToCSV = (): void => {
    console.log('Exporting to CSV');
  };

  // Calculate status counts
  const statusCounts = missions.reduce<Record<MissionStatus | 'all' | 'total', number>>(
    (acc, mission) => {
      const status = mission.status;
      acc[status] = (acc[status] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    },
    {
      draft: 0,
      published: 0,
      assigned: 0,
      completed: 0,
      cancelled: 0,
      all: missions.length,
      total: 0,
    } as Record<MissionStatus | 'all' | 'total', number>
  );

  if (isLoading) {
    return <div>{tAdmin('missions.loading')}</div>;
  }

  if (error) {
    return <div>{tAdmin('missions.error')}</div>;
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{tAdmin('missions.title')}</h1>
        <Link to="/app/missions/create" className="w-full sm:w-auto">
          <Button className="bg-tsa-blue hover:bg-tsa-blue/90 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{tAdmin('missions.newMission')}</span>
            <span className="sm:hidden">Nouvelle Mission</span>
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-4 sm:mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground h-5 truncate">
              {tAdmin('missions.stats.totalMissions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold">{statusCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center h-5">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-500 flex-shrink-0" />
              <span className="truncate">{tCommon('status.draft')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold">{statusCounts.draft || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center h-5">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-blue-500 flex-shrink-0" />
              <span className="truncate">{tCommon('status.published')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold">{statusCounts.published || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center h-5">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-yellow-500 flex-shrink-0" />
              <span className="truncate">{tCommon('status.assigned')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold">{statusCounts.assigned || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center h-5">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-yellow-500 flex-shrink-0" />
              <span className="truncate">{tCommon('status.in_progress')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold">{statusCounts.in_progress || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center h-5">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-500 flex-shrink-0" />
              <span className="truncate">{tCommon('status.completed')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold">{statusCounts.completed || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={tAdmin('missions.searchPlaceholder')}
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as VehicleType | 'all')}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={tAdmin('missions.vehicleTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tAdmin('missions.allVehicles')}</SelectItem>
                  {Object.values(VehicleType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {VehicleTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportToCSV} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{tCommon('actions.export')}</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as MissionStatus | 'all')}
        className="space-y-4"
      >
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="all" className="flex items-center gap-1 text-xs sm:text-sm">
            <span className="truncate">{tAdmin('missions.tabs.all')}</span>
            <Badge variant="secondary" className="text-xs">
              {statusCounts.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex items-center gap-1 text-xs sm:text-sm">
            <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-500 flex-shrink-0" />
            <span className="truncate hidden sm:inline">{tCommon('status.draft')}</span>
            <span className="truncate sm:hidden">Draft</span>
            <Badge variant="secondary" className="text-xs">
              {statusCounts.draft || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="published" className="flex items-center gap-1 text-xs sm:text-sm">
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-blue-500 flex-shrink-0" />
            <span className="truncate hidden sm:inline">{tCommon('status.published')}</span>
            <span className="truncate sm:hidden">Publié</span>
            <Badge variant="secondary" className="text-xs">
              {statusCounts.published || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="assigned" className="flex items-center gap-1 text-xs sm:text-sm">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-yellow-500 flex-shrink-0" />
            <span className="truncate hidden sm:inline">{tCommon('status.assigned')}</span>
            <span className="truncate sm:hidden">Assigné</span>
            <Badge variant="secondary" className="text-xs">
              {statusCounts.assigned || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-1 text-xs sm:text-sm">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-500 flex-shrink-0" />
            <span className="truncate hidden sm:inline">{tCommon('status.completed')}</span>
            <span className="truncate sm:hidden">Terminé</span>
            <Badge variant="secondary" className="text-xs">
              {statusCounts.completed || 0}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {filteredMissions.length > 0 ? (
                <div className="space-y-3 sm:space-y-4 p-3 sm:p-4">
                  {filteredMissions.map((mission) => (
                    <MissionCard key={mission.id} mission={mission} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">{tAdmin('missions.empty')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
