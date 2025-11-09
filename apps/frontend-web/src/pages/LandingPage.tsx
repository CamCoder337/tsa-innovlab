import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ShoppingBag,
  Truck,
  ArrowRight,
  Package,
  MapPin,
  Shield,
  Clock,
  LogIn,
  ChevronDown,
  Globe,
  Menu,
  User,
} from 'lucide-react';
import logo from '@/assets/logo_blue_bg.png';
import LanguageDropdown from '@/components/ui/LanguageDropdown';
import { useAuthTranslation, useCommonTranslation, useTranslation } from '@/hooks/useTranslation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

const LandingPage: React.FC = () => {
  const { t: tCommon } = useCommonTranslation();
  const { t: tAuth } = useAuthTranslation();
  const { i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const currentLanguage = i18n.language || 'fr';

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tsa-blue via-tsa-blue/80 to-tsa-blue/60">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-3 w-4/5 h-16">
          <img src={logo} alt="TSA Logistics" className="h-full w-auto sm:h-16 sm:w-auto" />
          <div className="text-white">
            <h1 className="text-xl sm:text-2xl font-bold">{tCommon('app.name')}</h1>
            <p className="text-sm text-blue-100">{tCommon('app.tagline')}</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <LanguageDropdown position="bottom-left" />
          {isAuthenticated ? (
            <Link to="/app">
              <Button
                variant="outline"
                className="bg-tsa-blue text-white hover:bg-white hover:text-tsa-blue"
              >
                <User className="mr-2 h-4 w-4 flex-shrink-0" />
                {user?.firstName + ' ' + user?.lastName}
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button
                variant="outline"
                className="bg-tsa-blue text-white hover:bg-white hover:text-tsa-blue"
              >
                <LogIn className="mr-2 h-4 w-4 flex-shrink-0" />
                {tAuth('login.label')}
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Dropdown - Show on mobile/tablet */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0 text-white"
                aria-label="Menu"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40 w-fit flex flex-col flex-1 gap-3">
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

              {isAuthenticated ? (
                <Link to="/app">
                  <DropdownMenuItem className="py-0 cursor-pointer flex flex-1 items-center px-2">
                    <div className="w-1/4">
                      <User className="mr-2 h-4 w-4 flex-shrink-0" />
                    </div>
                    <span className="w-2/4 text-sm font-medium no-wrap">
                      {user?.firstName + ' ' + user?.lastName}
                    </span>
                    <div className="w-1/5"> </div>
                  </DropdownMenuItem>
                </Link>
              ) : (
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
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center text-white mb-16">
          <h2 className="text-4xl sm:text-6xl font-bold mb-6">
            {tCommon('landing.hero.title')}
            <span className="block text-blue-200">{tCommon('landing.hero.subtitle')}</span>
          </h2>
          <p className="text-xl sm:text-2xl text-blue-100 max-w-3xl mx-auto">
            {tCommon('landing.hero.description')}
          </p>
        </div>

        {/* Two Main Paths */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Commerce Path */}
          <Card className="group hover:scale-105 transition-all duration-300 shadow-2xl border-0 bg-white/95 backdrop-blur">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 group-hover:bg-green-200 transition-colors">
                  <ShoppingBag className="h-10 w-10 text-green-600" />
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  {tCommon('landing.commerce.title')}
                </h3>

                <p className="text-gray-600 text-lg mb-8 leading-relaxed min-h-20">
                  {tCommon('landing.commerce.description')}
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Package className="h-5 w-5 text-green-600" />
                    <span>{tCommon('landing.commerce.features.certified')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span>{tCommon('landing.commerce.features.quality')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span>{tCommon('landing.commerce.features.delivery')}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link to="/app/shop" className="block">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6">
                      {tCommon('landing.commerce.browse')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>

                  <Link to="/register" className="block">
                    <Button
                      variant="outline"
                      className="w-full border-green-600 text-green-600 hover:bg-green-50 text-lg py-3"
                    >
                      {tCommon('landing.commerce.register')}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transport Path */}
          <Card className="group hover:scale-105 transition-all duration-300 shadow-2xl border-0 bg-white/95 backdrop-blur">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6 group-hover:bg-orange-200 transition-colors">
                  <Truck className="h-10 w-10 text-orange-600" />
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  {tCommon('landing.transport.title')}
                </h3>

                <p className="text-gray-600 text-lg mb-8 leading-relaxed min-h-22">
                  {tCommon('landing.transport.description')}
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="h-5 w-5 text-orange-600" />
                    <span>{tCommon('landing.transport.features.tracking')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Shield className="h-5 w-5 text-orange-600" />
                    <span>{tCommon('landing.transport.features.secure')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span>{tCommon('landing.transport.features.simple')}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link to="/app/register" className="block">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-6">
                      {tCommon('landing.transport.join')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>

                  <p className="text-sm text-gray-500">{tCommon('landing.transport.subtitle')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-20 text-center text-white">
          <h3 className="text-2xl sm:text-3xl font-bold mb-12">
            {tCommon('landing.features.title')}
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2">
                {tCommon('landing.features.secure.title')}
              </h4>
              <p className="text-blue-100">{tCommon('landing.features.secure.description')}</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2">
                {tCommon('landing.features.fast.title')}
              </h4>
              <p className="text-blue-100">{tCommon('landing.features.fast.description')}</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2">
                {tCommon('landing.features.traceable.title')}
              </h4>
              <p className="text-blue-100">{tCommon('landing.features.traceable.description')}</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2">
                {tCommon('landing.features.quality.title')}
              </h4>
              <p className="text-blue-100">{tCommon('landing.features.quality.description')}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/20 py-8 text-center text-white/80">
        <p>{tCommon('landing.footer.copyright')}</p>
      </footer>
    </div>
  );
};

export default LandingPage;
