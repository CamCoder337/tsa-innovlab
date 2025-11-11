import {
  Globe,
  User,
  ChevronDown,
  UserCircle2,
  Settings,
  Headset,
  LogOut,
  ShoppingCart,
  LogIn,
  UserPlus,
  Menu,
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
import { useCart } from '@/hooks/useCart';
import CartDrawer from '@/components/shop/CartDrawer';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  useCommonTranslation,
  useAuthTranslation,
  useCartTranslation,
} from '@/hooks/useTranslation';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import GlobalSearch from '@/components/search/GlobalSearch';
// import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function Header({ className }: { className?: string }) {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { t: tCommon } = useCommonTranslation();
  const { t: tAuth } = useAuthTranslation();
  const { t: tCart } = useCartTranslation();
  const { i18n } = useTranslation();

  const displayName = user ? `${user.fullName}` : tCommon('roles.guest', 'Invité');
  const displayRole = user?.role ?? '';
  const isInvite = !user;
  const navigate = useNavigate();

  const currentLanguage = i18n.language || 'fr';

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = async () => {
    toast.loading(tAuth('loggingOut'), {
      duration: 30000,
    });

    await logout();

    toast.dismiss();
    toast.success('Déconnexion réussie');
    navigate('/');
  };

  return (
    <header
      className={`h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 bg-white dark:bg-gray-900 border-b dark:border-gray-800 ${className}`}
    >
      {/* Left Section: Logo and Mobile Sidebar */}
      <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink-0">
        {/* Mobile Sidebar Trigger - only show when user is authenticated */}
        {user && (
          <div className="md:hidden">
            <SidebarTrigger className="h-8 w-8 sm:h-9 sm:w-9" />
          </div>
        )}

        {/* Logo Section */}
        <div className="flex items-center justify-center">
          <img
            src={logo}
            alt="TSA Logistics"
            className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain"
          />
        </div>

        {/* App Name - Hidden on mobile, visible on medium+ screens */}
        <div className="hidden md:flex flex-col justify-center ml-1 lg:ml-2">
          <h1 className="font-semibold text-lg lg:text-xl leading-tight text-tsa-blue dark:text-tsa-white">
            {tCommon('app.name')}
          </h1>
          <p className="text-xs lg:text-sm text-muted-foreground leading-tight">
            {tCommon('app.tagline')}
          </p>
        </div>
      </div>

      {/* Center Section: Desktop Search */}
      {user && (
        <div className="hidden xl:flex flex-1 max-w-lg mx-4 2xl:mx-8">
          <GlobalSearch
            placeholder={tCommon(
              'search.placeholder',
              'Rechercher missions, produits, véhicules...'
            )}
            className="w-full"
          />
        </div>
      )}

      {/* Right Section: Actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Mobile/Tablet Search - Show on smaller screens when authenticated */}
        {user && (
          <div className="xl:hidden">
            <GlobalSearch
              placeholder={tCommon('search.placeholder')}
              className="w-48 sm:w-56 md:w-64 lg:w-72"
            />
          </div>
        )}

        {/* Desktop Language Selector - Hidden on mobile/tablet */}
        <div className="hidden lg:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 h-8 w-auto px-2 sm:px-3 min-w-0">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">
                  {currentLanguage.slice(0, 2).toUpperCase()}
                </span>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuItem onClick={() => changeLanguage('fr')}>
                🇫🇷 {tCommon('languages.french')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('en')}>
                🇺🇸 {tCommon('languages.english')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Theme Toggle - Always visible */}
        {/* <ThemeToggle /> */}

        {/* Desktop Notifications - Hidden on mobile/tablet */}
        {user && <NotificationCenter />}

        {/* Shopping Cart - Always visible */}
        <div className="hidden lg:block">
          <CartDrawer>
            <Button
              variant="ghost"
              size="sm"
              className="relative h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              {cart.items.length > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full p-0 text-[10px] sm:text-xs bg-tsa-blue/90 flex items-center justify-center">
                  {cart.items.length > 99 ? '99+' : cart.items.length}
                </Badge>
              )}
            </Button>
          </CartDrawer>
        </div>

        {/* User Profile Menu - Always visible */}
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 sm:h-9 px-2 sm:px-0 lg:px-4 gap-1 sm:gap-2 min-w-0"
                aria-label="User menu"
                data-testid="user-menu-button"
              >
                <Avatar className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 flex-shrink-0">
                  <UserCircle2 className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
                </Avatar>

                {/* User Info - Progressive disclosure based on screen size */}
                <div className="text-left hidden lg:flex flex-col min-w-0 max-w-[120px] xl:max-w-[150px]">
                  <p className="text-xs xl:text-sm font-medium truncate leading-tight">
                    {displayName}
                  </p>
                  {!isInvite && (
                    <p className="text-[10px] xl:text-xs text-muted-foreground truncate leading-tight">
                      {tCommon(`roles.${displayRole}`)}
                    </p>
                  )}
                </div>

                {/* User name only on medium screens */}
                <div className="text-left hidden md:flex lg:hidden flex-col min-w-0 max-w-[100px]">
                  <p className="text-xs font-medium truncate">{displayName}</p>
                </div>

                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 sm:w-56">
              {/* Mobile-only user info display */}
              <div className="md:hidden px-2 py-2 border-b">
                <p className="text-sm font-medium truncate">{displayName}</p>
                {!isInvite && (
                  <p className="text-xs text-muted-foreground truncate">
                    {tCommon(`roles.${displayRole}`)}
                  </p>
                )}
              </div>

              {isInvite ? (
                <>
                  <Link to="/login">
                    <DropdownMenuItem className="cursor-pointer">
                      <LogIn className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{tAuth('login.label')}</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/register">
                    <DropdownMenuItem className="cursor-pointer">
                      <UserPlus className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{tAuth('register.label')}</span>
                    </DropdownMenuItem>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/app/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{tAuth('profile')}</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <Link to="/app/settings">
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{tCommon('actions.settings', 'Paramètres')}</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="cursor-pointer">
                    <Headset className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{tCommon('actions.support', 'Support')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    data-testid="logout-button"
                    role="menuitem"
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{tAuth('logout')}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu Dropdown - Show on mobile/tablet */}
        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0"
                aria-label="Menu"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40 w-fit flex flex-col flex-1 gap-3">
              <CartDrawer>
                <div className="flex flex-1 items-center px-2">
                  <div className="w-1/4">
                    <ShoppingCart className="h-4 w-4 flex-shrink-0" />
                  </div>
                  <span className="w-2/4 text-sm font-medium">{tCart('title')}</span>
                  <div className="w-1/4">
                    {cart.items.length > 0 && (
                      <Badge className="w-5 h-5 sm:w-6 sm:h-6 rounded-full p-0 text-[10px] sm:text-xs bg-tsa-blue/90 flex items-center justify-center">
                        {cart.items.length > 99 ? '99+' : cart.items.length}
                      </Badge>
                    )}
                  </div>
                </div>
              </CartDrawer>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex flex-1 items-center px-2">
                    <div className="w-1/4">
                      <Globe className="h-4 w-4 flex-shrink-0" />
                    </div>
                    <span className="w-2/4 text-sm font-medium">
                      {currentLanguage.startsWith('fr')
                        ? tCommon('languages.french')
                        : tCommon('languages.english')}
                    </span>
                    <div className="w-6 flex justify-end">
                      <ChevronDown className="h-3 w-3 flex-shrink-0" />
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                  <DropdownMenuItem onClick={() => changeLanguage('fr')}>
                    🇫🇷 {tCommon('languages.french')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('en')}>
                    🇺🇸 {tCommon('languages.english')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isInvite && (
                <>
                  <Link to="/login">
                    <DropdownMenuItem className="py-0 cursor-pointer flex flex-1 items-center px-2">
                      <div className="w-1/4">
                        <LogIn className="mr-2 h-4 w-4 flex-shrink-0" />
                      </div>
                      <span className="w-2/4 text-sm font-medium no-wrap">
                        {tAuth('login.label')}
                      </span>
                      <div className="w-1/5"> </div>
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/register">
                    <DropdownMenuItem className="py-0 cursor-pointer flex flex-1 items-center px-2">
                      <div className="w-1/4">
                        <UserPlus className="mr-2 h-4 w-4 flex-shrink-0" />
                      </div>
                      <span className="w-2/4 text-sm font-medium">{tAuth('register.label')}</span>
                      <div className="w-1/4"> </div>
                    </DropdownMenuItem>
                  </Link>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
