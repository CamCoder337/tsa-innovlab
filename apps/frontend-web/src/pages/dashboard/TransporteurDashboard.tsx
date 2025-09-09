import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Search,
    AlertTriangle,
    Package,
    MapPin,
    Truck,
    Euro,
    CheckCircle,
    TrendingUp,
    Fuel,
    Settings,
} from "lucide-react"
import { Link } from "react-router-dom"
import { useAuthStore } from '@/stores/user'

// Mock data spécifique aux transporteurs
const transporteurKPIData = {
    availableMissions: 12,
    activeMissions: 3,
    completedToday: 2,
    dailyEarnings: 8500,
}

const transporteurInsights = [
    {
        title: "Missions Disponibles",
        icon: Search,
        value: 12,
        change: "+4 nouvelles",
        color: "blue",
        href: "/transporteur/missions/available",
    },
    {
        title: "Gains Aujourd'hui",
        icon: Euro,
        value: "8,500 FCFA",
        change: "+15% vs hier",
        color: "green",
        href: "/transporteur/earnings/current",
    },
    {
        title: "Missions Actives",
        icon: Truck,
        value: 3,
        change: "En cours",
        color: "orange",
        href: "/transporteur/missions/active",
    },
    {
        title: "Note Moyenne",
        icon: CheckCircle,
        value: "4.8/5",
        change: "+0.2 ce mois",
        color: "green",
        href: "/transporteur/profile",
    },
]

function TransporteurDashboard() {
    const user = useAuthStore((s) => s.currentUser)
    if (!user) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Bonjour, {user.prenom} {user.nom}
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Véhicule en ligne" />
                    </h1>
                    <p className="text-muted-foreground">Trouvez de nouvelles missions et gérez vos livraisons.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/app/missions/">
                        <Button className="gap-2" style={{ backgroundColor: "var(--tsa-blue)" }}>
                            <Search className="h-4 w-4" />
                            Missions Disponibles
                        </Button>
                    </Link>
                    {/* <Link to="/transporteur/earnings">
                        <Button variant="outline" className="gap-2 bg-transparent">
                            <Euro className="h-4 w-4" />
                            Mes Gains
                        </Button>
                    </Link> */}
                </div>
            </div>

            <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-green-600" />
                        <div>
                            <p className="font-medium text-green-800">Véhicule Opérationnel</p>
                            <p className="text-sm text-green-600">
                                Localisation active • Carburant: 85% • Prochaine maintenance dans 15 jours
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {transporteurInsights.map((insight, index) => (
                    <Link key={index} to={insight.href}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{insight.title}</p>
                                        <p className="text-2xl font-bold">{insight.value}</p>
                                        <p className="text-xs text-green-600">{insight.change}</p>
                                    </div>
                                    <insight.icon className="h-8 w-8 text-tsa-blue" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Mes Missions Actives
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                {
                                    id: "TSA-TR-045",
                                    route: "Douala → Yaoundé",
                                    client: "Transport Express",
                                    status: "En Transit",
                                    eta: "2h 30m",
                                    progress: 65,
                                    payment: "2,500 FCFA",
                                },
                                {
                                    id: "TSA-TR-046",
                                    route: "Yaoundé → Bafoussam",
                                    client: "Logistics Pro",
                                    status: "Chargement",
                                    eta: "Départ 14h",
                                    progress: 10,
                                    payment: "3,200 FCFA",
                                },
                                {
                                    id: "TSA-TR-047",
                                    route: "Douala → Bamenda",
                                    client: "Fret Rapide",
                                    status: "Planifié",
                                    eta: "Demain 8h",
                                    progress: 0,
                                    payment: "2,800 FCFA",
                                },
                            ].map((mission, i) => (
                                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-2 h-2 rounded-full ${mission.status === "En Transit"
                                                ? "bg-blue-500 animate-pulse"
                                                : mission.status === "Chargement"
                                                    ? "bg-orange-500"
                                                    : "bg-gray-400"
                                                }`}
                                        ></div>
                                        <div>
                                            <p className="font-medium">{mission.id}</p>
                                            <p className="text-sm text-muted-foreground">{mission.route}</p>
                                            <p className="text-xs text-muted-foreground">pour {mission.client}</p>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-sm font-medium">{mission.status}</p>
                                        <p className="text-xs text-muted-foreground">ETA: {mission.eta}</p>
                                        <p className="text-xs font-medium text-green-600">{mission.payment}</p>
                                        <Progress value={mission.progress} className="w-20 h-1" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Actions Rapides
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link to="/transporteur/missions/available">
                            <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                                <Search className="h-4 w-4" />
                                Chercher Missions
                            </Button>
                        </Link>
                        <Link to="/transporteur/tracking">
                            <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                                <MapPin className="h-4 w-4" />
                                Suivi GPS
                            </Button>
                        </Link>
                        <Link to="/transporteur/vehicle/info">
                            <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                                <Truck className="h-4 w-4" />
                                État Véhicule
                            </Button>
                        </Link>
                        <Link to="/transporteur/earnings/current">
                            <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                                <Euro className="h-4 w-4" />
                                Gains du Jour
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Alertes & Notifications
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Package className="h-4 w-4 text-blue-600" />
                                    <p className="text-sm font-medium text-blue-800">Nouvelle Mission</p>
                                </div>
                                <p className="text-xs text-blue-600">Mission urgente Douala → Yaoundé disponible (3,500 FCFA)</p>
                            </div>
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Fuel className="h-4 w-4 text-orange-600" />
                                    <p className="text-sm font-medium text-orange-800">Carburant</p>
                                </div>
                                <p className="text-xs text-orange-600">Niveau carburant à 85% - Station recommandée à 2km</p>
                            </div>
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <p className="text-sm font-medium text-green-800">Évaluation Client</p>
                                </div>
                                <p className="text-xs text-green-600">Nouvelle note 5/5 reçue pour votre dernière livraison</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            État du Véhicule
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Carburant</span>
                            <div className="flex items-center gap-2">
                                <Progress value={85} className="w-20" />
                                <span className="text-sm font-semibold">85%</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Kilométrage</span>
                            <span className="font-semibold">45,230 km</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Prochaine Maintenance</span>
                            <span className="font-semibold text-orange-600">15 jours</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Statut GPS</span>
                            <Badge className="bg-green-100 text-green-800">Actif</Badge>
                        </div>
                        <Link to="/transporteur/vehicle/maintenance">
                            <Button variant="outline" className="w-full gap-2 bg-transparent">
                                <Settings className="h-4 w-4" />
                                Gérer Véhicule
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default TransporteurDashboard
