import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  CreditCard,
  Package,
  Star,
  Calendar,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

export default function ClientProfile() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await authService.updateProfile(formData);
      console.log(response);

      if (response.error) {
        console.error(response.error);
        toast.error(response.error.message || 'Failed to update profile');
      }

      if (response.data) {
        updateUser(response.data);
        toast.success('Profile updated successfully');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Profil Client</h1>
          <p className="text-gray-600">Gérez vos informations personnelles et préférences</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <ShoppingBag className="h-3 w-3 mr-1" />
          Client
        </Badge>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations Personnelles
              </CardTitle>
              <CardDescription>
                Vos informations de base pour les commandes et livraisons
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isLoading}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              {isEditing ? (
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded border">
                  {user.firstName || 'Non renseigné'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              {isEditing ? (
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded border">
                  {user.lastName || 'Non renseigné'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded border">{user.email}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Téléphone
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded border">{user.phone || 'Non renseigné'}</div>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-sm text-gray-600">Membre depuis</div>
              <div className="font-semibold">
                {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Package className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-sm text-gray-600">Statut du compte</div>
              <div className="font-semibold text-green-700">
                {user.emailVerifiedAt ? 'Vérifié' : 'En attente'}
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Star className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-sm text-gray-600">Type de client</div>
              <div className="font-semibold text-purple-700">Standard</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shopping Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Préférences d'Achat
          </CardTitle>
          <CardDescription>
            Configurez vos préférences pour une meilleure expérience d'achat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Notifications</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm">Nouvelles offres et promotions</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm">Mises à jour de commandes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Recommandations de produits</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Préférences de livraison</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="radio" name="delivery" className="rounded" defaultChecked />
                  <span className="text-sm">Livraison standard (gratuite)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="delivery" className="rounded" />
                  <span className="text-sm">Livraison express (+2000 FCFA)</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Méthodes de Paiement
          </CardTitle>
          <CardDescription>Gérez vos méthodes de paiement préférées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium">MTN Mobile Money</div>
                  <div className="text-sm text-gray-600">
                    {user.phone ? `****${user.phone.slice(-4)}` : 'Non configuré'}
                  </div>
                </div>
              </div>
              <Badge variant="secondary">Principal</Badge>
            </div>

            <Button variant="outline" className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Ajouter une méthode de paiement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Adresses
          </CardTitle>
          <CardDescription>Gérez vos adresses de livraison et de facturation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm mb-4">Aucune adresse enregistrée</p>
              <Button variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Ajouter une adresse
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
