import React, { useState } from 'react';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import type { ChatRoom } from '@/types/chat.types';

export const ChatPage: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [showMobileChatList, setShowMobileChatList] = useState(true);

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    setShowMobileChatList(false);
  };

  const handleBackToList = () => {
    setShowMobileChatList(true);
  };

  return (
    <div className="h-screen bg-gray-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex h-[calc(100vh-8rem)]">
            {/* Chat List - Hidden on mobile when a chat is selected */}
            <div
              className={`${
                showMobileChatList ? 'flex' : 'hidden'
              } md:flex md:w-1/3 border-r border-gray-200 bg-white flex-col`}
            >
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Messages</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ChatList onSelectRoom={handleSelectRoom} />
              </div>
            </div>

            {/* Chat Window */}
            <div
              className={`${
                !showMobileChatList ? 'flex' : 'hidden'
              } md:flex md:flex-1 flex-col bg-gray-50`}
            >
              {selectedRoom ? (
                <>
                  <div className="md:hidden p-4 border-b border-gray-200 bg-white">
                    <button
                      onClick={handleBackToList}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ← Retour
                    </button>
                  </div>
                  <ChatWindow room={selectedRoom} onClose={() => setShowMobileChatList(true)} />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium">Aucune conversation sélectionnée</h3>
                    <p className="mt-1 text-sm">
                      Sélectionnez une conversation ou commencez-en une nouvelle.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
