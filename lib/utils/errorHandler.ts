/**
 * Comprehensive error handling utility for the ATS Resume Checker application
 * Provides centralized error classification, user-friendly messages, and recovery suggestions
 */

export type AppErrorType = 
  | 'PARSE_ERROR'
  | 'AI_API_ERROR'
  | 'USAGE_LIMIT_EXCEEDED'
  | 'AUTH_ERROR'
  | 'EXPORT_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'STORAGE_ERROR'
  | 'PERMISSION_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE'
  | 'OFFLINE_ERROR'
  | 'UNKNOWN_ERROR';

export interface AppError {
  type: AppErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, unknown>;
  timestamp: number;
  recoverable: boolean;
  userMessage: string;
  technicalMessage: string;
  recoveryActions: RecoveryAction[];
}

export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
  icon?: string;
}

export class ErrorHandler {
  private static errorCounts = new Map<AppErrorType, number>();
  private static lastErrorTime = new Map<AppErrorType, number>();

  /**
   * Creates a standardized AppError from various error sources
   */
  static createError(
    type: AppErrorType,
    originalError?: Error | string,
    context?: Record<string, unknown>
  ): AppError {
    const timestamp = Date.now();
    const errorMessage = typeof originalError === 'string' 
      ? originalError 
      : originalError?.message || 'Unknown error occurred';

    // Track error frequency
    this.trackError(type, timestamp);

    const baseError: Omit<AppError, 'userMessage' | 'technicalMessage' | 'recoveryActions'> = {
      type,
      message: errorMessage,
      originalError: typeof originalError === 'string' ? new Error(originalError) : originalError,
      context,
      timestamp,
      recoverable: this.isRecoverable(type),
    };

    return {
      ...baseError,
      userMessage: this.getUserMessage(type, errorMessage, context),
      technicalMessage: this.getTechnicalMessage(type, errorMessage, context),
      recoveryActions: this.getRecoveryActions(type, context),
    };
  }

  /**
   * Handles errors with automatic classification
   */
  static handleError(error: unknown, context?: Record<string, unknown>): AppError {
    const errorType = this.classifyError(error);
    return this.createError(errorType, error as Error, context);
  }

  /**
   * Classifies errors based on their characteristics
   */
  private static classifyError(error: unknown): AppErrorType {
    if (!error) return 'UNKNOWN_ERROR';

    const errorMessage = (error as Error).message?.toLowerCase() || '';
    const errorName = (error as Error).name?.toLowerCase() || '';

    // Network-related errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('fetch') || 
        errorMessage.includes('connection') ||
        errorName.includes('networkerror')) {
      return 'NETWORK_ERROR';
    }

    // Authentication errors
    if (errorMessage.includes('auth') || 
        errorMessage.includes('unauthorized') || 
        errorMessage.includes('forbidden') ||
        errorMessage.includes('token')) {
      return 'AUTH_ERROR';
    }

    // File parsing errors
    if (errorMessage.includes('parse') || 
        errorMessage.includes('invalid pdf') || 
        errorMessage.includes('invalid docx') ||
        errorMessage.includes('corrupt')) {
      return 'PARSE_ERROR';
    }

    // AI API errors
    if (errorMessage.includes('openrouter') || 
        errorMessage.includes('gemini') || 
        errorMessage.includes('api key') ||
        errorMessage.includes('model')) {
      return 'AI_API_ERROR';
    }

    // Rate limiting
    if (errorMessage.includes('rate limit') || 
        errorMessage.includes('too many requests') ||
        errorMessage.includes('quota')) {
      return 'RATE_LIMIT_ERROR';
    }

    // File size errors
    if (errorMessage.includes('file too large') || 
        errorMessage.includes('size limit')) {
      return 'FILE_TOO_LARGE';
    }

    // Unsupported file types
    if (errorMessage.includes('unsupported') || 
        errorMessage.includes('invalid file type')) {
      return 'UNSUPPORTED_FILE';
    }

    // Storage errors
    if (errorMessage.includes('storage') || 
        errorMessage.includes('localstorage') ||
        errorMessage.includes('quota exceeded')) {
      return 'STORAGE_ERROR';
    }

    // Validation errors
    if (errorMessage.includes('validation') || 
        errorMessage.includes('invalid input') ||
        errorMessage.includes('required field')) {
      return 'VALIDATION_ERROR';
    }

    // Export errors
    if (errorMessage.includes('export') || 
        errorMessage.includes('pdf generation') ||
        errorMessage.includes('docx generation')) {
      return 'EXPORT_ERROR';
    }

    // Usage limit errors
    if (errorMessage.includes('usage limit') || 
        errorMessage.includes('daily limit')) {
      return 'USAGE_LIMIT_EXCEEDED';
    }

    // Permission errors
    if (errorMessage.includes('permission') || 
        errorMessage.includes('access denied')) {
      return 'PERMISSION_ERROR';
    }

    // Offline errors
    if (errorMessage.includes('offline') || 
        !navigator.onLine) {
      return 'OFFLINE_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Determines if an error type is recoverable
   */
  private static isRecoverable(type: AppErrorType): boolean {
    const recoverableErrors: AppErrorType[] = [
      'NETWORK_ERROR',
      'AI_API_ERROR',
      'PARSE_ERROR',
      'EXPORT_ERROR',
      'VALIDATION_ERROR',
      'OFFLINE_ERROR',
    ];
    return recoverableErrors.includes(type);
  }

  /**
   * Gets user-friendly error messages
   */
  private static getUserMessage(
    type: AppErrorType, 
    originalMessage: string, 
    context?: Record<string, unknown>
  ): string {
    const messages: Record<AppErrorType, string> = {
      PARSE_ERROR: 'We couldn\'t read your document. Please make sure it\'s a valid PDF or DOCX file and try again.',
      AI_API_ERROR: 'Our AI analysis service is temporarily unavailable. Please try again in a few moments.',
      USAGE_LIMIT_EXCEEDED: 'You\'ve reached your daily analysis limit. Upgrade to premium for unlimited analyses.',
      AUTH_ERROR: 'There was an issue with your account. Please log in again to continue.',
      EXPORT_ERROR: 'We couldn\'t export your resume. Please try again or contact support if the issue persists.',
      NETWORK_ERROR: 'Connection issue detected. Please check your internet connection and try again.',
      VALIDATION_ERROR: 'Please check your input and make sure all required fields are filled correctly.',
      STORAGE_ERROR: 'We couldn\'t save your data. Please try again or clear your browser storage.',
      PERMISSION_ERROR: 'You don\'t have permission to access this feature. Please check your account status.',
      RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment before trying again.',
      FILE_TOO_LARGE: 'Your file is too large. Please use a file smaller than 10MB.',
      UNSUPPORTED_FILE: 'This file type isn\'t supported. Please upload a PDF or DOCX file.',
      OFFLINE_ERROR: 'You\'re currently offline. Some features may not be available until you reconnect.',
      UNKNOWN_ERROR: 'Something unexpected happened. Our team has been notified and is working on a fix.',
    };

    return messages[type] || messages.UNKNOWN_ERROR;
  }

  /**
   * Gets technical error messages for debugging
   */
  private static getTechnicalMessage(
    type: AppErrorType, 
    originalMessage: string, 
    context?: Record<string, unknown>
  ): string {
    return `${type}: ${originalMessage}${context ? ` | Context: ${JSON.stringify(context)}` : ''}`;
  }

  /**
   * Gets recovery actions for each error type
   */
  private static getRecoveryActions(
    type: AppErrorType, 
    context?: Record<string, unknown>
  ): RecoveryAction[] {
    const commonActions: RecoveryAction[] = [
      {
        label: 'Try Again',
        action: () => window.location.reload(),
        primary: true,
        icon: 'refresh',
      },
      {
        label: 'Go Home',
        action: () => window.location.href = '/',
        icon: 'home',
      },
    ];

    const specificActions: Partial<Record<AppErrorType, RecoveryAction[]>> = {
      PARSE_ERROR: [
        {
          label: 'Upload Different File',
          action: () => window.location.href = '/analyze',
          primary: true,
          icon: 'upload',
        },
        ...commonActions,
      ],
      AUTH_ERROR: [
        {
          label: 'Login Again',
          action: () => window.location.href = '/auth/login',
          primary: true,
          icon: 'user',
        },
        ...commonActions,
      ],
      USAGE_LIMIT_EXCEEDED: [
        {
          label: 'Upgrade to Premium',
          action: () => window.location.href = '/pricing',
          primary: true,
          icon: 'crown',
        },
        {
          label: 'Try Tomorrow',
          action: () => window.location.href = '/',
          icon: 'calendar',
        },
      ],
      NETWORK_ERROR: [
        {
          label: 'Check Connection',
          action: () => window.open('https://www.google.com', '_blank'),
          primary: true,
          icon: 'wifi',
        },
        ...commonActions,
      ],
      OFFLINE_ERROR: [
        {
          label: 'Retry When Online',
          action: () => {
            const retry = () => {
              if (navigator.onLine) {
                window.location.reload();
              } else {
                setTimeout(retry, 1000);
              }
            };
            retry();
          },
          primary: true,
          icon: 'wifi-off',
        },
      ],
    };

    return specificActions[type] || commonActions;
  }

  /**
   * Tracks error frequency for monitoring
   */
  private static trackError(type: AppErrorType, timestamp: number) {
    const count = this.errorCounts.get(type) || 0;
    this.errorCounts.set(type, count + 1);
    this.lastErrorTime.set(type, timestamp);

    // Log frequent errors
    if (count > 5) {
      console.warn(`Frequent error detected: ${type} (${count} times)`);
    }
  }

  /**
   * Gets error statistics for monitoring
   */
  static getErrorStats(): Record<string, { count: number; lastOccurrence: number }> {
    const stats: Record<string, { count: number; lastOccurrence: number }> = {};
    
    this.errorCounts.forEach((count, type) => {
      stats[type] = {
        count,
        lastOccurrence: this.lastErrorTime.get(type) || 0,
      };
    });

    return stats;
  }

  /**
   * Clears error statistics
   */
  static clearErrorStats() {
    this.errorCounts.clear();
    this.lastErrorTime.clear();
  }

  /**
   * Reports error to external monitoring service
   */
  static async reportError(error: AppError): Promise<void> {
    try {
      // Only report in production
      if (process.env.NODE_ENV !== 'production') {
        console.log('Error would be reported:', error);
        return;
      }

      // Send to error reporting service
      await fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: error.type,
          message: error.message,
          technicalMessage: error.technicalMessage,
          context: error.context,
          timestamp: error.timestamp,
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }
}

/**
 * Utility function for handling async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const appError = ErrorHandler.handleError(error, context);
    await ErrorHandler.reportError(appError);
    return { error: appError };
  }
}

/**
 * React hook for error handling
 */
export function useErrorHandler() {
  const handleError = (error: unknown, context?: Record<string, unknown>) => {
    return ErrorHandler.handleError(error, context);
  };

  const reportError = async (error: AppError) => {
    await ErrorHandler.reportError(error);
  };

  return { handleError, reportError };
}