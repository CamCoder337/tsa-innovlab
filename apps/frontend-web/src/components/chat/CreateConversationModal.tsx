import React, { useState } from 'react';
import { Search, X, Users, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useChat } from '@/hooks/useChat';
import { type ConversationListItem, ConversationType, type SearchUser } from '@/types/chat.types';

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: ConversationListItem) => void;
}

export const CreateConversationModal: React.FC<CreateConversationModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated,
}) => {
  const { searchUsers, createDirectConversation, isLoading } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [conversationType, setConversationType] = useState<ConversationType>(
    ConversationType.DIRECT
  );
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedUser) return;

    try {
      let conversation;

      if (conversationType === ConversationType.DIRECT) {
        conversation = await createDirectConversation(selectedUser.id);
      } else {
        // For mission conversations, we need a missionId - this should be handled differently
        // For now, we'll create a direct conversation and show a warning
        console.warn(
          'Mission conversations require a missionId - creating direct conversation instead'
        );
        conversation = await createDirectConversation(selectedUser.id);
      }

      // Convert Conversation to ConversationListItem
      const conversationListItem: ConversationListItem = {
        ...conversation,
        unreadMessagesCount: 0,
        otherParticipant: {
          id: selectedUser.id,
          fullName: selectedUser.fullName,
          email: selectedUser.email,
          role: selectedUser.role,
          avatarUrl: selectedUser.avatar,
        },
      };

      onConversationCreated(conversationListItem);
      handleClose();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setConversationType(ConversationType.DIRECT);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Nouvelle conversation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Conversation Type Selection */}
          <div className="flex gap-2">
            <Button
              variant={conversationType === ConversationType.DIRECT ? 'default' : 'outline'}
              size="sm"
              onClick={() => setConversationType(ConversationType.DIRECT)}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Directe
            </Button>
            <Button
              variant={conversationType === ConversationType.MISSION ? 'default' : 'outline'}
              size="sm"
              onClick={() => setConversationType(ConversationType.MISSION)}
              className="flex-1"
            >
              <Hash className="h-4 w-4 mr-2" />
              Mission
            </Button>
          </div>

          {/* User Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rechercher un utilisateur</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Nom, email ou rôle..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          </div>

          {/* Selected User */}
          {selectedUser && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedUser.avatar} alt={selectedUser.fullName} />
                    <AvatarFallback>{selectedUser.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{selectedUser.fullName}</p>
                    <p className="text-xs text-gray-600">{selectedUser.email}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {selectedUser.role}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && !selectedUser && (
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.fullName} />
                      <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.fullName}</p>
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-4 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucun utilisateur trouvé</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={handleCreateConversation}
              disabled={!selectedUser || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                'Créer la conversation'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
