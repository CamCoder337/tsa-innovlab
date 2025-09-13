// ============================================================================
// AUTH SERVICE
// ============================================================================

import { BaseApi } from './api';
import type {
    LoginRequest,
    RegisterRequest,
    VerifyEmailRequest,
    RefreshTokenRequest,
    AuthResponse,
    ProfileResponse,
    TokenResponse,
} from '../types/auth.types';
import type { ApiResponse } from '../types/api.types';
import type { AxiosError } from 'axios';

export class AuthService extends BaseApi {
    private isAxiosError(error: unknown): error is AxiosError<{ message?: string; errors?: unknown[] }> {
        return (error as AxiosError).isAxiosError === true;
    }

    private getErrorMessage(error: AxiosError<{ message?: string; errors?: unknown[] }>): string {
        return error.response?.data?.message || error.message || 'An error occurred';
    }

    private getErrorResponse(error: unknown): { success: false; status: number; message: string; errors: string[] } {
        if (this.isAxiosError(error)) {
            // Convert any error objects to strings if needed
            const errors = error.response?.data?.errors || [];
            const stringErrors = errors.map(err => 
                typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err)
            );
            
            return {
                success: false as const,
                status: error.response?.status || 500,
                message: this.getErrorMessage(error),
                errors: stringErrors
            };
        }
        return {
            success: false as const,
            status: 500,
            message: 'An unexpected error occurred',
            errors: []
        };
    }

    // Public routes (no auth required)
    async login(credentials: LoginRequest): Promise<TokenResponse> {
        try {
            const response = await this.axiosInstance.post('/api/auth/login', credentials);
            return { data: response.data };
        } catch (error) {
            return { error: this.getErrorResponse(error) };
        }
    }

    async register(userData: RegisterRequest): Promise<AuthResponse> {
        try {
            const response = await this.axiosInstance.post('/api/auth/register', userData);
            return { data: response.data };
        } catch (error) {
            return { error: this.getErrorResponse(error) };
        }
    }

    async verifyEmail(data: VerifyEmailRequest): Promise<ApiResponse> {
        try {
            const response = await this.axiosInstance.post('/api/auth/verify-email', data);
            return { data: response.data };
        } catch (error) {
            return { error: this.getErrorResponse(error) };
        }
    }

    async refreshToken(data: RefreshTokenRequest): Promise<TokenResponse> {
        try {
            const response = await this.axiosInstance.post('/api/auth/refresh-token', data);
            return { data: response.data };
        } catch (error) {
            return { error: this.getErrorResponse(error) };
        }
    }

    async debugToken(token: string): Promise<ApiResponse> {
        try {
            const response = await this.insertToken().post('/api/auth/debug-token', { token });
            return { data: response.data };
        } catch (error) {
            return { error: this.getErrorResponse(error) };
        }
    }

    // Protected routes (auth required)
    async getProfile(): Promise<ProfileResponse> {
        try {
            const response = await this.insertToken().get('/api/auth/me');
            return { data: response.data };
        } catch (error) {
            return { error: this.getErrorResponse(error) };
        }
    }

    async logout(): Promise<ApiResponse> {
        try {
            const response = await this.insertToken().post('/api/auth/logout');
            return { data: response.data };
        } catch (error) {
            return { error: this.getErrorResponse(error) };
        }
    }

    // MFA routes
    // async getMFAStatus(): Promise<MFAStatusResponse> {
    //     try {
    //         const response = await this.insertToken().get('/api/auth/mfa/status');
    //     return response.data;
    // }

    // async initializeMFA(): Promise<ApiResponse<MFAInitializeResponse>> {
    //     const response = await this.insertToken().post('/api/auth/mfa/initialize');
    //     return response.data;
    // }

    // async enableMFA(data: MFAEnableRequest): Promise<ApiResponse> {
    //     const response = await this.insertToken().post('/api/auth/mfa/enable', data);
    //     return response.data;
    // }

    // async disableMFA(data: MFAEnableRequest): Promise<ApiResponse> {
    //     const response = await this.insertToken().post('/api/auth/mfa/disable', data);
    //     return response.data;
    // }

    // async regenerateRecoveryCodes(): Promise<ApiResponse<{ backupCodes: string[] }>> {
    //     const response = await this.insertToken().post('/api/auth/mfa/regenerate-codes');
    //     return response.data;
    // }
}

export const authService = new AuthService();
