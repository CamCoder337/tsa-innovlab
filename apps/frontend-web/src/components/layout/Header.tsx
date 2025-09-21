import {
  Globe,
  User,
  ChevronDown,
  Bell,
  UserCircle2,
  Settings,
  Headset,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import logo from '@/assets/logo_white_bg.png';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

export default function Header() {
  const { user, logout } = useAuth();
  const displayName = user ? `${user.fullName}` : 'Invité';
  const displayRole = user?.role ?? '';
  const navigate = useNavigate();

  const handleLogout = async () => {
    toast.promise(authService.logout(), {
      loading: 'Déconnexion...',
      success: 'Déconnexion réussie',
      error: 'Erreur lors de la déconnexion',
    });
    logout();
    navigate('/');
  };

  return (
    <header className="fixed inset-y-0 z-10 h-fit w-full border-b bg-white flex items-center justify-between md:px-6">
      {/* Logo */}
      <div className="flex items-center gap-1">
        <div className="rounded-lg flex items-center justify-center">
          <img src={logo} alt="TSA Logistics" width={100} height={100} />
        </div>
        <div className="rounded-lg hidden md:flex flex-col justify-center">
          <h1 className="font-semibold text-xl" style={{ color: 'var(--tsa-blue)' }}>
            TSA-Logistics
          </h1>
          <p className="text-sm text-muted-foreground">Plateforme de Gestion Logistique</p>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center max-sm:gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="max-sm:p-0">
            <Button variant="ghost" size="sm" className="gap-1">
              <Globe className="h-7 w-7" />
              FR
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>🇫🇷 Français</DropdownMenuItem>
            <DropdownMenuItem>🇺🇸 English</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Real-time Notifications */}
        <Button variant="ghost" size="sm" className="relative max-sm:p-0">
          <Bell className="h-7 w-7" />
          <Badge className="absolute -top-1 right-2 w-6 h-6 rounded-full p-2 text-xs bg-tsa-blue/90">
            21
          </Badge>
        </Button>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="max-sm:p-2">
            <Button variant="ghost" className="md:gap-2 h-auto px-6">
              <Avatar className="h-8 w-8">
                <UserCircle2 className="h-8 w-8" />
              </Avatar>
              <div className="text-left hidden md:flex flex-col">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {displayRole.charAt(0).toUpperCase() + displayRole.slice(1)}
                </p>
              </div>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <Link to="/app/profile">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <Link to="/app/settings">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem>
              <Headset className="mr-2 h-4 w-4" />
              Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
