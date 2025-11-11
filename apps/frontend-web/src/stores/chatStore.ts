import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type ConversationListItem,
  type CreateDirectConversationRequest,
  type CreateMissionConversationRequest,
  type SendMessageRequest,
  type ChatMessageEvent,
  type ChatMessageReadEvent,
  type ChatTypingEvent,
  type ChatState,
  type ChatbotConversation,
  type ChatbotProfile,
  type ChatbotMessage,
  type ChatbotResponse,
  ConversationType,
  MessageType,
} from '@/types/chat.types';
import { chatService } from '@/services/chat.service';
import { chatbotService } from '@/services/chatbot.service';
import { webSocketService, WebSocketEventType } from '@/services/websocket.service';

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: {},
  typingIndicators: [],
  isLoading: false,
  isReplying: false,
  error: null,
  unreadCount: 0,
  chatbot: null,
  chatbotCapabilities: {
    canHandleMissions: true,
    canHandleTracking: true,
    canHandleBoutique: true,
    canHandleVehicles: true,
    canHandleSupport: true,
    supportedLanguages: ['fr', 'en'],
  },
};

// Chatbot response generation logic
const generateChatbotResponse = (userInput: string): ChatbotResponse => {
  const input = userInput.toLowerCase().trim();

  // Mission-related keywords
  if (
    input.includes('mission') ||
    input.includes('transport') ||
    input.includes('livraison') ||
    input.includes('colis')
  ) {
    return {
      content:
        "Je peux vous aider avec la gestion des missions de transport. Vous pouvez créer une nouvelle mission, suivre vos missions en cours, ou consulter l'historique de vos missions dans la section 'Missions'.",
      category: 'missions',
      relatedTopics: ['créer mission', 'suivi mission', 'historique'],
    };
  }

  // Tracking-related keywords
  if (
    input.includes('suivi') ||
    input.includes('tracking') ||
    input.includes('localisation') ||
    input.includes('position')
  ) {
    return {
      content:
        "Pour le suivi de vos missions, rendez-vous dans la section 'Suivi' où vous pourrez voir la position en temps réel de vos transporteurs et l'état d'avancement de vos livraisons.",
      category: 'tracking',
      relatedTopics: ['position temps réel', 'état livraison', 'notifications'],
    };
  }

  // Boutique-related keywords
  if (
    input.includes('boutique') ||
    input.includes('produit') ||
    input.includes('achat') ||
    input.includes('commande')
  ) {
    return {
      content:
        'Dans notre boutique, vous trouverez des pièces reconditionnées de qualité. Vous pouvez parcourir les catégories, ajouter des articles à votre panier et passer commande facilement.',
      category: 'boutique',
      relatedTopics: ['catalogue produits', 'panier', 'commandes'],
    };
  }

  // Vehicle-related keywords
  if (
    input.includes('véhicule') ||
    input.includes('camion') ||
    input.includes('flotte') ||
    input.includes('vehicle')
  ) {
    return {
      content:
        "Pour la gestion de votre flotte, vous pouvez ajouter vos véhicules, mettre à jour leurs informations et suivre leur disponibilité dans la section 'Véhicules'.",
      category: 'vehicles',
      relatedTopics: ['ajouter véhicule', 'disponibilité', 'maintenance'],
    };
  }

  // Support-related keywords
  if (
    input.includes('aide') ||
    input.includes('support') ||
    input.includes('problème') ||
    input.includes('help')
  ) {
    return {
      content:
        "Je suis là pour vous aider ! Vous pouvez me poser des questions sur l'utilisation de la plateforme TSA Logistics. Pour un support technique avancé, contactez notre équipe via la section 'Contact'.",
      category: 'support',
      relatedTopics: ['utilisation plateforme', 'contact support', 'FAQ'],
    };
  }

  // Greeting keywords
  if (
    input.includes('bonjour') ||
    input.includes('salut') ||
    input.includes('hello') ||
    input.includes('hi')
  ) {
    return {
      content:
        "Bonjour ! Je suis l'assistant TSA Logistics. Je peux vous aider avec vos missions de transport, le suivi de vos livraisons, la boutique de pièces reconditionnées, et bien plus encore. Comment puis-je vous assister aujourd'hui ?",
      category: 'greeting',
      relatedTopics: ['missions', 'suivi', 'boutique', 'support'],
    };
  }

  // Default response
  return {
    content:
      "Je suis l'assistant TSA Logistics et je peux vous aider avec diverses fonctionnalités de la plateforme : gestion des missions, suivi des livraisons, boutique de pièces reconditionnées, et support général. Que souhaitez-vous savoir ?",
    category: 'general',
    relatedTopics: ['missions', 'suivi', 'boutique', 'véhicules', 'support'],
  };
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Initialize chatbot
      initializeChatbot: () => {
        const chatbotProfile: ChatbotProfile = {
          id: -1,
          type: ConversationType.CHATBOT,
          name: 'TSA Bot',
          description: 'Assistant virtuel TSA Logistics',
          isActive: true,
        };

        const welcomeMessage: ChatbotMessage = {
          id: 1,
          content:
            'Bonjour ! Je suis votre assistant TSA Logistics. Je peux vous aider avec vos missions, le suivi de vos livraisons, la boutique et bien plus encore. Comment puis-je vous assister ?',
          createdAt: new Date().toISOString(),
          isFromBot: true,
          senderId: 'bot',
          conversationId: -1,
          type: MessageType.TEXT,
          isRead: true,
          updatedAt: new Date().toISOString(),
        };

        const helpMessage: ChatbotMessage = {
          id: 2,
          content:
            "Voici ce que je peux faire pour vous :\n• Gestion des missions de transport\n• Suivi en temps réel\n• Boutique de pièces reconditionnées\n• Support et assistance\n\nN'hésitez pas à me poser vos questions !",
          createdAt: new Date().toISOString(),
          isFromBot: true,
          senderId: 'bot',
          conversationId: -1,
          type: MessageType.TEXT,
          isRead: true,
          updatedAt: new Date().toISOString(),
        };

        const chatbot: ChatbotConversation = {
          id: -1,
          type: ConversationType.CHATBOT,
          profile: chatbotProfile,
          messages: [welcomeMessage, helpMessage],
          lastMessage: helpMessage,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({ chatbot });
      },

      // Send message to chatbot
      sendChatbotMessage: async (message: string, userId?: string): Promise<ChatbotResponse> => {
        set({ error: null });

        const { chatbot } = get();

        if (!chatbot) {
          set({ isLoading: false });
          return generateChatbotResponse(message);
        }

        try {
          const conversationId = userId || 'default';

          // Generate unique IDs based on timestamp
          const userMessageId = Date.now();
          const botMessageId = Date.now() + 1;

          // Add user message
          const userMessage: ChatbotMessage = {
            id: userMessageId,
            content: message,
            createdAt: new Date().toISOString(),
            isFromBot: false,
            senderId: userId || 'user',
            conversationId: -1,
            type: MessageType.TEXT,
            isRead: true,
            updatedAt: new Date().toISOString(),
          };

          // Update chatbot with user message immediately
          const chatbotWithUserMessage: ChatbotConversation = {
            ...chatbot,
            messages: [...chatbot.messages, userMessage],
            updatedAt: new Date().toISOString(),
          };
          
          set({ 
            chatbot: chatbotWithUserMessage, 
            currentConversation: chatbotWithUserMessage,
            messages: [chatbotWithUserMessage.messages],
            isReplying: true 
          });

          // Call chatbot service
          const response = await chatbotService.sendMessage({
            message,
            conversationId,
            context: {}, // Can be enriched with contextual data
          });

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            // Return fallback response on error
            const fallbackResponse = {
              content:
                'Désolé, je rencontre des difficultés à traiter votre demande. Veuillez réessayer.',
              suggestions: ['Aide', 'Support'],
            };

            // Add fallback bot message
            const fallbackBotMessage: ChatbotMessage = {
              id: botMessageId,
              content: fallbackResponse.content,
              createdAt: new Date().toISOString(),
              isFromBot: true,
              senderId: 'bot',
              conversationId: -1,
              type: MessageType.TEXT,
              isRead: true,
              updatedAt: new Date().toISOString(),
              suggestions: fallbackResponse.suggestions,
            };

            const updatedChatbot: ChatbotConversation = {
              ...chatbotWithUserMessage,
              messages: [...chatbotWithUserMessage.messages, fallbackBotMessage],
              lastMessage: fallbackBotMessage,
              updatedAt: new Date().toISOString(),
            };

            set({ 
              chatbot: updatedChatbot,
              currentConversation: updatedChatbot,
              messages: [updatedChatbot.messages],
              isReplying: false 
            });
            return fallbackResponse;
          }

          const botResponse = response.data!;

          // Create bot message with data from API
          const botMessage: ChatbotMessage = {
            id: botMessageId,
            content: botResponse.message,
            createdAt: botResponse.timestamp || new Date().toISOString(),
            isFromBot: true,
            senderId: 'bot',
            conversationId: -1,
            type: MessageType.TEXT,
            isRead: true,
            updatedAt: botResponse.timestamp || new Date().toISOString(),
            suggestions: botResponse.suggestions,
            navigation: botResponse.navigation,
            requiresHuman: botResponse.requires_human,
          };

          // Update chatbot conversation with bot response
          const updatedChatbot: ChatbotConversation = {
            ...chatbotWithUserMessage,
            messages: [...chatbotWithUserMessage.messages, botMessage],
            lastMessage: botMessage,
            updatedAt: new Date().toISOString(),
          };

          set({ 
            chatbot: updatedChatbot, 
            currentConversation: updatedChatbot, 
            messages: [updatedChatbot.messages],
            isReplying: false
          });

          // Return response for compatibility
          return {
            content: botResponse.message,
            suggestions: botResponse.suggestions,
            navigation: botResponse.navigation,
            requiresHuman: botResponse.requires_human,
          };
        } catch (error) {
          console.error('Failed to send chatbot message:', error);
          set({
            error: 'Failed to communicate with chatbot',
            isLoading: false,
          });
          return {
            content: 'Erreur lors de la communication avec le chatbot',
          };
        }
      },

      // Get chatbot response (synchronous version)
      getChatbotResponse: (userInput: string): ChatbotResponse => {
        return generateChatbotResponse(userInput);
      },

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

        // Mark messages as read when opening conversation (only for regular conversations)
        if (conversation && conversation.id !== -1) {
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
        chatbot: state.chatbot,
      }),
      onRehydrateStorage: () => (state) => {
        // Fix chatbot messages array after rehydration
        if (state && state.chatbot) {
          const messages = state.chatbot.messages;
          if (!Array.isArray(messages) && messages && typeof messages === 'object') {
            state.chatbot.messages = Object.values(messages) as ChatbotMessage[];
          }
        }
      },
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
