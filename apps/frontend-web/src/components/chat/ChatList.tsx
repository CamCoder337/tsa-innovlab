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
  const [filterType, setFilterType] = useState<ConversationType | 'all'>('all');

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
      return <Hash className="h-4 w-4 text-blue-500" />;
    }
    return <MessageCircle className="h-4 w-4 text-green-500" />;
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
      <div className="p-4 text-center">
        <div className="text-red-500 text-sm mb-2">{error}</div>
        <Button variant="outline" size="sm" onClick={clearError}>
          {tChat('buttons.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {tForms('sections.messages')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateConversation}
            className="text-tsa-blue hover:text-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {tChat('buttons.newConversation')}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={tChat('placeholders.searchConversations')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1">
          <Button
            variant={filterType === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('all')}
            className="text-xs"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {tChat('buttons.all')}
          </Button>
          <Button
            variant={filterType === ConversationType.DIRECT ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType(ConversationType.DIRECT)}
            className="text-xs"
          >
            <Users className="h-3 w-3 mr-1" />
            {tChat('buttons.direct')}
          </Button>
          <Button
            variant={filterType === ConversationType.MISSION ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType(ConversationType.MISSION)}
            className="text-xs"
          >
            <Hash className="h-3 w-3 mr-1" />
            {tChat('buttons.mission')}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{tChat('messages.loadingError')}</p>
          <p className="text-sm text-red-500 mt-1">{error}</p>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 flex items-center justify-center text-gray-500 h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            {tChat('messages.loading')}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">
              {searchTerm
                ? tChat('messages.noConversationFound')
                : tChat('messages.noConversationsForNow')}
            </p>
            {!searchTerm && (
              <Button variant="outline" size="sm" onClick={onCreateConversation} className="mt-2">
                <Plus className="h-4 w-4 mr-1" />
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
                  className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isActive ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                  onClick={() => onSelectConversation(conversation)}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
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
                      {/* Conversation type indicator */}
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                        {getConversationIcon(conversation)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className={`text-sm font-medium truncate ${
                            isActive ? 'text-blue-900' : 'text-gray-900'
                          }`}
                        >
                          {getConversationTitle(conversation)}
                        </h4>
                        <div className="flex items-center gap-1">
                          {lastMessageTime && (
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {lastMessageTime}
                            </p>
                          )}
                          {conversation.unreadMessagesCount &&
                            conversation.unreadMessagesCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="h-5 w-5 p-0 text-xs rounded-full flex items-center justify-center"
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
