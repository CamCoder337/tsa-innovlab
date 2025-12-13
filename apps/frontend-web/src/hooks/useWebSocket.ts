import { useEffect, useCallback, useRef } from 'react';
import { webSocketService, type WebSocketMessage } from '@/services/websocket.service';

interface UseWebSocketOptions {
  /**
   * Callback appelé pour chaque message reçu
   */
  onMessage?: (message: WebSocketMessage) => void;
  
  /**
   * Événements spécifiques à écouter
   */
  events?: string[];
  
  /**
   * Callback appelé quand la connexion est établie
   */
  onConnect?: () => void;
  
  /**
   * Callback appelé quand la connexion est perdue
   */
  onDisconnect?: () => void;
}

/**
 * Hook pour écouter les événements WebSocket
 * 
 * @example
 * // Écouter tous les messages
 * useWebSocket({
 *   onMessage: (msg) => console.log('Message:', msg)
 * });
 * 
 * @example
 * // Écouter des événements spécifiques
 * useWebSocket({
 *   events: ['sos:alert', 'mission:updated'],
 *   onMessage: (msg) => {
 *     if (msg.type === 'sos:alert') {
 *       // Gérer l'alerte SOS
 *     }
 *   }
 * });
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { onMessage, events, onConnect, onDisconnect } = options;
  const unsubscribersRef = useRef<(() => void)[]>([]);

  // Callback stable pour les messages
  const handleMessage = useCallback((data: unknown) => {
    if (onMessage && data) {
      onMessage(data as WebSocketMessage);
    }
  }, [onMessage]);

  useEffect(() => {
    // Nettoyer les anciens abonnements
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    // S'abonner aux événements de connexion
    if (onConnect) {
      const unsub = webSocketService.subscribe('connected', onConnect);
      unsubscribersRef.current.push(unsub);
    }

    if (onDisconnect) {
      const unsub = webSocketService.subscribe('disconnected', onDisconnect);
      unsubscribersRef.current.push(unsub);
    }

    // S'abonner aux événements spécifiques ou à tous les messages
    if (events && events.length > 0) {
      // Écouter des événements spécifiques
      events.forEach(event => {
        const unsub = webSocketService.subscribe(event, (data) => {
          handleMessage({ type: event, data, timestamp: new Date().toISOString() });
        });
        unsubscribersRef.current.push(unsub);
      });
    } else if (onMessage) {
      // Écouter tous les messages via l'événement wildcard
      const unsub = webSocketService.subscribe('*', handleMessage);
      unsubscribersRef.current.push(unsub);
    }

    // Cleanup
    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [events?.join(','), handleMessage, onConnect, onDisconnect]);

  // Méthodes utilitaires
  const isConnected = useCallback(() => {
    return webSocketService.isConnected();
  }, []);

  const getStatus = useCallback(() => {
    return webSocketService.getConnectionStatus();
  }, []);

  return {
    isConnected,
    getStatus,
  };
}

export default useWebSocket;
