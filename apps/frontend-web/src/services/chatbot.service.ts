// ============================================================================
// CHATBOT SERVICE
// ============================================================================

import { BaseApi } from './api';
import type { ApiResponse } from '@/types/common.types';
import type { AxiosError } from 'axios';

/**
 * Chatbot request payload
 */
export interface ChatbotQueryRequest {
  message: string;
  conversationId?: string;
  context?: Record<string, unknown>;
}

/**
 * Chatbot response from backend
 */
export interface ChatbotQueryResponse {
  message: string;
  intent?: {
    name: string;
    confidence: number;
    entities: Record<string, unknown>;
  };
  suggestions: string[];
  data?: Record<string, unknown>;
  navigation?: {
    path: string;
    description: string;
    filters?: Record<string, unknown>;
  };
  requires_human: boolean;
  timestamp: string;
}

/**
 * Chatbot Service for AI-powered conversations
 */
export class ChatbotService extends BaseApi {
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

  /**
   * Send a message to the chatbot
   */
  async sendMessage(request: ChatbotQueryRequest): Promise<ApiResponse<ChatbotQueryResponse>> {
    try {
      const response = await this.insertToken().post('/api/common/chatbot/query', request, {
        timeout: 20000, // 20 seconds for LLM processing
      });
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Get chatbot conversation history
   */
  async getHistory(conversationId: string): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.insertToken().get(
        `/api/common/chatbot/history/${conversationId}`
      );
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Check chatbot health
   */
  async checkHealth(): Promise<ApiResponse<{ status: string; message: string }>> {
    try {
      const response = await this.insertToken().get('/api/common/chatbot/health');
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }
}

export const chatbotService = new ChatbotService();
