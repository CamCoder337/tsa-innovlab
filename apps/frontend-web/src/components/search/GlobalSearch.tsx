import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Package, Truck, Users, MapPin, X, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMissionStore } from '@/stores/missionStore';
import { useProductStore } from '@/stores/productStore';
import { useVehicleStore } from '@/stores/vehicleStore';
import { useUserStore } from '@/stores/userStore';
import { matchesSearchQuery } from '@/utils/search.utils';
import { useCommonTranslation, useNavigationTranslation } from '@/hooks/useTranslation';
import type { Mission } from '@/types/mission.types';
import type { Product } from '@/types/product.types';
import type { Vehicle } from '@/types/vehicle.types';
import type { User } from '@/types/auth.types';

interface SearchResult {
  id: string;
  type: 'mission' | 'product' | 'vehicle' | 'user';
  title: string;
  subtitle: string;
  description?: string;
  status?: string;
  url: string;
  data: Mission | Product | Vehicle | User;
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  maxResults?: number;
}

export default function GlobalSearch({
  className = '',
  placeholder,
  maxResults = 20,
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { user } = useAuth();
  const { t: tCommon } = useCommonTranslation();
  const { t: tNav } = useNavigationTranslation();
  const navigate = useNavigate();

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Store data
  const { missions, myMissions } = useMissionStore();
  const { products } = useProductStore();
  const { vehicles } = useVehicleStore();
  const { users } = useUserStore();

  // Search results
  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];

    const results: SearchResult[] = [];
    const isAdmin = user?.role === 'admin';

    // Search missions
    const missionList = isAdmin ? missions : myMissions;
    missionList.forEach((mission) => {
      if (
        matchesSearchQuery(
          query,
          mission.title,
          mission.description,
          mission.typeMarchandise,
          `${mission.affreteur?.firstName}  ${mission.affreteur?.lastName}`,
          `${mission.transporteur?.firstName}  ${mission.transporteur?.lastName}`,
          mission.adresseDepart?.city,
          mission.adresseArrivee?.city
        )
      ) {
        results.push({
          id: mission.id,
          type: 'mission',
          title: mission.title,
          subtitle: `${mission.adresseDepart?.city || 'N/A'} → ${mission.adresseArrivee?.city || 'N/A'}`,
          description: mission.description || undefined,
          status: mission.status,
          url: isAdmin ? `/app/admin/missions/${mission.id}` : `/app/missions/${mission.id}`,
          data: mission,
        });
      }
    });

    // Search products
    products.forEach((product) => {
      if (
        matchesSearchQuery(
          query,
          product.name,
          product.description,
          product.reference,
          product.category?.name
        )
      ) {
        results.push({
          id: product.id,
          type: 'product',
          title: product.name,
          subtitle: product.category?.name || tCommon('notDefined'),
          description: product.description || undefined,
          status: product.isActive ? 'active' : 'inactive',
          url: isAdmin ? `/app/admin/products/${product.id}` : `/app/shop/products/${product.id}`,
          data: product,
        });
      }
    });

    // Search vehicles (for transporteurs and admin)
    if (user?.role === 'transporteur' || isAdmin) {
      vehicles.forEach((vehicle) => {
        if (
          matchesSearchQuery(
            query,
            vehicle.registration,
            vehicle.description,
            vehicle.type,
            `${vehicle.user?.firstName}  ${vehicle.user?.lastName}`
          )
        ) {
          results.push({
            id: vehicle.id,
            type: 'vehicle',
            title: vehicle.registration,
            subtitle: `${vehicle.type} - ${vehicle.user?.firstName}  ${vehicle.user?.lastName}`,
            description: vehicle.description || undefined,
            status: vehicle.status,
            url: isAdmin ? `/app/admin/vehicles/${vehicle.id}` : `/app/vehicles/${vehicle.id}`,
            data: vehicle,
          });
        }
      });
    }

    // Search users (admin only)
    if (isAdmin) {
      users.forEach((searchUser) => {
        if (
          matchesSearchQuery(
            query,
            `${searchUser.firstName}  ${searchUser.lastName}`,
            searchUser.email,
            searchUser.phone
          )
        ) {
          results.push({
            id: searchUser.id,
            type: 'user',
            title: `${searchUser.firstName}  ${searchUser.lastName}`,
            subtitle: `${tCommon(`roles.${searchUser.role}`)} - ${searchUser.email}`,
            status: searchUser.status,
            url: `/app/admin/users/${searchUser.id}`,
            data: searchUser,
          });
        }
      });
    }

    // Sort by relevance and limit results
    return results
      .sort((a, b) => {
        // Prioritize exact matches in title
        const aExact = a.title.toLowerCase().includes(query.toLowerCase());
        const bExact = b.title.toLowerCase().includes(query.toLowerCase());
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Then sort by type priority
        const typePriority = { mission: 0, product: 1, vehicle: 2, user: 3 };
        return typePriority[a.type] - typePriority[b.type];
      })
      .slice(0, maxResults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, missions, myMissions, products, vehicles, users, user?.role, maxResults]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    searchResults.forEach((result) => {
      if (!groups[result.type]) groups[result.type] = [];
      groups[result.type].push(result);
    });
    return groups;
  }, [searchResults]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || searchResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && searchResults[selectedIndex]) {
            handleResultClick(searchResults[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, searchResults, selectedIndex]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mission':
        return <MapPin className="h-4 w-4" />;
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'vehicle':
        return <Truck className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mission':
        return tNav('menu.missions');
      case 'product':
        return tNav('menu.products');
      case 'vehicle':
        return tNav('menu.vehicles');
      case 'user':
        return tNav('menu.users');
      default:
        return type;
    }
  };

  const getStatusColor = (type: string, status?: string) => {
    if (!status) return 'default';

    switch (type) {
      case 'mission':
        switch (status) {
          case 'published':
            return 'blue';
          case 'assigned':
            return 'yellow';
          case 'in_progress':
            return 'orange';
          case 'completed':
            return 'green';
          case 'cancelled':
            return 'red';
          default:
            return 'gray';
        }
      case 'product':
        return status === 'active' ? 'green' : 'gray';
      case 'vehicle':
        switch (status) {
          case 'available':
            return 'green';
          case 'in_mission':
            return 'blue';
          case 'maintenance':
            return 'yellow';
          case 'inactive':
            return 'gray';
          default:
            return 'default';
        }
      case 'user':
        switch (status) {
          case 'active':
            return 'green';
          case 'suspended':
            return 'red';
          case 'pending':
            return 'yellow';
          default:
            return 'default';
        }
      default:
        return 'default';
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder || tCommon('search.title')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length >= 2);
            setSelectedIndex(-1);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 shadow-lg py-0">
          <CardContent className="p-0 overflow-auto">
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {tCommon('search.noResults', { type: tCommon('search.result') })}
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {Object.entries(groupedResults).map(([type, results], groupIndex) => (
                  <div key={type}>
                    {groupIndex > 0 && <Separator />}
                    <div className="p-2 bg-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        {getTypeIcon(type)}
                        {getTypeLabel(type)} ({results.length})
                      </div>
                    </div>
                    {results.map((result, index) => {
                      const globalIndex = searchResults.indexOf(result);
                      return (
                        <div
                          key={index}
                          className={`p-3 cursor-pointer hover:bg-muted/50 border-l-2 border-transparent ${
                            selectedIndex === globalIndex ? 'bg-muted border-l-primary' : ''
                          }`}
                          onClick={() => handleResultClick(result)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">{result.title}</h4>
                                {result.status && (
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs bg-${getStatusColor(result.type, result.status)}-100 text-${getStatusColor(result.type, result.status)}-700`}
                                  >
                                    {tCommon(`status.${result.status}`, result.status)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {result.subtitle}
                              </p>
                              {result.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {result.description}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
