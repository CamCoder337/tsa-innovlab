// ============================================================================
// FORM TYPES
// ============================================================================

import type { UserRole } from './user.types';
import type { MissionItem, SpecialRequirements, CargoType, UrgencyLevel } from './mission.types';

// Auth Forms
export interface LoginFormData {
    email: string;
    password: string;
}

export interface RegisterFormData {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole | '';
}

export interface ForgotPasswordFormData {
    email: string;
}

export interface VerifyEmailFormData {
    email: string;
    code: string;
}

// Mission Forms
export interface CreateMissionFormData {
    title: string;
    origin: string;
    destination: string;
    cargoType: CargoType | '';
    urgency: UrgencyLevel | '';
    proposedPrice: string;
    description: string;
    specialRequirements: SpecialRequirements;
    deadline: Date | undefined;
    missionItems: MissionItem[];
}

export interface UpdateMissionFormData extends Partial<CreateMissionFormData> {
    id: string;
}

export interface FormErrors {
    [key: string]: string;
}


