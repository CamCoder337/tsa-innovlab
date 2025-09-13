import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
    User,
    Mail,
    Phone,
    Calendar,
    Star,
    Truck,
    TrendingUp,
    Edit,
    Save,
    X,
    Shield,
    Award,
    Upload,
    FileText,
    CheckCircle,
    AlertCircle,
    Clock,
} from 'lucide-react';

function TransporteurProfile() {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [kycUploading, setKycUploading] = useState<string | null>(null);
    const [kycDocuments, setKycDocuments] = useState({
        identityCard: { status: 'verified', fileName: 'carte_identite.pdf', uploadDate: '2024-01-15' },
        drivingLicense: {
            status: 'verified',
            fileName: 'permis_conduire.pdf',
            uploadDate: '2024-01-12',
        },
        vehicleRegistration: {
            status: 'pending',
            fileName: 'carte_grise.pdf',
            uploadDate: '2024-01-20',
        },
        insurance: { status: 'verified', fileName: 'assurance_vehicule.pdf', uploadDate: '2024-01-10' },
        technicalControl: { status: 'missing', fileName: null, uploadDate: null },
        professionalLicense: {
            status: 'verified',
            fileName: 'licence_transport.pdf',
            uploadDate: '2024-01-08',
        },
    });

    const [formData, setFormData] = useState({
        name: user?.firstName || '',
        surname: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || ''
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
        { label: 'Missions Terminées', value: '89', icon: Truck },
        { label: 'Note Moyenne', value: '4.9/5', icon: Star },
        { label: 'Taux de Réussite', value: '98%', icon: Award },
        { label: 'Membre Depuis', value: 'Jan 2024', icon: Calendar },
    ];

    const vehicleInfo = {
        model: 'Mercedes Actros',
        plate: 'CM-123-AB',
        capacity: '25 tonnes',
        mileage: '45,230 km',
    };

    const kycProgress = Object.values(kycDocuments).filter((doc) => doc.status === 'verified').length;
    const totalKycDocs = Object.keys(kycDocuments).length;
    const kycPercentage = (kycProgress / totalKycDocs) * 100;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
                    <p className="text-muted-foreground">
                        Gérez vos informations personnelles et votre véhicule
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
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Transporteur
                                </Badge>
                                <div className="flex items-center gap-2 mt-1">
                                    <Shield className="h-4 w-4 text-green-600" />
                                    <span className="text-sm text-green-600">Vérifié</span>
                                </div>
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
                            Documents KYC & Certifications Transport
                            <Badge
                                variant="outline"
                                className={`ml-auto ${kycPercentage === 100 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
                            >
                                {kycProgress}/{totalKycDocs} Vérifiés
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                            <p className="text-xs font-medium">{kycDocuments.identityCard.fileName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Téléchargé le{' '}
                                                {new Date(kycDocuments.identityCard.uploadDate!).toLocaleDateString(
                                                    'fr-FR'
                                                )}
                                            </p>
                                            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                                                <Upload className="h-3 w-3 mr-1" />
                                                Remplacer
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-6 w-6 mx-auto text-gray-400" />
                                            <p className="text-xs text-muted-foreground">Carte d'identité</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={kycUploading === 'identityCard'}
                                            >
                                                {kycUploading === 'identityCard' ? 'Upload...' : 'Choisir'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Permis de conduire */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Permis de Conduire</Label>
                                    <Badge
                                        variant="outline"
                                        className={`${getKycStatusInfo(kycDocuments.drivingLicense.status).bgColor} ${getKycStatusInfo(kycDocuments.drivingLicense.status).color} ${getKycStatusInfo(kycDocuments.drivingLicense.status).borderColor}`}
                                    >
                                        {getKycStatusInfo(kycDocuments.drivingLicense.status).label}
                                    </Badge>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-44">
                                    {kycDocuments.drivingLicense.fileName ? (
                                        <div className="space-y-2">
                                            <FileText className="h-8 w-8 mx-auto text-blue-600" />
                                            <p className="text-xs font-medium">{kycDocuments.drivingLicense.fileName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Téléchargé le{' '}
                                                {new Date(kycDocuments.drivingLicense.uploadDate!).toLocaleDateString(
                                                    'fr-FR'
                                                )}
                                            </p>
                                            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                                                <Upload className="h-3 w-3 mr-1" />
                                                Remplacer
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-6 w-6 mx-auto text-gray-400" />
                                            <p className="text-xs text-muted-foreground">Permis poids lourd</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={kycUploading === 'drivingLicense'}
                                            >
                                                {kycUploading === 'drivingLicense' ? 'Upload...' : 'Choisir'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Carte grise */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Carte Grise</Label>
                                    <Badge
                                        variant="outline"
                                        className={`${getKycStatusInfo(kycDocuments.vehicleRegistration.status).bgColor} ${getKycStatusInfo(kycDocuments.vehicleRegistration.status).color} ${getKycStatusInfo(kycDocuments.vehicleRegistration.status).borderColor}`}
                                    >
                                        {getKycStatusInfo(kycDocuments.vehicleRegistration.status).label}
                                    </Badge>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-44">
                                    {kycDocuments.vehicleRegistration.fileName ? (
                                        <div className="space-y-2">
                                            <FileText className="h-8 w-8 mx-auto text-blue-600" />
                                            <p className="text-xs font-medium">
                                                {kycDocuments.vehicleRegistration.fileName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Téléchargé le{' '}
                                                {new Date(kycDocuments.vehicleRegistration.uploadDate!).toLocaleDateString(
                                                    'fr-FR'
                                                )}
                                            </p>
                                            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                                                <Upload className="h-3 w-3 mr-1" />
                                                Remplacer
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-6 w-6 mx-auto text-gray-400" />
                                            <p className="text-xs text-muted-foreground">Immatriculation véhicule</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={kycUploading === 'vehicleRegistration'}
                                            >
                                                {kycUploading === 'vehicleRegistration' ? 'Upload...' : 'Choisir'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Assurance */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Assurance Véhicule</Label>
                                    <Badge
                                        variant="outline"
                                        className={`${getKycStatusInfo(kycDocuments.insurance.status).bgColor} ${getKycStatusInfo(kycDocuments.insurance.status).color} ${getKycStatusInfo(kycDocuments.insurance.status).borderColor}`}
                                    >
                                        {getKycStatusInfo(kycDocuments.insurance.status).label}
                                    </Badge>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-44">
                                    {kycDocuments.insurance.fileName ? (
                                        <div className="space-y-2">
                                            <FileText className="h-8 w-8 mx-auto text-blue-600" />
                                            <p className="text-xs font-medium">{kycDocuments.insurance.fileName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Téléchargé le{' '}
                                                {new Date(kycDocuments.insurance.uploadDate!).toLocaleDateString('fr-FR')}
                                            </p>
                                            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                                                <Upload className="h-3 w-3 mr-1" />
                                                Remplacer
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-6 w-6 mx-auto text-gray-400" />
                                            <p className="text-xs text-muted-foreground">Attestation assurance</p>
                                            <Button variant="outline" size="sm" disabled={kycUploading === 'insurance'}>
                                                {kycUploading === 'insurance' ? 'Upload...' : 'Choisir'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contrôle technique */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Contrôle Technique</Label>
                                    <Badge
                                        variant="outline"
                                        className={`${getKycStatusInfo(kycDocuments.technicalControl.status).bgColor} ${getKycStatusInfo(kycDocuments.technicalControl.status).color} ${getKycStatusInfo(kycDocuments.technicalControl.status).borderColor}`}
                                    >
                                        {getKycStatusInfo(kycDocuments.technicalControl.status).label}
                                    </Badge>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-44">
                                    <div className="space-y-2">
                                        <Upload className="h-6 w-6 mx-auto text-gray-400" />
                                        <p className="text-xs text-muted-foreground">Certificat contrôle technique</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={kycUploading === 'technicalControl'}
                                        >
                                            {kycUploading === 'technicalControl' ? 'Upload...' : 'Choisir'}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Licence professionnelle */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Licence Transport</Label>
                                    <Badge
                                        variant="outline"
                                        className={`${getKycStatusInfo(kycDocuments.professionalLicense.status).bgColor} ${getKycStatusInfo(kycDocuments.professionalLicense.status).color} ${getKycStatusInfo(kycDocuments.professionalLicense.status).borderColor}`}
                                    >
                                        {getKycStatusInfo(kycDocuments.professionalLicense.status).label}
                                    </Badge>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-44">
                                    {kycDocuments.professionalLicense.fileName ? (
                                        <div className="space-y-2">
                                            <FileText className="h-8 w-8 mx-auto text-blue-600" />
                                            <p className="text-xs font-medium">
                                                {kycDocuments.professionalLicense.fileName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Téléchargé le{' '}
                                                {new Date(kycDocuments.professionalLicense.uploadDate!).toLocaleDateString(
                                                    'fr-FR'
                                                )}
                                            </p>
                                            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                                                <Upload className="h-3 w-3 mr-1" />
                                                Remplacer
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-6 w-6 mx-auto text-gray-400" />
                                            <p className="text-xs text-muted-foreground">Licence professionnelle</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={kycUploading === 'professionalLicense'}
                                            >
                                                {kycUploading === 'professionalLicense' ? 'Upload...' : 'Choisir'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Truck className="h-5 w-5 text-green-600 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-green-900">Certification Transporteur</h4>
                                    <p className="text-sm text-green-700">
                                        Ces documents sont essentiels pour valider votre statut de transporteur
                                        professionnel et garantir la sécurité des missions sur la plateforme TSA
                                        Logistics.
                                    </p>
                                    <ul className="text-xs text-green-600 mt-2 space-y-1">
                                        <li>• Formats acceptés: PDF, JPG, PNG (max 5MB)</li>
                                        <li>• Vérification sous 24-48h ouvrées</li>
                                        <li>• Documents requis pour accepter des missions</li>
                                        <li>• Renouvellement automatique des alertes d'expiration</li>
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
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                Mon Véhicule
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Modèle</span>
                                <span className="font-semibold">{vehicleInfo.model}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Plaque</span>
                                <span className="font-semibold">{vehicleInfo.plate}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Capacité</span>
                                <span className="font-semibold">{vehicleInfo.capacity}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Kilométrage</span>
                                <span className="font-semibold">{vehicleInfo.mileage}</span>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>État Général</span>
                                    <span className="text-green-600">Excellent</span>
                                </div>
                                <Progress value={92} className="w-full" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Certifications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Permis Poids Lourd</span>
                                <Badge variant="outline" className="bg-green-50 text-green-700 ml-auto">
                                    Valide
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Assurance Véhicule</span>
                                <Badge variant="outline" className="bg-green-50 text-green-700 ml-auto">
                                    Valide
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Contrôle Technique</span>
                                <Badge variant="outline" className="bg-green-50 text-green-700 ml-auto">
                                    Valide
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default TransporteurProfile;
