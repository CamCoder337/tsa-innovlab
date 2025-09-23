// ============================================================================
// FORM TYPES
// ============================================================================

import type { UserRole } from './auth.types';

// Auth Forms
export interface LoginFormData {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone: string;
  country?: string;
  role: UserRole;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface VerifyEmailFormData {
  email: string;
  token: string;
}

// Mission Forms
export interface CreateMissionFormData {
  title: string;
  origin: string;
  destination: string;
  proposedPrice: string;
  description: string;
  deadline: Date | undefined;
}

export interface UpdateMissionFormData extends Partial<CreateMissionFormData> {
  id: string;
}

export interface FormErrors {
  [key: string]: string;
}
