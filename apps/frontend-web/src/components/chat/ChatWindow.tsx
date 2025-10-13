import React, { useState, useEffect, useRef } from 'react';
import type { Message, ChatRoom } from '@/types/chat.types';
import { webSocketService } from '@/services/websocket.service';
import { useAuth } from '@/hooks/useAuth';

interface ChatWindowProps {
  room: ChatRoom;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ room, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Load initial messages
    const loadMessages = async () => {
      try {
        // TODO: Implement API call to fetch messages
        // const response = await fetch(`/api/chat/rooms/${room.id}/messages`);
        // const data = await response.json();
        // setMessages(data);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const handleNewMessage = (message: Message) => {
      if (message.missionId === room.missionId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    webSocketService.subscribe('newMessage', handleNewMessage);

    return () => {
      webSocketService.unsubscribe('newMessage', handleNewMessage);
    };
  }, [room]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    // const messageDto: SendMessageDto = {
    //   missionId: room.missionId,
    //   content: newMessage,
    // };

    try {
      // TODO: Implement API call to send message
      // await fetch(`/api/chat/messages`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(messageDto),
      // });

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h3 className="font-semibold">Chat - Mission {room.missionId}</h3>
        <button onClick={onClose} className="text-white hover:text-gray-300">
          ×
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            Aucun message dans cette conversation
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.senderId === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Envoyer
          </button>
        </div>
      </form>
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isCurrentUser }) => {
  return (
    <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isCurrentUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        <div className="font-medium text-sm">{isCurrentUser ? 'Moi' : message.senderName}</div>
        <div className="text-sm">{message.content}</div>
        <div className="text-xs opacity-70 text-right mt-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};
