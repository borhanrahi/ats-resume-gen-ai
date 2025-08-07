'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppError, RecoveryAction } from '@/lib/utils/errorHandler';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: AppError;
  className?: string;
  showTechnicalDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorDisplay({
  error,
  className,
  showTechnicalDetails = false,
  onRetry,
  onDismiss,
}: ErrorDisplayProps) {
  const [copiedErrorId, setCopiedErrorId] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);

  const copyErrorId = async () => {
    try {
      await navigator.clipboard.writeText(`Error ID: ${error.timestamp}`);
      setCopiedErrorId(true);
      setTimeout(() => setCopiedErrorId(false), 2000);
    } catch (err) {
      console.error('Failed to copy error ID:', err);
    }
  };

  const getErrorSeverity = (type: string): 'low' | 'medium' | 'high' => {
    const highSeverity = ['AUTH_ERROR', 'PERMISSION_ERROR', 'UNKNOWN_ERROR'];
    const mediumSeverity = ['AI_API_ERROR', 'NETWORK_ERROR', 'EXPORT_ERROR'];
    
    if (highSeverity.includes(type)) return 'high';
    if (mediumSeverity.includes(type)) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    }
  };

  const severity = getErrorSeverity(error.type);

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
            <div>
              <CardTitle className="text-lg">Something went wrong</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getSeverityColor(severity)}>
                  {severity.toUpperCase()} SEVERITY
                </Badge>
                <Badge variant="outline">
                  {error.type.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User-friendly error message */}
        <Alert>
          <AlertDescription className="text-base">
            {error.userMessage}
          </AlertDescription>
        </Alert>

        {/* Recovery actions */}
        {error.recoveryActions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              What you can do:
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {error.recoveryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={index === 0 ? 'default' : 'outline'}
                  onClick={action.action}
                  className="justify-start h-auto p-3"
                >
                  <div className="flex items-center gap-2">
                    {action.icon === 'refresh' && <RefreshCw className="w-4 h-4" />}
                    {action.icon === 'home' && <Home className="w-4 h-4" />}
                    {action.icon === 'external' && <ExternalLink className="w-4 h-4" />}
                    <span>{action.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Additional retry button if provided */}
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}

        {/* Error ID and support info */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Error ID: {error.timestamp}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyErrorId}
              className="h-8 px-2"
            >
              {copiedErrorId ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            If this problem persists, please{' '}
            <a
              href={`mailto:support@atsresumechecker.com?subject=Error Report&body=Error ID: ${error.timestamp}%0AError Type: ${error.type}%0AMessage: ${error.message}`}
              className="text-primary hover:underline"
            >
              contact support
            </a>
            {' '}with the error ID above.
          </p>
        </div>

        {/* Technical details (for development or debugging) */}
        {(showTechnicalDetails || process.env.NODE_ENV === 'development') && (
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="mb-3"
            >
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </Button>
            
            {showDetails && (
              <div className="space-y-3">
                <div className="bg-muted p-3 rounded-lg text-sm font-mono">
                  <div className="space-y-1">
                    <div><strong>Type:</strong> {error.type}</div>
                    <div><strong>Message:</strong> {error.message}</div>
                    <div><strong>Timestamp:</strong> {new Date(error.timestamp).toISOString()}</div>
                    {error.context && (
                      <div>
                        <strong>Context:</strong>
                        <pre className="mt-1 text-xs overflow-auto">
                          {JSON.stringify(error.context, null, 2)}
                        </pre>
                      </div>
                    )}
                    {error.originalError?.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 text-xs overflow-auto max-h-32">
                          {error.originalError.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact error display for inline use
 */
export function CompactErrorDisplay({
  error,
  onRetry,
  className,
}: {
  error: AppError;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Alert className={cn('border-destructive/50', className)}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error.userMessage}</span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-2 h-7 px-2"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Error boundary fallback component
 */
export function ErrorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  const [errorId] = React.useState(`error_${Date.now()}`);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <CardTitle>Application Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Something unexpected happened. The application encountered an error and couldn't continue.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button
              onClick={resetError}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            Error ID: {errorId}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}