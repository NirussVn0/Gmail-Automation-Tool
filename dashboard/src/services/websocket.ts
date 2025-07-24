import { WebSocketService, Logger } from '@/types/core';
import { container } from '@/lib/container';

export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: number;
  id: string;
}

export interface WebSocketEventHandler<T = any> {
  (data: T): void;
}

export class SocketIOService implements WebSocketService {
  private socket: any = null;
  private logger: Logger;
  private eventHandlers = new Map<string, Set<WebSocketEventHandler>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor() {
    this.logger = container.resolve<Logger>('Logger');
  }

  connect(url: string): void {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    this.isConnecting = true;
    this.logger.info('Connecting to WebSocket', { url });

    try {
      if (typeof window !== 'undefined') {
        import('socket.io-client').then(({ io }) => {
          this.socket = io(url, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.reconnectDelay,
          });

          this.setupEventListeners();
          this.isConnecting = false;
        }).catch(error => {
          this.logger.error('Failed to import socket.io-client', error);
          this.isConnecting = false;
        });
      }
    } catch (error) {
      this.logger.error('Failed to connect to WebSocket', error as Error);
      this.isConnecting = false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.logger.info('Disconnecting from WebSocket');
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventHandlers.clear();
    this.reconnectAttempts = 0;
  }

  subscribe<T>(event: string, handler: WebSocketEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    this.eventHandlers.get(event)!.add(handler as WebSocketEventHandler);
    
    if (this.socket) {
      this.socket.on(event, handler);
    }

    this.logger.debug('Subscribed to WebSocket event', { event });
  }

  unsubscribe(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
    
    this.eventHandlers.delete(event);
    this.logger.debug('Unsubscribed from WebSocket event', { event });
  }

  emit<T>(event: string, data: T): void {
    if (this.socket && this.socket.connected) {
      const message: WebSocketMessage<T> = {
        type: event,
        data,
        timestamp: Date.now(),
        id: this.generateMessageId(),
      };

      this.socket.emit(event, message);
      this.logger.debug('Emitted WebSocket message', { event, messageId: message.id });
    } else {
      this.logger.warn('Cannot emit message: WebSocket not connected', { event });
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.logger.info('WebSocket connected');
      this.reconnectAttempts = 0;
      
      this.eventHandlers.forEach((handlers, event) => {
        handlers.forEach(handler => {
          this.socket.on(event, handler);
        });
      });
    });

    this.socket.on('disconnect', (reason: string) => {
      this.logger.warn('WebSocket disconnected', { reason });
    });

    this.socket.on('connect_error', (error: Error) => {
      this.logger.error('WebSocket connection error', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.logger.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      this.logger.info('WebSocket reconnected', { attemptNumber });
    });

    this.socket.on('reconnect_error', (error: Error) => {
      this.logger.error('WebSocket reconnection error', error);
    });
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isConnected(): boolean {
    return this.socket && this.socket.connected;
  }

  getConnectionState(): 'connected' | 'connecting' | 'disconnected' {
    if (this.isConnecting) return 'connecting';
    if (this.socket && this.socket.connected) return 'connected';
    return 'disconnected';
  }
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private service: SocketIOService;
  private baseUrl: string;

  private constructor() {
    this.service = new SocketIOService();
    this.baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  connect(): void {
    this.service.connect(this.baseUrl);
  }

  disconnect(): void {
    this.service.disconnect();
  }

  subscribeToAccountUpdates(handler: (account: any) => void): void {
    this.service.subscribe('account_updated', handler);
  }

  subscribeToJobProgress(handler: (progress: any) => void): void {
    this.service.subscribe('job_progress', handler);
  }

  subscribeToSystemNotifications(handler: (notification: any) => void): void {
    this.service.subscribe('system_notification', handler);
  }

  subscribeToProxyStatus(handler: (status: any) => void): void {
    this.service.subscribe('proxy_status', handler);
  }

  unsubscribeFromAll(): void {
    this.service.unsubscribe('account_updated');
    this.service.unsubscribe('job_progress');
    this.service.unsubscribe('system_notification');
    this.service.unsubscribe('proxy_status');
  }

  isConnected(): boolean {
    return this.service.isConnected();
  }

  getConnectionState(): 'connected' | 'connecting' | 'disconnected' {
    return this.service.getConnectionState();
  }
}

export const websocketManager = WebSocketManager.getInstance();
