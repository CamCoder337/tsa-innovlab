import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import {
  Bell,
  Shield,
  Save,
  Smartphone,
  Mail,
  CheckCircle,
  Copy,
  AlertTriangle,
  RefreshCw,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';
import PasswordChangeForm from '@/components/forms/PasswordChangeForm';
import { useAdminTranslation } from '@/hooks/useTranslation';

interface MFAStatus {
  enabled: boolean;
  setupRequired: boolean;
  backupCodes: string[];
  qrCode?: string;
  secret?: string;
}

function AdminSettings() {
  const { user } = useAuth();
  const { t } = useAdminTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({
    enabled: user?.mfaEnabled || false,
    setupRequired: false,
    backupCodes: [],
  });
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
    systemAlerts: true,
    userRegistrations: true,
    securityEvents: true,
    performanceAlerts: true,
    dailyReports: true,
    weeklyReports: true,
  });
  const [preferences, setPreferences] = useState({
    language: 'fr',
    timezone: 'Africa/Douala',
    sessionTimeout: 30,
    auditLogRetention: 90,
    backupFrequency: 'daily',
    maintenanceMode: false,
  });
  const [systemSettings, setSystemSettings] = useState({
    maxFileSize: 10,
    allowedFileTypes: ['pdf', 'jpg', 'png', 'docx'],
    rateLimitRequests: 100,
    rateLimitWindow: 15,
    enableRegistration: true,
    requireEmailVerification: true,
    enableMFA: true,
  });

  if (!user) return null;

  const handleSaveSettings = async () => {
    setIsLoading(true);

    try {
      // Simulate API call for admin settings
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(t('settings.saveSuccess'));
    } catch (error) {
      console.error(error);
      toast.error(t('settings.saveError'));
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
          toast.success(t('settings.mfaDisabled'));
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(t('settings.mfaError'));
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
    toast.success(t('settings.copiedToClipboard'));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isLoading} className="gap-2">
          <Save className="h-4 w-4" />
          {isLoading ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('settings.adminNotifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('settings.emailNotifications')}</span>
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
                <span className="text-sm">{t('settings.smsNotifications')}</span>
              </div>
              <Switch
                checked={notifications.sms}
                onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('settings.pushNotifications')}</span>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm">{t('settings.systemAlerts')}</span>
              <Switch
                checked={notifications.systemAlerts}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, systemAlerts: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">{t('settings.userRegistrations')}</span>
              <Switch
                checked={notifications.userRegistrations}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, userRegistrations: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">{t('settings.securityEvents')}</span>
              <Switch
                checked={notifications.securityEvents}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, securityEvents: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">{t('settings.performanceAlerts')}</span>
              <Switch
                checked={notifications.performanceAlerts}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, performanceAlerts: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">{t('settings.dailyReports')}</span>
              <Switch
                checked={notifications.dailyReports}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, dailyReports: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">{t('settings.weeklyReports')}</span>
              <Switch
                checked={notifications.weeklyReports}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, weeklyReports: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('settings.systemSettings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>{t('settings.defaultLanguage')}</Label>
                <Select
                  value={preferences.language}
                  onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">{t('settings.french')}</SelectItem>
                    <SelectItem value="en">{t('settings.english')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('settings.timezone')}</Label>
                <Select
                  value={preferences.timezone}
                  onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Douala">{t('settings.africaDouala')}</SelectItem>
                    <SelectItem value="Europe/Paris">{t('settings.europeParis')}</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>{t('settings.sessionTimeout')}</Label>
                <Select
                  value={preferences.sessionTimeout.toString()}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, sessionTimeout: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">{t('settings.minutes15')}</SelectItem>
                    <SelectItem value="30">{t('settings.minutes30')}</SelectItem>
                    <SelectItem value="60">{t('settings.hour1')}</SelectItem>
                    <SelectItem value="120">{t('settings.hours2')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('settings.backupFrequency')}</Label>
                <Select
                  value={preferences.backupFrequency}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, backupFrequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">{t('settings.hourly')}</SelectItem>
                    <SelectItem value="daily">{t('settings.daily')}</SelectItem>
                    <SelectItem value="weekly">{t('settings.weekly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm">{t('settings.maintenanceMode')}</span>
              <Switch
                checked={preferences.maintenanceMode}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, maintenanceMode: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">{t('settings.enableRegistration')}</span>
              <Switch
                checked={systemSettings.enableRegistration}
                onCheckedChange={(checked) =>
                  setSystemSettings({ ...systemSettings, enableRegistration: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">{t('settings.requireEmailVerification')}</span>
              <Switch
                checked={systemSettings.requireEmailVerification}
                onCheckedChange={(checked) =>
                  setSystemSettings({ ...systemSettings, requireEmailVerification: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('settings.security')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Password Change Form */}
            <PasswordChangeForm isLoading={isLoading} setIsLoading={setIsLoading} />

            <Separator />

            {/* MFA Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    {t('settings.mfaTitle')}
                  </h4>
                  <p className="text-sm text-gray-600">{t('settings.mfaDescription')}</p>
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
                  <AlertDescription>{t('settings.mfaEnabled')}</AlertDescription>
                </Alert>
              )}

              {mfaStatus.setupRequired && (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                  <h5 className="font-medium">{t('settings.mfaSetup')}</h5>

                  {mfaStatus.qrCode && (
                    <div className="space-y-3">
                      <p className="text-sm">{t('settings.scanQrCode')}</p>
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
                          <input
                            id="mfaCode"
                            placeholder="000000"
                            maxLength={6}
                            className="w-32 px-3 py-2 border rounded-md"
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
                    administrateur si vous perdez votre téléphone.
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

export default AdminSettings;
