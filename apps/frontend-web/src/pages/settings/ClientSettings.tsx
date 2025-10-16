import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Shield,
  Key,
  Bell,
  Eye,
  EyeOff,
  Smartphone,
  Lock,
  AlertTriangle,
  CheckCircle,
  Copy,
  RefreshCw,
  Save,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MFAStatus {
  enabled: boolean;
  setupRequired: boolean;
  backupCodes: string[];
  qrCode?: string;
  secret?: string;
}

export default function ClientSettings() {
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

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    productRecommendations: false,
    securityAlerts: true,
  });

  // Password Change Handler
  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        toast.success('Mot de passe modifié avec succès');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la modification du mot de passe');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  // MFA Management
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
          <p className="text-gray-600">Gérez vos préférences et sécurité</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <Settings className="h-3 w-3 mr-1" />
          Client
        </Badge>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité
          </CardTitle>
          <CardDescription>
            Protégez votre compte avec des mesures de sécurité avancées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Password Change */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              Changer le mot de passe
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
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
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
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
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
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

            <Button
              onClick={handlePasswordChange}
              disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword}
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
                  Conservez ces codes en lieu sûr. Ils vous permettront d'accéder à votre compte si
                  vous perdez votre téléphone.
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

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choisissez les notifications que vous souhaitez recevoir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Mises à jour de commandes</div>
                <div className="text-sm text-gray-600">
                  Notifications sur le statut de vos commandes
                </div>
              </div>
              <Switch
                checked={notifications.orderUpdates}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, orderUpdates: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Promotions et offres</div>
                <div className="text-sm text-gray-600">
                  Recevez nos meilleures offres et promotions
                </div>
              </div>
              <Switch
                checked={notifications.promotions}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, promotions: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Recommandations de produits</div>
                <div className="text-sm text-gray-600">
                  Suggestions personnalisées basées sur vos achats
                </div>
              </div>
              <Switch
                checked={notifications.productRecommendations}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, productRecommendations: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Alertes de sécurité</div>
                <div className="text-sm text-gray-600">
                  Notifications importantes sur la sécurité de votre compte
                </div>
              </div>
              <Switch
                checked={notifications.securityAlerts}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, securityAlerts: checked })
                }
              />
            </div>
          </div>

          <Button className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder les préférences
          </Button>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Informations du compte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">ID du compte</Label>
              <div className="font-mono text-sm">{user.id}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Dernière connexion</Label>
              <div className="text-sm">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('fr-FR') : 'Jamais'}
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Statut du compte</Label>
              <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                {user.status}
              </Badge>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Email vérifié</Label>
              <Badge variant={user.emailVerifiedAt ? 'default' : 'destructive'}>
                {user.emailVerifiedAt ? 'Vérifié' : 'Non vérifié'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
