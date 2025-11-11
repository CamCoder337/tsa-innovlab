import { BaseApi } from './api';
import type { ApiResponse } from '../types/common.types';
import type { Address, CreateAddressDto, UpdateAddressDto } from '../types/address.types';
import type { AxiosError } from 'axios';

export class AddressService extends BaseApi {
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
  async getAddresses(params?: { page: number; limit: number }): Promise<ApiResponse<Address[]>> {
    try {
      const response = await this.insertToken().get('/api/common/addresses', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Get a specific vehicle by ID
   */
  async getAddress(id: string): Promise<ApiResponse<Address>> {
    try {
      const response = await this.insertToken().get(`/api/common/addresses/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Create a new vehicle
   */
  async createAddress(data: CreateAddressDto): Promise<ApiResponse<Address>> {
    try {
      const response = await this.insertToken().post('/api/common/addresses', data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Update an existing vehicle
   */
  async updateAddress(id: string, data: UpdateAddressDto): Promise<ApiResponse<Address>> {
    try {
      const response = await this.insertToken().put(`/api/common/addresses/${id}`, data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Delete a vehicle
   */
  async deleteAddress(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await this.insertToken().delete(`/api/common/addresses/${id}`);
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }
}

// Export singleton instance
export const addressService = new AddressService();
