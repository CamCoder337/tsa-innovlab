/**
 * 🚀 Exemple d'intégration du Chatbot TSA avec Streaming
 * 
 * Ce composant React montre comment utiliser le streaming SSE
 * pour une expérience utilisateur fluide (comme ChatGPT)
 */

import React, { useState, useEffect, useRef } from 'react';

// ============================================
// 1. Hook personnalisé pour le streaming
// ============================================

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  isStreaming?: boolean;
}

interface UseChatbotStreamOptions {
  apiUrl: string;
  userId: string;
  userRole: string;
  userToken?: string;
}

function useChatbotStream({ apiUrl, userId, userRole, userToken }: UseChatbotStreamOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const sendMessage = async (message: string) => {
    // Ajouter le message utilisateur
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Préparer le message bot (vide au départ)
    const botMessage: ChatMessage = {
      role: 'bot',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, botMessage]);
    setIsStreaming(true);

    try {
      // Créer la connexion SSE
      const params = new URLSearchParams({
        message,
        user_id: userId,
        user_role: userRole,
        ...(userToken && { user_token: userToken }),
      });

      const eventSource = new EventSource(`${apiUrl}/api/ai/chatbot/query/stream?${params}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'start':
            console.log('🚀 Streaming started');
            break;

          case 'chunk':
            // Ajouter le chunk au message bot
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === 'bot') {
                lastMessage.content += data.content;
              }
              return newMessages;
            });
            break;

          case 'done':
            // Streaming terminé
            console.log('✅ Streaming done', data);
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === 'bot') {
                lastMessage.isStreaming = false;
                lastMessage.suggestions = data.suggestions;
              }
              return newMessages;
            });
            setIsStreaming(false);
            eventSource.close();
            break;

          case 'error':
            console.error('❌ Streaming error', data);
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === 'bot') {
                lastMessage.content = data.message;
                lastMessage.isStreaming = false;
              }
              return newMessages;
            });
            setIsStreaming(false);
            eventSource.close();
            break;
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE error', error);
        setIsStreaming(false);
        eventSource.close();
      };
    } catch (error) {
      console.error('❌ Failed to start streaming', error);
      setIsStreaming(false);
    }
  };

  const stopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopStreaming();
    };
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
  };
}

// ============================================
// 2. Composant Chatbot avec UI
// ============================================

interface ChatbotProps {
  apiUrl: string;
  userId: string;
  userRole: string;
  userToken?: string;
}

export function ChatbotStreaming({ apiUrl, userId, userRole, userToken }: ChatbotProps) {
  const { messages, isStreaming, sendMessage, stopStreaming } = useChatbotStream({
    apiUrl,
    userId,
    userRole,
    userToken,
  });

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isStreaming) {
      sendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isStreaming) {
      sendMessage(suggestion);
    }
  };

  return (
    <div className="chatbot-container">
      {/* Header */}
      <div className="chatbot-header">
        <h3>🤖 Assistant TSA Logistique</h3>
        <span className={`status ${isStreaming ? 'streaming' : 'ready'}`}>
          {isStreaming ? '⏳ En cours...' : '✅ Prêt'}
        </span>
      </div>

      {/* Messages */}
      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <div className="message-text">
                {msg.content}
                {msg.isStreaming && <span className="cursor">▊</span>}
              </div>
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="message-suggestions">
                  {msg.suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="suggestion-button"
                      disabled={isStreaming}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="chatbot-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Posez votre question..."
          disabled={isStreaming}
          className="input-field"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isStreaming}
          className="send-button"
        >
          {isStreaming ? '⏸️' : '📤'}
        </button>
      </form>

      {/* Styles inline pour l'exemple */}
      <style jsx>{`
        .chatbot-container {
          display: flex;
          flex-direction: column;
          height: 600px;
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          overflow: hidden;
          background: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .chatbot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .chatbot-header h3 {
          margin: 0;
          font-size: 18px;
        }

        .status {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.2);
        }

        .status.streaming {
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #f5f5f5;
        }

        .message {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          font-size: 32px;
          flex-shrink: 0;
        }

        .message-content {
          max-width: 70%;
        }

        .message-text {
          padding: 12px 16px;
          border-radius: 12px;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          line-height: 1.5;
        }

        .message.user .message-text {
          background: #667eea;
          color: white;
        }

        .cursor {
          display: inline-block;
          animation: blink 1s infinite;
          margin-left: 2px;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .message-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .suggestion-button {
          padding: 8px 12px;
          border: 1px solid #667eea;
          border-radius: 16px;
          background: white;
          color: #667eea;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .suggestion-button:hover:not(:disabled) {
          background: #667eea;
          color: white;
        }

        .suggestion-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chatbot-input {
          display: flex;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid #e0e0e0;
          background: white;
        }

        .input-field {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 24px;
          font-size: 14px;
          outline: none;
        }

        .input-field:focus {
          border-color: #667eea;
        }

        .send-button {
          padding: 12px 24px;
          border: none;
          border-radius: 24px;
          background: #667eea;
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-button:hover:not(:disabled) {
          background: #764ba2;
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

// ============================================
// 3. Exemple d'utilisation
// ============================================

export default function ChatbotPage() {
  // Récupérer les infos utilisateur depuis votre contexte/store
  const userId = 'user-123'; // À remplacer par l'ID réel
  const userRole = 'AFFRETEUR'; // CLIENT, TRANSPORTEUR, AFFRETEUR
  const userToken = 'Bearer your-jwt-token'; // Token JWT

  return (
    <div style={{ padding: '20px' }}>
      <h1>Chatbot TSA avec Streaming</h1>
      <ChatbotStreaming
        apiUrl="http://localhost:8000"
        userId={userId}
        userRole={userRole}
        userToken={userToken}
      />
    </div>
  );
}
