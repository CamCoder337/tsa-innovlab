import { io, type Socket } from 'socket.io-client';

type EventCallback<T = unknown> = (data: T) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private eventCallbacks: Map<string, Set<EventCallback>> = new Map();
  private static instance: WebSocketService;
  /**
   * Authentication token for WebSocket connection
   * Used for initial connection and potential re-authentication
   */
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public initialize(accessToken: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.token = accessToken;
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3333', {
      path: '/socket.io',
      auth: { token: this.token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    // Réécoute des événements enregistrés en cas de reconnexion
    this.socket.on('connect', () => {
      this.eventCallbacks.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          this.socket?.on(event, callback);
        });
      });
    });
  }

  public subscribe<T = unknown>(event: string, callback: (data: T) => void): () => void {
    if (!this.socket) {
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
    this.socket.on(event, wrappedCallback);

    // Retourne une fonction pour se désabonner
    return () => {
      this.unsubscribe(event, wrappedCallback);
    };
  }

  public unsubscribe<T = unknown>(event: string, callback: EventCallback<T>): void {
    this.socket?.off(event, callback as EventCallback<unknown>);
    this.eventCallbacks.get(event)?.delete(callback as EventCallback<unknown>);
    if (this.eventCallbacks.get(event)?.size === 0) {
      this.eventCallbacks.delete(event);
    }
  }

  public emit<T = unknown>(event: string, data?: T): void {
    if (!this.socket) {
      console.error('WebSocket not initialized. Call initialize() first.');
      return;
    }
    this.socket.emit(event, data);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.eventCallbacks.clear();
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const webSocketService = WebSocketService.getInstance();
