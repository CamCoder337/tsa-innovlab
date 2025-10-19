import React, { useState } from 'react';
import { Search, X, Users, Hash, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useChat } from '@/hooks/useChat';
import { type ConversationListItem, ConversationType, type SearchUser } from '@/types/chat.types';
import { useMissionStore } from '@/stores/missionStore';
import { useAuthStore } from '@/stores/authStore';
import { type Mission } from '@/types/mission.types';

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: ConversationListItem) => void;
}

interface UserWithMissions extends SearchUser {
  relatedMissions?: Mission[];
}

export const CreateConversationModal: React.FC<CreateConversationModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated,
}) => {
  const { searchUsers, isLoading, createDirectConversation, createMissionConversation } = useChat();
  const { myMissions } = useMissionStore();
  const { currentUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserWithMissions[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithMissions | null>(null);
  const [conversationType, setConversationType] = useState<ConversationType>(
    ConversationType.DIRECT
  );
  const [isSearching, setIsSearching] = useState(false);
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [selectedUserMissions, setSelectedUserMissions] = useState<Mission[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);

  const filterUsersByMissions = (users: SearchUser[]): UserWithMissions[] => {
    if (conversationType !== ConversationType.MISSION || !currentUser) {
      return users;
    }

    return users
      .map((user) => {
        const relatedMissions = myMissions.filter((mission) => {
          if (currentUser.role === 'affreteur') {
            // For affreteur, show transporteurs who are assigned to their missions
            return mission.transporteurId === user.id;
          } else if (currentUser.role === 'transporteur') {
            // For transporteur, show affreteurs who created missions they're assigned to
            return mission.affreteurId === user.id;
          }
          return false;
        });

        return {
          ...user,
          relatedMissions,
        };
      })
      .filter((user) => user.relatedMissions && user.relatedMissions.length > 0);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await searchUsers(query);
      const filteredResults = filterUsersByMissions(results);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateConversation = async (missionId?: string) => {
    if (!selectedUser) return;

    try {
      let conversation;

      if (conversationType === ConversationType.DIRECT) {
        conversation = await createDirectConversation(selectedUser.id);
      } else {
        const finalMissionId = missionId || selectedMissionId;
        if (!finalMissionId) {
          console.error('Mission ID is required for mission conversations');
          return;
        }
        conversation = await createMissionConversation(selectedUser.id, finalMissionId);
      }

      // Convert Conversation to ConversationListItem
      const conversationListItem: ConversationListItem = {
        ...conversation,
        unreadMessagesCount: 0,
        otherParticipant: {
          id: selectedUser.id,
          firstName: selectedUser.firstName,
          lastName: selectedUser.lastName,
          email: selectedUser.email,
          role: selectedUser.role,
        },
      };

      onConversationCreated(conversationListItem);
      handleClose();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleShowMissions = (user: UserWithMissions) => {
    if (user.relatedMissions) {
      setSelectedUserMissions(user.relatedMissions);
      setSelectedUser(user);
      setShowMissionsModal(true);
    }
  };

  const handleMissionSelect = (missionId: string) => {
    setSelectedMissionId(missionId);
    setShowMissionsModal(false);
    handleCreateConversation(missionId);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setConversationType(ConversationType.DIRECT);
    setShowMissionsModal(false);
    setSelectedUserMissions([]);
    setSelectedMissionId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogDescription />
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
                    {/* <AvatarImage src={selectedUser.avatar} alt={`${selectedUser.firstName} ${selectedUser.lastName}`} /> */}
                    <AvatarFallback>
                      {selectedUser.firstName.charAt(0)} {selectedUser.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{`${selectedUser.firstName} ${selectedUser.lastName}`}</p>
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
                <div key={user.id} className="p-3 hover:bg-gray-50 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {/* <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} /> */}
                      <AvatarFallback>
                        {user.firstName.charAt(0)} {user.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() =>
                        conversationType === ConversationType.DIRECT ? setSelectedUser(user) : null
                      }
                    >
                      <p className="font-medium text-sm truncate">{`${user.firstName} ${user.lastName}`}</p>
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      {conversationType === ConversationType.MISSION && user.relatedMissions && (
                        <p className="text-xs text-blue-600 mt-1">
                          {user.relatedMissions.length} mission(s) partagée(s)
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {user.role}
                      </Badge>
                      {conversationType === ConversationType.MISSION &&
                        user.relatedMissions &&
                        user.relatedMissions.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowMissions(user)}
                            className="h-6 w-6 p-0 hover:bg-blue-100"
                          >
                            <Info className="h-3 w-3 text-blue-600" />
                          </Button>
                        )}
                    </div>
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
              onClick={() => handleCreateConversation()}
              disabled={
                !selectedUser ||
                isLoading ||
                (conversationType === ConversationType.MISSION && !selectedMissionId)
              }
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

        {/* Mission Selection Modal */}
        {showMissionsModal && (
          <Dialog open={showMissionsModal} onOpenChange={setShowMissionsModal}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Sélectionner une mission
                </DialogTitle>
                <DialogDescription>
                  Choisissez la mission pour laquelle vous souhaitez créer une conversation avec{' '}
                  {selectedUser?.firstName} {selectedUser?.lastName}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedUserMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleMissionSelect(mission.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{mission.title}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {mission.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={
                              mission.status === 'published'
                                ? 'default'
                                : mission.status === 'assigned'
                                  ? 'secondary'
                                  : mission.status === 'completed'
                                    ? 'outline'
                                    : 'destructive'
                            }
                            className="text-xs"
                          >
                            {mission.status}
                          </Badge>
                          {mission.budgetMin && mission.budgetMax && (
                            <span className="text-xs text-gray-500">
                              {mission.budgetMin.toLocaleString()} -{' '}
                              {mission.budgetMax.toLocaleString()} FCFA
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowMissionsModal(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};
