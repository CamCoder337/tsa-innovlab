import { getWebSocketUrl } from '@/config/env';

/**
 * WebSocket Event Types matching backend WebSocketEventType
 */
export enum WebSocketEventType {
  // General events
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  
  // Location events
  LOCATION_UPDATE = 'location:update',
  
  // Mission events
  MISSION_UPDATED = 'mission:updated',
  MISSION_STATUS_CHANGED = 'mission:status:changed',
}

/**
 * WebSocket Message interface
 */
export interface WebSocketMessage<T = unknown> {
  type: string | WebSocketEventType;
  data: T;
  timestamp: string;
  userId?: string;
}

type EventCallback<T = unknown> = (data: T) => void;

interface WebSocketData {
  data?: unknown;
  missionId?: string;
  deviceId?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

/**
 * Enhanced WebSocket Service
 * Gère la connexion WebSocket et les messages en temps réel
 */
class WebSocketService {
  private ws: WebSocket | null = null;
  private eventCallbacks = new Map<string, Set<EventCallback>>();
  private static instance: WebSocketService;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private isAuthenticated = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Initialise la connexion WebSocket avec un token d'authentification
   */
  public initialize(token: string): void {
    this.token = token;
    this.connect();
  }

  /**
   * Établit la connexion WebSocket
   */
  private connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = `${getWebSocketUrl()}?token=${encodeURIComponent(this.token || '')}`;
      this.ws = new WebSocket(wsUrl);
      this.setupEventListeners();
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Configure les écouteurs d'événements WebSocket
   */
  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('✅ WebSocket connection opened');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.isAuthenticated = true;
      this.startHeartbeat();
      this.emit(WebSocketEventType.CONNECTED, { connected: true });
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        // Ignorer les messages 'pong' qui ne sont pas du JSON
        if (event.data === 'pong') {
          return;
        }
        
        const message = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', message);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log('❌ WebSocket disconnected:', event.code, event.reason);
      this.isConnecting = false;
      this.isAuthenticated = false;
      this.stopHeartbeat();
      this.emit(WebSocketEventType.DISCONNECTED, { code: event.code, reason: event.reason });

      if (event.code !== 1000) {
        // Reconnexion si la déconnexion n'était pas intentionnelle
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error: Event) => {
      console.error('❌ WebSocket error:', error);
      this.isConnecting = false;
      this.isAuthenticated = false;
      this.emit(WebSocketEventType.ERROR, { error: 'WebSocket error' });
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    try {
      const { type, data, userId } = message;
      console.log(`📨 Received WebSocket message:`, { type, userId });

      // Vérifier si le message contient des données et les extraire correctement
      let messageData: unknown;
      
      if (data && typeof data === 'object') {
        // Si data est un objet avec une propriété 'data', l'utiliser
        messageData = (data as WebSocketData).data !== undefined 
          ? (data as WebSocketData).data 
          : data;
      } else {
        // Sinon utiliser directement les données
        messageData = data;
      }
      
      // Émettre l'événement avec les données
      this.emit(type, messageData);
      
      // Émettre également un événement générique pour tous les messages
      this.emit('*', {
        type,
        data: messageData,
        userId: userId || message.userId
      });
    } catch (error) {
      console.error('❌ Error handling WebSocket message:', error);
    }
  }

  /**
   * Démarre le heartbeat pour maintenir la connexion active
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // S'assurer qu'il n'y a pas de doublon
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Envoyer un simple 'ping' au serveur
        this.ws.send('ping');
      }
    }, 30000) as unknown as NodeJS.Timeout;
  }

  /**
   * Arrête le heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Planifie une tentative de reconnexion
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit(WebSocketEventType.ERROR, { 
        message: 'Max reconnection attempts reached',
        code: 'MAX_RECONNECT_ATTEMPTS'
      });
      
      // Réessayer après un délai plus long
      setTimeout(() => {
        this.reconnectAttempts = 0;
        this.connect();
      }, 60000); // Réessayer après 1 minute
      
      return;
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.connect();
      }
    }, delay);
  }

  /**
   * S'abonne à un événement WebSocket
   */
  public subscribe<T = unknown>(event: string, callback: (data: T) => void): () => void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }

    const callbacks = this.eventCallbacks.get(event)!;
    callbacks.add(callback as EventCallback);

    // Retourne une fonction de désabonnement
    return () => {
      this.unsubscribe(event, callback as EventCallback);
    };
  }

  /**
   * Se désabonne d'un événement
   */
  public unsubscribe(event: string, callback: EventCallback): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.eventCallbacks.delete(event);
      }
    }
  }

  /**
   * Émet un événement via la connexion WebSocket
   */
  public emit<T = unknown>(event: string, data?: T): void {
    // Émettre l'événement localement
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }

    // Si l'événement doit être envoyé au serveur
    if (this.shouldSendToServer(event) && this.ws?.readyState === WebSocket.OPEN) {
      try {
        const message: WebSocketMessage = {
          type: event,
          data,
          timestamp: new Date().toISOString(),
        };
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  }

  /**
   * Détermine si un événement doit être envoyé au serveur
   */
  private shouldSendToServer(event: string): boolean {
    // Ne pas envoyer les événements système au serveur
    const systemEvents = [
      WebSocketEventType.CONNECTED,
      WebSocketEventType.DISCONNECTED,
      WebSocketEventType.ERROR
    ];
    return !systemEvents.includes(event as WebSocketEventType);
  }

  /**
   * Déconnecte le WebSocket
   */
  public disconnect(): void {
    if (this.ws) {
      this.stopHeartbeat();
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
      this.isAuthenticated = false;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Vérifie si la connexion est active
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  /**
   * Obtient l'état de la connexion
   */
  public getConnectionStatus() {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      isAuthenticated: this.isAuthenticated,
    };
  }
}

export const webSocketService = WebSocketService.getInstance();
