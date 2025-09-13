import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
    Bell,
    Shield,
    Eye,
    EyeOff,
    Save,
    Smartphone,
    Mail,
    MapPin,
    Truck,
    Clock,
} from 'lucide-react';

function TransporteurSettings() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [notifications, setNotifications] = useState({
        email: true,
        sms: true,
        push: true,
        newMissions: true,
        routeUpdates: true,
        paymentAlerts: true,
    });

    const [preferences, setPreferences] = useState({
        language: 'fr',
        currency: 'FCFA',
        timezone: 'Africa/Douala',
        autoAccept: false,
        maxDistance: 500,
        workingHours: { start: '06:00', end: '20:00' },
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    if (!user) return null;

    const handleSaveSettings = async () => {
        setIsLoading(true);
        setMessage('');

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setMessage('Paramètres sauvegardés avec succès');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error(error);
            setMessage('Erreur lors de la sauvegarde');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage('Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setMessage('Mot de passe modifié avec succès');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error(error);
            setMessage('Erreur lors du changement de mot de passe');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
                    <p className="text-muted-foreground">
                        Configurez vos préférences de travail et paramètres de compte
                    </p>
                </div>
                <Button onClick={handleSaveSettings} disabled={isLoading} className="gap-2">
                    <Save className="h-4 w-4" />
                    {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
            </div>

            {message && (
                <Alert className={message.includes('succès') ? 'border-green-200 bg-green-50' : ''}>
                    <AlertDescription className={message.includes('succès') ? 'text-green-800' : ''}>
                        {message}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Notifications Email</span>
                            </div>
                            <Switch
                                checked={notifications.email}
                                onCheckedChange={(checked) =>
                                    setNotifications({ ...notifications, email: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Notifications SMS</span>
                            </div>
                            <Switch
                                checked={notifications.sms}
                                onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Notifications Push</span>
                            </div>
                            <Switch
                                checked={notifications.push}
                                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                            />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <span className="text-sm">Nouvelles missions</span>
                            <Switch
                                checked={notifications.newMissions}
                                onCheckedChange={(checked) =>
                                    setNotifications({ ...notifications, newMissions: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm">Mises à jour d'itinéraire</span>
                            <Switch
                                checked={notifications.routeUpdates}
                                onCheckedChange={(checked) =>
                                    setNotifications({ ...notifications, routeUpdates: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm">Alertes de paiement</span>
                            <Switch
                                checked={notifications.paymentAlerts}
                                onCheckedChange={(checked) =>
                                    setNotifications({ ...notifications, paymentAlerts: checked })
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Préférences de Travail
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Langue</Label>
                            <Select
                                value={preferences.language}
                                onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fr">Français</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Distance maximale (km)</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    value={preferences.maxDistance}
                                    onChange={(e) =>
                                        setPreferences({ ...preferences, maxDistance: Number(e.target.value) })
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Heures de travail</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="time"
                                        value={preferences.workingHours.start}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                workingHours: { ...preferences.workingHours, start: e.target.value },
                                            })
                                        }
                                        className="pl-10"
                                    />
                                </div>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="time"
                                        value={preferences.workingHours.end}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                workingHours: { ...preferences.workingHours, end: e.target.value },
                                            })
                                        }
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <span className="text-sm">Acceptation automatique</span>
                            <Switch
                                checked={preferences.autoAccept}
                                onCheckedChange={(checked) =>
                                    setPreferences({ ...preferences, autoAccept: checked })
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Sécurité
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={passwordData.currentPassword}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                        }
                                        placeholder="Mot de passe actuel"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={passwordData.newPassword}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                                        }
                                        placeholder="Nouveau mot de passe"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                    }
                                    placeholder="Confirmer le mot de passe"
                                />
                            </div>
                        </div>

                        <Button onClick={handlePasswordChange} disabled={isLoading} className="gap-2">
                            <Shield className="h-4 w-4" />
                            Changer le Mot de Passe
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default TransporteurSettings;
