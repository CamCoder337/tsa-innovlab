import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Hash,
  MessageCircle,
  Check,
  CheckCheck,
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
import type { ConversationListItem, Message } from '@/types/chat.types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChatWindowProps {
  conversation: ConversationListItem;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onClose }) => {
  const { t: tChat } = useChatTranslation();
  const { user } = useAuth();
  const {
    messages,
    isLoading,
    error,
    fetchMessages,
    sendMessage,
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

  const currentMessages = useMemo(() => {
    return messages[conversation.id] || [];
  }, [messages, conversation.id]);

  const typingUsers = useMemo(() => {
    return typingIndicators
      .filter((indicator) => indicator.conversationId === conversation.id && indicator.isTyping)
      .map((indicator) => {
        // Map userId to actual user data
        // For now, use otherParticipant if it matches, otherwise fallback to userId
        if (!conversation.otherParticipant) return null;
        const isOtherParticipant = indicator.userId === conversation.otherParticipant?.id;

        if (!isOtherParticipant) return null;
        return {
          userId: indicator.userId,
          firstName: conversation.otherParticipant?.firstName,
          lastName: conversation.otherParticipant?.lastName,
        };
      });
  }, [typingIndicators, conversation.id, conversation.otherParticipant]);

  // Create stable function references to avoid infinite loops
  const loadMessagesForConversation = useCallback(
    async (conversationId: number) => {
      await fetchMessages(conversationId);
      if (messages) {
        await markAllMessagesAsRead(conversationId);
      }
    },
    [fetchMessages, markAllMessagesAsRead, messages]
  );

  useEffect(() => {
    // Only load messages when conversation actually changes
    if (conversation.id) {
      currentConversationIdRef.current = conversation.id;
      loadMessagesForConversation(conversation.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  // useEffect(() => {
  //   scrollToBottom();
  // }, [currentMessages, typingUsers]);

  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await sendMessage(conversation.id, newMessage);
      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

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
    if (conversation.type === 'mission' && conversation.mission) {
      return `Mission: ${conversation.mission.title}`;
    }
    return (
      conversation.otherParticipant?.firstName + ' ' + conversation.otherParticipant?.lastName ||
      tChat('messages.unknownUser')
    );
  };

  const getConversationSubtitle = () => {
    if (conversation.type === 'mission') {
      return `avec ${conversation.otherParticipant?.firstName} ${conversation.otherParticipant?.lastName}`;
    }
    if (conversation.otherParticipant?.role) {
      return (
        conversation.otherParticipant?.role?.charAt(0).toUpperCase() +
          conversation.otherParticipant?.role?.slice(1) || ''
      );
    }
  };

  const getConversationIcon = () => {
    if (conversation.type === 'mission') {
      return <Hash className="h-4 w-4 text-blue-500" />;
    }
    return <MessageCircle className="h-4 w-4 text-green-500" />;
  };

  if (error) {
    return (
      <div className="flex flex-col h-fit items-center justify-center p-8 bg-gray-50">
        <div className="text-red-500 text-sm mb-4">{error}</div>
        <Button variant="outline" onClick={() => clearError()}>
          {tChat('buttons.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-white justify-between">
      {/* Header - Fixed Height */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="relative">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage
                src={conversation.otherParticipant?.avatarUrl}
                alt={`${conversation.otherParticipant?.firstName} ${conversation.otherParticipant?.lastName}`}
              />
              <AvatarFallback className="text-xs sm:text-sm">
                {conversation.otherParticipant?.firstName?.charAt(0) || ''}
                {conversation.otherParticipant?.lastName?.charAt(0) || ''}
                {!conversation.otherParticipant?.firstName &&
                  !conversation.otherParticipant?.lastName &&
                  '?'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
              {getConversationIcon()}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
              {getConversationTitle()}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{getConversationSubtitle()}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {conversation.type === 'direct' && (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" className="p-1 sm:p-2">
            <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="p-1 sm:p-2 md:hidden">
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Messages - Scrollable Area */}
      <div className="flex-1 flex flex-col justify-end py-2 gap-2 px-2 sm:px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 h-full">
            <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500 text-sm sm:text-base">
              {tChat('messages.loadingMessages')}
            </span>
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-gray-500">
            <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 text-gray-300" />
            <p className="text-sm sm:text-base">{tChat('messages.noMessagesInConversation')}</p>
            <p className="text-xs sm:text-sm mt-1">{tChat('messages.sendFirstMessage')}</p>
          </div>
        ) : (
          <>
            {currentMessages.map((message, index) => {
              const isCurrentUser = message.senderId === user?.id;
              const showAvatar =
                !isCurrentUser &&
                (index === 0 || currentMessages[index - 1]?.senderId !== message.senderId);

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isCurrentUser={isCurrentUser}
                  showAvatar={showAvatar}
                  otherParticipant={conversation.otherParticipant}
                />
              );
            })}

            {/* Typing indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 px-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
                <span>
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
      <div className="border-t border-gray-200 px-3 sm:px-8 py-2 bg-white shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder={tChat('placeholders.sendMessageTo', {
              name: conversation.otherParticipant?.firstName || tChat('user'),
            })}
            className="flex-1 text-sm sm:text-base"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!newMessage.trim() || isLoading} className="px-3 sm:px-4">
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
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
  showAvatar,
  otherParticipant,
}) => {
  const { t: tCommon } = useCommonTranslation();
  const { t: tErrors } = useErrorsTranslation();
  const getMessageStatusIcon = () => {
    if (!isCurrentUser) return null;

    if (message.isRead) {
      return <CheckCheck className="h-3 w-3 text-tsa-white" />;
    }
    return <Check className="h-3 w-3 text-tsa-white" />;
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
    <div className={`flex gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <div className="w-6 sm:w-8">
          {showAvatar && (
            <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
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
        </div>
      )}

      <div
        className={`max-w-xs sm:max-w-sm lg:max-w-md min-w-20 sm:min-w-28 ${isCurrentUser ? 'order-1' : ''}`}
      >
        <div
          className={`px-3 sm:px-4 py-2 rounded-2xl ${
            isCurrentUser
              ? 'bg-tsa-blue text-white rounded-br-md'
              : 'bg-tsa-gray/25 text-gray-900 rounded-bl-md'
          }`}
        >
          <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">
            {message.content}
          </div>

          <div className={`flex items-center gap-1 mt-1 text-xs justify-end`}>
            <span>{formatMessageTime(message.createdAt)}</span>
            {getMessageStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  );
};
