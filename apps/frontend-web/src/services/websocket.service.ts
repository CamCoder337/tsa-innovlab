import { getWebSocketUrl } from '@/config/env';

/**
 * WebSocket Event Types matching backend WebSocketEventType
 */
export enum WebSocketEventType {
  // General events
  CONNECTED = 'connected',
  BROADCAST = 'broadcast',
  NOTIFICATION = 'notification',

  // Authentication events
  AUTH_REQUEST = 'auth:request',
  AUTH_SUCCESS = 'auth:success',
  AUTH_FAILED = 'auth:failed',

  // Chat events
  CHAT_MESSAGE = 'chat:message',
  CHAT_MESSAGE_READ = 'chat:read',
  CHAT_TYPING_START = 'chat:typing:start',
  CHAT_TYPING_STOP = 'chat:typing:stop',
  CHAT_CONVERSATION_CREATED = 'chat:conversation:created',
  CHAT_CONVERSATION_UPDATED = 'chat:conversation:updated',

  // Mission events
  MISSION_NEW = 'mission:new',
  MISSION_UPDATED = 'mission:updated',
  MISSION_STATUS_CHANGED = 'mission:status:changed',
}

/**
 * WebSocket Message interface matching backend
 */
export interface WebSocketMessage {
  type: string | WebSocketEventType;
  data: unknown;
  timestamp: string;
  userId?: string;
}

type EventCallback<T = unknown> = (data: T) => void;

/**
 * Enhanced WebSocket Service matching backend capabilities
 * Uses native WebSocket instead of Socket.IO to match backend implementation
 */
class WebSocketService {
  private ws: WebSocket | null = null;
  private eventCallbacks: Map<string, Set<EventCallback>> = new Map();
  private static instance: WebSocketService;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isAuthenticated = false;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public initialize(accessToken: string): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.token = accessToken;
    this.connect();
  }

  public connect(): void {
    if (this.isConnecting) return;

    this.isConnecting = true;
    const wsUrl = getWebSocketUrl(this.token || undefined);

    try {
      this.ws = new WebSocket(wsUrl);

      this.setupEventListeners();
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.isAuthenticated = true; // Token was validated during connection
      this.startHeartbeat();

      // Trigger connected event for subscribers
      const callbacks = this.eventCallbacks.get(WebSocketEventType.CONNECTED);
      if (callbacks) {
        callbacks.forEach((callback) => {
          try {
            callback({ authenticated: true });
          } catch (error) {
            console.error('❌ Error in connected callback:', error);
          }
        });
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('❌ WebSocket disconnected:', event.code, event.reason);
      this.isConnecting = false;
      this.isAuthenticated = false;
      this.stopHeartbeat();

      if (event.code !== 1000) {
        // Not a normal closure
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.isConnecting = false;
      this.isAuthenticated = false;
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    const callbacks = this.eventCallbacks.get(message.type);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(message.data);
        } catch (error) {
          console.error('❌ Error in WebSocket callback:', error);
        }
      });
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  public subscribe<T = unknown>(event: string, callback: (data: T) => void): () => void {
    if (!this.ws) {
      console.error('WebSocket not initialized. Call initialize() first.');
      return () => {};
    }

    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }

    // Create a wrapper function to handle the type casting
    const wrappedCallback: EventCallback = (data: unknown) => {
      callback(data as T);
    };

    this.eventCallbacks.get(event)?.add(wrappedCallback);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(event, wrappedCallback);
    };
  }

  public unsubscribe<T = unknown>(event: string, callback: EventCallback<T>): void {
    this.eventCallbacks.get(event)?.delete(callback as EventCallback<unknown>);
    if (this.eventCallbacks.get(event)?.size === 0) {
      this.eventCallbacks.delete(event);
    }
  }

  public emit<T = unknown>(event: string, data?: T): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected. Cannot send message.');
      return;
    }

    if (!this.isAuthenticated) {
      console.error('WebSocket not authenticated. Cannot send message.');
      return;
    }

    const message: WebSocketMessage = {
      type: event,
      data,
      timestamp: new Date().toISOString(),
    };

    this.ws.send(JSON.stringify(message));
  }

  public disconnect(): void {
    this.stopHeartbeat();
    this.isAuthenticated = false;
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.eventCallbacks.clear();
    this.reconnectAttempts = 0;
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  /**
   * Send typing indicator for chat
   */
  public sendTypingIndicator(conversationId: number, isTyping: boolean): void {
    this.emit(
      isTyping ? WebSocketEventType.CHAT_TYPING_START : WebSocketEventType.CHAT_TYPING_STOP,
      {
        conversationId,
        isTyping,
      }
    );
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): {
    connected: boolean;
    connecting: boolean;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export const webSocketService = WebSocketService.getInstance();
