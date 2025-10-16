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
  Key,
  CheckCircle,
  Copy,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authService } from '@/services/auth.service';

interface MFAStatus {
  enabled: boolean;
  setupRequired: boolean;
  backupCodes: string[];
  qrCode?: string;
  secret?: string;
}

function TransporteurSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({
    enabled: user?.mfaEnabled || false,
    setupRequired: false,
    backupCodes: [],
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
    newMissions: true,
    routeUpdates: true,
    paymentAlerts: true,
    weeklyReports: true,
  });

  const [preferences, setPreferences] = useState({
    language: 'fr',
    currency: 'FCFA',
    timezone: 'Africa/Douala',
    autoAccept: false,
    maxDistance: 500,
    workingHours: { start: '06:00', end: '20:00' },
    vehicleType: 'truck',
    maxWeight: 5000,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  if (!user) return null;

  const handleSaveSettings = async () => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Paramètres sauvegardés avec succès');
      setTimeout(() => {}, 3000);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      setIsLoading(true);

      const response = await authService.updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (response.error) {
        toast.error(response.error.message || 'Erreur lors de la modification du mot de passe');
      }

      if (response.data) {
        toast.success('Mot de passe modifié avec succès');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAToggle = async (enabled: boolean) => {
    try {
      setIsLoading(true);

      if (enabled) {
        // Initialize MFA setup
        const response = await fetch('/api/auth/mfa/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMfaStatus({
            enabled: false,
            setupRequired: true,
            backupCodes: [],
            qrCode: data.qrCode,
            secret: data.secret,
          });
        }
      } else {
        // Disable MFA
        const response = await fetch('/api/auth/mfa/disable', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (response.ok) {
          setMfaStatus({
            enabled: false,
            setupRequired: false,
            backupCodes: [],
          });
          toast.success('MFA désactivé avec succès');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la configuration MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAEnable = async (code: string) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const data = await response.json();
        setMfaStatus({
          enabled: true,
          setupRequired: false,
          backupCodes: data.backupCodes || [],
        });
        toast.success('MFA activé avec succès');
      } else {
        toast.error('Code invalide');
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'activation MFA");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papiers');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
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

            <div className="flex items-center justify-between">
              <span className="text-sm">Rapports hebdomadaires</span>
              <Switch
                checked={notifications.weeklyReports}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, weeklyReports: checked })
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
              <Label>Devise</Label>
              <Select
                value={preferences.currency}
                onValueChange={(value) => setPreferences({ ...preferences, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FCFA">FCFA</SelectItem>
                  <SelectItem value="EUR">Euro</SelectItem>
                  <SelectItem value="USD">Dollar US</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fuseau Horaire</Label>
              <Select
                value={preferences.timezone}
                onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Douala">Afrique/Douala</SelectItem>
                  <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type de véhicule</Label>
              <Select
                value={preferences.vehicleType}
                onValueChange={(value) => setPreferences({ ...preferences, vehicleType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Camion</SelectItem>
                  <SelectItem value="van">Camionnette</SelectItem>
                  <SelectItem value="motorcycle">Moto</SelectItem>
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
              <Label>Poids maximum (kg)</Label>
              <div className="relative">
                <Truck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={preferences.maxWeight}
                  onChange={(e) =>
                    setPreferences({ ...preferences, maxWeight: Number(e.target.value) })
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
          <CardContent className="space-y-6">
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
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    placeholder="Confirmer le mot de passe"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Changer le mot de passe
              </h4>

              <Button
                onClick={handlePasswordChange}
                disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword}
                className="w-full md:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Modification...' : 'Changer le mot de passe'}
              </Button>
            </div>

            <Separator />

            {/* MFA Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Authentification à deux facteurs (MFA)
                  </h4>
                  <p className="text-sm text-gray-600">
                    Ajoutez une couche de sécurité supplémentaire à votre compte
                  </p>
                </div>
                <Switch
                  checked={mfaStatus.enabled}
                  onCheckedChange={handleMFAToggle}
                  disabled={isLoading}
                />
              </div>

              {mfaStatus.enabled && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    MFA est activé sur votre compte. Votre compte est protégé.
                  </AlertDescription>
                </Alert>
              )}

              {mfaStatus.setupRequired && (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                  <h5 className="font-medium">Configuration MFA</h5>

                  {mfaStatus.qrCode && (
                    <div className="space-y-3">
                      <p className="text-sm">
                        1. Scannez ce QR code avec votre application d'authentification (Google
                        Authenticator, Authy, etc.)
                      </p>
                      <div className="flex justify-center">
                        <img src={mfaStatus.qrCode} alt="QR Code MFA" className="border rounded" />
                      </div>

                      <p className="text-sm">2. Ou entrez manuellement cette clé secrète :</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                          {mfaStatus.secret}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(mfaStatus.secret || '')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mfaCode">
                          3. Entrez le code à 6 chiffres de votre application
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="mfaCode"
                            placeholder="000000"
                            maxLength={6}
                            className="w-32"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value.length === 6) {
                                handleMFAEnable(e.currentTarget.value);
                              }
                            }}
                          />
                          <Button
                            onClick={(e) => {
                              const input = e.currentTarget
                                .previousElementSibling as HTMLInputElement;
                              if (input.value.length === 6) {
                                handleMFAEnable(input.value);
                              }
                            }}
                            disabled={isLoading}
                          >
                            Activer MFA
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mfaStatus.backupCodes.length > 0 && (
                <div className="space-y-3 p-4 border rounded-lg bg-yellow-50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <h5 className="font-medium">Codes de récupération</h5>
                  </div>
                  <p className="text-sm text-yellow-800">
                    Conservez ces codes en lieu sûr. Ils vous permettront d'accéder à votre compte
                    si vous perdez votre téléphone.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {mfaStatus.backupCodes.map((code, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-white rounded text-sm font-mono border">
                          {code}
                        </code>
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(code)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Régénérer les codes
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TransporteurSettings;
