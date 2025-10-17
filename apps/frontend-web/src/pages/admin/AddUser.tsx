import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddUserForm from '@/components/forms/AddUserForm';
import type { CreateUserRequest } from '@/types/auth.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function AddUser() {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuth();

  const handleSubmit = async (userData: CreateUserRequest) => {
    try {
      await signup(userData);
      toast.success('Utilisateur créé avec succès');
      navigate('/admin/users');
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la création de l'utilisateur");
    }
  };

  const handleCancel = () => {
    navigate('/admin/users');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/admin/users')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ajouter un Utilisateur</h1>
              <p className="text-muted-foreground">
                Créer un nouveau compte utilisateur sur la plateforme
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <AddUserForm onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isLoading} />
      </div>
    </div>
  );
}
