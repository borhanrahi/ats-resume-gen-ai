'use client';

import React, { useCallback } from 'react';
import { ErrorHandler, AppError, withErrorHandling } from '@/lib/utils/errorHandler';
import { useToast } from '@/components/ui/toast';

/**
 * React hook for comprehensive error handling with user feedback
 */
export function useErrorHandling() {
  const { addToast } = useToast();

  /**
   * Handle errors with automatic user notification
   */
  const handleError = useCallback((
    error: unknown,
    context?: Record<string, unknown>,
    options?: {
      showToast?: boolean;
      toastDuration?: number;
      customMessage?: string;
    }
  ): AppError => {
    const appError = ErrorHandler.handleError(error, context);
    
    // Report error for monitoring
    ErrorHandler.reportError(appError);

    // Show toast notification if requested (default: true)
    if (options?.showToast !== false) {
      const message = options?.customMessage || appError.userMessage;
      
      addToast({
        type: 'error',
        title: 'Error',
        description: message,
        duration: options?.toastDuration || 5000,
        action: appError.recoverable ? {
          label: 'Retry',
          onClick: () => {
            // Trigger the first recovery action if available
            if (appError.recoveryActions.length > 0) {
              appError.recoveryActions[0].action();
            }
          }
        } : undefined,
      });
    }

    return appError;
  }, [addToast]);

  /**
   * Handle success with user notification
   */
  const handleSuccess = useCallback((
    message: string,
    description?: string,
    duration?: number
  ) => {
    addToast({
      type: 'success',
      title: message,
      description,
      duration: duration || 3000,
    });
  }, [addToast]);

  /**
   * Handle warnings with user notification
   */
  const handleWarning = useCallback((
    message: string,
    description?: string,
    action?: { label: string; onClick: () => void }
  ) => {
    addToast({
      type: 'warning',
      title: message,
      description,
      action,
      duration: 6000,
    });
  }, [addToast]);

  /**
   * Handle info messages with user notification
   */
  const handleInfo = useCallback((
    message: string,
    description?: string,
    duration?: number
  ) => {
    addToast({
      type: 'info',
      title: message,
      description,
      duration: duration || 4000,
    });
  }, [addToast]);

  /**
   * Wrapper for async operations with error handling
   */
  const withErrorHandlingWrapper = useCallback(<T>(
    operation: () => Promise<T>,
    context?: Record<string, unknown>,
    options?: {
      showToast?: boolean;
      successMessage?: string;
      customErrorMessage?: string;
    }
  ) => {
    return withErrorHandling(operation, context).then(result => {
      if (result.error) {
        handleError(result.error.originalError || result.error, context, {
          showToast: options?.showToast,
          customMessage: options?.customErrorMessage,
        });
        return result;
      }

      // Show success message if provided
      if (options?.successMessage && result.data) {
        handleSuccess(options.successMessage);
      }

      return result;
    });
  }, [handleError, handleSuccess]);

  /**
   * Handle network errors specifically
   */
  const handleNetworkError = useCallback((
    error: unknown,
    context?: Record<string, unknown>
  ) => {
    const appError = handleError(error, context, {
      customMessage: 'Network connection issue. Please check your internet connection and try again.',
    });

    return appError;
  }, [handleError]);

  /**
   * Handle validation errors specifically
   */
  const handleValidationError = useCallback((
    errors: Record<string, string[]> | string,
    context?: Record<string, unknown>
  ) => {
    let message: string;
    
    if (typeof errors === 'string') {
      message = errors;
    } else {
      const errorMessages = Object.values(errors).flat();
      message = errorMessages.length > 0 
        ? errorMessages[0] 
        : 'Please check your input and try again.';
    }

    const appError = ErrorHandler.createError('VALIDATION_ERROR', message, context);
    
    addToast({
      type: 'error',
      title: 'Validation Error',
      description: message,
      duration: 5000,
    });

    return appError;
  }, [addToast]);

  /**
   * Handle authentication errors specifically
   */
  const handleAuthError = useCallback((
    error: unknown,
    context?: Record<string, unknown>
  ) => {
    const appError = handleError(error, context, {
      customMessage: 'Authentication issue. Please log in again to continue.',
    });

    // Redirect to login after a delay
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 2000);

    return appError;
  }, [handleError]);

  /**
   * Handle file upload errors specifically
   */
  const handleFileError = useCallback((
    error: unknown,
    fileName?: string,
    context?: Record<string, unknown>
  ) => {
    const fileContext = { ...context, fileName };
    const appError = handleError(error, fileContext);

    // Provide specific guidance for file errors
    if (appError.type === 'FILE_TOO_LARGE') {
      handleWarning(
        'File too large',
        `${fileName || 'Your file'} is too large. Please use a file smaller than 10MB.`,
        {
          label: 'Choose Different File',
          onClick: () => {
            // Trigger file picker or navigate to upload page
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) {
              fileInput.click();
            }
          }
        }
      );
    }

    return appError;
  }, [handleError, handleWarning]);

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
    handleNetworkError,
    handleValidationError,
    handleAuthError,
    handleFileError,
    withErrorHandling: withErrorHandlingWrapper,
  };
}

/**
 * Hook for handling loading states with error handling
 */
export function useAsyncOperation<T>() {
  const { handleError, handleSuccess } = useErrorHandling();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<AppError | null>(null);
  const [data, setData] = React.useState<T | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options?: {
      successMessage?: string;
      showErrorToast?: boolean;
      context?: Record<string, unknown>;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();
      setData(result);
      
      if (options?.successMessage) {
        handleSuccess(options.successMessage);
      }
      
      return result;
    } catch (err) {
      const appError = handleError(err, options?.context, {
        showToast: options?.showErrorToast !== false,
      });
      setError(appError);
      throw appError;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, handleSuccess]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    isLoading,
    error,
    data,
    execute,
    reset,
  };
}