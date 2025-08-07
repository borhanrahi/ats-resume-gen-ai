'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useOfflineState } from '@/lib/utils/offlineManager';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export default function OfflineIndicator({ 
  className, 
  showDetails = false 
}: OfflineIndicatorProps) {
  const {
    isOnline,
    wasOffline,
    offlineDuration,
    capabilities,
    getOfflineMessage,
  } = useOfflineState();

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [queuedActions, setQueuedActions] = useState(0);

  // Listen for offline status events
  useEffect(() => {
    const handleOfflineStatus = (event: CustomEvent) => {
      const { message, queuedActions: queued } = event.detail;
      setNotificationMessage(message);
      setQueuedActions(queued || 0);
      setShowNotification(true);

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    };

    window.addEventListener('offline-status', handleOfflineStatus as EventListener);
    
    return () => {
      window.removeEventListener('offline-status', handleOfflineStatus as EventListener);
    };
  }, []);

  // Format offline duration
  const formatDuration = (duration: number): string => {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Don't show indicator if online and never was offline
  if (isOnline && !wasOffline && !showNotification) {
    return null;
  }

  return (
    <>
      {/* Status Bar Indicator */}
      <div className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isOnline ? 'bg-green-500' : 'bg-red-500',
        className
      )}>
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {!isOnline && (
                <span className="text-white/80">
                  - Limited functionality
                </span>
              )}
            </div>

            {showDetails && (
              <div className="flex items-center gap-4 text-xs">
                {wasOffline && offlineDuration > 0 && (
                  <span className="text-white/80">
                    Was offline for {formatDuration(offlineDuration)}
                  </span>
                )}
                {queuedActions > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {queuedActions} queued
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-16 right-4 z-50 max-w-sm animate-in slide-in-from-right">
          <Alert className={cn(
            'border shadow-lg',
            isOnline ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          )}>
            {isOnline ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className="text-sm">
              {notificationMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}

/**
 * Offline Feature Guard - Wraps components that may not work offline
 */
interface OfflineGuardProps {
  children: React.ReactNode;
  feature: 'analyze' | 'export' | 'save' | 'login' | 'upload';
  fallback?: React.ReactNode;
  showMessage?: boolean;
}

export function OfflineGuard({ 
  children, 
  feature, 
  fallback, 
  showMessage = true 
}: OfflineGuardProps) {
  const { isOnline, getOfflineMessage, capabilities } = useOfflineState();

  // Check if feature is available offline
  const isAvailable = isOnline || (() => {
    switch (feature) {
      case 'export':
        return capabilities.canExportOffline;
      case 'save':
        return capabilities.canSaveOffline;
      case 'analyze':
        return capabilities.canAnalyzeOffline;
      default:
        return false;
    }
  })();

  if (isAvailable) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showMessage) {
    return null;
  }

  return (
    <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/20">
      <div className="flex items-center gap-3 text-center">
        <WifiOff className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {getOfflineMessage(feature)}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Offline Capabilities Display - Shows what's available offline
 */
export function OfflineCapabilities({ className }: { className?: string }) {
  const { capabilities, isOnline } = useOfflineState();

  if (isOnline) {
    return null;
  }

  const features = [
    {
      name: 'Resume Export',
      available: capabilities.canExportOffline,
      description: 'Export resumes using cached templates',
    },
    {
      name: 'Data Saving',
      available: capabilities.canSaveOffline,
      description: 'Save your work locally',
    },
    {
      name: 'AI Analysis',
      available: capabilities.canAnalyzeOffline,
      description: 'Analyze resumes with AI',
    },
    {
      name: 'Cached Data',
      available: capabilities.hasOfflineData,
      description: 'Access previously analyzed resumes',
    },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-muted-foreground">
        Available Offline:
      </h3>
      <div className="space-y-2">
        {features.map((feature) => (
          <div
            key={feature.name}
            className="flex items-center gap-2 text-sm"
          >
            {feature.available ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span className={cn(
              feature.available ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {feature.name}
            </span>
            <span className="text-xs text-muted-foreground">
              - {feature.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}