import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DollarSign,
  Plus,
} from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import type { Mission, MissionStatus } from '@/types/mission.types';

const statusBadgeVariant: Record<
  MissionStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  draft: 'outline',
  published: 'secondary',
  assigned: 'default',
  completed: 'default',
  cancelled: 'destructive',
};

const statusBadgeLabel: Record<MissionStatus, string> = {
  draft: 'Brouillon',
  published: 'Publiée',
  assigned: 'Assignée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

export default function MissionsManagement() {
  const { missions = [], isLoading, error } = useMissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<MissionStatus | 'all'>('all');

  const filteredMissions = missions.filter((mission: Mission) => {
    const matchesSearch =
      mission.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mission.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesType = typeFilter === 'all' || mission.typeMarchandise === typeFilter;
    const matchesStatus = statusFilter === 'all' || mission.status === statusFilter;
    const matchesTab = activeTab === 'all' || mission.status === activeTab;

    return matchesSearch && matchesType && matchesStatus && matchesTab;
  });

  const exportToCSV = (): void => {
    // TODO: Implement CSV export
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

  const getAddressLabel = (addressId: string | null | undefined): string => {
    // TODO: Replace with actual address lookup
    return addressId ? `Adresse #${addressId}` : 'Non spécifiée';
  };

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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Mission
        </Button>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              </Select>
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
                  <div
                    key={mission.id}
                    className="p-6 border-b hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{mission.titre}</h3>
                        <Badge variant={statusBadgeVariant[mission.status]}>
                          {statusBadgeLabel[mission.status]}
                        </Badge>
                        {mission.isFlexibleDates && (
                          <Badge variant="outline" className="text-xs">
                            Dates flexibles
                          </Badge>
                        )}
                        {mission.isFlexibleRoute && (
                          <Badge variant="outline" className="text-xs">
                            Itinéraire flexible
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        #{mission.id} • {mission.typeMarchandise || 'Type non spécifié'}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="h-4 w-4" />
                        Voir
                      </Button>
                      {mission.status === 'published' && (
                        <Button variant="outline" size="sm" className="gap-1">
                          <Truck className="h-4 w-4" />
                          Assigner
                        </Button>
                      )}
                      {mission.status === 'assigned' && (
                        <Button variant="outline" size="sm" className="gap-1">
                          <MessageCircle className="h-4 w-4" />
                          Contacter
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Itinéraire</p>
                          <p className="text-sm text-muted-foreground">
                            {getAddressLabel(mission.adresseDepartId)} →{' '}
                            {getAddressLabel(mission.adresseArriveeId)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Dates</p>
                          <p className="text-sm text-muted-foreground">
                            {mission.dateDepartEstime
                              ? new Date(mission.dateDepartEstime).toLocaleDateString()
                              : 'Non définie'}{' '}
                            -{' '}
                            {mission.dateArriveePrevue
                              ? new Date(mission.dateArriveePrevue).toLocaleDateString()
                              : 'Non définie'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Budget</p>
                          <p className="text-sm text-muted-foreground">
                            {mission.budgetMin?.toLocaleString() || 'N/A'} -{' '}
                            {mission.budgetMax?.toLocaleString() || 'N/A'} FCFA
                          </p>
                        </div>
                      </div>
                    </div>

                    {mission.notesComplementaires && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-1">Notes complémentaires</p>
                        <p className="text-sm text-muted-foreground">
                          {mission.notesComplementaires}
                        </p>
                      </div>
                    )}

                    {mission.documents && mission.documents.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-1">Documents</p>
                        <div className="flex flex-wrap gap-2">
                          {mission.documents.map((doc, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              Document {index + 1} {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
