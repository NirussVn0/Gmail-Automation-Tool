import { NotificationService } from '@/types/core';

export interface NotificationOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

export class ToastNotificationService implements NotificationService {
  private toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    description?: string;
    duration: number;
    persistent: boolean;
    action?: NotificationOptions['action'];
  }> = [];

  private listeners: Array<(toasts: typeof this.toasts) => void> = [];

  success(message: string, description?: string, options?: NotificationOptions): void {
    this.addToast('success', message, description, options);
  }

  error(message: string, description?: string, options?: NotificationOptions): void {
    this.addToast('error', message, description, options);
  }

  warning(message: string, description?: string, options?: NotificationOptions): void {
    this.addToast('warning', message, description, options);
  }

  info(message: string, description?: string, options?: NotificationOptions): void {
    this.addToast('info', message, description, options);
  }

  private addToast(
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    description?: string,
    options?: NotificationOptions
  ): void {
    const id = this.generateId();
    const toast = {
      id,
      type,
      title,
      description,
      duration: options?.duration || (type === 'error' ? 0 : 5000),
      persistent: options?.persistent || false,
      action: options?.action,
    };

    this.toasts.push(toast);
    this.notifyListeners();

    if (toast.duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, toast.duration);
    }
  }

  removeToast(id: string): void {
    const index = this.toasts.findIndex(toast => toast.id === id);
    if (index > -1) {
      this.toasts.splice(index, 1);
      this.notifyListeners();
    }
  }

  clearAll(): void {
    this.toasts = [];
    this.notifyListeners();
  }

  subscribe(listener: (toasts: typeof this.toasts) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export class BrowserNotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  async showNotification(
    title: string,
    options?: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      requireInteraction?: boolean;
      silent?: boolean;
      actions?: Array<{ action: string; title: string; icon?: string }>;
    }
  ): Promise<boolean> {
    if (!await this.requestPermission()) {
      return false;
    }

    try {
      const notification = new Notification(title, {
        body: options?.body,
        icon: options?.icon || '/favicon.ico',
        badge: options?.badge,
        tag: options?.tag,
        requireInteraction: options?.requireInteraction || false,
        silent: options?.silent || false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermission(): NotificationPermission {
    return this.permission;
  }
}

export class NotificationManager {
  private static instance: NotificationManager;
  private toastService: ToastNotificationService;
  private browserService: BrowserNotificationService;

  private constructor() {
    this.toastService = new ToastNotificationService();
    this.browserService = new BrowserNotificationService();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  success(message: string, description?: string, options?: NotificationOptions): void {
    this.toastService.success(message, description, options);
    
    if (options?.persistent) {
      this.browserService.showNotification(message, {
        body: description,
        tag: 'success',
      });
    }
  }

  error(message: string, description?: string, options?: NotificationOptions): void {
    this.toastService.error(message, description, options);
    
    this.browserService.showNotification(`Error: ${message}`, {
      body: description,
      tag: 'error',
      requireInteraction: true,
    });
  }

  warning(message: string, description?: string, options?: NotificationOptions): void {
    this.toastService.warning(message, description, options);
    
    if (options?.persistent) {
      this.browserService.showNotification(`Warning: ${message}`, {
        body: description,
        tag: 'warning',
      });
    }
  }

  info(message: string, description?: string, options?: NotificationOptions): void {
    this.toastService.info(message, description, options);
  }

  subscribeToToasts(listener: (toasts: any[]) => void): () => void {
    return this.toastService.subscribe(listener);
  }

  removeToast(id: string): void {
    this.toastService.removeToast(id);
  }

  clearAllToasts(): void {
    this.toastService.clearAll();
  }

  async requestBrowserPermission(): Promise<boolean> {
    return this.browserService.requestPermission();
  }

  isBrowserNotificationSupported(): boolean {
    return this.browserService.isSupported();
  }

  getBrowserPermission(): NotificationPermission {
    return this.browserService.getPermission();
  }
}

export const notificationManager = NotificationManager.getInstance();
