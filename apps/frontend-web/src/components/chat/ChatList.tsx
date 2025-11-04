import { useState } from 'react';
import { Search, Plus, MessageCircle, Clock, Hash, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { ConversationType, type ConversationListItem } from '@/types/chat.types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useChatTranslation, useFormsTranslation } from '@/hooks/useTranslation';

interface ChatListProps {
  onSelectConversation: (conversation: ConversationListItem) => void;
  onCreateConversation: () => void;
}

export default function ChatList({ onSelectConversation, onCreateConversation }: ChatListProps) {
  const { t: tForms } = useFormsTranslation();
  const { t: tChat } = useChatTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ConversationType | 'all'>(ConversationType.DIRECT);

  const { conversations, isLoading, error, currentConversation, clearError } = useChat();

  // Filter conversations based on search and type
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      searchTerm === '' ||
      conv.otherParticipant?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.otherParticipant?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.mission?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || conv.type === filterType;

    return matchesSearch && matchesType;
  });

  const getConversationIcon = (conversation: ConversationListItem) => {
    if (conversation.type === 'mission') {
      return <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />;
    }
    return <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />;
  };

  const getConversationTitle = (conversation: ConversationListItem) => {
    if (conversation.type === 'mission' && conversation.mission) {
      return `Mission: ${conversation.mission.title}`;
    }

    const firstName = conversation.otherParticipant?.firstName;
    const lastName = conversation.otherParticipant?.lastName;

    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }

    return 'Utilisateur inconnu';
  };

  const getConversationSubtitle = (conversation: ConversationListItem) => {
    if (conversation.type === 'mission') {
      return `avec ${conversation.otherParticipant?.firstName} ${conversation.otherParticipant?.lastName}`;
    }
    if (conversation.otherParticipant?.role) {
      return (
        conversation.otherParticipant?.role?.charAt(0).toUpperCase() +
          conversation.otherParticipant?.role?.slice(1) || ''
      );
    }
    return 'Utilisateur inconnu';
  };

  const formatMessageTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: fr,
    });
  };

  if (error) {
    return (
      <div className="p-3 sm:p-4 text-center">
        <div className="text-red-500 text-xs sm:text-sm mb-2">{error}</div>
        <Button variant="outline" size="sm" onClick={clearError} className="text-xs sm:text-sm">
          {tChat('buttons.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-2 sm:p-3 lg:p-4 border-b border-gray-200 space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center gap-1 sm:gap-2">
            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
            <span>{tForms('sections.messages')}</span>
          </h2>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
            <Input
              placeholder={tChat('placeholders.searchConversations')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 sm:pl-9 lg:pl-10 text-xs sm:text-sm h-8 sm:h-9 lg:h-10"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateConversation}
            className="text-tsa-blue hover:text-blue-700 h-6 w-6 sm:h-8 sm:w-8 lg:h-9 lg:w-9 p-0 sm:p-1"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sr-only">{tChat('buttons.newConversation')}</span>
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="hidden gap-1 sm:gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('all')}
            className="text-xs flex-1 sm:flex-none h-7 sm:h-8 px-2 sm:px-3"
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            <span>{tChat('buttons.all')}</span>
          </Button>
          <Button
            variant={filterType === ConversationType.DIRECT ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType(ConversationType.DIRECT)}
            className="text-xs flex-1 sm:flex-none h-7 sm:h-8 px-2 sm:px-3"
          >
            <Users className="h-3 w-3 mr-1" />
            <span>{tChat('buttons.direct')}</span>
          </Button>
          <Button
            variant={filterType === ConversationType.MISSION ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType(ConversationType.MISSION)}
            className="text-xs flex-1 sm:flex-none h-7 sm:h-8 px-2 sm:px-3"
          >
            <Hash className="h-3 w-3 mr-1" />
            <span>{tChat('buttons.mission')}</span>
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-center py-4 sm:py-6 lg:py-8 px-2 sm:px-3 lg:px-4">
          <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-red-400 mx-auto mb-2 sm:mb-3 lg:mb-4" />
          <p className="text-red-600 font-medium text-xs sm:text-sm lg:text-base">
            {tChat('messages.loadingError')}
          </p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-2 sm:p-3 lg:p-4 flex items-center justify-center text-gray-500 h-full">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-xs sm:text-sm lg:text-base">{tChat('messages.loading')}</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-2 sm:p-3 lg:p-4 text-center text-gray-500">
            <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
            <p className="text-xs sm:text-sm lg:text-base">
              {searchTerm
                ? tChat('messages.noConversationFound')
                : tChat('messages.noConversationsForNow')}
            </p>
            {!searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateConversation}
                className="mt-2 text-xs sm:text-sm h-7 sm:h-8"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {tChat('buttons.newConversation')}
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const isActive = currentConversation?.id === conversation.id;
              const lastMessageTime = conversation.lastMessage?.createdAt
                ? formatMessageTime(conversation.lastMessage.createdAt)
                : '';

              return (
                <div
                  key={conversation.id}
                  className={`p-2 sm:p-3 lg:p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isActive ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                  onClick={() => onSelectConversation(conversation)}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10">
                        <AvatarImage
                          src={conversation.otherParticipant?.avatarUrl}
                          alt={`${conversation.otherParticipant?.firstName} ${conversation.otherParticipant?.lastName}`}
                        />
                        <AvatarFallback className="text-xs">
                          {conversation.otherParticipant?.firstName?.charAt(0) || ''}
                          {conversation.otherParticipant?.lastName?.charAt(0) || ''}
                          {!conversation.otherParticipant?.firstName &&
                            !conversation.otherParticipant?.lastName &&
                            '?'}
                        </AvatarFallback>
                      </Avatar>
                      {/* Conversation type indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5">
                        {getConversationIcon(conversation)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className={`text-xs sm:text-sm lg:text-base font-medium truncate ${
                            isActive ? 'text-blue-900' : 'text-gray-900'
                          }`}
                        >
                          {getConversationTitle(conversation)}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          {lastMessageTime && (
                            <p className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                              <span>{lastMessageTime}</span>
                            </p>
                          )}
                          {conversation.unreadMessagesCount &&
                            conversation.unreadMessagesCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 p-0 text-xs rounded-full flex items-center justify-center min-w-3 sm:min-w-4 lg:min-w-5"
                              >
                                {conversation.unreadMessagesCount > 99
                                  ? '99+'
                                  : conversation.unreadMessagesCount}
                              </Badge>
                            )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 truncate">
                          {getConversationSubtitle(conversation)}
                        </p>
                      </div>

                      {/* Last message preview */}
                      {conversation.lastMessage && (
                        <p
                          className={`text-xs mt-1 truncate ${
                            conversation.unreadMessagesCount && conversation.unreadMessagesCount > 0
                              ? 'font-medium text-gray-700'
                              : 'text-gray-500'
                          }`}
                        >
                          {conversation.lastMessage.senderId === user?.id
                            ? tForms('messages.you') + ': '
                            : ''}
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
