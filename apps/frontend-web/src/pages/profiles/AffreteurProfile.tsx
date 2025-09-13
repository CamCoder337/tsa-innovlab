import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    User,
    Mail,
    Phone,
    Calendar,
    Star,
    Package,
    TrendingUp,
    Edit,
    Save,
    X,
    Upload,
    FileText,
    CheckCircle,
    AlertCircle,
    Clock,
    Shield,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function AffreteurProfile() {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [kycUploading, setKycUploading] = useState<string | null>(null);
    const [kycDocuments, setKycDocuments] = useState({
        identityCard: { status: 'verified', fileName: 'carte_identite.pdf', uploadDate: '2024-01-15' },
        businessLicense: {
            status: 'pending',
            fileName: 'licence_commerciale.pdf',
            uploadDate: '2024-01-20',
        },
        taxCertificate: { status: 'missing', fileName: null, uploadDate: null },
        bankStatement: {
            status: 'verified',
            fileName: 'releve_bancaire.pdf',
            uploadDate: '2024-01-10',
        },
    });

    const [formData, setFormData] = useState({
        name: user?.firstName || '',
        surname: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    if (!user) return null;

    const handleKycUpload = async () => {

        try {
            await new Promise((resolve) => setTimeout(resolve, 2000));

            setKycDocuments((prev) => ({
                ...prev,
                ['']: {
                    status: 'pending',
                    fileName: 'Name',
                    uploadDate: new Date().toISOString().split('T')[0],
                },
            }));

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error(error);
            setMessage('Erreur lors du téléchargement du document');
        } finally {
            setKycUploading(null);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        setMessage('');

        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            handleKycUpload();
            setIsEditing(false);
            setMessage('Profil mis à jour avec succès');

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error(error);
            setMessage('Erreur lors de la mise à jour du profil');
        } finally {
            setIsLoading(false);
        }
    }

    const getKycStatusInfo = (status: string) => {
        switch (status) {
            case 'verified':
                return {
                    icon: CheckCircle,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    label: 'Vérifié',
                };
            case 'pending':
                return {
                    icon: Clock,
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    label: 'En attente',
                };
            case 'rejected':
                return {
                    icon: AlertCircle,
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    label: 'Rejeté',
                };
            default:
                return {
                    icon: Upload,
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    label: 'Manquant',
                };
        }
    };

    const stats = [
        { label: 'Missions Créées', value: '47', icon: Package },
        { label: 'Missions Terminées', value: '44', icon: TrendingUp },
        { label: 'Note Moyenne', value: '4.8/5', icon: Star },
        { label: 'Membre Depuis', value: 'Jan 2024', icon: Calendar },
    ];

    const kycProgress = Object.values(kycDocuments).filter((doc) => doc.status === 'verified').length;
    const totalKycDocs = Object.keys(kycDocuments).length;
    const kycPercentage = (kycProgress / totalKycDocs) * 100;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
                    <p className="text-muted-foreground">
                        Gérez vos informations personnelles et vos préférences
                    </p>
                </div>
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Modifier
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button onClick={handleSave} disabled={isLoading} className="gap-2">
                            <Save className="h-4 w-4" />
                            {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                        </Button>
                        <Button variant="outline" disabled={isLoading}>
                            <X className="h-4 w-4" />
                            Annuler
                        </Button>
                    </div>
                )}
            </div>

            {message && (
                <Alert className={message.includes('succès') ? 'border-green-200 bg-green-50' : ''}>
                    <AlertDescription className={message.includes('succès') ? 'text-green-800' : ''}>
                        {message}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Informations Personnelles
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
                                    {user.firstName
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-lg font-semibold">{user.firstName}</h3>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    Affréteur
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom Complet</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                                <Label htmlFor="company">Entreprise</Label>
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
                                <Textarea
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    disabled={!isEditing}
                                    className="pl-10 min-h-[80px]"
                                    placeholder="Votre adresse complète"
                                />
                            </div>
                        </div> */}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Documents KYC (Know Your Customer)
                            <Badge
                                variant="outline"
                                className={`ml-auto ${kycPercentage === 100 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
                            >
                                {kycProgress}/{totalKycDocs} Vérifiés
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Carte d'identité */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Carte d'Identité</Label>
                                    <Badge
                                        variant="outline"
                                        className={`${getKycStatusInfo(kycDocuments.identityCard.status).bgColor} ${getKycStatusInfo(kycDocuments.identityCard.status).color} ${getKycStatusInfo(kycDocuments.identityCard.status).borderColor}`}
                                    >
                                        {getKycStatusInfo(kycDocuments.identityCard.status).label}
                                    </Badge>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-44">
                                    {kycDocuments.identityCard.fileName ? (
                                        <div className="space-y-2">
                                            <FileText className="h-8 w-8 mx-auto text-blue-600" />
                                            <p className="text-sm font-medium">{kycDocuments.identityCard.fileName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Téléchargé le{' '}
                                                {new Date(kycDocuments.identityCard.uploadDate!).toLocaleDateString(
                                                    'fr-FR'
                                                )}
                                            </p>
                                            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                                                <Upload className="h-4 w-4 mr-2" />
                                                Remplacer
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-8 w-8 mx-auto text-gray-400" />
                                            <p className="text-sm text-muted-foreground">
                                                Glissez votre carte d'identité ici
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={kycUploading === 'identityCard'}
                                            >
                                                {kycUploading === 'identityCard'
                                                    ? 'Téléchargement...'
                                                    : 'Choisir un fichier'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Licence commerciale */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Licence Commerciale</Label>
                                    <Badge
                                        variant="outline"
                                        className={`${getKycStatusInfo(kycDocuments.businessLicense.status).bgColor} ${getKycStatusInfo(kycDocuments.businessLicense.status).color} ${getKycStatusInfo(kycDocuments.businessLicense.status).borderColor}`}
                                    >
                                        {getKycStatusInfo(kycDocuments.businessLicense.status).label}
                                    </Badge>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-44">
                                    {kycDocuments.businessLicense.fileName ? (
                                        <div className="space-y-2">
                                            <FileText className="h-8 w-8 mx-auto text-blue-600" />
                                            <p className="text-sm font-medium">{kycDocuments.businessLicense.fileName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Téléchargé le{' '}
                                                {new Date(kycDocuments.businessLicense.uploadDate!).toLocaleDateString(
                                                    'fr-FR'
                                                )}
                                            </p>
                                            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                                                <Upload className="h-4 w-4 mr-2" />
                                                Remplacer
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-8 w-8 mx-auto text-gray-400" />
                                            <p className="text-sm text-muted-foreground">
                                                Licence d'exploitation commerciale
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={kycUploading === 'businessLicense'}
                                            >
                                                {kycUploading === 'businessLicense'
                                                    ? 'Téléchargement...'
                                                    : 'Choisir un fichier'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Certificat fiscal */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Certificat Fiscal</Label>
                                    <Badge
                                        variant="outline"
                                        className={`${getKycStatusInfo(kycDocuments.taxCertificate.status).bgColor} ${getKycStatusInfo(kycDocuments.taxCertificate.status).color} ${getKycStatusInfo(kycDocuments.taxCertificate.status).borderColor}`}
                                    >
                                        {getKycStatusInfo(kycDocuments.taxCertificate.status).label}
                                    </Badge>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-44">
                                    <div className="space-y-2">
                                        <Upload className="h-8 w-8 mx-auto text-gray-400" />
                                        <p className="text-sm text-muted-foreground">Certificat de situation fiscale</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={kycUploading === 'taxCertificate'}
                                        >
                                            {kycUploading === 'taxCertificate'
                                                ? 'Téléchargement...'
                                                : 'Choisir un fichier'}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Relevé bancaire */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Relevé Bancaire</Label>
                                    <Badge
                                        variant="outline"
                                        className={`${getKycStatusInfo(kycDocuments.bankStatement.status).bgColor} ${getKycStatusInfo(kycDocuments.bankStatement.status).color} ${getKycStatusInfo(kycDocuments.bankStatement.status).borderColor}`}
                                    >
                                        {getKycStatusInfo(kycDocuments.bankStatement.status).label}
                                    </Badge>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-44">
                                    {kycDocuments.bankStatement.fileName ? (
                                        <div className="space-y-2">
                                            <FileText className="h-8 w-8 mx-auto text-blue-600" />
                                            <p className="text-sm font-medium">{kycDocuments.bankStatement.fileName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Téléchargé le{' '}
                                                {new Date(kycDocuments.bankStatement.uploadDate!).toLocaleDateString(
                                                    'fr-FR'
                                                )}
                                            </p>
                                            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                                                <Upload className="h-4 w-4 mr-2" />
                                                Remplacer
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-8 w-8 mx-auto text-gray-400" />
                                            <p className="text-sm text-muted-foreground">
                                                Relevé bancaire récent (3 mois)
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={kycUploading === 'bankStatement'}
                                            >
                                                {kycUploading === 'bankStatement'
                                                    ? 'Téléchargement...'
                                                    : 'Choisir un fichier'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-blue-900">Pourquoi ces documents ?</h4>
                                    <p className="text-sm text-blue-700">
                                        La vérification KYC nous permet de sécuriser la plateforme et de respecter les
                                        réglementations. Vos documents sont traités de manière confidentielle et
                                        sécurisée.
                                    </p>
                                    <ul className="text-xs text-blue-600 mt-2 space-y-1">
                                        <li>• Formats acceptés: PDF, JPG, PNG (max 5MB)</li>
                                        <li>• Vérification sous 24-48h ouvrées</li>
                                        <li>• Documents stockés de manière sécurisée</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Statistiques
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {stats.map((stat, index) => (
                                <div key={index} className="flex items-center justify-between">
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
                            <CardTitle>Préférences</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Notifications Email</span>
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                    Activées
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Notifications SMS</span>
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                    Activées
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Suivi GPS</span>
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                    Activé
                                </Badge>
                            </div>
                            <Separator />
                            <Button variant="outline" className="w-full bg-transparent">
                                Gérer les Préférences
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default AffreteurProfile;
