import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { CreateVehicleForm } from '@/components/forms/CreateVehicleForm';
import { useVehicles } from '@/hooks/useVehicles';
import {
  type Vehicle,
  VehicleType,
  VehicleStatus,
  VehicleTypeLabels,
  VehicleStatusLabels,
  VehicleStatusColors,
  VehicleTypeIcons,
  type CreateVehicleRequest,
  type UpdateVehicleRequest,
  type VehicleFiltersQuery,
} from '../../types/vehicle.types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useFormsTranslation } from '@/hooks/useTranslation';

export const MyVehicles: React.FC = () => {
  const { t: tForms } = useFormsTranslation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<VehicleType | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  const filters: VehicleFiltersQuery = {
    search: searchTerm || undefined,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  const {
    vehicles,
    isLoading,
    error,
    createVehicle,
    updateVehicle,
    updateVehicleStatus,
    deleteVehicle,
    fetchVehicles,
    clearError,
    getTotalVehicles,
    getAvailableCount,
    getInUseCount,
    getMaintenanceCount,
  } = useVehicles();

  // Refresh data when filters change
  useEffect(() => {
    fetchVehicles(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateVehicle = async (data: CreateVehicleRequest) => {
    await createVehicle(data);
    if (!error) {
      setShowCreateForm(false);
      toast.success('Vehicule ajouté avec succès');
    } else {
      console.error(error);
      toast.error("Erreur lors de l'ajout du véhicule");
    }
  };

  const handleUpdateVehicle = async (data: UpdateVehicleRequest) => {
    if (editingVehicle) {
      await updateVehicle(editingVehicle.id, data);
      if (!error) {
        setEditingVehicle(null);
        toast.success('Vehicule mis à jour avec succès');
      } else {
        console.error(error);
        toast.error('Erreur lors de la modification du véhicule');
      }
    }
  };

  const handleStatusChange = async (vehicleId: string, newStatus: VehicleStatus) => {
    await updateVehicleStatus(vehicleId, newStatus);
    if (!error) {
      toast.success('Status mis à jour avec succès');
    } else {
      console.error(error);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      await deleteVehicle(vehicleId);
      if (!error) {
        toast.success('Vehicule supprimé avec succès');
      } else {
        console.error(error);
        toast.error('Erreur lors de la suppression du véhicule');
      }
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
  };

  const getStatusBadgeColor = (status: VehicleStatus) => {
    const colors = VehicleStatusColors[status];
    const colorClasses = {
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      orange: 'bg-orange-100 text-orange-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colorClasses[colors as keyof typeof colorClasses] || colorClasses.gray;
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 flex flex-col flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mes Véhicules</h1>
          <p className="text-sm sm:text-base text-gray-600">Gérez votre flotte de véhicules</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="w-full sm:w-auto flex items-center justify-center px-3 sm:px-4 py-2 bg-tsa-blue text-white rounded-lg hover:bg-tsa-blue transition-colors text-sm sm:text-base"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          <span className="hidden sm:inline">Ajouter un véhicule</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>

        <Sheet
          open={showCreateForm}
          onOpenChange={(open) => {
            if (!open) {
              setEditingVehicle(null);
            }
            setShowCreateForm(open);
          }}
        >
          <SheetContent className="w-full sm:w-4/5 sm:min-w-fit p-3 sm:p-4 max-h-screen overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingVehicle ? tForms('sections.updateVehicle') : tForms('sections.addVehicle')}
              </SheetTitle>
              <SheetDescription className="text-xs sm:text-sm text-gray-600 mt-1">
                {editingVehicle
                  ? tForms('messages.updateVehicleDescription')
                  : tForms('messages.addVehicleDescription')}
              </SheetDescription>
            </SheetHeader>
            <div>
              <CreateVehicleForm
                vehicle={editingVehicle ?? null}
                onSubmit={(data) => {
                  if (editingVehicle) handleUpdateVehicle(data as UpdateVehicleRequest);
                  else {
                    handleCreateVehicle(data as CreateVehicleRequest);
                  }
                }}
                onCancel={() => {
                  setShowCreateForm(false);
                  setEditingVehicle(null);
                }}
                isLoading={isLoading}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{getTotalVehicles()}</p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center text-xs sm:text-base">
              🚗
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Disponibles</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{getAvailableCount()}</p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center text-xs sm:text-base">
              ✅
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">En mission</p>
              <p className="text-lg sm:text-2xl font-bold text-tsa-blue">{getInUseCount()}</p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center text-xs sm:text-base">
              🚚
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Maintenance</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">
                {getMaintenanceCount()}
              </p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center text-xs sm:text-base">
              🔧
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
              <input
                type="text"
                placeholder="Rechercher par immatriculation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-3 sm:px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm sm:text-base"
          >
            <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            <span className="hidden sm:inline">Filtres</span>
            <span className="sm:hidden">Filtrer</span>
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-gray-700">
                  Type de véhicule
                </Label>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as VehicleType | '')}
                >
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les types</SelectItem>
                    {Object.values(VehicleType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {VehicleTypeLabels[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-gray-700">Statut</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as VehicleStatus | '')}
                >
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les statuts</SelectItem>
                    {Object.values(VehicleStatus)
                      .filter((status) => status !== 'in_mission')
                      .map((status) => (
                        <SelectItem key={status} value={status}>
                          {VehicleStatusLabels[status]}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full text-xs sm:text-sm"
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
          <div className="flex justify-between items-center">
            <p className="text-red-800 text-sm sm:text-base">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 text-lg sm:text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Vehicles List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="inline-block w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">Chargement des véhicules...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <p className="text-gray-600 text-sm sm:text-base">Aucun véhicule trouvé</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 text-tsa-blue hover:text-blue-800 text-sm sm:text-base"
            >
              Ajouter votre premier véhicule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Type
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Description
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg sm:text-2xl mr-2 sm:mr-3">
                          {VehicleTypeIcons[vehicle.type]}
                        </span>
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900">
                            {vehicle.registration}
                          </div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            {VehicleTypeLabels[vehicle.type]}
                          </div>
                          <div className="text-xs text-gray-500 hidden sm:block">
                            ID: {vehicle.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className="text-xs sm:text-sm text-gray-900">
                        {VehicleTypeLabels[vehicle.type]}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <Select
                        value={vehicle.status}
                        onValueChange={(value) =>
                          handleStatusChange(vehicle.id, value as VehicleStatus)
                        }
                        disabled={isLoading || vehicle.status === 'in_mission'}
                      >
                        <SelectTrigger
                          className={`text-xs px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${getStatusBadgeColor(vehicle.status)} h-auto min-h-0 w-full sm:w-auto`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(VehicleStatus)
                            .filter((status) => status !== 'in_mission')
                            .map((status) => (
                              <SelectItem key={status} value={status}>
                                {VehicleStatusLabels[status]}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                      <div className="text-xs sm:text-sm text-gray-900 max-w-xs truncate">
                        {vehicle.description || 'Aucune description'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                      <div className="flex justify-end space-x-1 sm:space-x-2">
                        <button
                          onClick={() => setEditingVehicle(vehicle)}
                          className="text-tsa-blue hover:text-blue-900 p-1"
                          title="Modifier"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Supprimer"
                          disabled={vehicle.status === VehicleStatus.IN_MISSION}
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVehicles;
