import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileTranslation, useCommonTranslation } from '@/hooks/useTranslation';
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
  Save,
  Smartphone,
  Mail,
  MapPin,
  Truck,
  Clock,
  CheckCircle,
  Copy,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import PasswordChangeForm from '@/components/forms/PasswordChangeForm';
import { authService } from '@/services/auth.service';

interface MFAStatus {
  enabled: boolean;
  setupRequired: boolean;
  backupCodes: string[];
  key?: string;
  secret?: string;
}

function TransporteurSettings() {
  const { user } = useAuth();
  const { t } = useProfileTranslation();
  const { t: tCommon } = useCommonTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({
    enabled: user?.mfaEnabled || false,
    setupRequired: user?.mfaEnabled || false,
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

  if (!user) return null;

  const handleSaveSettings = async () => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(t('settings.saveSuccess'));
      setTimeout(() => {}, 3000);
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
        const response = await authService.setupMFA();

        if (response.error) {
          console.error(response.error);
          toast.error(response.error?.message);
        }

        if (response.data) {
          const status = await authService.statusMFA();

          if (status.error) {
            console.error(status.error);
            toast.error(status.error?.message);
          }

          if (status.data) {
            setMfaStatus({
              enabled: status.data.mfaEnabled,
              setupRequired: true,
              backupCodes: response.data.recoveryCodes,
              key: response.data.manualEntryKey,
              secret: response.data.secret,
            });
          }
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
          toast.success(t('settings.security.mfa.disableSuccess'));
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(t('settings.security.mfa.configError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAEnable = async (code: string) => {
    try {
      setIsLoading(true);

      const response = await authService.enableMFA(code);

      if (response.error) {
        console.error(response.error);
        toast.error(response.error?.message || t('settings.security.mfa.invalidCode'));
      }

      if (response.data) {
        const status = await authService.statusMFA();

        if (status.error) {
          console.error(status.error);
          toast.error(status.error?.message);
        }

        if (status.data) {
          setMfaStatus({
            ...mfaStatus,
            enabled: status.data.mfaEnabled,
            setupRequired: true,
          });
        }
        toast.success(t('settings.security.mfa.enableSuccess'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('settings.security.mfa.enableError'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(tCommon('copied'));
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('settings.notifications.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('settings.notifications.email')}</span>
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
                <span className="text-sm">{t('settings.notifications.sms')}</span>
              </div>
              <Switch
                checked={notifications.sms}
                onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('settings.notifications.push')}</span>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm">{t('settings.notifications.missionUpdates')}</span>
              <Switch
                checked={notifications.newMissions}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, newMissions: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">{t('client.routeUpdates')}</span>
              <Switch
                checked={notifications.routeUpdates}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, routeUpdates: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">{t('client.paymentAlerts')}</span>
              <Switch
                checked={notifications.paymentAlerts}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, paymentAlerts: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">{t('settings.notifications.weeklyReports')}</span>
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
              {t('settings.preferences.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Label>{t('settings.preferences.language')}</Label>
                <Select
                  value={preferences.language}
                  onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">{t('settings.preferences.french')}</SelectItem>
                    <SelectItem value="en">{t('settings.preferences.english')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('settings.preferences.currency')}</Label>
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
                <Label>{t('settings.preferences.timezone')}</Label>
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
            </div>

            {/* <div className="space-y-2">
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
            </div> */}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>{t('client.maxDistance')}</Label>
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
                <Label>{t('client.maxWeight')}</Label>
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
            </div>

            <div className="space-y-2">
              <Label>{t('client.workingHours')}</Label>
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
              <span className="text-sm">{t('client.autoAccept')}</span>
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
              {t('settings.security.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <PasswordChangeForm isLoading={isLoading} setIsLoading={setIsLoading} />

            <Separator />

            {/* MFA Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    {t('settings.security.mfa.title')}
                  </h4>
                  <p className="text-sm text-gray-600">{t('settings.security.mfa.description')}</p>
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
                  <AlertDescription>{t('settings.security.mfa.enabled')}</AlertDescription>
                </Alert>
              )}

              {mfaStatus.setupRequired && (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                  <h5 className="font-medium">{t('settings.security.mfa.setup')}</h5>

                  {mfaStatus.key && (
                    <div className="space-y-3">
                      <p className="text-sm">{t('settings.security.mfa.scanQR')}</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                          {mfaStatus.key}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(mfaStatus.key || '')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      <p className="text-sm">{t('settings.security.mfa.manualKey')}</p>
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
                        <Label htmlFor="mfaCode">{t('settings.security.mfa.enterCode')}</Label>
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
                            {t('settings.security.mfa.enable')}
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
                    <h5 className="font-medium">{t('settings.security.mfa.backupCodes')}</h5>
                  </div>
                  <p className="text-sm text-yellow-800">
                    {t('settings.security.mfa.backupCodesDescription')}
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
                    {t('settings.security.mfa.regenerateCodes')}
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
