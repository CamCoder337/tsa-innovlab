import type { User, UserRole } from './auth.types';
import type { Mission } from './mission.types';

/**
 * Message types matching backend MessageType enum
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

/**
 * Conversation types matching backend ConversationType enum
 */
export enum ConversationType {
  DIRECT = 'direct',
  MISSION = 'mission',
}

/**
 * Message interface matching backend Message model
 */
export interface Message {
  id: number;
  conversationId: number;
  senderId: string;
  missionId?: number;
  content: string;
  type: MessageType;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  // Relations (optional when populated)
  sender?: User;
  conversation?: Conversation;
  mission?: Mission;
}

/**
 * Conversation interface matching backend Conversation model
 */
export interface Conversation {
  id: number;
  type: ConversationType;
  user1Id: string;
  user2Id: string;
  missionId?: number;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  // Relations (optional when populated)
  user1?: User;
  user2?: User;
  mission?: Mission;
  messages?: Message[];
  // Computed fields
  messagesCount?: number;
  unreadMessagesCount?: number;
  otherParticipant?: Partial<User>;
}

/**
 * API DTOs for requests
 */
export interface CreateDirectConversationRequest {
  userId: string;
}

export interface CreateMissionConversationRequest {
  missionId: number;
  userId: string;
}

export interface SendMessageRequest {
  content: string;
  type?: MessageType;
}

export interface ConversationFilters {
  page?: number;
  limit?: number;
  type?: ConversationType;
}

export interface SearchUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface SearchUsersRequest {
  search?: string;
  role?: UserRole;
  limit?: number;
}

/**
 * WebSocket event data interfaces
 */
export interface ChatMessageEvent {
  conversationId: number;
  message: Message;
}

export interface ChatTypingEvent {
  conversationId: number;
  senderId: string;
  isTyping: boolean;
}

export interface ChatMessageReadEvent {
  messageId: number;
  conversationId: number;
  readerId: string;
  readAt: string;
}

/**
 * UI-specific interfaces
 */
export interface ConversationListItem extends Conversation {
  lastMessage?: Message;
}

export interface TypingIndicator {
  conversationId: number;
  userId: string;
  isTyping: boolean;
  timestamp: number;
}
