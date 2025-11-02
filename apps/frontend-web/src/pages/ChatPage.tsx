import React, { useState } from 'react';
import { Plus, ArrowLeft, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import ChatList from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { CreateConversationModal } from '@/components/chat/CreateConversationModal';
import { useChat } from '@/hooks/useChat';
import type { ConversationListItem } from '@/types/chat.types';

export const ChatPage: React.FC = () => {
  const { t } = useTranslation('chat');
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
    <div className="bg-gray-50 dark:bg-gray-950 flex flex-1 flex-col">
      {/* Main Chat Interface */}
      <div className="flex flex-1">
        {/* Sidebar - Chat List */}
        <aside
          className={`
          ${showMobileChatList ? 'flex' : 'hidden'}
          md:flex w-full md:w-80 lg:w-96
          border-r border-gray-200 bg-white flex-col
        `}
        >
          <ChatList
            onSelectConversation={handleSelectConversation}
            onCreateConversation={handleCreateConversation}
          />
        </aside>

        {/* Main Chat Area */}
        <div className="w-full flex flex-1 flex-col bg-white dark:bg-gray-900">
          {currentConversation ? (
            <>
              {/* Mobile Back Button */}
              <div className="md:hidden flex items-center p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <Button variant="ghost" size="sm" onClick={handleBackToList} className="mr-2 p-1">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium text-sm">
                  {t('buttons.backToConversations', 'Retour aux conversations')}
                </span>
              </div>

              {/* Chat Window */}
              <ChatWindow conversation={currentConversation} onClose={handleBackToList} />
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
              <div className="text-center max-w-md mx-auto p-4 sm:p-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-tsa-blue" />
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('welcome.title', 'Bienvenue dans TSA Chat')}
                </h3>

                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
                  {t(
                    'welcome.description',
                    'Communiquez en temps réel avec vos collègues et partenaires. Sélectionnez une conversation existante ou créez-en une nouvelle.'
                  )}
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={handleCreateConversation}
                    className="w-full text-sm sm:text-base"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('buttons.newConversation', 'Nouvelle conversation')}
                  </Button>

                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {t(
                      'welcome.selectHint',
                      'Ou sélectionnez une conversation dans la liste de gauche'
                    )}
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
