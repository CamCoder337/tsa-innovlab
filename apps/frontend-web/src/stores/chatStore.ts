import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ConversationListItem,
  CreateDirectConversationRequest,
  CreateMissionConversationRequest,
  SendMessageRequest,
  ChatMessageEvent,
  ChatMessageReadEvent,
  ChatTypingEvent,
  ChatState,
} from '@/types/chat.types';
import { chatService } from '@/services/chat.service';
import { webSocketService, WebSocketEventType } from '@/services/websocket.service';

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: {},
  typingIndicators: [],
  isLoading: false,
  error: null,
  unreadCount: 0,
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchConversations: async (filters) => {
        try {
          set({ isLoading: true, error: null });
          const response = await chatService.getConversations(filters);

          if (response.error) {
            set({
              error: response.error.errors[0] || response.error.message,
              isLoading: false,
            });
            return;
          }

          // Transform conversations to include UI-specific fields
          const conversations: ConversationListItem[] =
            response.data?.data?.map((conv) => ({
              ...conv,
              lastMessage: undefined, // Will be populated if available
              otherParticipant: conv.otherParticipant!,
            })) || [];

          set({ conversations, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch conversations',
            isLoading: false,
          });
        }
      },

      fetchConversation: async (conversationId) => {
        try {
          set({ isLoading: true, error: null });
          const response = await chatService.getConversation(conversationId);

          if (response.error) {
            set({
              error: response.error.errors[0] || response.error.message,
              isLoading: false,
            });
            return;
          }

          set({ currentConversation: response.data, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch conversation',
            isLoading: false,
          });
        }
      },

      fetchMessages: async (conversationId, page = 1) => {
        try {
          set({ isLoading: true, error: null });
          const response = await chatService.getMessages(conversationId, page);

          if (response.error)
            set({
              error:
                response.error.errors[0] ||
                response.error.message ||
                'Erreur lors de la récupération des messages',
              isLoading: false,
            });

          if (response.data) {
            const { messages } = get();
            const existingMessages = messages[conversationId] || [];

            // For page 1, replace messages; for other pages, append
            const newMessages =
              page === 1
                ? response.data.data || []
                : [...existingMessages, ...(response.data.data || [])];

            // Sort by createdAt descending (newest first)
            const sortedMessages = newMessages.sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );

            set({
              messages: { ...messages, [conversationId]: sortedMessages },
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch messages',
            isLoading: false,
          });
        }
      },

      sendMessage: async (conversationId, content) => {
        try {
          const request: SendMessageRequest = { content };
          const response = await chatService.sendMessage(conversationId, request);

          if (response.error)
            set({
              error:
                response.error.errors[0] ||
                response.error.message ||
                'Erreur lors de la récupération des messages',
              isLoading: false,
            });

          if (response.data) {
            const { messages } = get();
            const existingMessages = messages[conversationId] || [];

            // Add new message and sort by createdAt
            const newMessages = [...existingMessages, response.data.message];
            const sortedMessages = newMessages.sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );

            set({
              messages: { ...messages, [conversationId]: sortedMessages },
            });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to send message' });
        }
      },

      createDirectConversation: async (userId) => {
        try {
          set({ isLoading: true, error: null });
          const request: CreateDirectConversationRequest = { userId };
          const response = await chatService.createDirectConversation(request);

          if (response.data) {
            const conversation = response.data;

            // Add to conversations list if not already present
            const { conversations } = get();
            const exists = conversations.find((c) => c.id === conversation.id);

            if (!exists) {
              const newConversation: ConversationListItem = {
                ...conversation,
                otherParticipant: conversation.otherParticipant!,
              };
              set({ conversations: [newConversation, ...conversations] });
            }

            set({ currentConversation: conversation, isLoading: false });
            return conversation;
          } else if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            throw new Error(response.error.message);
          }

          throw new Error('No data received');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create conversation',
            isLoading: false,
          });
          throw error;
        }
      },

      createMissionConversation: async (userId, missionId) => {
        try {
          set({ isLoading: true, error: null });
          if (!missionId) {
            throw new Error('Mission ID is required for mission conversations');
          }
          const request: CreateMissionConversationRequest = {
            missionId: missionId,
            userId,
          };
          const response = await chatService.createMissionConversation(request);

          if (response.data) {
            const conversation = response.data;

            // Add to conversations list if not already present
            const { conversations } = get();
            const exists = conversations.find((c) => c.id === conversation.id);

            if (!exists) {
              const newConversation: ConversationListItem = {
                ...conversation,
                otherParticipant: conversation.otherParticipant!,
              };
              set({ conversations: [newConversation, ...conversations] });
            }

            set({ currentConversation: conversation, isLoading: false });
            return conversation;
          } else if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            throw new Error(response.error.message);
          }

          throw new Error('No data received');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create conversation',
            isLoading: false,
          });
          throw error;
        }
      },

      markMessageAsRead: async (messageId) => {
        try {
          await chatService.markMessageAsRead(messageId);
          // Message read status will be updated via WebSocket
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to mark message as read' });
        }
      },

      markAllMessagesAsRead: async (conversationId) => {
        try {
          await chatService.markAllMessagesAsRead(conversationId);

          // Update local unread count
          const { conversations } = get();
          const updatedConversations = conversations.map((conv) =>
            conv.id === conversationId ? { ...conv, unreadMessagesCount: 0 } : conv
          );

          set({ conversations: updatedConversations });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to mark messages as read',
          });
        }
      },

      searchUsers: async (query, role) => {
        try {
          const response = await chatService.searchUsers({ search: query, role: role });
          if (response.data) {
            return response.data;
          } else if (response.error) {
            set({ error: response.error.message });
            return [];
          }
          return [];
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to search users' });
          return [];
        }
      },

      // Real-time event handlers
      handleNewMessage: (message) => {
        const { messages, conversations, currentConversation } = get();

        // Add message to conversation and sort by createdAt
        const conversationMessages = messages[message.conversationId] || [];
        const newMessages = [...conversationMessages, message];
        const sortedMessages = newMessages.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        set({
          messages: {
            ...messages,
            [message.conversationId]: sortedMessages,
          },
        });

        // Update conversation list
        const updatedConversations = conversations.map((conv) => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message,
              unreadMessagesCount:
                currentConversation?.id === message.conversationId
                  ? 0
                  : (conv.unreadMessagesCount || 0) + 1,
            };
          }
          return conv;
        });

        set({ conversations: updatedConversations });
      },

      handleMessageRead: (messageId, conversationId) => {
        const { messages } = get();
        const conversationMessages = messages[conversationId] || [];

        const updatedMessages = conversationMessages.map((msg) =>
          msg.id === messageId ? { ...msg, readAt: new Date().toISOString() } : msg
        );

        set({
          messages: {
            ...messages,
            [conversationId]: updatedMessages,
          },
        });
      },

      handleTypingStart: (conversationId, userId) => {
        const { typingIndicators } = get();
        const existing = typingIndicators.find(
          (t) => t.conversationId === conversationId && t.userId === userId
        );

        if (!existing) {
          set({
            typingIndicators: [
              ...typingIndicators,
              { conversationId, userId, isTyping: true, timestamp: Date.now() },
            ],
          });
        }
      },

      handleTypingStop: (conversationId, userId) => {
        const { typingIndicators } = get();
        set({
          typingIndicators: typingIndicators.filter(
            (t) => !(t.conversationId === conversationId && t.userId === userId)
          ),
        });
      },

      sendTypingIndicator: (conversationId, isTyping) => {
        webSocketService.sendTypingIndicator(conversationId, isTyping);
      },

      // Utility actions
      setCurrentConversation: (conversation) => {
        set({ currentConversation: conversation });

        // Mark messages as read when opening conversation
        if (conversation) {
          get().markAllMessagesAsRead(conversation.id);
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      reset: () => set(initialState),
    }),
    {
      name: 'tsa_chat',
      partialize: (state) => ({
        // Only persist conversations and current conversation
        conversations: state.conversations,
        currentConversation: state.currentConversation,
        messages: state.messages,
      }),
    }
  )
);

// Initialize WebSocket event listeners
export const initializeChatWebSocket = () => {
  const store = useChatStore.getState();

  // Subscribe to chat events
  webSocketService.subscribe(WebSocketEventType.CHAT_MESSAGE, (data: ChatMessageEvent) => {
    store.handleNewMessage(data.message);
  });

  webSocketService.subscribe(WebSocketEventType.CHAT_MESSAGE_READ, (data: ChatMessageReadEvent) => {
    store.handleMessageRead(data.messageId, data.conversationId);
  });

  webSocketService.subscribe(WebSocketEventType.CHAT_TYPING_START, (data: ChatTypingEvent) => {
    store.handleTypingStart(data.conversationId, data.senderId);
  });

  webSocketService.subscribe(WebSocketEventType.CHAT_TYPING_STOP, (data: ChatTypingEvent) => {
    store.handleTypingStop(data.conversationId, data.senderId);
  });

  webSocketService.subscribe(WebSocketEventType.CHAT_CONVERSATION_CREATED, () => {
    // Refresh conversations when a new one is created
    store.fetchConversations();
  });
};
