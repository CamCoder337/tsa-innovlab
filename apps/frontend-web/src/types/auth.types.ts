// ============================================================================
// AUTH TYPES
// ============================================================================

import type { User, UserRole } from './user.types';

export interface LoginRequest {
    email: string;
    password: string;
    mfaCode?: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    password: string;
    confirmPassword: string;
}

export interface VerifyEmailRequest {
    token: string | null;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface MFAInitializeResponse {
    qrCode: string;
    secret: string;
    backupCodes: string[];
}

export interface MFAEnableRequest {
    token: string;
}

export interface MFAStatusResponse {
    enabled: boolean;
    backupCodesCount: number;
}

export interface AuthResponse<T = unknown> {
    data?: {
        success: boolean;
        message: string;
        data?: T;
    };
    error?: {
        success: boolean;
        message: string;
        status: number;
        errors?: T[];
    };
}

export interface ProfileResponse<T = unknown> {
    data?: {
        success: boolean;
        data: User;
    };
    error?: {
        success: boolean;
        message: string;
        status: number;
        errors?: T[];
    };
}

export interface TokenResponse {
    data?: {
        success: boolean;
        message: string;
        data?: {
            accessToken: string;
            refreshToken?: string;
            expiresIn?: number;
        };
        requiresMFA?: boolean;
        mfaSetupRequired?: boolean;
    };
    error?: {
        success: boolean;
        message: string;
        status: number;
        errors?: string[];
    };
}

export interface LoginResponse {
    data?: {
        success: boolean;
        message: string;
        data?: {
            accessToken: string;
            refreshToken?: string;
            expiresIn: number;
        };
        requiresMFA?: boolean;
        mfaSetupRequired?: boolean;
    };
    error?: {
        success: boolean;
        message: string;
        status: number;
        errors?: string[];
    };
}
