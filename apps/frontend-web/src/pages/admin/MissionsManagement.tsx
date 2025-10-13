import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';
import {
  Search,
  Download,
  Calendar,
  MapPin,
  Truck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  Eye,
  MessageCircle,
  Plus,
} from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import type { Mission, MissionStatus } from '@/types/mission.types';
import { getStatusColor, getStatusIcon, getStatusLabel } from '@/lib/mission-utils';
import { Link } from 'react-router-dom';

export default function MissionsManagement() {
  const { missions = [], isLoading, error } = useMissions();
  const [searchQuery, setSearchQuery] = useState('');
  // const [typeFilter, setTypeFilter] = useState<string>('all');
  // const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<MissionStatus | 'all'>('all');

  const filteredMissions = missions.filter((mission: Mission) => {
    const matchesSearch =
      mission.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    <div className="container mx-auto py-8">
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
                filteredMissions.map((mission) => (
                  <Card key={mission.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {mission.titre}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>
                                    {mission.adresseDepartId} → {mission.adresseArriveeId}
                                  </span>
                                </div>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    Crée le{' '}
                                    {new Date(mission.createdAt).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <Badge className={getStatusColor(mission.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(mission.status)}
                                {getStatusLabel(mission.status)}
                              </div>
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-gray-500">Prix:</span>
                              <span className="ml-1 font-medium text-green-600">
                                {mission.budgetMax || mission.budgetMin} FCFA
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Type:</span>
                              <span className="ml-1 font-medium">{mission.typeMarchandise}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Échéance:</span>
                              <span className="ml-1 font-medium">
                                {mission.dateArriveePrevue
                                  ? new Date(mission.dateArriveePrevue).toLocaleDateString('fr-FR')
                                  : 'Non spécifiée'}
                              </span>
                            </div>
                            {/* <div>
                                                                                                    <span className="text-gray-500">Prix/km:</span>
                                                                                                    <span className="ml-1 font-medium">
                                                                                                        {Math.round(
                                                                                                            (mission.budgetMax || mission.budgetMin)
                                                                                                        )}{' '}
                                                                                                        FCFA
                                                                                                    </span>
                                                                                                </div> */}
                          </div>

                          {/* {mission?.shipper && (
                                                                                                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                                                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                                                        <span className="text-xs font-medium text-blue-600">
                                                                                                            {mission.shipper.name.charAt(0)}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <p className="text-sm font-medium text-blue-800">
                                                                                                            {mission.shipper.company}
                                                                                                        </p>
                                                                                                        <div className="flex items-center gap-2 text-xs text-blue-600">
                                                                                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                                                                            <span>{mission.shipper.rating}</span>
                                                                                                            <span>•</span>
                                                                                                            <span>
                                                                                                                Publié le{' '}
                                                                                                                {new Date(mission.createdAt).toLocaleDateString('fr-FR')}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )} */}
                        </div>

                        <div className="flex flex-col gap-2 lg:w-48">
                          <Link
                            to={`/app/missions/${mission.id}`}
                            aria-label={`Voir ${mission.titre}`}
                          >
                            <Button variant="outline" className="gap-2 bg-transparent w-full">
                              <Eye className="h-4 w-4" />
                              Voir Détails
                            </Button>
                          </Link>
                          {mission.status === 'published' && (
                            <Button
                              className="gap-2"
                              style={{ backgroundColor: 'var(--tsa-blue)' }}
                            >
                              <Truck className="h-4 w-4" />
                              Assigner
                            </Button>
                          )}
                          {mission.status === 'assigned' && (
                            <Button
                              className="gap-2"
                              style={{ backgroundColor: 'var(--tsa-blue)' }}
                            >
                              <MessageCircle className="h-4 w-4" />
                              Contacter
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
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
