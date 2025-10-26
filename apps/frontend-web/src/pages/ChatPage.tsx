import React, { useState } from 'react';
import { Plus, ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatList from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { CreateConversationModal } from '@/components/chat/CreateConversationModal';
import { useChat } from '@/hooks/useChat';
import type { ConversationListItem } from '@/types/chat.types';

export const ChatPage: React.FC = () => {
  const { currentConversation, setCurrentConversation } = useChat();
  const [showMobileChatList, setShowMobileChatList] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSelectConversation = (conversation: ConversationListItem) => {
    setCurrentConversation(conversation);
    setShowMobileChatList(false);
  };

  const handleBackToList = () => {
    setShowMobileChatList(true);
    setCurrentConversation(null);
  };

  const handleCreateConversation = () => {
    setShowCreateModal(true);
  };

  const handleConversationCreated = (conversation: ConversationListItem) => {
    setShowCreateModal(false);
    handleSelectConversation(conversation);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Main Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Chat List */}
        <div
          className={`${
            showMobileChatList ? 'flex' : 'hidden'
          } md:flex w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white flex-col`}
        >
          <ChatList
            onSelectConversation={handleSelectConversation}
            onCreateConversation={handleCreateConversation}
          />
        </div>

        {/* Main Chat Area */}
        <div
          className={`${!showMobileChatList ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-white`}
        >
          {currentConversation ? (
            <>
              {/* Mobile Back Button */}
              <div className="md:hidden flex items-center p-3 border-b border-gray-200 bg-white">
                <Button variant="ghost" size="sm" onClick={handleBackToList} className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">Retour aux conversations</span>
              </div>

              {/* Chat Window */}
              <div className="flex-1">
                <ChatWindow conversation={currentConversation} onClose={handleBackToList} />
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-tsa-blue" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Bienvenue dans TSA Chat
                </h3>

                <p className="text-gray-600 mb-6">
                  Communiquez en temps réel avec vos collègues et partenaires. Sélectionnez une
                  conversation existante ou créez-en une nouvelle.
                </p>

                <div className="space-y-3">
                  <Button onClick={handleCreateConversation} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle conversation
                  </Button>

                  <p className="text-sm text-gray-500">
                    Ou sélectionnez une conversation dans la liste de gauche
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Conversation Modal */}
      {showCreateModal && (
        <CreateConversationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}
    </div>
  );
};

export default ChatPage;
