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
import type { ConversationListItem, Message } from '@/types/chat.types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChatWindowProps {
  conversation: ConversationListItem;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onClose }) => {
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
    const this_messages = messages[conversation.id].reverse();
    return this_messages || [];
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

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, typingUsers]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      'Utilisateur inconnu'
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
      <div className="flex flex-col h-full items-center justify-center p-8 bg-gray-50">
        <div className="text-red-500 text-sm mb-4">{error}</div>
        <Button variant="outline" onClick={() => clearError()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={conversation.otherParticipant?.avatarUrl}
                alt={`${conversation.otherParticipant?.firstName} ${conversation.otherParticipant?.lastName}`}
              />
              <AvatarFallback>
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
            <h3 className="font-semibold text-gray-900 truncate">{getConversationTitle()}</h3>
            <p className="text-sm text-gray-500 truncate">{getConversationSubtitle()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversation.type === 'direct' && (
            <>
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500">Chargement des messages...</span>
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <MessageCircle className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-sm">Aucun message dans cette conversation</p>
            <p className="text-xs mt-1">Envoyez le premier message pour commencer</p>
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
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
                <span>
                  {typingUsers.length === 1
                    ? `${typingUsers[0]?.firstName} est en train d'écrire...`
                    : `${typingUsers.length} personnes sont en train d'écrire...`}
                </span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder={`Envoyer un message à ${conversation.otherParticipant?.firstName || "l'utilisateur"}...`}
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!newMessage.trim() || isLoading} className="px-4">
            <Send className="h-4 w-4" />
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
  const getMessageStatusIcon = () => {
    if (!isCurrentUser) return null;

    if (message.readAt) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    }
    return <Check className="h-3 w-3 text-gray-400" />;
  };

  const formatMessageTime = (createdAt: string) => {
    // Handle null, undefined, or empty string
    if (!createdAt) {
      return 'Maintenant';
    }

    const messageDate = new Date(createdAt);

    // Check if the date is valid
    if (isNaN(messageDate.getTime())) {
      console.warn('Invalid date format received:', createdAt);
      return 'Date invalide';
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
        <div className="w-8">
          {showAvatar && (
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={otherParticipant?.avatar}
                alt={`${otherParticipant?.firstName} ${otherParticipant?.lastName}`}
              />
              <AvatarFallback>
                {otherParticipant?.firstName?.charAt(0) || ''}
                {otherParticipant?.lastName?.charAt(0) || ''}
                {!otherParticipant?.firstName && !otherParticipant?.lastName && '?'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-1' : ''}`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isCurrentUser
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
        </div>

        <div
          className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
            isCurrentUser ? 'justify-end' : 'justify-start'
          }`}
        >
          <span>{formatMessageTime(message.createdAt)}</span>
          {getMessageStatusIcon()}
        </div>
      </div>
    </div>
  );
};
