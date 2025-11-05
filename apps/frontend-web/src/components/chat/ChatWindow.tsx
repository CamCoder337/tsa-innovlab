import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Hash,
  MessageCircle,
  Check,
  ArrowLeft,
  CheckCheck,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import {
  useCommonTranslation,
  useChatTranslation,
  useErrorsTranslation,
} from '@/hooks/useTranslation';
import { ConversationType } from '@/types/chat.types';
import type {
  ConversationListItem,
  ChatbotConversation,
  AnyConversation,
  Message,
  ChatbotMessage,
} from '@/types/chat.types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChatWindowProps {
  conversation: AnyConversation;
  onBack?: () => void;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onBack, onClose }) => {
  const { t: tChat } = useChatTranslation();
  const { user } = useAuth();
  const {
    messages,
    isLoading,
    error,
    fetchMessages,
    sendMessage,
    sendChatbotMessage,
    markAllMessagesAsRead,
    sendTypingIndicator,
    typingIndicators,
    clearError,
  } = useChat();

  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null);
  const currentConversationIdRef = useRef<number | null>(null);

  // Check if this is a chatbot conversation
  const isChatbotConversation = conversation.type === ConversationType.CHATBOT;
  const chatbotConversation = isChatbotConversation ? (conversation as ChatbotConversation) : null;

  const currentMessages = useMemo(() => {
    if (isChatbotConversation && chatbotConversation) {
      // For chatbot conversations, use chatbot messages
      return chatbotConversation.messages.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.isFromBot ? 'bot' : user?.id || '',
        content: msg.content,
        type: 'text' as const,
        isRead: true,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      }));
    }
    return messages[conversation.id] || [];
  }, [messages, conversation.id, isChatbotConversation, chatbotConversation, user?.id]);

  const typingUsers = useMemo(() => {
    // Skip typing indicators for chatbot conversations
    if (isChatbotConversation) return [];

    return typingIndicators
      .filter((indicator) => indicator.conversationId === conversation.id && indicator.isTyping)
      .map((indicator) => {
        // Map userId to actual user data
        const regularConv = conversation as ConversationListItem;
        if (!regularConv.otherParticipant) return null;
        const isOtherParticipant = indicator.userId === regularConv.otherParticipant?.id;

        if (!isOtherParticipant) return null;
        return {
          userId: indicator.userId,
          firstName: regularConv.otherParticipant?.firstName,
          lastName: regularConv.otherParticipant?.lastName,
        };
      });
  }, [isChatbotConversation, typingIndicators, conversation]);

  // Create stable function references to avoid infinite loops
  const loadMessagesForConversation = useCallback(
    async (conversationId: number) => {
      // Skip API calls for chatbot conversations
      if (isChatbotConversation) return;

      await fetchMessages(conversationId);
      if (messages) {
        await markAllMessagesAsRead(conversationId);
      }
    },
    [fetchMessages, markAllMessagesAsRead, messages, isChatbotConversation]
  );

  useEffect(() => {
    // Only load messages when conversation actually changes
    if (conversation.id) {
      currentConversationIdRef.current = conversation.id;
      loadMessagesForConversation(conversation.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      if (isChatbotConversation) {
        await sendChatbotMessage(newMessage);
      } else {
        await sendMessage(conversation.id, newMessage);
      }
      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    // Skip typing indicators for chatbot conversations
    if (isChatbotConversation) return;

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(conversation.id, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(conversation.id, false);
    }, 1000);
  };

  const getConversationTitle = () => {
    if (isChatbotConversation && chatbotConversation) {
      return chatbotConversation.profile.name;
    }
    const regularConv = conversation as ConversationListItem;
    if (regularConv.type === 'mission' && regularConv.mission) {
      return `Mission: ${regularConv.mission.title}`;
    }
    return (
      regularConv.otherParticipant?.firstName + ' ' + regularConv.otherParticipant?.lastName ||
      tChat('messages.unknownUser')
    );
  };

  const getConversationSubtitle = () => {
    if (isChatbotConversation && chatbotConversation) {
      return chatbotConversation.profile.description;
    }
    const regularConv = conversation as ConversationListItem;
    if (regularConv.type === 'mission') {
      return `avec ${regularConv.otherParticipant?.firstName} ${regularConv.otherParticipant?.lastName}`;
    }
    if (regularConv.otherParticipant?.role) {
      return (
        regularConv.otherParticipant?.role?.charAt(0).toUpperCase() +
          regularConv.otherParticipant?.role?.slice(1) || ''
      );
    }
  };

  const getConversationIcon = () => {
    if (isChatbotConversation) {
      return <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />;
    }
    if (conversation.type === 'mission') {
      return <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />;
    }
    return <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />;
  };

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50">
        <div className="text-red-500 text-xs sm:text-sm lg:text-base mb-3 sm:mb-4">{error}</div>
        <Button variant="outline" onClick={() => clearError()} className="text-xs sm:text-sm">
          {tChat('buttons.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-white justify-between h-full">
      {/* Header - Fixed Height */}
      <div className="flex items-center justify-between p-2 sm:p-3 lg:p-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Mobile Back Button */}
          <div className="md:hidden flex items-center w-fit border-b border-gray-200 bg-white flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2 h-7 w-7 p-0">
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <span className="md:flex hidden font-medium text-xs sm:text-sm truncate">
              {tChat('buttons.backToConversations', 'Retour aux conversations')}
            </span>
          </div>

          <div className="relative flex-shrink-0">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10">
              {isChatbotConversation ? (
                <AvatarFallback className="bg-purple-100 text-purple-600">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                </AvatarFallback>
              ) : (
                <>
                  <AvatarImage
                    src={(conversation as ConversationListItem).otherParticipant?.avatarUrl}
                    alt={`${(conversation as ConversationListItem).otherParticipant?.firstName} ${(conversation as ConversationListItem).otherParticipant?.lastName}`}
                  />
                  <AvatarFallback className="text-xs">
                    {(conversation as ConversationListItem).otherParticipant?.firstName?.charAt(
                      0
                    ) || ''}
                    {(conversation as ConversationListItem).otherParticipant?.lastName?.charAt(0) ||
                      ''}
                    {!(conversation as ConversationListItem).otherParticipant?.firstName &&
                      !(conversation as ConversationListItem).otherParticipant?.lastName &&
                      '?'}
                  </AvatarFallback>
                </>
              )}
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5">
              {getConversationIcon()}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-xs sm:text-sm lg:text-base">
              {getConversationTitle()}
            </h3>
            <p className="text-xs text-gray-500 truncate">{getConversationSubtitle()}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {conversation.type === 'direct' && !isChatbotConversation && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex h-7 w-7 lg:h-8 lg:w-8 p-0"
              >
                <Phone className="h-3 w-3 lg:h-4 lg:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex h-7 w-7 lg:h-8 lg:w-8 p-0"
              >
                <Video className="h-3 w-3 lg:h-4 lg:w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 p-0">
            <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 md:hidden"
            >
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Messages - Scrollable Area */}
      <div className="flex-1 flex flex-col justify-end py-1 sm:py-2 gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 overflow-y-auto">
        {isLoading && !isChatbotConversation ? (
          <div className="flex items-center justify-center py-6 sm:py-8 lg:py-12 h-full">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500 text-xs sm:text-sm lg:text-base">
              {tChat('messages.loadingMessages')}
            </span>
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 lg:py-12 text-gray-500">
            {isChatbotConversation ? (
              <Bot className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 mb-2 sm:mb-3 lg:mb-4 text-purple-300" />
            ) : (
              <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 mb-2 sm:mb-3 lg:mb-4 text-gray-300" />
            )}
            <p className="text-xs sm:text-sm lg:text-base">
              {isChatbotConversation
                ? tChat('messages.noChatbotMessages', 'Commencez une conversation avec le bot')
                : tChat('messages.noMessagesInConversation')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isChatbotConversation
                ? tChat('messages.askBotQuestion', 'Posez votre première question')
                : tChat('messages.sendFirstMessage')}
            </p>
          </div>
        ) : (
          <>
            {currentMessages.map((message, index) => {
              const isCurrentUser = message.senderId === user?.id;
              const isBotMessage = message.senderId === 'bot';
              const showAvatar =
                !isCurrentUser &&
                !isBotMessage &&
                (index === 0 || currentMessages[index - 1]?.senderId !== message.senderId);
              const msg = isBotMessage ? (message as Message) : (message as ChatbotMessage);
              return (
                <MessageBubble
                  key={message.id}
                  message={msg}
                  isCurrentUser={isCurrentUser}
                  isBotMessage={isBotMessage}
                  showAvatar={showAvatar}
                  otherParticipant={
                    !isChatbotConversation
                      ? (conversation as ConversationListItem).otherParticipant
                      : undefined
                  }
                />
              );
            })}

            {/* Typing indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-500 px-1 sm:px-2">
                <div className="flex gap-1">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
                <span className="text-xs">
                  {typingUsers.length === 1
                    ? tChat('messages.isTyping', { name: typingUsers[0]?.firstName })
                    : tChat('messages.peopleTyping', { count: typingUsers.length })}
                </span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Fixed Height */}
      <div className="border-t border-gray-200 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 bg-white shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder={
              isChatbotConversation
                ? tChat('placeholders.sendMessageToBot', 'Posez votre question au bot...')
                : tChat('placeholders.sendMessageTo', {
                    name:
                      (conversation as ConversationListItem).otherParticipant?.firstName ||
                      tChat('user'),
                  })
            }
            className="flex-1 text-xs sm:text-sm lg:text-base h-8 sm:h-9 lg:h-10"
            disabled={isLoading && !isChatbotConversation}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || (isLoading && !isChatbotConversation)}
            className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 p-0 flex-shrink-0"
          >
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: Message | ChatbotMessage;
  isCurrentUser: boolean;
  isBotMessage?: boolean;
  showAvatar: boolean;
  otherParticipant?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  isBotMessage = false,
  showAvatar,
  otherParticipant,
}) => {
  const { t: tCommon } = useCommonTranslation();
  const { t: tErrors } = useErrorsTranslation();

  const getMessageStatusIcon = () => {
    if (!isCurrentUser || isBotMessage) return null;

    if (message.isRead) {
      return <CheckCheck className="h-2 w-2 sm:h-3 sm:w-3 text-tsa-white" />;
    }
    return <Check className="h-2 w-2 sm:h-3 sm:w-3 text-tsa-white" />;
  };

  const formatMessageTime = (createdAt: string) => {
    // Handle null, undefined, or empty string
    if (!createdAt) {
      return tCommon('time.now');
    }

    const messageDate = new Date(createdAt);

    // Check if the date is valid
    if (isNaN(messageDate.getTime())) {
      console.warn('Invalid date format received:', createdAt);
      return tErrors('general.invalidDate');
    }

    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return formatDistanceToNow(messageDate, {
      addSuffix: true,
      locale: fr,
    });
  };

  return (
    <div
      className={`flex gap-1 sm:gap-2 mb-1 sm:mb-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isCurrentUser && (
        <div className="w-5 sm:w-6 lg:w-8 flex-shrink-0">
          {showAvatar && !isBotMessage && (
            <Avatar className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8">
              <AvatarImage
                src={otherParticipant?.avatar}
                alt={`${otherParticipant?.firstName} ${otherParticipant?.lastName}`}
              />
              <AvatarFallback className="text-xs">
                {otherParticipant?.firstName?.charAt(0) || ''}
                {otherParticipant?.lastName?.charAt(0) || ''}
                {!otherParticipant?.firstName && !otherParticipant?.lastName && '?'}
              </AvatarFallback>
            </Avatar>
          )}
          {showAvatar && isBotMessage && (
            <Avatar className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8">
              <AvatarFallback className="bg-purple-100 text-purple-600">
                <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div
        className={`max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg min-w-16 sm:min-w-20 lg:min-w-24 ${isCurrentUser ? 'order-1' : ''}`}
      >
        <div
          className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl ${
            isCurrentUser
              ? 'bg-tsa-blue text-white rounded-br-sm sm:rounded-br-md'
              : isBotMessage
                ? 'bg-purple-100 text-purple-900 rounded-bl-sm sm:rounded-bl-md'
                : 'bg-tsa-gray/25 text-gray-900 rounded-bl-sm sm:rounded-bl-md'
          }`}
        >
          <div className="text-xs sm:text-sm lg:text-base whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </div>

          <div className={`flex items-center gap-1 mt-1 text-xs justify-end`}>
            <span className={`text-xs opacity-75 ${isBotMessage ? 'text-purple-700' : ''}`}>
              {formatMessageTime(message.createdAt)}
            </span>
            {getMessageStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  );
};
