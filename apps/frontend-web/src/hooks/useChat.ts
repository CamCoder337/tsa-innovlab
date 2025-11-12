import { useChatStore } from '@/stores/chatStore';

/**
 * Main chat hook providing all chat functionality
 */
export const useChat = () => {
  const store = useChatStore();

  return {
    // State
    conversations: store.conversations,
    currentConversation: store.currentConversation,
    messages: store.messages,
    typingIndicators: store.typingIndicators,
    isLoading: store.isLoading,
    isReplying: store.isReplying,
    error: store.error,
    unreadCount: store.unreadCount,
    chatbot: store.chatbot,
    chatbotCapabilities: store.chatbotCapabilities,

    // Actions
    initializeChatbot: store.initializeChatbot,
    fetchConversations: store.fetchConversations,
    fetchConversation: store.fetchConversation,
    fetchMessages: store.fetchMessages,
    getChatbotResponse: store.getChatbotResponse,
    sendMessage: store.sendMessage,
    sendChatbotMessage: store.sendChatbotMessage,
    createDirectConversation: store.createDirectConversation,
    createMissionConversation: store.createMissionConversation,
    markMessageAsRead: store.markMessageAsRead,
    markAllMessagesAsRead: store.markAllMessagesAsRead,
    searchUsers: store.searchUsers,
    sendTypingIndicator: store.sendTypingIndicator,
    setCurrentConversation: store.setCurrentConversation,
    clearError: store.clearError,
    reset: store.reset,

    // Computed values
    getCurrentMessages: () => {
      const conversationId = store.currentConversation?.id;
      return conversationId ? store.messages[conversationId] || [] : [];
    },

    getConversationMessages: (conversationId: number) => {
      return store.messages[conversationId] || [];
    },

    getTypingUsers: (conversationId: number) => {
      return store.typingIndicators
        .filter((t) => t.conversationId === conversationId && t.isTyping)
        .map((t) => t.userId);
    },

    getTotalUnreadCount: () => {
      return store.conversations.reduce(
        (total, conv) => total + (conv.unreadMessagesCount || 0),
        0
      );
    },
  };
};
