import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Package,
  Star,
  MessageSquare,
  Eye,
  CheckCircle,
  Search,
  Filter,
  Truck,
  DollarSign,
} from 'lucide-react';
import type { Mission } from '@/types/mission.types';

const mockMissions: Mission[] = [
  {
    id: 'TSA-004',
    title: 'Transport Matériel Médical Yaoundé → Garoua',
    origin: 'Yaoundé',
    destination: 'Garoua',
    status: 'assignee',
    proposedPrice: 850000,
    description: 'Transport de matériel médical de Yaoundé à Garoua',
    specialRequirements: {
      refrigerated: false,
      fragile: false,
      hazardous: false,
      insurance: false,
    },
    missionItems: [],
    deadline: '2025-01-30',
    distance: 692,
    cargoType: 'medical',
    weight: 2500,
    bids: 3,
    shipper: {
      id: '1',
      name: 'Dr. Marie Fotso',
      rating: 4.9,
      phone: '+237 696 123 456',
      company: 'Clinique Centrale',
    },
    createdAt: '2025-01-23',
    urgency: 'high',
  },
  {
    id: 'TSA-005',
    title: 'Livraison Produits Alimentaires Douala → Bamenda',
    origin: 'Douala',
    destination: 'Bamenda',
    status: 'assignee',
    proposedPrice: 320000,
    description: 'Livraison de produits alimentaires de Douala à Bamenda',
    specialRequirements: {
      refrigerated: false,
      fragile: false,
      hazardous: false,
      insurance: false,
    },
    missionItems: [],
    deadline: '2025-01-27',
    distance: 368,
    cargoType: 'food',
    weight: 1800,
    bids: 2,
    shipper: {
      id: '2',
      name: 'Paul Nkomo',
      rating: 4.6,
      phone: '+237 696 123 456',
      company: 'Agro-Export SARL',
    },
    createdAt: '2025-01-22',
    urgency: 'medium',
  },
  {
    id: 'TSA-001',
    title: 'Transport Électronique Douala → Yaoundé',
    origin: 'Douala',
    destination: 'Yaoundé',
    status: 'en_transit',
    proposedPrice: 450000,
    finalPrice: 420000,
    description: 'Transport électronique de Douala à Yaoundé',
    specialRequirements: {
      refrigerated: false,
      fragile: false,
      hazardous: false,
      insurance: false,
    },
    missionItems: [],
    deadline: '2025-01-25',
    distance: 243,
    cargoType: 'electronics',
    weight: 800,
    bids: 1,
    shipper: {
      id: '3',
      name: 'Tech Solutions',
      rating: 4.7,
      phone: '+237 696 123 456',
      company: 'Tech Solutions SARL',
    },
    createdAt: '2025-01-20',
    urgency: 'medium',
  },
];

export default function MissionsTransporteurPage() {
  const [missions] = useState(mockMissions);
  const [activeTab, setActiveTab] = useState('disponibles');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    const labels = {
      high: 'URGENT',
      medium: 'PRIORITAIRE',
      low: 'STANDARD',
    };
    return labels[urgency as keyof typeof labels] || urgency.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assignee':
        return 'bg-blue-100 text-blue-800';
      case 'en_transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      assignee: 'DISPONIBLE',
      en_transit: 'EN COURS',
      terminee: 'TERMINÉE',
    };
    return labels[status as keyof typeof labels] || status.toUpperCase();
  };

  const filteredMissions = missions.filter((mission) => {
    const matchesTab =
      activeTab === 'toutes' ||
      (activeTab === 'disponibles' && mission.status === 'assignee') ||
      (activeTab === 'en_cours' && mission.status === 'en_transit') ||
      (activeTab === 'terminees' && mission.status === 'terminee');

    const matchesSearch =
      mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.destination.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOrigin = filterOrigin === 'all' || mission.origin === filterOrigin;
    const matchesUrgency = filterUrgency === 'all' || mission.urgency === filterUrgency;

    return matchesTab && matchesSearch && matchesOrigin && matchesUrgency;
  });

  const uniqueOrigins = Array.from(new Set(missions.map((m) => m.origin)));

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
                    {missions.filter((m) => m.status === 'assignee').length}
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
                    {missions.filter((m) => m.status === 'en_transit').length}
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
                    {missions.filter((m) => m.status === 'terminee').length}
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
                      .filter((m) => m.status === 'assignee')
                      .reduce((sum, m) => sum + m.proposedPrice, 0)
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
                    placeholder="Rechercher par titre, origine ou destination..."
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
                  {uniqueOrigins.map((origin) => (
                    <SelectItem key={origin} value={origin}>
                      {origin}
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
                <TabsTrigger value="assignees">Disponibles</TabsTrigger>
                <TabsTrigger value="en_transit">En Cours</TabsTrigger>
                <TabsTrigger value="terminees">Terminées</TabsTrigger>
                <TabsTrigger value="toutes">Toutes</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <div className="space-y-4">
                  {filteredMissions.map((mission) => (
                    <Card key={mission.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {mission.title}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>
                                      {mission.origin} → {mission.destination}
                                    </span>
                                  </div>
                                  <span>•</span>
                                  <span>{mission.distance} km</span>
                                  <span>•</span>
                                  <span>{mission.weight} kg</span>
                                </div>
                              </div>
                              {mission?.urgency && (
                                <div className="flex gap-2">
                                  <Badge className={getUrgencyColor(mission.urgency)}>
                                    {getUrgencyLabel(mission.urgency)}
                                  </Badge>
                                  <Badge className={getStatusColor(mission.status)}>
                                    {getStatusLabel(mission.status)}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                              <div>
                                <span className="text-gray-500">Prix:</span>
                                <span className="ml-1 font-medium text-green-600">
                                  {mission.finalPrice || mission.proposedPrice} FCFA
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Type:</span>
                                <span className="ml-1 font-medium">{mission.cargoType}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Échéance:</span>
                                <span className="ml-1 font-medium">
                                  {new Date(mission.deadline).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Prix/km:</span>
                                <span className="ml-1 font-medium">
                                  {Math.round(
                                    (mission.finalPrice || mission.proposedPrice) /
                                      (mission.distance || 1)
                                  )}{' '}
                                  FCFA
                                </span>
                              </div>
                            </div>

                            {mission?.shipper && (
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
                            )}
                          </div>

                          <div className="flex flex-col gap-2 lg:w-48">
                            <Button variant="outline" className="gap-2 bg-transparent">
                              <Eye className="h-4 w-4" />
                              Voir Détails
                            </Button>
                            {mission.status === 'assignee' && (
                              <Button
                                className="gap-2"
                                style={{ backgroundColor: 'var(--tsa-blue)' }}
                              >
                                <MessageSquare className="h-4 w-4" />
                                Faire une Offre
                              </Button>
                            )}
                            {mission.status === 'en_transit' && (
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
