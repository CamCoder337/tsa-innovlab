import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    CalendarIcon,
    MapPin,
    Package,
    DollarSign,
    Plus,
    Minus,
} from 'lucide-react';
import type { Mission } from '@/types/mission.types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function CreateMission() {
    const [date, setDate] = useState<Date>();

    const [formData, setFormData] = useState<Mission>({
        id: '',
        affreteurId: '',
        status: 'draft',
        titre: '',
        description: '',
        adresseDepartId: '',
        adresseArriveeId: '',
        typeMarchandise: '',
        poids: 0,
        volume: 0,
        dateDepartEstime: '',
        dateArriveePrevue: '',
        budgetMin: 0,
        budgetMax: 0,
        createdAt: '',
        updatedAt: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <div className="flex-1 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer une Nouvelle Mission</h1>
                <p className="text-gray-600">
                    Publiez vos besoins de transport et connectez-vous avec des transporteurs fiables
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Détails de la Mission
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="title">Titre de la Mission</Label>
                            <Input
                                id="title"
                                placeholder="ex: Transport Électronique Douala → Yaoundé"
                                value={formData.titre}
                                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="origin">Origine</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="origin"
                                        placeholder="Ville de départ"
                                        className="pl-10"
                                        value={formData.adresseDepartId}
                                        onChange={(e) => setFormData({ ...formData, adresseDepartId: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="destination">Destination</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="destination"
                                        placeholder="Ville d'arrivée"
                                        className="pl-10"
                                        value={formData.adresseArriveeId}
                                        onChange={(e) => setFormData({ ...formData, adresseArriveeId: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="cargoType">Type de Marchandise</Label>
                                <Select
                                    value={formData.typeMarchandise}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, typeMarchandise: value as string })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner le type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="electronics">Électronique</SelectItem>
                                        <SelectItem value="construction">Matériaux de Construction</SelectItem>
                                        <SelectItem value="food">Produits Alimentaires</SelectItem>
                                        <SelectItem value="textiles">Textiles</SelectItem>
                                        <SelectItem value="machinery">Machines</SelectItem>
                                        <SelectItem value="chemicals">Produits Chimiques</SelectItem>
                                        <SelectItem value="other">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* <div>
                                <Label htmlFor="urgency">Niveau d'Urgence</Label>
                                <Select
                                    value={formData.urgency}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, urgency: value as 'low' | 'medium' | 'high' })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner l'urgence" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Faible - Livraison standard</SelectItem>
                                        <SelectItem value="medium">Moyenne - Livraison prioritaire</SelectItem>
                                        <SelectItem value="high">Élevée - Livraison urgente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div> */}
                        </div>

                        <div>
                            <Label htmlFor="description">Description de la Mission</Label>
                            <Textarea
                                id="description"
                                placeholder="Fournissez des informations détaillées sur votre marchandise et les exigences spéciales..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Articles de Marchandise
                            </div>
                            <Button type="button" variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Ajouter Article
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 border rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Article 1</h4>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Label>Description</Label>
                                    <Input
                                        placeholder="Description de l'article"
                                        value="Description de l\'item"
                                    />
                                </div>
                                <div>
                                    <Label>Poids (kg)</Label>
                                    <Input
                                        placeholder="0"
                                        value="0"
                                    />
                                </div>
                                <div>
                                    <Label>Volume (m³)</Label>
                                    <Input
                                        placeholder="0"
                                        value="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Exigences Spéciales
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="refrigerated"
                                    checked={formData.specialRequirements?.refrigerated}
                                    onCheckedChange={(checked) =>
                                        setFormData({
                                            ...formData,
                                            specialRequirements: {
                                                ...formData.specialRequirements,
                                                refrigerated: checked as boolean,
                                            },
                                        })
                                    }
                                />
                                <Label htmlFor="refrigerated">Réfrigéré</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="fragile"
                                    checked={formData.specialRequirements.fragile}
                                    onCheckedChange={(checked) =>
                                        setFormData({
                                            ...formData,
                                            specialRequirements: {
                                                ...formData.specialRequirements,
                                                fragile: checked as boolean,
                                            },
                                        })
                                    }
                                />
                                <Label htmlFor="fragile">Fragile</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="hazardous"
                                    checked={formData.specialRequirements.hazardous}
                                    onCheckedChange={(checked) =>
                                        setFormData({
                                            ...formData,
                                            specialRequirements: {
                                                ...formData.specialRequirements,
                                                hazardous: checked as boolean,
                                            },
                                        })
                                    }
                                />
                                <Label htmlFor="hazardous">Dangereux</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="insurance"
                                    checked={formData.specialRequirements.insurance}
                                    onCheckedChange={(checked) =>
                                        setFormData({
                                            ...formData,
                                            specialRequirements: {
                                                ...formData.specialRequirements,
                                                insurance: checked as boolean,
                                            },
                                        })
                                    }
                                />
                                <Label htmlFor="insurance">Assurance Requise</Label>
                            </div>
                        </div>
                    </CardContent>
                </Card> */}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Prix et Délais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="proposedPrice">Prix Proposé (FCFA)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="proposedPrice"
                                        placeholder="0"
                                        className="pl-10"
                                        value={formData.budgetMin}
                                        onChange={(e) =>
                                            setFormData({ ...formData, budgetMin: parseInt(e.target.value) })
                                        }
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Les transporteurs peuvent négocier ce prix
                                </p>
                            </div>
                            <div>
                                <Label>Date Limite</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !date && 'text-muted-foreground'
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, 'PPP') : 'Choisir une date'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-4">
                    <Button type="submit" className="flex-1" style={{ backgroundColor: 'var(--tsa-blue)' }}>
                        <Package className="h-4 w-4 mr-2" />
                        Créer la Mission
                    </Button>
                    <Button type="button" variant="outline">
                        Sauvegarder comme Brouillon
                    </Button>
                </div>
            </form>
        </div>
    );
}
