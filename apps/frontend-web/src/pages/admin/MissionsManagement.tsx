import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, Clock, CheckCircle, AlertTriangle, Package, Plus } from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import type { Mission, MissionStatus } from '@/types/mission.types';
import { Link } from 'react-router-dom';
import MissionCard from '@/components/missions/MissionCard';

export default function MissionsManagement() {
  const { missions = [], isLoading, error } = useMissions();
  const [searchQuery, setSearchQuery] = useState('');
  // const [typeFilter, setTypeFilter] = useState<string>('all');
  // const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<MissionStatus | 'all'>('all');

  const filteredMissions = missions.filter((mission: Mission) => {
    const matchesSearch =
      mission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mission.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    // const matchesType = typeFilter === 'all' || mission.typeMarchandise === typeFilter;
    // const matchesStatus = statusFilter === 'all' || mission.status === statusFilter;
    const matchesTab = activeTab === 'all' || mission.status === activeTab;

    return matchesSearch && matchesTab;
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
    return <div>Chargement des missions...</div>;
  }

  if (error) {
    return <div>Erreur lors du chargement des missions</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des Missions</h1>
        <Link to="/app/missions/create">
          <Button className="bg-tsa-blue hover:bg-tsa-blue/90">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Mission
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total des Missions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Package className="h-4 w-4 mr-1 text-gray-500" />
              Brouillons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.draft || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1 text-blue-500" />
              Publiées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.published || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Clock className="h-4 w-4 mr-1 text-yellow-500" />
              Assignées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.assigned || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
              Terminées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.completed || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une mission..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    <SelectItem value="draft">Brouillon</SelectItem>
                                    <SelectItem value="published">Publiée</SelectItem>
                                    <SelectItem value="assigned">Assignée</SelectItem>
                                    <SelectItem value="completed">Terminée</SelectItem>
                                    <SelectItem value="cancelled">Annulée</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Type de marchandise" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les types</SelectItem>
                                    <SelectItem value="electronique">Électronique</SelectItem>
                                    <SelectItem value="construction">Matériaux de Construction</SelectItem>
                                    <SelectItem value="alimentaire">Produits Alimentaires</SelectItem>
                                    <SelectItem value="textile">Textiles</SelectItem>
                                    <SelectItem value="machines">Machines</SelectItem>
                                    <SelectItem value="chimique">Produits Chimiques</SelectItem>
                                </SelectContent>
                            </Select> */}
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
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
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-1">
            Toutes <Badge variant="secondary">{statusCounts.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex items-center gap-1">
            <Package className="h-4 w-4 mr-1 text-gray-500" />
            Brouillons <Badge variant="secondary">{statusCounts.draft || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="published" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 mr-1 text-blue-500" />
            Publiées <Badge variant="secondary">{statusCounts.published || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="assigned" className="flex items-center gap-1">
            <Clock className="h-4 w-4 mr-1 text-yellow-500" />
            Assignées <Badge variant="secondary">{statusCounts.assigned || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            Terminées <Badge variant="secondary">{statusCounts.completed || 0}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {filteredMissions.length > 0 ? (
                <div className="space-y-4 p-4">
                  {filteredMissions.map((mission) => (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      showApplyButton={false}
                      showPublishButton={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Aucune mission trouvée avec ces critères.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
