import type { Timestamps } from './common.types';

export type UserRole = 'admin' | 'transporteur' | 'affreteur' | 'client';

export type UserStatus = 'pending' | 'active' | 'suspended';

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

export interface updateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
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

export interface AuthState {
  currentUser: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface AuthActions {
  login: (user: User, token?: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setToken: (token: string, expiresIn?: number, refreshToken?: string) => void;
  initializeTokenManagement: () => void;
}

export type AuthStore = AuthState & AuthActions;
