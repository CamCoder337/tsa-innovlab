import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Users,
    Package,
    Truck,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    BarChart3,
    PieChart,
    Activity,
} from "lucide-react"

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("overview")

    // Données de démonstration
    const stats = {
        totalUsers: 1247,
        activeShippers: 342,
        activeCarriers: 189,
        totalMissions: 2856,
        activeMissions: 127,
        completedMissions: 2634,
        totalRevenue: 45680000,
        monthlyRevenue: 3240000,
        pendingIssues: 8,
    }

    const recentMissions = [
        {
            id: "TSA-001",
            title: "Transport Électronique Douala → Yaoundé",
            shipper: "Tech Solutions SARL",
            carrier: "Jean-Paul Mbarga",
            status: "en_transit",
            value: 420000,
        },
        {
            id: "TSA-002",
            title: "Matériaux Construction Bafoussam → Bamenda",
            shipper: "BTP Cameroun",
            carrier: "Marie Fotso Transport",
            status: "en_negociation",
            value: 280000,
        },
        {
            id: "TSA-003",
            title: "Produits Alimentaires Garoua → N'Djamena",
            shipper: "Agro-Export SARL",
            carrier: "Non assigné",
            status: "ouverte",
            value: 680000,
        },
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case "en_transit":
                return "bg-yellow-100 text-yellow-800"
            case "en_negociation":
                return "bg-orange-100 text-orange-800"
            case "ouverte":
                return "bg-blue-100 text-blue-800"
            case "terminee":
                return "bg-green-100 text-green-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const getStatusLabel = (status: string) => {
        const labels = {
            en_transit: "EN TRANSIT",
            en_negociation: "EN NÉGOCIATION",
            ouverte: "OUVERTE",
            terminee: "TERMINÉE",
        }
        return labels[status as keyof typeof labels] || status.toUpperCase()
    }

    return (
        <div className="flex-1">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de Bord Administrateur</h1>
                <p className="text-gray-600">Vue d'ensemble de la plateforme TSA Logistics</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="users">Utilisateurs</TabsTrigger>
                    <TabsTrigger value="missions">Missions</TabsTrigger>
                    <TabsTrigger value="analytics">Analyses</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Users className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Utilisateurs Total</p>
                                        <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Package className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Missions Total</p>
                                        <p className="text-2xl font-bold">{stats.totalMissions.toLocaleString()}</p>
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
                                        <p className="text-sm text-gray-600">Revenus Total</p>
                                        <p className="text-2xl font-bold">{(stats.totalRevenue / 1000000).toFixed(1)}M FCFA</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Problèmes en Attente</p>
                                        <p className="text-2xl font-bold">{stats.pendingIssues}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Activité Récente
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Mission TSA-045 terminée</p>
                                            <p className="text-xs text-gray-500">Il y a 2 heures</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Users className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Nouveau transporteur inscrit</p>
                                            <p className="text-xs text-gray-500">Il y a 4 heures</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 rounded-lg">
                                            <Clock className="h-4 w-4 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Mission TSA-046 en retard</p>
                                            <p className="text-xs text-gray-500">Il y a 6 heures</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Statistiques Mensuelles
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Nouvelles missions</span>
                                        <span className="font-medium">+127</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Nouveaux utilisateurs</span>
                                        <span className="font-medium">+89</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Revenus ce mois</span>
                                        <span className="font-medium text-green-600">
                                            {(stats.monthlyRevenue / 1000000).toFixed(1)}M FCFA
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Taux de réussite</span>
                                        <span className="font-medium">94.2%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Missions Récentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentMissions.map((mission) => (
                                    <div key={mission.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{mission.title}</h4>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                <span>Affréteur: {mission.shipper}</span>
                                                <span>•</span>
                                                <span>Transporteur: {mission.carrier}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium">{mission.value.toLocaleString()} FCFA</span>
                                            <Badge className={getStatusColor(mission.status)}>{getStatusLabel(mission.status)}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Users className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Affréteurs Actifs</p>
                                        <p className="text-2xl font-bold">{stats.activeShippers}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Truck className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Transporteurs Actifs</p>
                                        <p className="text-2xl font-bold">{stats.activeCarriers}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Croissance Mensuelle</p>
                                        <p className="text-2xl font-bold">+12.5%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Gestion des Utilisateurs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">Interface de gestion des utilisateurs à implémenter...</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="missions" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-100 rounded-lg">
                                        <Clock className="h-5 w-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Missions Actives</p>
                                        <p className="text-2xl font-bold">{stats.activeMissions}</p>
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
                                        <p className="text-sm text-gray-600">Missions Terminées</p>
                                        <p className="text-2xl font-bold">{stats.completedMissions}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <BarChart3 className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Taux de Réussite</p>
                                        <p className="text-2xl font-bold">94.2%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Supervision des Missions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">Interface de supervision des missions à implémenter...</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Analyses de Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">Graphiques et analyses détaillées à implémenter...</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChart className="h-5 w-5" />
                                    Répartition des Revenus
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">Graphiques de répartition à implémenter...</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
