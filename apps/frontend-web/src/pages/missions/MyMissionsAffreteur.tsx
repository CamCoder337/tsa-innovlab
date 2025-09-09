import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    MapPin,
    Calendar,
    Package,
    Star,
    MessageSquare,
    Eye,
    Edit,
    Clock,
    CheckCircle,
    XCircle,
    Plus,
} from "lucide-react"
import { Link } from "react-router-dom"
import type { Mission } from '@/types/mission.types'

const mockMissions: Mission[] = [
    {
        id: "TSA-001",
        title: "Transport Électronique Douala → Yaoundé",
        description: "Transport de matériel électronique de Douala à Yaoundé",
        origin: "Douala",
        destination: "Yaoundé",
        status: "en_transit",
        proposedPrice: 450000,
        finalPrice: 420000,
        specialRequirements: {
            refrigerated: false,
            fragile: false,
            hazardous: false,
            insurance: false,
        },
        missionItems: [],
        cargoType: "electronics",
        deadline: "2025-01-25",
        bids: 8,
        shipper: {
            id: "3",
            name: "Jean-Paul Mbarga",
            rating: 4.8,
            phone: "+237 696 123 456",
            company: "Agro-Export SARL",
        },
        createdAt: "2025-01-20",
    },
    {
        id: "TSA-002",
        title: "Matériaux de Construction Bafoussam → Bamenda",
        description: "Transport de matériaux de construction de Bafoussam à Bamenda",
        origin: "Bafoussam",
        destination: "Bamenda",
        status: "en_negociation",
        proposedPrice: 280000,
        deadline: "2025-01-28",
        bids: 12,
        specialRequirements: {
            refrigerated: false,
            fragile: false,
            hazardous: false,
            insurance: false,
        },
        missionItems: [],
        cargoType: "construction",
        createdAt: "2025-01-21",
    },
    {
        id: "TSA-003",
        title: "Export Produits Alimentaires vers le Tchad",
        description: "Export de produits alimentaires de Garoua à N'Djamena",
        origin: "Garoua",
        destination: "N'Djamena",
        status: "ouverte",
        proposedPrice: 680000,
        deadline: "2025-01-30",
        bids: 3,
        specialRequirements: {
            refrigerated: false,
            fragile: false,
            hazardous: false,
            insurance: false,
        },
        missionItems: [],
        cargoType: "food",
        createdAt: "2025-01-22",
    },
]

export default function MissionsAffréteurPage() {
    const [missions] = useState(mockMissions)
    const [activeTab, setActiveTab] = useState("toutes")

    const getStatusColor = (status: string) => {
        switch (status) {
            case "brouillon":
                return "bg-gray-100 text-gray-800"
            case "ouverte":
                return "bg-blue-100 text-blue-800"
            case "en_negociation":
                return "bg-orange-100 text-orange-800"
            case "assignee":
                return "bg-purple-100 text-purple-800"
            case "en_transit":
                return "bg-yellow-100 text-yellow-800"
            case "terminee":
                return "bg-green-100 text-green-800"
            case "annulee":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "terminee":
                return <CheckCircle className="h-4 w-4" />
            case "annulee":
                return <XCircle className="h-4 w-4" />
            case "en_transit":
                return <Clock className="h-4 w-4" />
            default:
                return <Package className="h-4 w-4" />
        }
    }

    const getStatusLabel = (status: string) => {
        const labels = {
            brouillon: "BROUILLON",
            ouverte: "OUVERTE",
            en_negociation: "EN NÉGOCIATION",
            assignee: "ASSIGNÉE",
            en_transit: "EN TRANSIT",
            terminee: "TERMINÉE",
            annulee: "ANNULÉE",
        }
        return labels[status as keyof typeof labels] || status.toUpperCase()
    }

    const filteredMissions = missions.filter((mission) => {
        if (activeTab === "toutes") return true
        if (activeTab === "actives") return ["ouverte", "en_negociation", "assignee", "en_transit"].includes(mission.status)
        if (activeTab === "terminees") return mission.status === "terminee"
        if (activeTab === "brouillons") return mission.status === "brouillon"
        return true
    })

    return (
        <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Missions</h1>
                    <p className="text-gray-600">Gérez et suivez vos missions de transport</p>
                </div>
                <Link to="/affreteur/missions/creer">
                    <Button className="gap-2" style={{ backgroundColor: "var(--tsa-blue)" }}>
                        <Plus className="h-4 w-4" />
                        Nouvelle Mission
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Package className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Missions</p>
                                <p className="text-2xl font-bold">{missions.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Clock className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">En Cours</p>
                                <p className="text-2xl font-bold">
                                    {missions.filter((m) => ["en_negociation", "assignee", "en_transit"].includes(m.status)).length}
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
                                <p className="text-2xl font-bold">{missions.filter((m) => m.status === "terminee").length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <MessageSquare className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Offres</p>
                                <p className="text-2xl font-bold">{missions.reduce((sum, m) => sum + m.bids, 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historique des Missions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="toutes">Toutes</TabsTrigger>
                            <TabsTrigger value="actives">Actives</TabsTrigger>
                            <TabsTrigger value="terminees">Terminées</TabsTrigger>
                            <TabsTrigger value="brouillons">Brouillons</TabsTrigger>
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
                                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{mission.title}</h3>
                                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="h-4 w-4" />
                                                                    <span>
                                                                        {mission.origin} → {mission.destination}
                                                                    </span>
                                                                </div>
                                                                <span>•</span>
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="h-4 w-4" />
                                                                    <span>Créée le {new Date(mission.createdAt).toLocaleDateString("fr-FR")}</span>
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
                                                            <span className="text-gray-500">Proposé:</span>
                                                            <span className="ml-1 font-medium">{mission.proposedPrice.toLocaleString()} FCFA</span>
                                                        </div>
                                                        {mission.finalPrice && (
                                                            <div>
                                                                <span className="text-gray-500">Final:</span>
                                                                <span className="ml-1 font-medium text-green-600">
                                                                    {mission.finalPrice.toLocaleString()} FCFA
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="text-gray-500">Échéance:</span>
                                                            <span className="ml-1 font-medium">
                                                                {new Date(mission.deadline).toLocaleDateString("fr-FR")}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Offres:</span>
                                                            <span className="ml-1 font-medium">{mission.bids}</span>
                                                        </div>
                                                    </div>

                                                    {mission?.shipper && (
                                                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                                <span className="text-xs font-medium text-green-600">
                                                                    {mission.shipper.name.charAt(0)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-green-800">
                                                                    Assignée à {mission.shipper.name}
                                                                </p>
                                                                <div className="flex items-center gap-2 text-xs text-green-600">
                                                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                                    <span>{mission.shipper.rating}</span>
                                                                    <span>•</span>
                                                                    <span>{mission.shipper.phone}</span>
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
                                                    {mission.status === "brouillon" && (
                                                        <Button variant="outline" className="gap-2 bg-transparent">
                                                            <Edit className="h-4 w-4" />
                                                            Modifier
                                                        </Button>
                                                    )}
                                                    {["ouverte", "en_negociation"].includes(mission.status) && (
                                                        <Button className="gap-2" style={{ backgroundColor: "var(--tsa-blue)" }}>
                                                            <MessageSquare className="h-4 w-4" />
                                                            Voir Offres ({mission.bids})
                                                        </Button>
                                                    )}
                                                    {mission.status === "en_transit" && (
                                                        <Button className="gap-2" style={{ backgroundColor: "var(--tsa-blue)" }}>
                                                            <MapPin className="h-4 w-4" />
                                                            Suivre Expédition
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
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune mission trouvée</h3>
                                    <p className="text-gray-600">
                                        {activeTab === "brouillons"
                                            ? "Vous n'avez aucun brouillon de mission"
                                            : activeTab === "terminees"
                                                ? "Aucune mission terminée pour le moment"
                                                : "Aucune mission ne correspond au filtre actuel"}
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
