import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ChevronDown,
  Layout,
  Users,
  ShoppingBag,
  MapPin,
  MessagesSquare,
  Truck,
  User,
  Headset,
  Settings,
  LogOut,
} from 'lucide-react';
import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import {
  useNavigationTranslation,
  useCommonTranslation,
  useAuthTranslation,
} from '@/hooks/useTranslation';
import { toast } from 'sonner';

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: SidebarItem[];
};

const getAffreteurMenu = (tNav: (key: string) => string): SidebarItem[] => [
  {
    id: 'dashboard',
    label: tNav('menu.dashboard'),
    icon: Layout,
    href: '/app',
  },
  {
    id: 'missions',
    label: tNav('menu.missions'),
    icon: Package,
    href: '/app/missions',
    children: [
      {
        id: 'tracking',
        label: tNav('menu.tracking'),
        icon: MapPin,
        href: '/app/tracking-dashboard',
      },
    ],
  },
  {
    id: 'products',
    label: tNav('menu.shop'),
    icon: ShoppingCart,
    href: '/app/shop',
    children: [
      {
        id: 'orders',
        label: tNav('menu.orders'),
        icon: ShoppingBag,
        href: '/app/shop/orders',
      },
    ],
  },
  {
    id: 'chat',
    label: tNav('menu.chat'),
    icon: MessagesSquare,
    href: '/app/chat',
  },
  // {
  //     id: "freight",
  //     label: "Réseau de fret",
  //     icon: Truck,
  //     children: [
  //         { id: "marketplace", label: "Marketplace", icon: Package, href: "/freight/marketplace" },
  //         { id: "create-mission", label: "Créer une mission", icon: Package, href: "/freight/create" },
  //         { id: "my-missions", label: "Mes missions", icon: MapPin, href: "/freight/missions" },
  //     ],
  // },
  // {
  //     id: "tracking",
  //     label: "Suivi",
  //     icon: MapPin,
  //     children: [
  //         { id: "live-tracking", label: "Temps réel", icon: MapPin, href: "/tracking" },
  //         { id: "analytics", label: "Analyses", icon: BarChart3, href: "/tracking/analytics" },
  //     ],
  // }
];

const getTransporteurMenu = (tNav: (key: string) => string): SidebarItem[] => [
  {
    id: 'dashboard',
    label: tNav('menu.dashboard'),
    icon: Layout,
    href: '/app',
  },
  {
    id: 'missions',
    label: tNav('menu.missions'),
    icon: Package,
    href: '/app/missions',
    children: [
      {
        id: 'tracking',
        label: tNav('menu.tracking'),
        icon: MapPin,
        href: '/app/tracking-dashboard',
      },
    ],
  },
  {
    id: 'vehicles',
    label: tNav('menu.vehicles'),
    icon: Truck,
    href: '/app/vehicles',
  },
  {
    id: 'products',
    label: tNav('menu.shop'),
    icon: ShoppingCart,
    href: '/app/shop',
    children: [
      {
        id: 'orders',
        label: tNav('menu.orders'),
        icon: ShoppingBag,
        href: '/app/shop/orders',
      },
    ],
  },
  {
    id: 'chat',
    label: tNav('menu.chat'),
    icon: MessagesSquare,
    href: '/app/chat',
  },
  // {
  //     id: "tracking",
  //     label: "Suivi",
  //     icon: MapPin,
  //     children: [{ id: "live-tracking", label: "Temps réel", icon: MapPin, href: "/tracking" }],
  // },
  // {
  //     id: "delivery",
  //     label: "Livraison",
  //     icon: Home,
  //     children: [
  //         { id: "request-delivery", label: "Demande", icon: Package, href: "/delivery" },
  //         { id: "delivery-history", label: "Historique", icon: MapPin, href: "/delivery/history" },
  //     ],
  // },
];

const getAdminMenu = (tNav: (key: string) => string): SidebarItem[] => [
  {
    id: 'dashboard',
    label: tNav('menu.dashboard'),
    icon: LayoutDashboard,
    href: '/app',
  },
  {
    id: 'missions',
    label: tNav('menu.missions'),
    icon: Package,
    href: '/app/missions',
    children: [
      {
        id: 'tracking',
        label: tNav('menu.tracking'),
        icon: MapPin,
        href: '/app/tracking-dashboard',
      },
    ],
  },
  {
    id: 'products',
    label: tNav('menu.shop'),
    icon: ShoppingBag,
    href: '/app/products',
  },
  {
    id: 'orders',
    label: tNav('menu.orders'),
    icon: ShoppingCart,
    href: '/app/orders',
  },
  {
    id: 'users',
    label: tNav('menu.users'),
    icon: Users,
    href: '/app/users',
  },
  {
    id: 'chat',
    label: tNav('menu.chat'),
    icon: MessagesSquare,
    href: '/app/chat',
  },
  // {
  //     id: "analytics",
  //     label: "Analytique IA",
  //     icon: BarChart3,
  //     children: [{ id: "predictions", label: "Prédictions", icon: BarChart3, href: "/analytics" }],
  // },
  // { id: "support", label: "Support", icon: MessageCircle, href: "/support" },
  // { id: "admin", label: "Administration", icon: Shield, href: "/admin" },
  // { id: "settings", label: "Paramètres", icon: Settings, href: "/settings" },
];

const getClientMenu = (tNav: (key: string) => string): SidebarItem[] => [
  {
    id: 'products',
    label: tNav('menu.shop'),
    icon: ShoppingCart,
    href: '/app/shop',
  },
];

function GetMenuByRole(): SidebarItem[] {
  const { user, isAuthenticated } = useAuth();
  const { t: tNav } = useNavigationTranslation();

  if (!isAuthenticated || user?.role === 'client') return getClientMenu(tNav);
  if (user?.role === 'transporteur') return getTransporteurMenu(tNav);
  if (user?.role === 'admin') return getAdminMenu(tNav);
  return getAffreteurMenu(tNav);
}

function MenuTree({ items }: { items: SidebarItem[] }) {
  const { pathname } = useLocation();
  return (
    <SidebarMenu className="flex flex-col gap-4">
      {items.map((item) => (
        <SidebarMenuItem key={item.id}>
          {item.children && item.children.length ? (
            <details open={true} className="gap-2 flex flex-col">
              <summary className="list-none">
                <SidebarMenuButton
                  asChild
                  isActive={item.href ? pathname === item.href : false}
                  tooltip={item.label}
                >
                  <div className="flex items-center justify-between">
                    <Link to={item.href!} className="flex items-center gap-3 font-medium">
                      <item.icon className="h-5 w-5" />
                      <span className="text-base">{item.label}</span>
                    </Link>
                    <div>
                      <ChevronDown width={16} height={16} />
                    </div>
                  </div>
                </SidebarMenuButton>
              </summary>
              <SidebarMenu className="ml-4">
                {item.children.map((child) => (
                  <SidebarMenuItem key={child.id}>
                    {child.href ? (
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === child.href}
                        tooltip={child.label}
                      >
                        <Link to={child.href!} className="flex items-center gap-3 font-medium">
                          <child.icon className="h-5 w-5" />
                          <span>{child.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton tooltip={child.label}>
                        <div className="flex items-center gap-3 font-medium">
                          <child.icon className="h-5 w-5" />
                          <span>{child.label}</span>
                        </div>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </details>
          ) : item.href ? (
            <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
              <Link to={item.href} className="flex items-center gap-3 font-medium">
                <item.icon className="h-5 w-5" />
                <span className="text-base">{item.label}</span>
              </Link>
            </SidebarMenuButton>
          ) : (
            <SidebarMenuButton tooltip={item.label}>
              <div className="flex items-center gap-3 font-medium">
                <item.icon className="h-5 w-5" />
                <span className="text-base">{item.label}</span>
              </div>
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export default function Sidebar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t: tAuth } = useAuthTranslation();
  const { t: tCommon } = useCommonTranslation();
  const { t: tNav } = useNavigationTranslation();

  const displayName = user?.fullName;
  const role = tCommon(`roles.${user?.role}`);
  const menu = GetMenuByRole();
  const navigate = useNavigate();

  const handleLogout = async () => {
    toast.loading(tAuth('loggingOut'), {
      duration: 30000,
    });

    await logout();

    toast.dismiss();
    toast.success('Déconnexion réussie');
    navigate('/');
  };

  if (!isAuthenticated) return null;

  return (
    <UISidebar collapsible="icon" className="top-16 h-[calc(100vh-4rem)] flex flex-col fixed">
      <SidebarHeader className="flex flex-row items-center justify-between p-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="text-base font-bold text-tsa-blue group-data-[collapsible=icon]:hidden">
            {tNav('breadcrumb.workspace', { role })}
          </div>
        </div>
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-hidden">
        <SidebarGroup className="h-full flex flex-col">
          <SidebarGroupContent className="flex-1 overflow-y-auto p-4">
            <MenuTree items={menu} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
      </SidebarContent>
      <SidebarFooter className="flex-shrink-0">
        <div className="md:hidden">
          {/* Mobile-only user info display */}
          <div className="pb-2 border-b">
            <p className="px-2 text-sm font-medium truncate">{displayName}</p>
            <p className="px-2 text-xs text-muted-foreground truncate">{role}</p>
          </div>

          <Link to="/app/profile" className="h-fit pt-8">
            <div className="cursor-pointer flex items-center px-2 py-1 gap-2">
              <User className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{tAuth('profile')}</span>
            </div>
          </Link>

          <Link to="/app/settings" className="h-fit">
            <div className="cursor-pointer flex items-center px-2 py-1 gap-2">
              <Settings className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{tCommon('actions.settings', 'Paramètres')}</span>
            </div>
          </Link>

          <div className="cursor-pointer flex items-center px-2 py-1 gap-2">
            <Headset className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{tCommon('actions.support', 'Support')}</span>
          </div>

          <div
            onClick={handleLogout}
            data-testid="logout-button"
            role="menuitem"
            className="cursor-pointer flex items-center px-2 py-1 gap-2 text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{tAuth('logout')}</span>
          </div>
        </div>
      </SidebarFooter>
    </UISidebar>
  );
}
