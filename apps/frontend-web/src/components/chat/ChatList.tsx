import React, { useState, useEffect } from 'react';
import type { ChatRoom, Message } from '@/types/chat.types';
import { webSocketService } from '@/services/websocket.service';
import { useAuth } from '@/hooks/useAuth';

interface ChatListProps {
  onSelectRoom: (room: ChatRoom) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onSelectRoom }) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadChatRooms = async () => {
      try {
        setLoading(true);
        // TODO: Implement API call to fetch user's chat rooms
        // const response = await fetch('/api/chat/rooms');
        // const data = await response.json();
        // setRooms(data);

        // Mock data for now
        setRooms([
          {
            id: '1',
            missionId: 'M123',
            participants: [
              {
                avatar: 'https://via.placeholder.com/150',
                id: '1',
                name: 'John Doe',
                role: 'affreteur',
              },
              {
                avatar: 'https://via.placeholder.com/150',
                id: '2',
                name: 'Jane Smith',
                role: 'transporteur',
              },
            ],
            unreadCount: 2,
            createdAt: new Date(),
          },
        ]);
      } catch (err) {
        setError('Failed to load chat rooms');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadChatRooms();

    // Subscribe to new messages to update unread counts
    const handleNewMessage = (message: Message) => {
      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.missionId === message.missionId
            ? {
                ...room,
                lastMessage: message,
                unreadCount:
                  message.senderId !== user?.id ? room.unreadCount + 1 : room.unreadCount,
              }
            : room
        )
      );
    };

    webSocketService.subscribe<Message>('newMessage', handleNewMessage);

    return () => {
      webSocketService.unsubscribe<Message>('newMessage', handleNewMessage);
    };
  }, [user]);

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Chargement des conversations...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (rooms.length === 0) {
    return <div className="p-4 text-center text-gray-500">Aucune conversation pour le moment</div>;
  }

  return (
    <div className="divide-y divide-gray-200">
      {rooms.map((room) => {
        const otherParticipant = room.participants.find((p) => p.id !== user?.id);

        return (
          <div
            key={room.id}
            className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
            onClick={() => onSelectRoom(room)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center w-full">
                <img
                  className="w-12 h-12 rounded-full mr-4"
                  src={otherParticipant?.avatar || 'https://via.placeholder.com/150'}
                  alt={otherParticipant?.name || 'Utilisateur inconnu'}
                />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {otherParticipant?.name || 'Utilisateur inconnu'}
                  </h4>
                  <p className="text-sm text-gray-500 truncate">
                    {room.lastMessage?.content || 'Aucun message'}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-400">
                    {room.lastMessage
                      ? new Date(room.lastMessage.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                  {room.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform -translate-y-1/2 bg-red-500 rounded-full">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
