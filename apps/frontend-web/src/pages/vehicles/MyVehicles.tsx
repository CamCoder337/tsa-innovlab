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
import toast from 'react-hot-toast';

export const MyVehicles: React.FC = () => {
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
  }, [filters]);

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

  if (showCreateForm) {
    return (
      <div className="p-6">
        <CreateVehicleForm
          onSubmit={
            handleCreateVehicle as (
              data: CreateVehicleRequest | UpdateVehicleRequest
            ) => Promise<void>
          }
          onCancel={() => setShowCreateForm(false)}
          isLoading={isLoading}
        />
      </div>
    );
  }

  if (editingVehicle) {
    return (
      <div className="p-6">
        <CreateVehicleForm
          vehicle={editingVehicle}
          onSubmit={handleUpdateVehicle}
          onCancel={() => setEditingVehicle(null)}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Véhicules</h1>
          <p className="text-gray-600">Gérez votre flotte de véhicules</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un véhicule
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalVehicles()}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              🚗
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disponibles</p>
              <p className="text-2xl font-bold text-green-600">{getAvailableCount()}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              ✅
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En mission</p>
              <p className="text-2xl font-bold text-blue-600">{getInUseCount()}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              🚚
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-orange-600">{getMaintenanceCount()}</p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              🔧
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par immatriculation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de véhicule
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as VehicleType | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tous les types</option>
                  {Object.values(VehicleType).map((type) => (
                    <option key={type} value={type}>
                      {VehicleTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tous les statuts</option>
                  {Object.values(VehicleStatus).map((status) => (
                    <option key={status} value={status}>
                      {VehicleStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex justify-between items-center">
            <p className="text-red-800">{error}</p>
            <button onClick={clearError} className="text-red-600 hover:text-red-800">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Vehicles List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">Chargement des véhicules...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Aucun véhicule trouvé</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Ajouter votre premier véhicule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{VehicleTypeIcons[vehicle.type]}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.registration}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {vehicle.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {VehicleTypeLabels[vehicle.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={vehicle.status}
                        onChange={(e) =>
                          handleStatusChange(vehicle.id, e.target.value as VehicleStatus)
                        }
                        className={`text-xs px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${getStatusBadgeColor(vehicle.status)}`}
                        disabled={isLoading}
                      >
                        {Object.values(VehicleStatus).map((status) => (
                          <option key={status} value={status}>
                            {VehicleStatusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {vehicle.description || 'Aucune description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingVehicle(vehicle)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                          disabled={vehicle.status === VehicleStatus.IN_MISSION}
                        >
                          <Trash2 className="w-4 h-4" />
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
