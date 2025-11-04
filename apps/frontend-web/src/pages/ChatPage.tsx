import React, { useState } from 'react';
import { Plus, MessageCircle } from 'lucide-react';
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
    <div className="bg-gray-50 flex flex-1 flex-col h-full">
      {/* Main Chat Interface */}
      <div className="flex flex-1 h-full">
        {/* Sidebar - Chat List */}
        <aside
          className={`
          ${showMobileChatList ? 'flex' : 'hidden'}
          md:flex w-full md:w-72 lg:w-80 xl:w-96
          border-r border-gray-200 bg-white flex-col
          h-full overflow-hidden
        `}
        >
          <ChatList
            onSelectConversation={handleSelectConversation}
            onCreateConversation={handleCreateConversation}
          />
        </aside>

        {/* Main Chat Area */}
        <div className="w-full flex flex-1 flex-col bg-white h-full overflow-hidden">
          {currentConversation ? (
            <>
              {/* Chat Window */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <ChatWindow
                  conversation={currentConversation}
                  onBack={handleBackToList}
                  onClose={handleBackToList}
                />
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center bg-gray-50 p-3 sm:p-4 lg:p-6">
              <div className="text-center max-w-xs sm:max-w-sm lg:max-w-md mx-auto p-3 sm:p-4 lg:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-6">
                  <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-tsa-blue" />
                </div>

                <h3 className="text-sm sm:text-base lg:text-lg xl:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                  {t('welcome.title', 'Bienvenue dans TSA Chat')}
                </h3>

                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-4 sm:mb-5 lg:mb-6 leading-relaxed">
                  {t(
                    'welcome.description',
                    'Communiquez en temps réel avec vos collègues et partenaires. Sélectionnez une conversation existante ou créez-en une nouvelle.'
                  )}
                </p>

                <div className="space-y-3 sm:space-y-4">
                  <Button
                    onClick={handleCreateConversation}
                    className="w-full text-xs sm:text-sm lg:text-base h-8 sm:h-9 lg:h-10"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {t('buttons.newConversation', 'Nouvelle conversation')}
                  </Button>

                  <p className="text-xs text-gray-500 leading-relaxed">
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
