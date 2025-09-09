import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Plus, FileText, Package, MapPin, Euro, Clock, CheckCircle, TrendingUp, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuthStore } from '@/stores/user'

// Mock data spécifique aux affréteurs
const affreteurKPIData = {
    totalMissions: 24,
    activeMissions: 8,
    pendingQuotes: 5,
    monthlySpending: 45600,
}

const affreteurInsights = [
    {
        title: "Missions Actives",
        icon: Package,
        value: 8,
        change: "+2 cette semaine",
        color: "blue",
        href: "/affreteur/missions/active",
    },
    {
        title: "Coût Moyen",
        icon: Euro,
        value: "1,900 FCFA",
        change: "-5% ce mois",
        color: "green",
        href: "/affreteur/reports/costs",
    },
    {
        title: "Transporteurs Favoris",
        icon: Users,
        value: 12,
        change: "+3 nouveaux",
        color: "purple",
        href: "/affreteur/marketplace/transporters",
    },
    {
        title: "Taux de Réussite",
        icon: CheckCircle,
        value: "94%",
        change: "+2% ce mois",
        color: "green",
        href: "/affreteur/reports/missions",
    },
]

function AffreteurDashboard() {
    const user = useAuthStore((s) => s.currentUser)
    if (!user) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Bonjour, {user.prenom} {user.nom}
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Système en ligne" />
                    </h1>
                    <p className="text-muted-foreground">Gérez vos expéditions et suivez vos missions en temps réel.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/app/missions/create">
                        <Button className="gap-2" style={{ backgroundColor: "var(--tsa-blue)" }}>
                            <Plus className="h-4 w-4" />
                            Créer Mission
                        </Button>
                    </Link>
                    <Link to="/app/missions/reports">
                        <Button variant="outline" className="gap-2 bg-transparent">
                            <FileText className="h-4 w-4" />
                            Mes Rapports
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                            <p className="font-medium text-green-800">Plateforme Opérationnelle</p>
                            <p className="text-sm text-green-600">
                                Tous vos transporteurs sont disponibles • Suivi temps réel actif
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {affreteurInsights.map((insight, index) => (
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
                            Mes Missions Récentes
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                {
                                    id: "TSA-AF-001",
                                    route: "Douala → Yaoundé",
                                    transporteur: "Paul Transport",
                                    status: "En Transit",
                                    eta: "2h 30m",
                                    progress: 65,
                                    cost: "2,500 FCFA",
                                },
                                {
                                    id: "TSA-AF-002",
                                    route: "Yaoundé → Bafoussam",
                                    transporteur: "Express Nord",
                                    status: "Livré",
                                    eta: "Terminé",
                                    progress: 100,
                                    cost: "1,800 FCFA",
                                },
                                {
                                    id: "TSA-AF-003",
                                    route: "Douala → Bamenda",
                                    transporteur: "Camions Rapides",
                                    status: "Chargement",
                                    eta: "4h 15m",
                                    progress: 15,
                                    cost: "3,200 FCFA",
                                },
                            ].map((mission, i) => (
                                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-2 h-2 rounded-full ${mission.status === "Livré"
                                                ? "bg-green-500"
                                                : mission.status === "En Transit"
                                                    ? "bg-blue-500 animate-pulse"
                                                    : "bg-orange-500"
                                                }`}
                                        ></div>
                                        <div>
                                            <p className="font-medium">{mission.id}</p>
                                            <p className="text-sm text-muted-foreground">{mission.route}</p>
                                            <p className="text-xs text-muted-foreground">par {mission.transporteur}</p>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-sm font-medium">{mission.status}</p>
                                        <p className="text-xs text-muted-foreground">ETA: {mission.eta}</p>
                                        <p className="text-xs font-medium text-tsa-blue">{mission.cost}</p>
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
                        <Link to="/affreteur/missions/create">
                            <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                                <Plus className="h-4 w-4" />
                                Nouvelle Mission
                            </Button>
                        </Link>
                        <Link to="/affreteur/marketplace/transporters">
                            <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                                <Users className="h-4 w-4" />
                                Trouver Transporteurs
                            </Button>
                        </Link>
                        <Link to="/affreteur/tracking">
                            <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                                <MapPin className="h-4 w-4" />
                                Suivi Expéditions
                            </Button>
                        </Link>
                        <Link to="/affreteur/reports/costs">
                            <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                                <Euro className="h-4 w-4" />
                                Analyse Coûts
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-tsa-blue" />
                            Recommandations
                            <div className="w-2 h-2 bg-tsa-blue rounded-full animate-pulse" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Euro className="h-4 w-4 text-blue-600" />
                                    <p className="text-sm font-medium text-blue-800">Optimisation Coûts</p>
                                </div>
                                <p className="text-xs text-blue-600">Groupez vos missions Douala-Yaoundé pour économiser 15%</p>
                            </div>
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users className="h-4 w-4 text-green-600" />
                                    <p className="text-sm font-medium text-green-800">Nouveau Transporteur</p>
                                </div>
                                <p className="text-xs text-green-600">"Express Logistics" disponible sur votre route préférée</p>
                            </div>
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="h-4 w-4 text-orange-600" />
                                    <p className="text-sm font-medium text-orange-800">Planification</p>
                                </div>
                                <p className="text-xs text-orange-600">Évitez les heures de pointe demain 14h-17h sur Douala</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Résumé Mensuel
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Missions Créées</span>
                            <span className="font-semibold">24</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Missions Terminées</span>
                            <span className="font-semibold text-green-600">22</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Coût Total</span>
                            <span className="font-semibold">45,600 FCFA</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Économies Réalisées</span>
                            <span className="font-semibold text-green-600">2,300 FCFA</span>
                        </div>
                        <Progress value={92} className="w-full" />
                        <p className="text-xs text-muted-foreground text-center">92% de vos missions livrées à temps</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default AffreteurDashboard
