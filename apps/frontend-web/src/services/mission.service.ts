// ============================================================================
// MISSION SERVICE
// ============================================================================

import { BaseApi } from './api';
import type { ApiResponse, PaginatedMetaResponse } from '@/types/common.types';
import type {
  Mission,
  CreateMissionDto,
  UpdateMissionDto,
  MissionFilterParams,
  MissionStatus,
} from '@/types/mission.types';
import type { AxiosError } from 'axios';

export class MissionService extends BaseApi {
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

  // Affreteur Mission Operations

  async getAffreteurMissions(
    params?: MissionFilterParams
  ): Promise<ApiResponse<PaginatedMetaResponse<Mission, 'missions'>>> {
    try {
      const response = await this.insertToken().get('/api/affreteur/missions', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getAffreteurMission(id: string): Promise<ApiResponse<Mission>> {
    try {
      const response = await this.insertToken().get(`/api/affreteur/missions/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async createMission(data: CreateMissionDto): Promise<ApiResponse<Record<string, Mission>>> {
    try {
      const response = await this.insertToken().post('/api/affreteur/missions', data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async updateMission(
    id: string,
    data: Partial<UpdateMissionDto>
  ): Promise<ApiResponse<Record<string, Mission>>> {
    try {
      const response = await this.insertToken().put(`/api/affreteur/missions/${id}`, data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async deleteMission(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      await this.insertToken().delete(`/api/affreteur/missions/${id}`);
      return { data: { success: true, message: 'Mission deleted successfully' } };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async publishMission(id: string): Promise<ApiResponse<Mission>> {
    try {
      const response = await this.insertToken().post(`/api/affreteur/missions/${id}/publish`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async cancelMission(id: string, reason: string): Promise<ApiResponse<Mission>> {
    try {
      const response = await this.insertToken().post(`/api/affreteur/missions/${id}/cancel`, {
        reason,
      });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  // Transporteur Mission Operations

  async getAvailableMissions(
    params?: Omit<MissionFilterParams, 'status'>
  ): Promise<ApiResponse<PaginatedMetaResponse<Mission, 'missions'>>> {
    try {
      const response = await this.insertToken().get('/api/transporteur/missions/available', {
        params,
      });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getTransporteurMissions(
    params?: MissionFilterParams
  ): Promise<ApiResponse<PaginatedMetaResponse<Mission, 'missions'>>> {
    try {
      const response = await this.insertToken().get('/api/transporteur/missions', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getTransporteurMission(id: string): Promise<ApiResponse<Mission>> {
    try {
      const response = await this.insertToken().get(`/api/transporteur/missions/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async submitProposal(
    missionId: string,
    data: { amount: number; message?: string; estimatedDeliveryDate: string }
  ): Promise<ApiResponse<Mission>> {
    try {
      const response = await this.insertToken().post(
        `/api/transporteur/missions/${missionId}/propose`,
        data
      );
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async updateMissionStatus(
    id: string,
    status: MissionStatus,
    comment?: string
  ): Promise<ApiResponse<Mission>> {
    try {
      const response = await this.insertToken().put(`/api/transporteur/missions/${id}/status`, {
        status,
        comment,
      });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  // Admin Operations

  async adminGetMissions(
    params?: MissionFilterParams
  ): Promise<ApiResponse<PaginatedMetaResponse<Mission, 'missions'>>> {
    try {
      const response = await this.insertToken().get('/api/admin/missions', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async adminGetMission(id: string): Promise<ApiResponse<Mission>> {
    try {
      const response = await this.insertToken().get(`/api/admin/missions/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async adminUpdateMission(
    id: string,
    data: Partial<UpdateMissionDto>
  ): Promise<ApiResponse<Mission>> {
    try {
      const response = await this.insertToken().put(`/api/admin/missions/${id}`, data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async adminDeleteMission(id: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      await this.insertToken().delete(`/api/admin/missions/${id}`);
      return { data: { success: true } };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }
}

export const missionService = new MissionService();
