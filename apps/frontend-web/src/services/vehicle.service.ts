import { BaseApi } from './api';
import type { ApiResponse, PaginatedMetaResponse } from '../types/common.types';
import type {
  Vehicle,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  UpdateVehicleStatusRequest,
  VehicleFiltersQuery,
} from '../types/vehicle.types';
import type { AxiosError } from 'axios';

export class VehicleService extends BaseApi {
  private isAxiosError(
    error: unknown
  ): error is AxiosError<{ message?: string; errors?: unknown[] }> {
    return (error as AxiosError).isAxiosError === true;
  }

  private getErrorMessage(error: AxiosError<{ message?: string; errors?: unknown[] }>): string {
    return error.response?.data?.message || error.message || 'An error occurred';
  }

  private getErrorResponse(error: unknown): {
    success: false;
    status: number;
    message: string;
    errors: string[];
  } {
    if (this.isAxiosError(error)) {
      const errors = error.response?.data?.errors || [];
      const stringErrors = errors.map((err) =>
        typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err)
      );

      return {
        success: false,
        status: error.response?.status || 500,
        message: this.getErrorMessage(error),
        errors: stringErrors,
      };
    }
    return {
      success: false,
      status: 500,
      message: 'An unexpected error occurred',
      errors: [],
    };
  }

  /**
   * Get all vehicles for the authenticated transporteur with filters
   */
  async getVehicles(
    params?: VehicleFiltersQuery
  ): Promise<ApiResponse<PaginatedMetaResponse<Vehicle, 'vehicles'>>> {
    try {
      const response = await this.insertToken().get('/api/transporteur/vehicles', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Get a specific vehicle by ID
   */
  async getVehicle(id: string): Promise<ApiResponse<Vehicle>> {
    try {
      const response = await this.insertToken().get(`/api/transporteur/vehicles/${id}`);
      return { data: response.data.data.vehicle };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Create a new vehicle
   */
  async createVehicle(data: CreateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    try {
      const response = await this.insertToken().post('/api/transporteur/vehicles', data);
      return { data: response.data.data.vehicle };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Update an existing vehicle
   */
  async updateVehicle(id: string, data: UpdateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    try {
      const response = await this.insertToken().put(`/api/transporteur/vehicles/${id}`, data);
      return { data: response.data.data.vehicle };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Update vehicle status
   */
  async updateVehicleStatus(
    id: string,
    data: UpdateVehicleStatusRequest
  ): Promise<ApiResponse<Vehicle>> {
    try {
      const response = await this.insertToken().put(
        `/api/transporteur/vehicles/${id}/status`,
        data
      );
      return { data: response.data.data.vehicle };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Delete a vehicle
   */
  async deleteVehicle(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await this.insertToken().delete(`/api/transporteur/vehicles/${id}`);
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }
}

// Export singleton instance
export const vehicleService = new VehicleService();
