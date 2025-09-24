import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getStatusColor, getStatusIcon, getStatusLabel } from '@/lib/functions';
import {
  Calendar,
  MapPin,
  Package,
  MessageSquare,
  Eye,
  CheckCircle,
  Search,
  Filter,
  Truck,
  DollarSign,
} from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import { Badge } from '@/components/ui/badge';
import { useAddresses } from '@/hooks/useAddresses';
// import { Calendar } from '@/components/ui/calendar';

export default function MissionsTransporteurPage() {
  const { missions } = useMissions();
  const { addresses } = useAddresses();
  const [activeTab, setActiveTab] = useState('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');

  const filteredMissions = missions.filter((mission) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'available') return mission.status === 'published';
    if (activeTab === 'completed') return mission.status === 'completed';
    if (activeTab === 'assigned') return mission.status === 'assigned';
    return true;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
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
                    {missions.filter((m) => m.status === 'assigned').length}
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
                    {missions.filter((m) => m.status === 'published').length}
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
                    {missions.filter((m) => m.status === 'completed').length}
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
                    {missions
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
                  {filteredMissions.map((mission) => (
                    <Link to={`/app/missions/${mission.id}`} aria-label={`Voir ${mission.titre}`}>
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
                                        {mission.adresseDepart?.label} →{' '}
                                        {mission.adresseArrivee?.label}
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
                                    {mission.budgetMin || mission.budgetMax} FCFA
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Type:</span>
                                  <span className="ml-1 font-medium">
                                    {mission.typeMarchandise}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Échéance:</span>
                                  <span className="ml-1 font-medium">
                                    {mission.dateArriveePrevue
                                      ? new Date(mission.dateArriveePrevue).toLocaleDateString(
                                          'fr-FR'
                                        )
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
                                <Button variant="outline" className="gap-2 bg-transparent">
                                  <Eye className="h-4 w-4" />
                                  Voir Détails
                                </Button>
                              </Link>
                              {mission.status === 'published' && (
                                <Button
                                  className="gap-2"
                                  style={{ backgroundColor: 'var(--tsa-blue)' }}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  Faire une Offre
                                </Button>
                              )}
                              {mission.status === 'assigned' && (
                                <Button
                                  className="gap-2"
                                  style={{ backgroundColor: 'var(--tsa-blue)' }}
                                >
                                  <Truck className="h-4 w-4" />
                                  Gérer Transport
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
