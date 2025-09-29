import type { User } from './auth.types';
import type { Mission, MissionStatus } from './mission.types';
import type { Timestamps } from './common.types';
import type { Paginator } from './common.types';

export type PropositionStatus = 'pending' | 'accepted' | 'rejected';

export interface Proposition extends Timestamps {
  id: string;
  missionId: string;
  mission?: Mission;
  transporteurId: string;
  transporteur?: User;
  prixPropose: number;
  delaiPropose: number; // in hours
  commentaire: string | null;
  status: PropositionStatus;
}

export interface CreatePropositionDto {
  prixPropose: number;
  delaiPropose: number; // in hours
  commentaire?: string;
}

export interface PropositionQueryParams {
  page?: number;
  limit?: number;
  status?: PropositionStatus;
  search?: string;
  missionId?: string;
  sortBy?: 'created_at' | 'prix_propose' | 'delai_propose';
  sortOrder?: 'asc' | 'desc';
}

export interface PropositionActionDto {
  commentaire?: string;
}

export type DeliveryProofType =
  | 'delivery_signature'
  | 'photo_delivery'
  | 'recipient_confirmation'
  | 'damage_report';

export interface DeliveryProofDto {
  proofType: DeliveryProofType;
  description: string;
  imageUrl?: string;
}

export interface LocationUpdateDto {
  latitude: number;
  longitude: number;
  timestamp?: string; // ISO
}

export type PropositionPaginator = Paginator<Proposition>;

export interface AffreteurPropositionsResponse {
  mission: {
    id: string;
    titre: string;
    status: MissionStatus;
    budgetMin: number | null;
    budgetMax: number | null;
  };
  propositions: PropositionPaginator;
}

export interface AcceptPropositionResponse {
  proposition: Proposition;
  mission: {
    id: string;
    status: MissionStatus;
  };
}

export interface MissionLocationUpdateResponse {
  missionId: string;
  location: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

export interface DeliveryProofResponse {
  missionId: string;
  proof: {
    type: DeliveryProofType;
    description: string;
    imageUrl: string | null;
    timestamp: string;
  };
}

export interface PropositionState {
  myPropositions: Proposition[];
  isLoading: boolean;
  error: string | null;
}

export interface PropositionActions {
  setMyPropositions: (propositions: Proposition[]) => void;
  addProposition: (proposition: Proposition) => void;
  updateProposition: (id: string, update: Proposition) => void;
  deleteProposition: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Extended store interface with API and utility methods
export type PropositionStoreExtended = PropositionState & PropositionActions;
