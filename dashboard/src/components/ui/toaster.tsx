'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToasterProps {
  className?: string;
}

const toasts: Toast[] = [];
const listeners: Array<(toasts: Toast[]) => void> = [];

function emitChange() {
  listeners.forEach((listener) => listener([...toasts]));
}

function addToast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast = { ...toast, id };
  toasts.push(newToast);
  emitChange();

  if (toast.duration !== 0) {
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);
  }

  return id;
}

function removeToast(id: string) {
  const index = toasts.findIndex((toast) => toast.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    emitChange();
  }
}

export function useToast() {
  const [toastList, setToastList] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setToastList);
    return () => {
      const index = listeners.indexOf(setToastList);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    toasts: toastList,
    toast: addToast,
    dismiss: removeToast,
  };
}

export function Toaster({ className }: ToasterProps) {
  const { toasts, dismiss } = useToast();

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
    }
  };

  return (
    <div
      className={cn(
        'fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:right-0 sm:bottom-0 sm:flex-col md:max-w-[420px]',
        className
      )}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all',
            getStyles(toast.type),
            'animate-slide-up'
          )}
        >
          <div className="flex items-start space-x-3">
            {getIcon(toast.type)}
            <div className="flex-1">
              {toast.title && (
                <div className="text-sm font-semibold text-foreground">
                  {toast.title}
                </div>
              )}
              {toast.description && (
                <div className="text-sm text-muted-foreground">
                  {toast.description}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export const toast = {
  success: (title: string, description?: string) =>
    addToast({ type: 'success', title, description }),
  error: (title: string, description?: string) =>
    addToast({ type: 'error', title, description }),
  warning: (title: string, description?: string) =>
    addToast({ type: 'warning', title, description }),
  info: (title: string, description?: string) =>
    addToast({ type: 'info', title, description }),
};
