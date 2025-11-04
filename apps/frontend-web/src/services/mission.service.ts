// ============================================================================
// MISSION SERVICE
// ============================================================================

import { BaseApi } from './api';
import { webSocketService } from './websocket.service';
import type { ApiResponse, PaginatedMetaResponse } from '@/types/common.types';
import type {
  Mission,
  MissionStatus,
  CreateMissionDto,
  UpdateMissionDto,
  MissionFilterParams,
  CreateMissionFeedback,
  MissionFeedback,
  MissionUpdateFilterParams,
  DynamicPricingRequest,
  DynamicPricingResponse,
  UpdateMissionStatus,
  proofType,
} from '@/types/mission.types';
import type { Vehicle } from '@/types/vehicle.types';
import type { AxiosError } from 'axios';

// Types pour les événements WebSocket
interface MissionStatusUpdatedEvent {
  id: string;
  status: MissionStatus;
}

// Type partiel de mission pour les mises à jour
type PartialMission = Partial<Mission> & {
  id: string;
  status: MissionStatus;
};

type MissionSubscriptionCallback = (mission: PartialMission) => void;
type MissionsSubscriptionCallback = (missions: PartialMission[]) => void;
type MissionFilter = string;

export class MissionService extends BaseApi {
  private static instance: MissionService;
  private missionSubscriptions = new Map<string, Set<MissionSubscriptionCallback>>();
  private missionsSubscriptions = new Map<MissionFilter, Set<MissionsSubscriptionCallback>>();

  private constructor() {
    super();
  }

  public static getInstance(): MissionService {
    if (!MissionService.instance) {
      MissionService.instance = new MissionService();
    }
    return MissionService.instance;
  }

  /**
   * Initialise le service WebSocket avec un token d'authentification
   * Doit être appelé après la connexion de l'utilisateur
   */
  public initializeWebSocket(token: string): void {
    webSocketService.initialize(token);
    this.setupWebSocketListeners();
  }

  /**
   * Configure les écouteurs d'événements WebSocket
   */
  private setupWebSocketListeners(): void {
    // Écoute les mises à jour de mission spécifique
    webSocketService.subscribe<Mission>('mission:updated', (mission) => {
      this.notifyMissionSubscribers(mission);
    });

    // Écoute les nouvelles missions
    webSocketService.subscribe<Mission>('mission:created', (mission) => {
      this.notifyMissionsSubscribers(mission);
    });

    // Écoute les suppressions de mission
    webSocketService.subscribe<{ id: string }>('mission:deleted', ({ id }) => {
      this.notifyMissionDeleted(id);
    });

    // Écoute les mises à jour de statut
    webSocketService.subscribe<MissionStatusUpdatedEvent>(
      'mission:status_updated',
      ({ id, status }) => {
        this.notifyMissionStatusUpdated(id, status);
      }
    );
  }

  /**
   * Déconnecte le service WebSocket
   * Doit être appelé lors de la déconnexion de l'utilisateur
   */
  public disconnectWebSocket(): void {
    webSocketService.disconnect();
  }

  /**
   * S'abonne aux mises à jour d'une mission spécifique
   * @param missionId ID de la mission à écouter
   * @param callback Fonction de rappel appelée lors des mises à jour
   * @returns Fonction pour se désabonner
   */
  public subscribeToMission(missionId: string, callback: MissionSubscriptionCallback): () => void {
    if (!this.missionSubscriptions.has(missionId)) {
      this.missionSubscriptions.set(missionId, new Set());
    }

    const callbacks = this.missionSubscriptions.get(missionId)!;
    callbacks.add(callback);

    // Retourne une fonction pour se désabonner
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.missionSubscriptions.delete(missionId);
      }
    };
  }

  /**
   * S'abonne aux mises à jour de la liste des missions
   * @param filter Filtre pour identifier la liste de missions à écouter
   * @param callback Fonction de rappel appelée lors des mises à jour
   * @returns Fonction pour se désabonner
   */
  public subscribeToMissions(filter: string, callback: MissionsSubscriptionCallback): () => void {
    if (!this.missionsSubscriptions.has(filter)) {
      this.missionsSubscriptions.set(filter, new Set());
    }

    const callbacks = this.missionsSubscriptions.get(filter)!;
    callbacks.add(callback);

    // Retourne une fonction pour se désabonner
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.missionsSubscriptions.delete(filter);
      }
    };
  }

  /**
   * Notifie tous les abonnés d'une mission mise à jour
   * @param mission Mission mise à jour
   */
  private notifyMissionSubscribers(mission: Mission): void {
    const callbacks = this.missionSubscriptions.get(mission.id);
    if (callbacks) {
      callbacks.forEach((callback) => callback(mission));
    }

    // Notifie également les abonnés aux listes de missions
    this.notifyMissionsSubscribers(mission);
  }

  /**
   * Notifie les abonnés des listes de missions
   * @param mission Mission affectant les listes
   */
  private notifyMissionsSubscribers(mission: Mission): void {
    // Ici, vous pouvez ajouter une logique pour déterminer quelles listes sont affectées
    // Pour l'instant, on notifie toutes les listes
    this.missionsSubscriptions.forEach((callbacks) => {
      callbacks.forEach((callback) => callback([mission]));
    });
  }

  /**
   * Notifie les abonnés de la suppression d'une mission
   * @param missionId ID de la mission supprimée
   */
  private notifyMissionDeleted(missionId: string): void {
    const callbacks = this.missionSubscriptions.get(missionId);
    if (callbacks) {
      const deletedMission: PartialMission = {
        id: missionId,
        status: 'cancelled' as MissionStatus,
      };
      callbacks.forEach((callback) => callback(deletedMission));
      this.missionSubscriptions.delete(missionId);
    }

    // Notifie également les abonnés aux listes de missions
    const deletedMission: PartialMission = {
      id: missionId,
      status: 'cancelled' as MissionStatus,
    };

    this.missionsSubscriptions.forEach((callbacks) => {
      callbacks.forEach((callback) => callback([deletedMission]));
    });
  }

  /**
   * Notifie les abonnés d'un changement de statut d'une mission
   * @param missionId ID de la mission mise à jour
   * @param status Nouveau statut de la mission
   */
  private notifyMissionStatusUpdated(missionId: string, status: MissionStatus): void {
    const callbacks = this.missionSubscriptions.get(missionId);
    if (callbacks) {
      const updatedMission: PartialMission = {
        id: missionId,
        status,
      };
      callbacks.forEach((callback) => callback(updatedMission));
    }

    // Notifie également les abonnés aux listes de missions
    this.missionsSubscriptions.forEach((callbacks) => {
      callbacks.forEach((callback) => {
        // Crée une mission minimale avec juste l'ID et le statut mis à jour
        // En production, vous voudriez probablement récupérer la mission complète depuis le store
        const updatedMission: PartialMission = {
          id: missionId,
          status,
        };
        callback([updatedMission]);
      });
    });
  }

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

  async createMission(data: CreateMissionDto): Promise<ApiResponse<Mission>> {
    try {
      const response = await this.insertToken().post('/api/affreteur/missions', data);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async updateMission(id: string, data: Partial<UpdateMissionDto>): Promise<ApiResponse<Mission>> {
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

  async unpublishMission(id: string): Promise<ApiResponse<Mission>> {
    try {
      const response = await this.insertToken().post(`/api/affreteur/missions/${id}/unpublish`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getMissionFeedback(id: string): Promise<ApiResponse<MissionFeedback>> {
    try {
      const response = await this.insertToken().get(`/api/affreteur/missions/${id}/feedback`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async createMissionFeedback(
    id: string,
    data: CreateMissionFeedback
  ): Promise<ApiResponse<MissionFeedback>> {
    try {
      const response = await this.insertToken().post(
        `/api/affreteur/missions/${id}/feedback`,
        data
      );
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getMissionHistory(
    id: string,
    params?: MissionUpdateFilterParams
  ): Promise<ApiResponse<PaginatedMetaResponse<Mission, 'missions'>>> {
    try {
      const response = await this.insertToken().get(`/api/affreteur/missions/${id}/history`, {
        params,
      });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async calculateDynamicPricing(
    requestData: DynamicPricingRequest
  ): Promise<ApiResponse<DynamicPricingResponse>> {
    try {
      const response = await this.insertToken().post(
        '/api/affreteur/pricing/calculate',
        requestData
      );
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getDynamicPricingConfig(): Promise<ApiResponse<Record<string, number>>> {
    try {
      const response = await this.insertToken().get('/api/affreteur/pricing/config');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  // async getAffreteurShipments(
  //   params?: MissionFilterParams
  // ): Promise<ApiResponse<PaginatedMetaResponse<Mission, 'missions'>>> {
  //   try {
  //     const response = await this.insertToken().get('/api/affreteur/missions', { params });
  //     return { data: response.data.data };
  //   } catch (error) {
  //     return { error: this.getErrorResponse(error) };
  //   }
  // }

  // async getAffreteurShipment(id: string): Promise<ApiResponse<Mission>> {
  //   try {
  //     const response = await this.insertToken().get(`/api/affreteur/missions/${id}`);
  //     return { data: response.data.data };
  //   } catch (error) {
  //     return { error: this.getErrorResponse(error) };
  //   }
  // }

  // Transporteur Mission Operations

  async getAvailableMissions(params?: {
    search?: string;
    city?: string;
    budgetMin?: number;
    budgetMax?: number;
    typeMarchandise?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedMetaResponse<Mission, 'missions'>>> {
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
      const response = await this.insertToken().get('/api/transporteur/my-missions', { params });
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

  async applyForMission(
    missionId: string,
    vehicleId: string
  ): Promise<ApiResponse<{ mission: Mission; vehicle: Vehicle }>> {
    try {
      const response = await this.insertToken().post(
        `/api/transporteur/missions/${missionId}/claim`,
        { vehicleId }
      );
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async getTransporteurMissionHistory(
    id: string,
    params?: MissionUpdateFilterParams
  ): Promise<ApiResponse<PaginatedMetaResponse<Mission, 'missions'>>> {
    try {
      const response = await this.insertToken().get(`/api/transporteur/missions/${id}/history`, {
        params,
      });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async updateMissionStatus(
    missionId: string,
    data: UpdateMissionStatus
  ): Promise<
    ApiResponse<{
      mission: Mission;
      oldStatus: MissionStatus;
      newStatus: MissionStatus;
      commentaire: string;
    }>
  > {
    try {
      const response = await this.insertToken().put(
        `/api/transporteur/missions/${missionId}/status`,
        data
      );
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async updateMissionLocation(
    missionId: string,
    location: { latitude: number; longitude: number; timestamp: Date }
  ): Promise<
    ApiResponse<{
      missionId: string;
      location: {
        latitude: number;
        longitude: number;
        timestamp: string;
      };
      realTimeBroadcast: boolean;
    }>
  > {
    try {
      const response = await this.insertToken().post(
        `/api/transporteur/missions/${missionId}/location`,
        location
      );
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async uploadProof(
    missionId: string,
    data: FormData
  ): Promise<
    ApiResponse<{
      missionId: string;
      proof: {
        type: proofType;
        description: string;
        imageUrl: string;
        timestamp: string;
      };
    }>
  > {
    try {
      const response = await this.insertToken().post(
        `/api/transporteur/missions/${missionId}/proof`,
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }
}

export const missionService = MissionService.getInstance();
