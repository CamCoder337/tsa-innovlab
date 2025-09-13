import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Users,
    Settings,
    Shield,
    Mail,
    Phone,
    Save,
    Edit,
    X,
    BarChart3,
    ServerCog,
} from 'lucide-react';

function AdminProfile() {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.firstName || '',
        surname: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    if (!user) return null;

    const adminStats = [
        { label: 'Utilisateurs inscrits', value: '1 245', icon: Users },
        { label: 'Missions actives', value: '73', icon: BarChart3 },
        { label: 'Incidents ouverts', value: '2', icon: Shield },
        { label: 'Services', value: 'OK', icon: ServerCog },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Profil Administrateur</h1>
                    <p className="text-muted-foreground">
                        Gérez vos informations et surveillez la plateforme
                    </p>
                </div>
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Modifier
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button className="gap-2">
                            <Save className="h-4 w-4" />
                            Sauvegarder
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4" />
                            Annuler
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Informations Administrateur
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 mb-6">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={'/placeholder.svg'} />
                                <AvatarFallback
                                    className="text-lg"
                                    style={{ backgroundColor: 'var(--tsa-blue)', color: 'white' }}
                                >
                                    {user?.firstName
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-lg font-semibold">{user.firstName}</h3>
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    Admin
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom Complet</Label>
                                <div className="relative">
                                    <Settings className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        disabled={!isEditing}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        disabled={!isEditing}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Téléphone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        disabled={!isEditing}
                                        className="pl-10"
                                        placeholder="+237 677 123 456"
                                    />
                                </div>
                            </div>

                            {/* <div className="space-y-2">
                                <Label htmlFor="company">Organisation</Label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="company"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        disabled={!isEditing}
                                        className="pl-10"
                                    />
                                </div>
                            </div> */}
                        </div>

                        {/* <div className="space-y-2">
                            <Label htmlFor="address">Adresse</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    disabled={!isEditing}
                                    className="pl-10"
                                    placeholder="Votre adresse complète"
                                />
                            </div>
                        </div> */}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Statistiques Plateforme
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {adminStats.map((stat, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                                    </div>
                                    <span className="font-semibold">{stat.value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Rôles & Accès
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                L'administration peut gérer les rôles des utilisateurs et les autorisations.
                            </p>
                            <Separator />
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    Gérer les utilisateurs
                                </Button>
                                <Button variant="outline" size="sm">
                                    Politiques d'accès
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default AdminProfile;
