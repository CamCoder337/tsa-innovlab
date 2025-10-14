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
} from 'lucide-react';
import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: SidebarItem[];
};

const affreteurMenu: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: Layout,
    href: '/app',
  },
  {
    id: 'missions',
    label: 'Missions',
    icon: Package,
    href: '/app/missions',
  },
  {
    id: 'products',
    label: 'Boutique',
    icon: ShoppingCart,
    href: '/app/shop',
    children: [
      {
        id: 'orders',
        label: 'Commandes',
        icon: ShoppingBag,
        href: '/app/shop/orders',
      },
    ],
  },
  {
    id: 'tracking',
    label: 'Suivi Temps Réel',
    icon: MapPin,
    href: '/app/tracking-dashboard',
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

const transporteurMenu: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: Layout,
    href: '/app',
  },
  {
    id: 'missions',
    label: 'Missions',
    icon: Package,
    href: '/app/missions',
  },
  {
    id: 'products',
    label: 'Boutique',
    icon: ShoppingCart,
    href: '/app/shop',
  },
  {
    id: 'tracking',
    label: 'Suivi Temps Réel',
    icon: MapPin,
    href: '/app/tracking-dashboard',
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

const adminMenu: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/app',
  },
  {
    id: 'missions',
    label: 'Missions',
    icon: Package,
    href: '/app/missions',
  },
  {
    id: 'products',
    label: 'Boutique',
    icon: ShoppingBag,
    href: '/app/products',
  },
  {
    id: 'users',
    label: 'Utilisateurs',
    icon: Users,
    href: '/app/users',
  },
  {
    id: 'tracking',
    label: 'Suivi Temps Réel',
    icon: MapPin,
    href: '/app/tracking-dashboard',
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

const clientMenu: SidebarItem[] = [
  {
    id: 'products',
    label: 'Boutique',
    icon: ShoppingCart,
    href: '/app/shop',
  },
];

function GetMenuByRole(): SidebarItem[] {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return clientMenu;
  if (user?.role === 'transporteur') return transporteurMenu;
  if (user?.role === 'admin') return adminMenu;
  return affreteurMenu;
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
                <SidebarMenuButton asChild isActive={item.href ? pathname === item.href : false}>
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
                      <SidebarMenuButton asChild isActive={pathname === child.href}>
                        <Link to={child.href!} className="flex items-center gap-3 font-medium">
                          <child.icon className="h-5 w-5" />
                          <span>{child.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton>
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
            <SidebarMenuButton asChild isActive={pathname === item.href}>
              <Link to={item.href} className="flex items-center gap-3 font-medium">
                <item.icon className="h-5 w-5" />
                <span className="text-base">{item.label}</span>
              </Link>
            </SidebarMenuButton>
          ) : (
            <SidebarMenuButton>
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
  const role = user ? user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) : 'Invité';
  const menu = GetMenuByRole();

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <UISidebar collapsible="icon" className="top-16 h-full">
        <SidebarContent>
          <SidebarGroup className="h-full flex flex-col">
            <SidebarGroupLabel>
              <div className="flex flex-1 justify-center text-base font-bold text-tsa-blue">
                Espace {role}
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent className="max-h-screen h-full p-4">
              <MenuTree items={menu} />
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
        </SidebarContent>
      </UISidebar>
    </SidebarProvider>
  );
}
