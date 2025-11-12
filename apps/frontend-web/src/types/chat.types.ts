import type { User, UserRole } from './auth.types';
import type { Timestamps } from './common.types';
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
  CHATBOT = 'chatbot',
}

export type ConversationFilter = 'all' | 'unread' | 'groups';

/**
 * Message interface matching backend Message model
 */
export interface Message extends Timestamps {
  id: number;
  conversationId: number;
  senderId: string;
  missionId?: number;
  content: string;
  type: MessageType;
  isRead: boolean;
  readAt?: string;
  // Relations (optional when populated)
  sender?: User;
  conversation?: Conversation;
  mission?: Mission;
}

/**
 * Conversation interface matching backend Conversation model
 */
export interface Conversation extends Timestamps {
  id: number;
  type: ConversationType;
  user1Id: string;
  user2Id: string;
  missionId?: string;
  lastActivityAt: string;
  // Relations (optional when populated)
  user1?: User;
  user2?: User;
  mission?: Mission;
  messages?: Message[];
  // Computed fields
  // messagesCount?: number;
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
  missionId: string;
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
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
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

/**
 * Chatbot types and interfaces
 */

export interface ChatbotProfile {
  id: number; // Special ID for chatbot (e.g., -1)
  type: ConversationType.CHATBOT;
  name: string;
  avatar?: string;
  description: string;
  isActive: boolean;
}

export interface ChatbotMessage extends Message {
  isFromBot: boolean;
  suggestions?: string[];
  navigation?: {
    path: string;
    description: string;
    filters?: Record<string, unknown>;
  };
  requiresHuman?: boolean;
}

export interface ChatbotConversation {
  id: number; // Special ID for chatbot conversation (e.g., -1)
  type: ConversationType;
  profile: ChatbotProfile;
  messages: ChatbotMessage[];
  lastMessage?: ChatbotMessage;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotResponse {
  content: string;
  category?: string;
  relatedTopics?: string[];
  suggestions?: string[];
  navigation?: {
    path: string;
    description: string;
    filters?: Record<string, unknown>;
  };
  requiresHuman?: boolean;
}

export interface ChatbotCapabilities {
  canHandleMissions: boolean;
  canHandleTracking: boolean;
  canHandleBoutique: boolean;
  canHandleVehicles: boolean;
  canHandleSupport: boolean;
  supportedLanguages: string[];
}

/**
 * Extended conversation types to include chatbot
 */
export type ExtendedConversationType = ConversationType | 'chatbot';

/**
 * Union type for all conversation types
 */
export type AnyConversation = ConversationListItem | ChatbotConversation;

export interface ChatState {
  // State
  conversations: ConversationListItem[];
  currentConversation: ConversationListItem | ChatbotConversation | null;
  messages: Record<number, Message[]>; // conversationId -> messages
  typingIndicators: TypingIndicator[];
  isLoading: boolean;
  isReplying: boolean;
  error: string | null;
  unreadCount: number;

  // Chatbot state
  chatbot: ChatbotConversation | null;
  chatbotCapabilities: ChatbotCapabilities;

  // Actions
  fetchConversations: (filters?: ConversationFilters) => Promise<void>;
  fetchConversation: (conversationId: number) => Promise<void>;
  fetchMessages: (conversationId: number, page?: number) => Promise<void>;
  sendMessage: (conversationId: number, content: string) => Promise<void>;
  createDirectConversation: (userId: string) => Promise<Conversation>;
  createMissionConversation: (userId: string, missionId?: string) => Promise<Conversation>;
  markMessageAsRead: (messageId: number) => Promise<void>;
  markAllMessagesAsRead: (conversationId: number) => Promise<void>;
  searchUsers: (query: string, role?: UserRole) => Promise<SearchUser[]>;

  // Chatbot actions
  initializeChatbot: () => void;
  sendChatbotMessage: (message: string, userId?: string) => Promise<ChatbotResponse>;
  getChatbotResponse: (userInput: string) => ChatbotResponse;

  // Real-time actions
  handleNewMessage: (message: Message) => void;
  handleMessageRead: (messageId: number, conversationId: number) => void;
  handleTypingStart: (conversationId: number, userId: string) => void;
  handleTypingStop: (conversationId: number, userId: string) => void;
  sendTypingIndicator: (conversationId: number, isTyping: boolean) => void;

  // Utility actions
  setCurrentConversation: (conversation: ConversationListItem | ChatbotConversation | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}
