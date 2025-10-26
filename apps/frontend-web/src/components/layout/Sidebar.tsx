import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useNavigationTranslation, useAuthTranslation } from '@/hooks/useTranslation';

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: SidebarItem[];
};

const getAffreteurMenu = (t: (key: string) => string): SidebarItem[] => [
  {
    id: 'dashboard',
    label: t('menu.dashboard'),
    icon: Layout,
    href: '/app',
  },
  {
    id: 'missions',
    label: t('menu.missions'),
    icon: Package,
    href: '/app/missions',
    children: [
      {
        id: 'tracking',
        label: t('menu.tracking'),
        icon: MapPin,
        href: '/app/tracking-dashboard',
      },
    ],
  },
  {
    id: 'products',
    label: t('menu.shop'),
    icon: ShoppingCart,
    href: '/app/shop',
    children: [
      {
        id: 'orders',
        label: t('menu.orders'),
        icon: ShoppingBag,
        href: '/app/shop/orders',
      },
    ],
  },
  {
    id: 'chat',
    label: t('menu.chat'),
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

const getTransporteurMenu = (t: (key: string) => string): SidebarItem[] => [
  {
    id: 'dashboard',
    label: t('menu.dashboard'),
    icon: Layout,
    href: '/app',
  },
  {
    id: 'missions',
    label: t('menu.missions'),
    icon: Package,
    href: '/app/missions',
    children: [
      {
        id: 'tracking',
        label: t('menu.tracking'),
        icon: MapPin,
        href: '/app/tracking-dashboard',
      },
    ],
  },
  {
    id: 'vehicles',
    label: t('menu.vehicles'),
    icon: Truck,
    href: '/app/vehicles',
  },
  {
    id: 'products',
    label: t('menu.shop'),
    icon: ShoppingCart,
    href: '/app/shop',
    children: [
      {
        id: 'orders',
        label: t('menu.orders'),
        icon: ShoppingBag,
        href: '/app/shop/orders',
      },
    ],
  },
  {
    id: 'chat',
    label: t('menu.chat'),
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

const getAdminMenu = (t: (key: string) => string): SidebarItem[] => [
  {
    id: 'dashboard',
    label: t('menu.dashboard'),
    icon: LayoutDashboard,
    href: '/app',
  },
  {
    id: 'missions',
    label: t('menu.missions'),
    icon: Package,
    href: '/app/missions',
    children: [
      {
        id: 'tracking',
        label: t('menu.tracking'),
        icon: MapPin,
        href: '/app/tracking-dashboard',
      },
    ],
  },
  {
    id: 'products',
    label: t('menu.shop'),
    icon: ShoppingBag,
    href: '/app/products',
  },
  {
    id: 'orders',
    label: t('menu.orders'),
    icon: ShoppingCart,
    href: '/app/orders',
  },
  {
    id: 'users',
    label: t('menu.users'),
    icon: Users,
    href: '/app/users',
  },
  {
    id: 'chat',
    label: t('menu.chat'),
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

const getClientMenu = (t: (key: string) => string): SidebarItem[] => [
  {
    id: 'products',
    label: t('menu.shop'),
    icon: ShoppingCart,
    href: '/app/shop',
  },
];

function GetMenuByRole(): SidebarItem[] {
  const { user, isAuthenticated } = useAuth();
  const { t } = useNavigationTranslation();

  if (!isAuthenticated || user?.role === 'client') return getClientMenu(t);
  if (user?.role === 'transporteur') return getTransporteurMenu(t);
  if (user?.role === 'admin') return getAdminMenu(t);
  return getAffreteurMenu(t);
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
  const { user, isAuthenticated } = useAuth();
  const { t: tAuth } = useAuthTranslation();
  const { t } = useNavigationTranslation();

  const role = user ? tAuth(`roles.${user?.role}`) : tAuth('roles.guest');
  const menu = GetMenuByRole();

  if (!isAuthenticated) return null;

  return (
    <UISidebar collapsible="icon" className="top-16 h-full">
      <SidebarHeader className="flex flex-row items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <div className="text-base font-bold text-tsa-blue group-data-[collapsible=icon]:hidden">
            {t('breadcrumb.workspace', { role })}
          </div>
        </div>
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="h-full flex flex-col">
          <SidebarGroupContent className="max-h-screen h-full p-4">
            <MenuTree items={menu} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
      </SidebarContent>
    </UISidebar>
  );
}
