import type { ApiResponse, PaginationMeta } from '@/types/common.types';
import { BaseApi } from './api';
import type { AxiosError } from 'axios';

// Types pour les urgences
export type EmergencyType = 'breakdown' | 'accident' | 'medical' | 'security' | 'delay' | 'traffic' | 'other';
export type EmergencyStatus = 'reported' | 'acknowledged' | 'in_progress' | 'resolved';
export type EmergencyPriority = 1 | 2 | 3; // 1 = Critical, 2 = High, 3 = Normal

export interface Emergency {
  id: string;
  missionId: string;
  reportedById: string;
  type: EmergencyType;
  description: string;
  photos: string[] | null;
  latitude: number | null;
  longitude: number | null;
  status: EmergencyStatus;
  isEmergency: boolean;
  emergencyConversationId: number | null;
  priority: EmergencyPriority;
  firstResponseAt: string | null;
  handledById: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  
  // Relations
  mission?: {
    id: string;
    title: string;
    status: string;
    affreteur?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
    transporteur?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  };
  reportedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  handledBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface EmergencyStats {
  active: number;
  critical: number;
  high: number;
  resolvedToday: number;
  avgResponseTimeMinutes: number;
}

export interface EmergencyFilterParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'all' | EmergencyStatus;
  priority?: EmergencyPriority;
}

export class EmergencyService extends BaseApi {
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
   * Récupérer la liste des urgences
   */
  async getEmergencies(
    params?: EmergencyFilterParams
  ): Promise<ApiResponse<{ data: Emergency[]; meta: PaginationMeta }>> {
    try {
      const response = await this.insertToken().get('/api/admin/emergencies', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Récupérer les statistiques des urgences
   */
  async getEmergencyStats(): Promise<ApiResponse<EmergencyStats>> {
    try {
      const response = await this.insertToken().get('/api/admin/emergencies/stats');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Récupérer les détails d'une urgence
   */
  async getEmergency(id: string): Promise<ApiResponse<{ emergency: Emergency }>> {
    try {
      const response = await this.insertToken().get(`/api/admin/emergencies/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Prendre en charge une urgence
   */
  async acknowledgeEmergency(id: string): Promise<ApiResponse<{ issue: Emergency }>> {
    try {
      const response = await this.insertToken().post(`/api/admin/emergencies/${id}/acknowledge`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Marquer une urgence comme en cours
   */
  async markInProgress(id: string): Promise<ApiResponse<{ issue: Emergency }>> {
    try {
      const response = await this.insertToken().post(`/api/admin/emergencies/${id}/in-progress`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Résoudre une urgence
   */
  async resolveEmergency(
    id: string,
    resolutionNotes?: string
  ): Promise<ApiResponse<{ issue: Emergency }>> {
    try {
      const response = await this.insertToken().post(`/api/admin/emergencies/${id}/resolve`, {
        resolution_notes: resolutionNotes,
      });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }
}

export const emergencyService = new EmergencyService();
