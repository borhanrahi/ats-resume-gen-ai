'use client';

import React from 'react';
import { Loader2, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLoadingManager } from '@/lib/utils/loadingManager';
import { cn } from '@/lib/utils';

interface GlobalLoadingIndicatorProps {
  className?: string;
  position?: 'top' | 'bottom' | 'center';
  variant?: 'minimal' | 'detailed' | 'overlay';
}

export default function GlobalLoadingIndicator({
  className,
  position = 'top',
  variant = 'minimal',
}: GlobalLoadingIndicatorProps) {
  const { loadingStates, isLoading } = useLoadingManager();

  if (!isLoading) {
    return null;
  }

  const primaryLoading = loadingStates[0]; // Show the first/primary loading state
  const hasProgress = primaryLoading.progress !== undefined;
  const elapsedTime = Date.now() - primaryLoading.startTime;

  const formatElapsedTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    return seconds > 0 ? `${seconds}s` : '0s';
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50';
      case 'bottom':
        return 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50';
      case 'center':
        return 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50';
      default:
        return 'fixed top-4 right-4 z-50';
    }
  };

  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-sm mx-4">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <div className="flex-1">
                <p className="font-medium">{primaryLoading.message}</p>
                {loadingStates.length > 1 && (
                  <p className="text-sm text-muted-foreground">
                    +{loadingStates.length - 1} more operation{loadingStates.length > 2 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            
            {hasProgress && (
              <div className="space-y-2">
                <Progress value={primaryLoading.progress} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round(primaryLoading.progress || 0)}%</span>
                  <span>{formatElapsedTime(elapsedTime)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn(getPositionClasses(), className)}>
        <Card className="min-w-80 shadow-lg">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="font-medium text-sm">Loading</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatElapsedTime(elapsedTime)}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm">{primaryLoading.message}</p>
              
              {hasProgress && (
                <div className="space-y-1">
                  <Progress value={primaryLoading.progress} className="w-full h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(primaryLoading.progress || 0)}%</span>
                  </div>
                </div>
              )}

              {loadingStates.length > 1 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {loadingStates.length - 1} other operation{loadingStates.length > 2 ? 's' : ''} running
                  </p>
                  <div className="mt-1 space-y-1">
                    {loadingStates.slice(1, 3).map((state) => (
                      <div key={state.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
                        <span className="text-xs text-muted-foreground truncate">
                          {state.message}
                        </span>
                      </div>
                    ))}
                    {loadingStates.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{loadingStates.length - 3} more...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Minimal variant (default)
  return (
    <div className={cn(getPositionClasses(), className)}>
      <Card className="shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {primaryLoading.message}
              </p>
              {hasProgress && (
                <div className="mt-1">
                  <Progress value={primaryLoading.progress} className="w-full h-1" />
                </div>
              )}
            </div>
            {loadingStates.length > 1 && (
              <div className="flex-shrink-0">
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                  {loadingStates.length}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Loading indicator for specific areas/components
 */
export function LocalLoadingIndicator({
  message = 'Loading...',
  progress,
  className,
  size = 'md',
}: {
  message?: string;
  progress?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      <span className={cn('text-muted-foreground', textSizeClasses[size])}>
        {message}
      </span>
      {progress !== undefined && (
        <span className={cn('text-muted-foreground font-medium', textSizeClasses[size])}>
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
}

/**
 * Button loading state
 */
export function ButtonLoading({
  children,
  isLoading,
  loadingText = 'Loading...',
  className,
  ...props
}: {
  children: React.ReactNode;
  isLoading: boolean;
  loadingText?: string;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      {...props}
      disabled={isLoading || props.disabled}
      className={className}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </Button>
  );
}