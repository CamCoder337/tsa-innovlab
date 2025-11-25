import { BaseApi } from './api';

export interface TrackingCredentials {
  trackingToken: string;
  trackingPin: string;
}

export interface LocationUpdate {
  id: string;
  missionId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: string;
}

export interface MissionIssue {
  id: string;
  missionId: string;
  reportedById: string;
  type: 'breakdown' | 'delay' | 'accident' | 'traffic' | 'other';
  description: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
  status: 'reported' | 'acknowledged' | 'resolved';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface QRCodeResponse {
  qrCode: string; // Base64 data URL
  mission: {
    id: string;
    title: string;
    status: string;
  };
}

export class MissionTrackingService extends BaseApi {
  private readonly baseUrl = '/api/affreteur/missions';

  /**
   * Générer le QR code de livraison pour une mission
   */
  async generateDeliveryQRCode(missionId: string): Promise<QRCodeResponse> {
    return this.get(`${this.baseUrl}/${missionId}/qr-code`);
  }

  /**
   * Régénérer le QR code (en cas de perte ou suspicion)
   */
  async regenerateQRCode(missionId: string): Promise<QRCodeResponse> {
    return this.post(`${this.baseUrl}/${missionId}/regenerate-qr`);
  }

  /**
   * Récupérer les positions GPS d'une mission
   */
  async getLocationUpdates(missionId: string, limit: number = 50): Promise<{
    locations: LocationUpdate[];
    mission: {
      id: string;
      title: string;
      status: string;
    };
  }> {
    return this.get(`${this.baseUrl}/${missionId}/locations`, {
      params: { limit },
    });
  }

  /**
   * Récupérer les problèmes signalés pour une mission
   */
  async getIssues(missionId: string): Promise<{ issues: MissionIssue[] }> {
    return this.get(`${this.baseUrl}/${missionId}/issues`);
  }

  /**
   * Marquer un problème comme reconnu
   */
  async acknowledgeIssue(missionId: string, issueId: string): Promise<{ issue: MissionIssue }> {
    return this.post(`${this.baseUrl}/${missionId}/issues/${issueId}/acknowledge`);
  }

  /**
   * Marquer un problème comme résolu
   */
  async resolveIssue(missionId: string, issueId: string): Promise<{ issue: MissionIssue }> {
    return this.post(`${this.baseUrl}/${missionId}/issues/${issueId}/resolve`);
  }

  /**
   * Marquer une mission comme payée
   */
  async markAsPaid(missionId: string): Promise<{ mission: any }> {
    return this.post(`${this.baseUrl}/${missionId}/mark-as-paid`);
  }

  /**
   * Clôturer définitivement une mission
   */
  async completeMission(missionId: string): Promise<{ mission: any }> {
    return this.post(`${this.baseUrl}/${missionId}/complete`);
  }

  /**
   * Polling des dernières positions (à appeler régulièrement)
   * @param missionId ID de la mission
   * @param intervalMs Intervalle en millisecondes (par défaut 5000 = 5s)
   * @returns Fonction cleanup pour arrêter le polling
   */
  startLocationPolling(
    missionId: string,
    onUpdate: (locations: LocationUpdate[]) => void,
    intervalMs: number = 5000
  ): () => void {
    let lastTimestamp: string | null = null;

    const poll = async () => {
      try {
        const response = await this.getLocationUpdates(missionId, 10);
        const locations = response.locations;

        // Filtrer pour ne garder que les nouvelles positions
        const newLocations = lastTimestamp
          ? locations.filter((loc) => new Date(loc.timestamp) > new Date(lastTimestamp!))
          : locations;

        if (newLocations.length > 0) {
          onUpdate(newLocations);
          lastTimestamp = newLocations[0].timestamp;
        }
      } catch (error) {
        console.error('Error polling location updates:', error);
      }
    };

    // Premier appel immédiat
    poll();

    // Polling régulier
    const intervalId = setInterval(poll, intervalMs);

    // Fonction cleanup
    return () => clearInterval(intervalId);
  }
}

// Singleton instance
export const missionTrackingService = new MissionTrackingService();
export default missionTrackingService;
