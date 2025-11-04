import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useProfileTranslation,
  useCommonTranslation,
  useErrorsTranslation,
} from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Bell,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Copy,
  RefreshCw,
  Save,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import PasswordChangeForm from '@/components/forms/PasswordChangeForm';

interface MFAStatus {
  enabled: boolean;
  setupRequired: boolean;
  backupCodes: string[];
  qrCode?: string;
  secret?: string;
}

export default function ClientSettings() {
  const { user } = useAuth();
  const { t: tProfile } = useProfileTranslation();
  const { t: tCommon } = useCommonTranslation();
  const { t: tErrors } = useErrorsTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({
    enabled: user?.mfaEnabled || false,
    setupRequired: false,
    backupCodes: [],
  });
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    productRecommendations: false,
    securityAlerts: true,
  });

  const handleSaveSettings = async () => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(tProfile('settings.saveSuccess'));
      setTimeout(() => {}, 3000);
    } catch (error) {
      console.error(error);
      toast.error(tErrors('general.saveError'));
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
          toast.success(tProfile('settings.security.mfa.disableSuccess'));
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(tErrors('profile.configError'));
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
        toast.success(tProfile('settings.security.mfa.enableSuccess'));
      } else {
        toast.error(tErrors('profile.invalidCode'));
      }
    } catch (error) {
      console.error(error);
      toast.error(tErrors('profile.enableError'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(tCommon('copied'));
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {tProfile('settings.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {tProfile('client.subtitle')}
          </p>
        </div>
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="gap-2 w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
        >
          <Save className="h-3 w-3 sm:h-4 sm:w-4" />
          {isLoading ? tProfile('settings.saving') : tProfile('settings.save')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {tProfile('settings.notifications.title')}
            </CardTitle>
            <CardDescription>{tProfile('client.notificationsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{tProfile('client.orderUpdates')}</div>
                  <div className="text-sm text-gray-600">
                    {tProfile('client.orderUpdatesDescription')}
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
                  <div className="font-medium">{tProfile('client.promotions')}</div>
                  <div className="text-sm text-gray-600">
                    {tProfile('client.promotionsDescription')}
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
                  <div className="font-medium">{tProfile('client.productRecommendations')}</div>
                  <div className="text-sm text-gray-600">
                    {tProfile('client.productRecommendationsDescription')}
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
                  <div className="font-medium">{tProfile('client.securityAlerts')}</div>
                  <div className="text-sm text-gray-600">
                    {tProfile('client.securityAlertsDescription')}
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
          </CardContent>
        </Card>

        {/* Shopping Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              {tProfile('client.shoppingPreferences')}
            </CardTitle>
            <CardDescription>{tProfile('client.shoppingPreferencesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">{tProfile('client.deliveryPreferences')}</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="radio" name="delivery" className="rounded" defaultChecked />
                    <span className="text-sm">{tProfile('client.standardDelivery')}</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" name="delivery" className="rounded" />
                    <span className="text-sm">{tProfile('client.expressDelivery')}</span>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {tProfile('settings.security.title')}
            </CardTitle>
            <CardDescription>{tProfile('client.securityDescription')}</CardDescription>
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
                    {tProfile('settings.security.mfa.title')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {tProfile('settings.security.mfa.description')}
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
                  <AlertDescription>{tProfile('settings.security.mfa.enabled')}</AlertDescription>
                </Alert>
              )}

              {mfaStatus.setupRequired && (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                  <h5 className="font-medium">{tProfile('settings.security.mfa.setup')}</h5>

                  {mfaStatus.qrCode && (
                    <div className="space-y-3">
                      <p className="text-sm">{tProfile('settings.security.mfa.scanQR')}</p>
                      <div className="flex justify-center">
                        <img src={mfaStatus.qrCode} alt="QR Code MFA" className="border rounded" />
                      </div>

                      <p className="text-sm">{tProfile('settings.security.mfa.manualKey')}</p>
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
                          {tProfile('settings.security.mfa.enterCode')}
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
                            {tProfile('settings.security.mfa.enable')}
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
                    <h5 className="font-medium">{tProfile('settings.security.mfa.backupCodes')}</h5>
                  </div>
                  <p className="text-sm text-yellow-800">
                    {tProfile('settings.security.mfa.backupCodesDescription')}
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
                    {tProfile('settings.security.mfa.regenerateCodes')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        {/* <Card>
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
        </Card> */}
      </div>
    </div>
  );
}
