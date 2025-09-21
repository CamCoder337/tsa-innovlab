import type { Timestamps } from './common.types';

export type MissionStatus = 'draft' | 'published' | 'assigned' | 'completed' | 'cancelled';

export interface Mission extends Timestamps {
  id: string;
  affreteurId: string;
  titre: string;
  description: string | null;
  typeMarchandise: string | null;
  poids: number | null;
  volume: number | null;
  dateDepartEstime: string | null;
  dateArriveePrevue: string | null;
  adresseDepartId: string | null;
  adresseArriveeId: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  status: MissionStatus;
  isFlexibleDates: boolean;
  isFlexibleRoute: boolean;
  notesComplementaires: string | null;
  documents: string[];
  transporteurId: string | null;
  dateDebutReelle: string | null;
  dateFinReelle: string | null;
  ratingAffreteur: number | null;
  commentaireAffreteur: string | null;
  ratingTransporteur: number | null;
  commentaireTransporteur: string | null;
}

export interface CreateMissionDto {
  titre: string;
  description?: string;
  typeMarchandise?: string;
  poids?: number;
  volume?: number;
  dateDepartEstime?: string;
  dateArriveePrevue?: string;
  adresseDepartId?: string;
  adresseArriveeId?: string;
  budgetMin?: number;
  budgetMax?: number;
  isFlexibleDates?: boolean;
  isFlexibleRoute?: boolean;
  notesComplementaires?: string;
  documents?: File[];
}

export interface UpdateMissionDto {
  status?: MissionStatus;
  transporteurId?: string | null;
  dateDebutReelle?: string | null;
  dateFinReelle?: string | null;
  ratingAffreteur?: number | null;
  commentaireAffreteur?: string | null;
  ratingTransporteur?: number | null;
  commentaireTransporteur?: string | null;
}

export interface MissionFilterParams {
  status?: MissionStatus[];
  affreteurId?: string;
  transporteurId?: string;
  dateFrom?: string;
  dateTo?: string;
  minBudget?: number;
  maxBudget?: number;
  typeMarchandise?: string;
  sortBy?: 'createdAt' | 'dateDepartEstime' | 'budgetMin';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
