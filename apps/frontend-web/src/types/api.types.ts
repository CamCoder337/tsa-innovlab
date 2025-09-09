// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

import type { Mission, MissionItem, SpecialRequirements, CargoType, UrgencyLevel } from './mission.types';
import type { User, UserRole } from './user.types';

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

export interface AuthResponse extends ApiResponse {
    user?: User;
    token?: string;
}

export interface MissionResponse extends ApiResponse {
    mission?: Mission;
    missions?: Mission[];
}

// Request payloads
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    role: UserRole;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface VerifyEmailRequest {
    email: string;
    code: string;
}

export interface CreateMissionRequest {
    title: string;
    origin: string;
    destination: string;
    cargoType: CargoType;
    urgency: UrgencyLevel;
    proposedPrice: number;
    description: string;
    specialRequirements: SpecialRequirements;
    deadline: string;
    missionItems: Omit<MissionItem, 'id'>[];
}

export interface UpdateMissionRequest extends Partial<CreateMissionRequest> {
    id: string;
}


