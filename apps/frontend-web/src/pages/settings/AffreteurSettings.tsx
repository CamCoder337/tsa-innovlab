import { useState } from 'react'
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Settings, Bell, Shield, Eye, EyeOff, Save, Smartphone, Mail, Euro } from "lucide-react"

function AffreteurSettings() {
    const { user } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)

    const [notifications, setNotifications] = useState({
        email: true,
        sms: true,
        push: true,
        missionUpdates: true,
        priceAlerts: false,
        weeklyReports: true,
    })

    const [preferences, setPreferences] = useState({
        language: "fr",
        currency: "FCFA",
        timezone: "Africa/Douala",
        autoAssign: false,
        priceRange: { min: 1000, max: 10000 },
    })

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    if (!user) return null

    const handleSaveSettings = async () => {
        setIsLoading(true)
        setMessage("")

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setMessage("Paramètres sauvegardés avec succès")
            setTimeout(() => setMessage(""), 3000)
        } catch (error) {
            setMessage("Erreur lors de la sauvegarde")
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage("Les mots de passe ne correspondent pas")
            return
        }

        setIsLoading(true)
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setMessage("Mot de passe modifié avec succès")
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
            setTimeout(() => setMessage(""), 3000)
        } catch (error) {
            setMessage("Erreur lors du changement de mot de passe")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
                    <p className="text-muted-foreground">Configurez vos préférences et paramètres de compte</p>
                </div>
                <Button onClick={handleSaveSettings} disabled={isLoading} className="gap-2">
                    <Save className="h-4 w-4" />
                    {isLoading ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
            </div>

            {message && (
                <Alert className={message.includes("succès") ? "border-green-200 bg-green-50" : ""}>
                    <AlertDescription className={message.includes("succès") ? "text-green-800" : ""}>
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
                                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
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
                            <span className="text-sm">Mises à jour de missions</span>
                            <Switch
                                checked={notifications.missionUpdates}
                                onCheckedChange={(checked) => setNotifications({ ...notifications, missionUpdates: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm">Alertes de prix</span>
                            <Switch
                                checked={notifications.priceAlerts}
                                onCheckedChange={(checked) => setNotifications({ ...notifications, priceAlerts: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm">Rapports hebdomadaires</span>
                            <Switch
                                checked={notifications.weeklyReports}
                                onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Préférences
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

                        <Separator />

                        <div className="flex items-center justify-between">
                            <span className="text-sm">Attribution automatique</span>
                            <Switch
                                checked={preferences.autoAssign}
                                onCheckedChange={(checked) => setPreferences({ ...preferences, autoAssign: checked })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Fourchette de prix préférée</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        value={preferences.priceRange.min}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                priceRange: { ...preferences.priceRange, min: Number(e.target.value) },
                                            })
                                        }
                                        className="pl-10"
                                    />
                                </div>
                                <div className="relative">
                                    <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={preferences.priceRange.max}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                priceRange: { ...preferences.priceRange, max: Number(e.target.value) },
                                            })
                                        }
                                        className="pl-10"
                                    />
                                </div>
                            </div>
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
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        placeholder="Mot de passe actuel"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
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
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
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

    )
}

export default AffreteurSettings
