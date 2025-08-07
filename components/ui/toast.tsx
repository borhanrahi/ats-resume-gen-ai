'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  persistent?: boolean;
}

interface ToastState {
  toasts: Toast[];
}

type ToastAction = 
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'CLEAR_ALL' };

const ToastContext = createContext<{
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
} | null>(null);

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.id),
      };
    case 'CLEAR_ALL':
      return {
        ...state,
        toasts: [],
      };
    default:
      return state;
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const addToast = (toast: Omit<Toast, 'id'>): string => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
      dismissible: toast.dismissible ?? true,
      persistent: toast.persistent ?? false,
    };

    dispatch({ type: 'ADD_TOAST', toast: newToast });

    // Auto-remove toast after duration (unless persistent)
    if (!newToast.persistent && newToast.duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', id });
      }, newToast.duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    dispatch({ type: 'REMOVE_TOAST', id });
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  return (
    <ToastContext.Provider value={{
      toasts: state.toasts,
      addToast,
      removeToast,
      clearAll,
    }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    if (!toast.dismissible) return;
    
    setIsLeaving(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 200); // Match animation duration
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    switch (toast.type) {
      case 'success':
        return <CheckCircle className={cn(iconClass, "text-green-500")} />;
      case 'error':
        return <AlertCircle className={cn(iconClass, "text-red-500")} />;
      case 'warning':
        return <AlertTriangle className={cn(iconClass, "text-yellow-500")} />;
      case 'info':
        return <Info className={cn(iconClass, "text-blue-500")} />;
    }
  };

  const getStyles = () => {
    const baseStyles = "border shadow-lg rounded-lg";
    switch (toast.type) {
      case 'success':
        return cn(baseStyles, "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800");
      case 'error':
        return cn(baseStyles, "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800");
      case 'warning':
        return cn(baseStyles, "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800");
      case 'info':
        return cn(baseStyles, "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800");
    }
  };

  return (
    <div
      className={cn(
        "p-4 transition-all duration-200 ease-in-out transform",
        getStyles(),
        isVisible && !isLeaving ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        isLeaving && "translate-x-full opacity-0"
      )}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground">
            {toast.title}
          </h4>
          {toast.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {toast.description}
            </p>
          )}
          
          {toast.action && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={toast.action.onClick}
                className="h-8 text-xs"
              >
                {toast.action.label}
              </Button>
            </div>
          )}
        </div>

        {toast.dismissible && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-transparent"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Convenience hooks for different toast types
export function useSuccessToast() {
  const { addToast } = useToast();
  return (title: string, description?: string, options?: Partial<Toast>) =>
    addToast({ type: 'success', title, description, ...options });
}

export function useErrorToast() {
  const { addToast } = useToast();
  return (title: string, description?: string, options?: Partial<Toast>) =>
    addToast({ type: 'error', title, description, ...options });
}

export function useWarningToast() {
  const { addToast } = useToast();
  return (title: string, description?: string, options?: Partial<Toast>) =>
    addToast({ type: 'warning', title, description, ...options });
}

export function useInfoToast() {
  const { addToast } = useToast();
  return (title: string, description?: string, options?: Partial<Toast>) =>
    addToast({ type: 'info', title, description, ...options });
}