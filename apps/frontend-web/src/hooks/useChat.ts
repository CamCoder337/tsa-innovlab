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
    error: store.error,
    unreadCount: store.unreadCount,

    // Actions
    fetchConversations: store.fetchConversations,
    fetchConversation: store.fetchConversation,
    fetchMessages: store.fetchMessages,
    sendMessage: store.sendMessage,
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

/**
 * Hook for messages of current conversation
 */
export const useCurrentMessages = () => {
  const currentConversation = useChatStore((state) => state.currentConversation);
  const messages = useChatStore((state) => state.messages);

  return currentConversation ? messages[currentConversation.id] || [] : [];
};

/**
 * Hook for typing indicators in current conversation
 */
export const useCurrentTypingIndicators = () => {
  const currentConversation = useChatStore((state) => state.currentConversation);
  const typingIndicators = useChatStore((state) => state.typingIndicators);

  if (!currentConversation) return [];

  return typingIndicators
    .filter((t) => t.conversationId === currentConversation.id && t.isTyping)
    .map((t) => t.userId);
};

/**
 * Hook for total unread messages count
 */
export const useUnreadCount = () => {
  const conversations = useChatStore((state) => state.conversations);
  return conversations.reduce((total, conv) => total + (conv.unreadMessagesCount || 0), 0);
};
