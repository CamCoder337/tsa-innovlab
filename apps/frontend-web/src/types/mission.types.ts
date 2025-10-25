import type { Timestamps } from './common.types';
import type { Address } from './address.types';
import type { User } from './auth.types';
import type { Vehicle, VehicleType } from './vehicle.types';

export type MissionStatus =
  | 'draft'
  | 'published'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type MissionUpdateType =
  | 'status_change'
  | 'location_update'
  | 'proof_upload'
  | 'note'
  | 'issue';

export type proofType =
  | 'delivery_signature'
  | 'photo_delivery'
  | 'recipient_confirmation'
  | 'damage_report';

export interface Mission extends Timestamps {
  id: string;
  affreteurId: string;
  affreteur?: User;
  transporteurId?: string | null;
  transporteur?: User;
  vehicleId?: string | null;
  vehicle?: Vehicle;
  requiredVehicleType?: VehicleType | null;
  title: string;
  description?: string | null;
  typeMarchandise?: string | null;
  poids?: number | null;
  volume?: number | null;
  dateDepartEstime?: string | null;
  dateArriveePrevue?: string | null;
  adresseDepartId?: string | null;
  adresseDepart?: Address;
  adresseArriveeId?: string | null;
  adresseArrivee?: Address;
  budgetMin?: number | null;
  budgetMax?: number | null;
  status: MissionStatus;
  isFlexibleDates?: boolean;
  isFlexibleRoute?: boolean;
  notesComplementaires?: string;
  documents?: string[];
  dateDebutReelle?: string;
  dateFinReelle?: string;
  ratingAffreteur?: number;
  commentaireAffreteur?: string;
  ratingTransporteur?: number;
  commentaireTransporteur?: string;
  // Position actuelle du transporteur pour le tracking en temps réel
  currentPosition?: { lat: number; lng: number };
  lastPositionUpdate?: string;
}

export interface CreateMissionDto {
  title: string;
  affreteurId: string;
  description?: string;
  typeMarchandise?: string;
  poids?: number;
  volume?: number;
  dateDepartEstime?: string;
  dateArriveePrevue?: string;
  adresseDepart?: Address;
  adresseArrivee?: Address;
  budgetMin?: number;
  budgetMax?: number;
  requiredVehicleType?: VehicleType;
}

// Mission application interface for transporteurs
export interface ApplyForMissionRequest {
  vehicleId: string;
}

export interface UpdateMissionDto extends Partial<CreateMissionDto> {
  status?: MissionStatus;
  transporteurId?: string | null;
  dateDebutReelle?: string | null;
  dateFinReelle?: string | null;
  ratingAffreteur?: number | null;
  commentaireAffreteur?: string | null;
  ratingTransporteur?: number | null;
  commentaireTransporteur?: string | null;
}

export interface UpdateMissionStatus {
  status: MissionStatus;
  transporteurId?: string | null;
  commentaire?: string | null;
}

export interface MissionStats {
  totals: {
    missions: number;
    affreteurs: number;
    transporteurs: number;
  };
  statusStats: Record<string, number>;
  recentMissions: Array<{
    id: string;
    title: string;
    status: MissionStatus;
    affreteur: string | null;
    createdAt: string;
  }>;
}

export interface MissionFilterParams {
  search?: string;
  status?: MissionStatus[];
  affreteurId?: string;
  transporteurId?: string;
  dateFrom?: string;
  dateTo?: string;
  budgetMin?: number;
  budgetMax?: number;
  typeMarchandise?: string;
  city?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'titre' | 'budgetMin' | 'budgetMax';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MissionState {
  missions: Mission[];
  myMissions: Mission[];
  currentMission: Mission | null;
  stats: MissionStats;
  feedbacks: MissionFeedback[];
  currentFeedback: MissionFeedback | null;
  feedbackStats: FeedbackStats | null;
  isLoading: boolean;
  error: string | null;
}

export interface MissionActions {
  setMissions: (missions: Mission[]) => void;
  setMyMissions: (missions: Mission[]) => void;
  setCurrentMission: (mission: Mission | null) => void;
  setStats: (stats: MissionStats) => void;

  fetchAllMissions: () => Promise<void>;
  fetchMyMissions: () => Promise<void>;
  fetchMission: (id: string) => Promise<void>;
  fetchMissionsStats: () => Promise<void>;
  createMission: (data: CreateMissionDto) => Promise<Mission | null>;
  updateMission: (id: string, data: UpdateMissionDto) => Promise<void>;
  deleteMission: (
    id: string,
    translations?: { loading?: string; success?: string; error?: string }
  ) => void;
  publishMission: (id: string) => Promise<void>;
  unpublishMission: (id: string) => Promise<void>;
  applyForMission: (id: string, vehicleId: string) => Promise<void>;

  // Feedback management actions
  fetchFeedbacks: (params?: FeedbackFilterParams) => Promise<void>;
  fetchFeedback: (id: string) => Promise<void>;
  fetchFeedbackStats: () => Promise<void>;
  setCurrentFeedback: (feedback: MissionFeedback | null) => void;
  setFeedbacks: (feedbacks: MissionFeedback[]) => void;
  setFeedbackStats: (feedbackStats: FeedbackStats) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Extended store interface with API and utility methods
export type MissionStoreExtended = MissionState & MissionActions;

// Feedback interfaces based on backend Feedback model
export interface MissionFeedback extends Timestamps {
  id: string;
  missionId: string;
  mission?: Mission;
  affreteurId: string;
  affreteur?: User;
  transporteurId?: string;
  transporteur?: User;
  rating: number;
  description?: string;
}

export interface CreateMissionFeedback {
  rating: number;
  description?: string;
}

// Feedback filter parameters for admin
export interface FeedbackFilterParams {
  page?: number;
  limit?: number;
  rating?: number; // Filter by rating (1-5)
  transporteurId?: string; // Filter by transporteur
  affreteurId?: string; // Filter by affreteur
  missionId?: string; // Filter by mission
  sortBy?: 'rating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Feedback statistics for admin dashboard
export interface FeedbackStats {
  total: number;
  averageRating: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  topTransporteurs: Array<{
    transporteurId: string;
    transporteurName: string;
    averageRating: number;
    feedbackCount: number;
  }>;
  worstTransporteurs: Array<{
    transporteurId: string;
    transporteurName: string;
    averageRating: number;
    feedbackCount: number;
  }>;
}

export interface MissionUpdate extends Timestamps {
  id: string;
  missionId: string;
  mission?: Mission;
  transporteurId?: string;
  transporteur?: User;
  type: MissionUpdateType;
  title: string;
  description?: string;
  oldStatus?: string;
  newStatus?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  attachments?: string[];
  isPublic: boolean;
}

export interface MissionUpdateFilterParams {
  page?: number;
  limit?: number;
  type?: MissionUpdateType;
}

export interface RecommendationRequest {
  userId: string;
  limit?: number;
  context?: 'homepage' | 'product' | 'cart' | 'checkout';
}

export interface SimilarProductsRequest {
  productId: string;
  limit?: number;
}

export interface RecommendationResponse {
  success: boolean;
  recommendations: Array<{
    product_id: string;
    score: number;
    reason: string;
  }>;
  strategy_used: string;
}

export interface DynamicPricingRequest {
  origin: string;
  destination: string;
  distance_km: number;
  weight_tons: number;
  cargo_type?: string;
  urgency?: string;
}

export interface DynamicPricingResponse {
  success: boolean;
  calculated_price: number;
  negotiation_range: {
    min_price: number;
    max_price: number;
    margin_percentage: number;
    reason: string;
  };
  breakdown: {
    base_cost: number;
    distance_factor: number;
    weight_factor: number;
    cargo_type_multiplier: number;
    urgency_multiplier: number;
  };
}

export interface VisualRecognitionResponse {
  success: boolean;
  results: Array<{
    product_id: string;
    product_name: string;
    confidence: number;
    category: string;
  }>;
  processing_time_ms: number;
}
