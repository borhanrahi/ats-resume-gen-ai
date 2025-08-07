/**
 * Offline Manager - Handles offline detection and graceful degradation
 * Provides offline state management, queue management, and user feedback
 */

import React from 'react';

export interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineTime: number;
  offlineDuration: number;
}

export interface QueuedAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineCapabilities {
  canAnalyzeOffline: boolean;
  canExportOffline: boolean;
  canSaveOffline: boolean;
  hasOfflineData: boolean;
}

class OfflineManager {
  private state: OfflineState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    lastOnlineTime: Date.now(),
    offlineDuration: 0,
  };

  private actionQueue: QueuedAction[] = [];
  private listeners: Set<(state: OfflineState) => void> = new Set();
  private capabilities: OfflineCapabilities = {
    canAnalyzeOffline: false,
    canExportOffline: true,
    canSaveOffline: true,
    hasOfflineData: false,
  };

  private readonly STORAGE_KEY = 'offline-manager';
  private readonly QUEUE_KEY = 'offline-queue';
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly RETRY_DELAYS = [1000, 5000, 15000, 30000]; // Progressive delays

  constructor() {
    this.initializeOfflineDetection();
    this.loadPersistedState();
    this.updateCapabilities();
  }

  /**
   * Initialize offline detection and event listeners
   */
  private initializeOfflineDetection() {
    if (typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Periodic connectivity check
    setInterval(this.checkConnectivity, 30000); // Check every 30 seconds

    // Check initial state
    this.checkConnectivity();
  }

  /**
   * Handle online event
   */
  private handleOnline = () => {
    const wasOffline = !this.state.isOnline;
    const now = Date.now();
    
    this.state = {
      ...this.state,
      isOnline: true,
      wasOffline,
      offlineDuration: wasOffline ? now - this.state.lastOnlineTime : 0,
      lastOnlineTime: now,
    };

    this.notifyListeners();
    this.persistState();
    
    if (wasOffline) {
      this.processQueuedActions();
      this.showReconnectedNotification();
    }
  };

  /**
   * Handle offline event
   */
  private handleOffline = () => {
    this.state = {
      ...this.state,
      isOnline: false,
      wasOffline: true,
    };

    this.notifyListeners();
    this.persistState();
    this.showOfflineNotification();
  };

  /**
   * Check connectivity with actual network request
   */
  private checkConnectivity = async () => {
    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch('/api/ping', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      const isOnline = response.ok;
      
      if (isOnline !== this.state.isOnline) {
        if (isOnline) {
          this.handleOnline();
        } else {
          this.handleOffline();
        }
      }
    } catch (error) {
      // Network request failed, we're likely offline
      if (this.state.isOnline) {
        this.handleOffline();
      }
    }
  };

  /**
   * Get current offline state
   */
  getState(): OfflineState {
    return { ...this.state };
  }

  /**
   * Get offline capabilities
   */
  getCapabilities(): OfflineCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Subscribe to offline state changes
   */
  subscribe(listener: (state: OfflineState) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Queue an action for when online
   */
  queueAction(
    type: string,
    data: any,
    maxRetries: number = 3
  ): string {
    const action: QueuedAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
    };

    // Prevent queue from growing too large
    if (this.actionQueue.length >= this.MAX_QUEUE_SIZE) {
      this.actionQueue.shift(); // Remove oldest action
    }

    this.actionQueue.push(action);
    this.persistQueue();

    return action.id;
  }

  /**
   * Process queued actions when back online
   */
  private async processQueuedActions() {
    if (!this.state.isOnline || this.actionQueue.length === 0) {
      return;
    }

    const actionsToProcess = [...this.actionQueue];
    this.actionQueue = [];

    for (const action of actionsToProcess) {
      try {
        await this.executeQueuedAction(action);
      } catch (error) {
        console.error('Failed to execute queued action:', error);
        
        // Retry if within limits
        if (action.retryCount < action.maxRetries) {
          action.retryCount++;
          
          // Add back to queue with delay
          setTimeout(() => {
            this.actionQueue.push(action);
            this.persistQueue();
          }, this.RETRY_DELAYS[Math.min(action.retryCount - 1, this.RETRY_DELAYS.length - 1)]);
        }
      }
    }

    this.persistQueue();
  }

  /**
   * Execute a queued action
   */
  private async executeQueuedAction(action: QueuedAction): Promise<void> {
    switch (action.type) {
      case 'ANALYSIS_REQUEST':
        await this.executeAnalysisRequest(action.data);
        break;
      case 'EXPORT_REQUEST':
        await this.executeExportRequest(action.data);
        break;
      case 'SAVE_DATA':
        await this.executeSaveData(action.data);
        break;
      default:
        console.warn('Unknown queued action type:', action.type);
    }
  }

  /**
   * Execute analysis request
   */
  private async executeAnalysisRequest(data: any): Promise<void> {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Analysis request failed: ${response.statusText}`);
    }
  }

  /**
   * Execute export request
   */
  private async executeExportRequest(data: any): Promise<void> {
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Export request failed: ${response.statusText}`);
    }
  }

  /**
   * Execute save data request
   */
  private async executeSaveData(data: any): Promise<void> {
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Save data request failed: ${response.statusText}`);
    }
  }

  /**
   * Check if a feature is available offline
   */
  isFeatureAvailableOffline(feature: keyof OfflineCapabilities): boolean {
    return this.capabilities[feature];
  }

  /**
   * Get offline-friendly error message
   */
  getOfflineMessage(action: string): string {
    const messages: Record<string, string> = {
      analyze: 'Analysis requires an internet connection. Your request will be processed when you\'re back online.',
      export: 'You can still export your resume offline using cached data.',
      save: 'Your data has been saved locally and will sync when you\'re back online.',
      login: 'Login requires an internet connection. Please try again when you\'re online.',
      upload: 'File uploads require an internet connection. Your file will be uploaded when you\'re back online.',
    };

    return messages[action] || 'This action requires an internet connection. Please try again when you\'re online.';
  }

  /**
   * Update offline capabilities based on available data
   */
  private updateCapabilities() {
    try {
      if (typeof window !== 'undefined') {
        const hasLocalData = localStorage.getItem('analysis-cache') !== null;
        const hasTemplates = localStorage.getItem('resume-templates') !== null;
        
        this.capabilities = {
          canAnalyzeOffline: false, // AI analysis always requires internet
          canExportOffline: hasLocalData || hasTemplates,
          canSaveOffline: true, // Can always save to localStorage
          hasOfflineData: hasLocalData,
        };
      }
    } catch (error) {
      console.error('Failed to update offline capabilities:', error);
    }
  }

  /**
   * Show offline notification to user
   */
  private showOfflineNotification() {
    if (typeof window === 'undefined') return;

    // Dispatch custom event for UI components to handle
    window.dispatchEvent(new CustomEvent('offline-status', {
      detail: {
        isOnline: false,
        message: 'You\'re currently offline. Some features may be limited.',
        capabilities: this.capabilities,
      }
    }));
  }

  /**
   * Show reconnected notification to user
   */
  private showReconnectedNotification() {
    if (typeof window === 'undefined') return;

    const queuedCount = this.actionQueue.length;
    const message = queuedCount > 0 
      ? `You're back online! Processing ${queuedCount} queued action${queuedCount > 1 ? 's' : ''}.`
      : 'You\'re back online!';

    window.dispatchEvent(new CustomEvent('offline-status', {
      detail: {
        isOnline: true,
        message,
        queuedActions: queuedCount,
      }
    }));
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error in offline state listener:', error);
      }
    });
  }

  /**
   * Persist state to localStorage
   */
  private persistState() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch (error) {
      console.error('Failed to persist offline state:', error);
    }
  }

  /**
   * Persist action queue to localStorage
   */
  private persistQueue() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.actionQueue));
      }
    } catch (error) {
      console.error('Failed to persist action queue:', error);
    }
  }

  /**
   * Load persisted state from localStorage
   */
  private loadPersistedState() {
    try {
      if (typeof window !== 'undefined') {
        const persistedState = localStorage.getItem(this.STORAGE_KEY);
        if (persistedState) {
          const parsed = JSON.parse(persistedState);
          this.state = { ...this.state, ...parsed };
        }

        const persistedQueue = localStorage.getItem(this.QUEUE_KEY);
        if (persistedQueue) {
          this.actionQueue = JSON.parse(persistedQueue);
        }
      }
    } catch (error) {
      console.error('Failed to load persisted offline state:', error);
    }
  }

  /**
   * Clear all offline data
   */
  clearOfflineData() {
    this.actionQueue = [];
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.QUEUE_KEY);
      }
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  /**
   * Get queue status for debugging
   */
  getQueueStatus() {
    return {
      queueLength: this.actionQueue.length,
      actions: this.actionQueue.map(action => ({
        id: action.id,
        type: action.type,
        timestamp: action.timestamp,
        retryCount: action.retryCount,
      })),
    };
  }

  on(event: string, listener: (data: any) => void) {
    if (event === 'state-change') {
      this.listeners.add(listener);
    }
  }

  off(event: string, listener: (data: any) => void) {
    if (event === 'state-change') {
      this.listeners.delete(listener);
    }
  }
}

let offlineManager: OfflineManager;

function getOfflineManager(): OfflineManager {
  if (typeof window === 'undefined') {
    // Return a mock/dummy manager on the server
    return {
      getState: () => ({ isOnline: true, wasOffline: false, lastOnlineTime: 0, offlineDuration: 0 }),
      getCapabilities: () => ({ canAnalyzeOffline: false, canExportOffline: false, canSaveOffline: false, hasOfflineData: false }),
      on: () => {},
      off: () => {},
    } as any;
  }

  if (!offlineManager) {
    offlineManager = new OfflineManager();
  }
  return offlineManager;
}

/**
 * Custom hook to use the offline state in React components
 */
export function useOfflineState() {
  const manager = getOfflineManager();
  const [state, setState] = React.useState<OfflineState>(manager.getState());
  const [capabilities, setCapabilities] = React.useState<OfflineCapabilities>(
    manager.getCapabilities()
  );

  React.useEffect(() => {
    // On the client, get the real manager and set up listeners
    const clientManager = getOfflineManager();

    const handleStateChange = (newState: OfflineState) => {
      setState(newState);
    };

    const handleCapabilitiesChange = (newCapabilities: OfflineCapabilities) => {
      setCapabilities(newCapabilities);
    };

    clientManager.on('state-change', handleStateChange);
    clientManager.on('capabilities-change', handleCapabilitiesChange);

    // Initial sync
    setState(clientManager.getState());
    setCapabilities(clientManager.getCapabilities());

    return () => {
      clientManager.off('state-change', handleStateChange);
      clientManager.off('capabilities-change', handleCapabilitiesChange);
    };
  }, []);

  return { state, capabilities, manager };
}

export default getOfflineManager;