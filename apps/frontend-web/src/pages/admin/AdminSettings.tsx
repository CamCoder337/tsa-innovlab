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
import { Settings, Shield, Save, Server, Eye, EyeOff } from 'lucide-react';

function AdminSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [platform, setPlatform] = useState({
    maintenanceMode: false,
    logsRetentionDays: 30,
    region: 'eu-central',
    enablePublicSignup: true,
  });

  const [security, setSecurity] = useState({
    enforce2FA: true,
    blockLegacyTLS: true,
    sessionTimeoutMinutes: 60,
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
      await new Promise((r) => setTimeout(r, 1000));
      setMessage('Paramètres administrateur sauvegardés avec succès');
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
      await new Promise((r) => setTimeout(r, 1000));
      setMessage('Mot de passe administrateur modifié avec succès');
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex">
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Paramètres Administrateur</h1>
                <p className="text-muted-foreground">
                  Configurez la plateforme, la sécurité et les préférences globales
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
                    <Server className="h-5 w-5" />
                    Plateforme
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mode maintenance</span>
                    <Switch
                      checked={platform.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setPlatform({ ...platform, maintenanceMode: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rétention des logs (jours)</Label>
                    <Input
                      type="number"
                      value={platform.logsRetentionDays}
                      onChange={(e) =>
                        setPlatform({ ...platform, logsRetentionDays: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Région</Label>
                    <Select
                      value={platform.region}
                      onValueChange={(value) => setPlatform({ ...platform, region: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eu-central">EU Central</SelectItem>
                        <SelectItem value="eu-west">EU West</SelectItem>
                        <SelectItem value="us-east">US East</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Inscription publique</span>
                    <Switch
                      checked={platform.enablePublicSignup}
                      onCheckedChange={(checked) =>
                        setPlatform({ ...platform, enablePublicSignup: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Sécurité
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Forcer l'authentification 2FA</span>
                    <Switch
                      checked={security.enforce2FA}
                      onCheckedChange={(checked) =>
                        setSecurity({ ...security, enforce2FA: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bloquer TLS obsolète</span>
                    <Switch
                      checked={security.blockLegacyTLS}
                      onCheckedChange={(checked) =>
                        setSecurity({ ...security, blockLegacyTLS: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expiration session (minutes)</Label>
                    <Input
                      type="number"
                      value={security.sessionTimeoutMinutes}
                      onChange={(e) =>
                        setSecurity({ ...security, sessionTimeoutMinutes: Number(e.target.value) })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Compte Administrateur
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
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
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
        </main>
      </div>
    </div>
  );
}

export default AdminSettings;
