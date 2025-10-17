import type { Timestamps } from './common.types';
import type { UserStatus } from './user.types';

export type UserRole = 'admin' | 'transporteur' | 'affreteur' | 'client';

export interface User extends Timestamps {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: string | null;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  avatarUrl?: string;
  fullName?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface MFARequiredResponse {
  data: {
    requiresMFA: boolean;
    mfaSetupRequired?: boolean;
    message: string;
  };
}

export interface MFAStatus {
  mfaEnabled: boolean;
  mfaRequired?: boolean;
  mustEnableMFA?: boolean;
}

export interface MFASetupResponse {
  secret: string;
  manualEntryKey: string;
  recoveryCodes: string[];
  instructions: string;
}

export interface MFARegenCodes {
  recoveryCodes: string[];
  warning: string;
}

export interface AuthState {
  currentUser: User | null;
  token: string | null;
  refreshToken: string | null;
  error: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthActions {
  signup: (data: CreateUserRequest) => Promise<boolean | undefined>;
  login: (data: LoginCredentials) => Promise<boolean | 'mfa_required' | undefined>;
  getUser: () => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setToken: (token: string, expiresIn?: number, refreshToken?: string) => void;
  initializeTokenManagement: () => void;
}

export type AuthStore = AuthState & AuthActions;
