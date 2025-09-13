// ============================================================================
// MISSION TYPES
// ============================================================================

import type { User } from './user.types';
import type { Address } from './address.types';

export type MissionStatus = 'draft' | 'published' | 'assigned' | 'completed' | 'cancelled';

export interface Mission {
    id: string;
    affreteurId: string;
    titre: string;
    description: string;
    typeMarchandise: string;
    poids: number;
    volume: number;
    dateDepartEstime: string;
    dateArriveePrevue: string;
    adresseDepartId: string;
    adresseArriveeId: string;
    budgetMin: number;
    budgetMax: number;
    status: MissionStatus;
    createdAt: string;
    updatedAt: string;
    // Relations
    affreteur?: User;
    adresseDepart?: Address;
    adresseArrivee?: Address;
    propositions?: Proposition[];
}

export interface CreateMissionRequest {
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
}

export interface UpdateMissionRequest extends Partial<CreateMissionRequest> {
    status?: MissionStatus;
}

export interface MissionFilters {
    status?: MissionStatus[];
    affreteurId?: string;
    typeMarchandise?: string[];
    budgetMin?: number;
    budgetMax?: number;
    dateDepartEstime?: string;
    dateArriveePrevue?: string;
}

export interface MissionListParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: MissionFilters;
}

// Proposition types
export type PropositionStatus = 'pending' | 'accepted' | 'rejected';

export interface Proposition {
    id: string;
    missionId: string;
    transporteurId: string;
    prixPropose: number;
    delaiPropose: number;
    commentaire: string | null;
    status: PropositionStatus;
    createdAt: string;
    updatedAt: string;
    // Relations
    mission?: Mission;
    transporteur?: User;
}

export interface CreatePropositionRequest {
    missionId: string;
    prixPropose: number;
    delaiPropose: number;
    commentaire?: string;
}

export interface UpdatePropositionRequest {
    prixPropose?: number;
    delaiPropose?: number;
    commentaire?: string;
    status?: PropositionStatus;
}
