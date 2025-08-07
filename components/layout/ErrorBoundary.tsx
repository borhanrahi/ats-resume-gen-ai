'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  userAgent: string;
  url: string;
  timestamp: number;
  userId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorReport: ErrorReport = {
        errorId: this.state.errorId || 'unknown',
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
        // Add user ID if available from auth context
        userId: this.getUserId(),
      };

      // Store error report locally for debugging
      this.storeErrorLocally(errorReport);

      // Send to error reporting service (if available)
      await this.sendErrorReport(errorReport);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private getUserId = (): string | undefined => {
    try {
      // Try to get user ID from localStorage or auth context
      const authData = localStorage.getItem('auth-user');
      if (authData) {
        const user = JSON.parse(authData);
        return user.id || user.$id;
      }
    } catch {
      // Ignore errors when getting user ID
    }
    return undefined;
  };

  private storeErrorLocally = (errorReport: ErrorReport) => {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('error-reports') || '[]');
      existingErrors.push(errorReport);
      
      // Keep only last 10 errors to prevent storage bloat
      const recentErrors = existingErrors.slice(-10);
      localStorage.setItem('error-reports', JSON.stringify(recentErrors));
    } catch {
      // Ignore storage errors
    }
  };

  private sendErrorReport = async (errorReport: ErrorReport) => {
    try {
      // Only send in production and if user consents
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/error-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorReport),
        });
      }
    } catch {
      // Ignore network errors when reporting
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getErrorMessage = (error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    if (message.includes('parse') || message.includes('syntax')) {
      return 'There was an issue processing your document. Please try uploading a different file.';
    }
    
    if (message.includes('auth') || message.includes('unauthorized')) {
      return 'Authentication issue. Please log in again to continue.';
    }
    
    if (message.includes('quota') || message.includes('limit')) {
      return 'Service limit reached. Please try again later or upgrade your account.';
    }
    
    return 'An unexpected error occurred. Our team has been notified and is working on a fix.';
  };

  private getRecoveryActions = (error: Error) => {
    const message = error.message.toLowerCase();
    const actions = [];

    if (message.includes('network') || message.includes('fetch')) {
      actions.push({
        label: 'Check Connection',
        action: () => window.open('https://www.google.com', '_blank'),
        icon: RefreshCw,
      });
    }

    if (message.includes('auth')) {
      actions.push({
        label: 'Login Again',
        action: () => window.location.href = '/auth/login',
        icon: Home,
      });
    }

    // Always provide retry and home options
    actions.push(
      {
        label: 'Try Again',
        action: this.handleRetry,
        icon: RefreshCw,
      },
      {
        label: 'Go Home',
        action: this.handleGoHome,
        icon: Home,
      }
    );

    return actions;
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.getErrorMessage(this.state.error);
      const recoveryActions = this.getRecoveryActions(this.state.error);

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6">
            {/* Error Icon and Title */}
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Something went wrong
              </h1>
              <p className="text-muted-foreground">
                {errorMessage}
              </p>
            </div>

            {/* Error Details Alert */}
            <Alert variant="destructive">
              <Bug className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Error ID: {this.state.errorId}</p>
                  {process.env.NODE_ENV === 'development' && (
                    <details className="text-xs">
                      <summary className="cursor-pointer hover:text-destructive-foreground">
                        Technical Details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {/* Recovery Actions */}
            <div className="space-y-3">
              {recoveryActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.action}
                  variant={index === 0 ? 'default' : 'outline'}
                  className="w-full min-h-[44px] flex items-center gap-2"
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Additional Help */}
            <div className="text-center text-sm text-muted-foreground">
              <p>
                If this problem persists, please{' '}
                <button
                  onClick={() => window.location.href = 'mailto:support@atsresumechecker.com?subject=Error Report&body=' + encodeURIComponent(`Error ID: ${this.state.errorId}\nError: ${this.state.error?.message}`)}
                  className="text-primary hover:underline"
                >
                  contact support
                </button>
                {' '}with error ID: {this.state.errorId}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;