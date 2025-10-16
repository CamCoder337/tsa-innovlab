import { BaseApi } from './api';
import type { AxiosError } from 'axios';
import type {
  User,
  CreateUserRequest,
  LoginCredentials,
  AuthTokens,
  MFARequiredResponse,
  MFASetupResponse,
  MFARegenCodes,
  MFAStatus,
} from '@/types/auth.types';
import type { ApiResponse } from '@/types/common.types';

export class AuthService extends BaseApi {
  private isAxiosError(
    error: unknown
  ): error is AxiosError<{ message?: string; errors?: unknown[] }> {
    return (error as AxiosError).isAxiosError === true;
  }

  private getErrorMessage(error: AxiosError<{ message?: string; errors?: unknown[] }>): string {
    return error.response?.data?.message || error.message || 'An error occurred';
  }

  private getErrorResponse(error: unknown): {
    success: false;
    status: number;
    message: string;
    errors: string[];
  } {
    if (this.isAxiosError(error)) {
      const errors = error.response?.data?.errors || [];
      const stringErrors = errors.map((err) =>
        typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err)
      );

      return {
        success: false,
        status: error.response?.status || 500,
        message: this.getErrorMessage(error),
        errors: stringErrors,
      };
    }
    return {
      success: false,
      status: 500,
      message: 'An unexpected error occurred',
      errors: [],
    };
  }

  // Authentication methods
  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<AuthTokens | MFARequiredResponse>> {
    try {
      const response = await this.axiosInstance.post('/api/auth/login', credentials);
      return { data: response.data.data || response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async register(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      const response = await this.axiosInstance.post('/api/auth/register', userData);
      return { data: response.data.data || response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await this.axiosInstance.post('/api/auth/verify-email', { token });
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    try {
      const response = await this.axiosInstance.post('/api/auth/refresh-token', { refreshToken });
      return { data: response.data.data || response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await this.axiosInstance.post('/api/auth/forgot-password', { email });
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async resetPassword(
    token: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await this.axiosInstance.post('/api/auth/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  // Protected routes (require authentication)
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await this.insertToken().get('/api/auth/me');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await this.insertToken().put('/api/auth/profile', userData);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
    newPassword_confirmation: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await this.insertToken().put('/api/auth/change-password', {
        currentPassword,
        newPassword,
        newPassword_confirmation,
      });
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await this.insertToken().post('/api/auth/logout');
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  // MFA methods
  async setupMFA(): Promise<ApiResponse<MFASetupResponse>> {
    try {
      const response = await this.insertToken().post('/api/auth/mfa/initialize');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async statusMFA(): Promise<ApiResponse<MFAStatus>> {
    try {
      const response = await this.insertToken().get('/api/auth/mfa/status');
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async enableMFA(code: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await this.insertToken().post('/api/auth/mfa/enable', { code });
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async regenMFACodes(): Promise<ApiResponse<MFARegenCodes>> {
    try {
      const response = await this.insertToken().post('/api/auth/mfa/regenerate-codes');
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  async disableMFA(code: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await this.insertToken().post('/api/auth/mfa/disable', { code });
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }
}

export const authService = new AuthService();
