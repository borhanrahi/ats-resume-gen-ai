/**
 * Loading Manager - Centralized loading state management
 * Provides global loading states, progress tracking, and user feedback
 */

import React from 'react';

export interface LoadingState {
  id: string;
  type: LoadingType;
  message: string;
  progress?: number;
  startTime: number;
  context?: Record<string, unknown>;
}

export type LoadingType = 
  | 'document_upload'
  | 'document_parse'
  | 'ai_analysis'
  | 'export_pdf'
  | 'export_docx'
  | 'auth_login'
  | 'auth_signup'
  | 'data_save'
  | 'template_load'
  | 'general';

export interface LoadingConfig {
  showGlobalIndicator?: boolean;
  showProgress?: boolean;
  estimatedDuration?: number;
  allowCancel?: boolean;
  onCancel?: () => void;
}

class LoadingManager {
  private loadingStates = new Map<string, LoadingState>();
  private listeners = new Set<(states: LoadingState[]) => void>();
  private globalConfig: LoadingConfig = {
    showGlobalIndicator: true,
    showProgress: false,
  };

  /**
   * Start a loading operation
   */
  startLoading(
    type: LoadingType,
    message: string,
    config?: LoadingConfig
  ): string {
    const id = `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const loadingState: LoadingState = {
      id,
      type,
      message,
      startTime: Date.now(),
      progress: config?.showProgress ? 0 : undefined,
      context: { config },
    };

    this.loadingStates.set(id, loadingState);
    this.notifyListeners();

    // Auto-complete after estimated duration (fallback)
    if (config?.estimatedDuration) {
      setTimeout(() => {
        if (this.loadingStates.has(id)) {
          console.warn(`Loading operation ${id} auto-completed after timeout`);
          this.stopLoading(id);
        }
      }, config.estimatedDuration + 5000); // Add 5s buffer
    }

    return id;
  }

  /**
   * Update loading progress
   */
  updateProgress(id: string, progress: number, message?: string): void {
    const state = this.loadingStates.get(id);
    if (!state) return;

    this.loadingStates.set(id, {
      ...state,
      progress: Math.max(0, Math.min(100, progress)),
      message: message || state.message,
    });

    this.notifyListeners();
  }

  /**
   * Update loading message
   */
  updateMessage(id: string, message: string): void {
    const state = this.loadingStates.get(id);
    if (!state) return;

    this.loadingStates.set(id, {
      ...state,
      message,
    });

    this.notifyListeners();
  }

  /**
   * Stop a loading operation
   */
  stopLoading(id: string): void {
    this.loadingStates.delete(id);
    this.notifyListeners();
  }

  /**
   * Stop all loading operations
   */
  stopAllLoading(): void {
    this.loadingStates.clear();
    this.notifyListeners();
  }

  /**
   * Get current loading states
   */
  getLoadingStates(): LoadingState[] {
    return Array.from(this.loadingStates.values());
  }

  /**
   * Check if any loading operation is active
   */
  isLoading(): boolean {
    return this.loadingStates.size > 0;
  }

  /**
   * Check if specific type is loading
   */
  isLoadingType(type: LoadingType): boolean {
    return Array.from(this.loadingStates.values()).some(state => state.type === type);
  }

  /**
   * Get loading state by ID
   */
  getLoadingState(id: string): LoadingState | undefined {
    return this.loadingStates.get(id);
  }

  /**
   * Subscribe to loading state changes
   */
  subscribe(listener: (states: LoadingState[]) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Set global loading configuration
   */
  setGlobalConfig(config: Partial<LoadingConfig>): void {
    this.globalConfig = { ...this.globalConfig, ...config };
  }

  /**
   * Get global loading configuration
   */
  getGlobalConfig(): LoadingConfig {
    return { ...this.globalConfig };
  }

  /**
   * Get user-friendly message for loading type
   */
  getDefaultMessage(type: LoadingType): string {
    const messages: Record<LoadingType, string> = {
      document_upload: 'Uploading your document...',
      document_parse: 'Processing your document...',
      ai_analysis: 'Analyzing with AI...',
      export_pdf: 'Generating PDF...',
      export_docx: 'Generating DOCX...',
      auth_login: 'Signing you in...',
      auth_signup: 'Creating your account...',
      data_save: 'Saving your data...',
      template_load: 'Loading templates...',
      general: 'Loading...',
    };

    return messages[type] || messages.general;
  }

  /**
   * Get estimated duration for loading type
   */
  getEstimatedDuration(type: LoadingType): number {
    const durations: Record<LoadingType, number> = {
      document_upload: 3000,
      document_parse: 5000,
      ai_analysis: 15000,
      export_pdf: 8000,
      export_docx: 6000,
      auth_login: 2000,
      auth_signup: 3000,
      data_save: 1000,
      template_load: 2000,
      general: 5000,
    };

    return durations[type] || durations.general;
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    const states = this.getLoadingStates();
    this.listeners.forEach(listener => {
      try {
        listener(states);
      } catch (error) {
        console.error('Error in loading state listener:', error);
      }
    });
  }

  /**
   * Get loading statistics for monitoring
   */
  getStatistics(): {
    activeCount: number;
    longestRunning: LoadingState | null;
    averageDuration: number;
    typeBreakdown: Record<LoadingType, number>;
  } {
    const states = this.getLoadingStates();
    const now = Date.now();

    const longestRunning = states.reduce((longest, state) => {
      const duration = now - state.startTime;
      const longestDuration = longest ? now - longest.startTime : 0;
      return duration > longestDuration ? state : longest;
    }, null as LoadingState | null);

    const typeBreakdown = states.reduce((breakdown, state) => {
      breakdown[state.type] = (breakdown[state.type] || 0) + 1;
      return breakdown;
    }, {} as Record<LoadingType, number>);

    const totalDuration = states.reduce((sum, state) => sum + (now - state.startTime), 0);
    const averageDuration = states.length > 0 ? totalDuration / states.length : 0;

    return {
      activeCount: states.length,
      longestRunning,
      averageDuration,
      typeBreakdown,
    };
  }
}

// Create singleton instance
export const loadingManager = new LoadingManager();

/**
 * React hook for loading state management
 */
export function useLoadingManager() {
  const [loadingStates, setLoadingStates] = React.useState<LoadingState[]>([]);

  React.useEffect(() => {
    const unsubscribe = loadingManager.subscribe(setLoadingStates);
    
    // Set initial state
    setLoadingStates(loadingManager.getLoadingStates());
    
    return unsubscribe;
  }, []);

  const startLoading = React.useCallback((
    type: LoadingType,
    message?: string,
    config?: LoadingConfig
  ) => {
    const finalMessage = message || loadingManager.getDefaultMessage(type);
    const finalConfig = {
      estimatedDuration: loadingManager.getEstimatedDuration(type),
      ...config,
    };
    
    return loadingManager.startLoading(type, finalMessage, finalConfig);
  }, []);

  const updateProgress = React.useCallback((id: string, progress: number, message?: string) => {
    loadingManager.updateProgress(id, progress, message);
  }, []);

  const updateMessage = React.useCallback((id: string, message: string) => {
    loadingManager.updateMessage(id, message);
  }, []);

  const stopLoading = React.useCallback((id: string) => {
    loadingManager.stopLoading(id);
  }, []);

  const isLoading = React.useMemo(() => loadingStates.length > 0, [loadingStates]);

  const isLoadingType = React.useCallback((type: LoadingType) => {
    return loadingStates.some(state => state.type === type);
  }, [loadingStates]);

  return {
    loadingStates,
    isLoading,
    isLoadingType,
    startLoading,
    updateProgress,
    updateMessage,
    stopLoading,
    stopAllLoading: loadingManager.stopAllLoading.bind(loadingManager),
  };
}

/**
 * Higher-order component for automatic loading management
 */
export function withLoadingManager<T extends object>(
  Component: React.ComponentType<T>,
  loadingType: LoadingType,
  message?: string
) {
  return React.forwardRef<any, T>((props, ref) => {
    const { startLoading, stopLoading } = useLoadingManager();
    const [loadingId, setLoadingId] = React.useState<string | null>(null);

    React.useEffect(() => {
      const id = startLoading(loadingType, message);
      setLoadingId(id);

      return () => {
        if (id) {
          stopLoading(id);
        }
      };
    }, [startLoading, stopLoading]);

    return React.createElement(Component, { ...props, ref } as T & { ref: unknown });
  });
}

/**
 * Hook for wrapping async operations with loading management
 */
export function useAsyncWithLoading<T>() {
  const { startLoading, stopLoading, updateProgress } = useLoadingManager();

  const executeWithLoading = React.useCallback(async (
    operation: (updateProgress?: (progress: number, message?: string) => void) => Promise<T>,
    type: LoadingType,
    message?: string,
    config?: LoadingConfig
  ): Promise<T> => {
    const loadingId = startLoading(type, message, config);

    try {
      const result = await operation((progress, msg) => {
        updateProgress(loadingId, progress, msg);
      });
      
      return result;
    } finally {
      stopLoading(loadingId);
    }
  }, [startLoading, stopLoading, updateProgress]);

  return { executeWithLoading };
}

export default loadingManager;