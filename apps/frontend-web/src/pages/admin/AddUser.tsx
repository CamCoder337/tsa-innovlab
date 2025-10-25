import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddUserForm from '@/components/forms/AddUserForm';
import type { CreateUserRequest } from '@/types/auth.types';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useAdminTranslation } from '@/hooks/useTranslation';

export default function AddUser() {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuth();
  const { t } = useAdminTranslation();

  const handleSubmit = async (userData: CreateUserRequest) => {
    try {
      await signup(userData);
      toast.success(t('addUser.createSuccess'));
      navigate('/admin/users');
    } catch (error) {
      console.error(error);
      toast.error(t('addUser.createError'));
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
              {t('addUser.backButton')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('addUser.title')}</h1>
              <p className="text-muted-foreground">{t('addUser.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <AddUserForm onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isLoading} />
      </div>
    </div>
  );
}
