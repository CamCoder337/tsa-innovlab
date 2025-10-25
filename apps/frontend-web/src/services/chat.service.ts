// ============================================================================
// CHAT SERVICE
// ============================================================================

import { BaseApi } from './api';
import type {
  Conversation,
  ConversationFilters,
  CreateDirectConversationRequest,
  CreateMissionConversationRequest,
  Message,
  SendMessageRequest,
  SearchUsersRequest,
  SearchUser,
} from '@/types/chat.types';
import type { ApiResponse, PaginatedResponse, Paginator } from '@/types/common.types';
import type { AxiosError } from 'axios';

/**
 * Chat Service for managing conversations and messages
 * Integrates with backend ConversationsController and MessagesController
 */
export class ChatService extends BaseApi {
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
   * Get user's conversations with pagination and filtering
   */
  async getConversations(
    params?: ConversationFilters
  ): Promise<ApiResponse<Paginator<Conversation>>> {
    try {
      const response = await this.insertToken().get('/api/common/conversations', { params });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Get a specific conversation by ID
   */
  async getConversation(id: number): Promise<ApiResponse<Conversation>> {
    try {
      const response = await this.insertToken().get(`/api/common/conversations/${id}`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Create or get a direct conversation between two users
   */
  async createDirectConversation(
    request: CreateDirectConversationRequest
  ): Promise<ApiResponse<Conversation>> {
    try {
      const response = await this.insertToken().post('/api/common/conversations/direct', request);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Create or get a mission-specific conversation
   */
  async createMissionConversation(
    request: CreateMissionConversationRequest
  ): Promise<ApiResponse<Conversation>> {
    try {
      const response = await this.insertToken().post('/api/common/conversations/mission', request);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Delete/archive a conversation
   */
  async deleteConversation(
    id: number
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await this.insertToken().delete(`/api/common/conversations/${id}`);
      return { data: response.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Search users for creating new conversations
   */
  async searchUsers(params?: SearchUsersRequest): Promise<ApiResponse<SearchUser[]>> {
    try {
      const response = await this.insertToken().get('/api/common/conversations/search/users', {
        params,
      });
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(
    conversationId: number,
    page = 1,
    limit = 50
  ): Promise<ApiResponse<PaginatedResponse<Message>>> {
    try {
      const response = await this.insertToken().get(
        `/api/common/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
      );

      return { data: response.data.data.messages };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Send a new message to a conversation
   */
  async sendMessage(
    conversationId: number,
    request: SendMessageRequest
  ): Promise<ApiResponse<{ message: Message }>> {
    try {
      const response = await this.insertToken().post(
        `/api/common/conversations/${conversationId}/messages`,
        request
      );
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Mark a specific message as read
   */
  async markMessageAsRead(id: number): Promise<ApiResponse<Message>> {
    try {
      const response = await this.insertToken().put(`/api/common/messages/${id}/read`);
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markAllMessagesAsRead(
    conversationId: number
  ): Promise<ApiResponse<{ updatedCount: number }>> {
    try {
      const response = await this.insertToken().put(
        `/api/common/conversations/${conversationId}/messages/read-all`
      );
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Send typing indicator to conversation participants
   */
  async sendTypingIndicator(
    conversationId: number,
    isTyping: boolean
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await this.insertToken().post(
        `/api/common/conversations/${conversationId}/typing`,
        {
          isTyping,
        }
      );
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }

  /**
   * Get unread messages count for the current user
   */
  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    try {
      const response = await this.insertToken().get('/api/common/messages/unread-count');
      return { data: response.data.data };
    } catch (error) {
      return { error: this.getErrorResponse(error) };
    }
  }
}

export const chatService = new ChatService();
