import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorHandler, withErrorHandling } from '../errorHandler';

// Mock fetch for error reporting
global.fetch = vi.fn();

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ErrorHandler.clearErrorStats();
  });

  describe('createError', () => {
    it('should create an AppError with correct properties', () => {
      const error = ErrorHandler.createError('NETWORK_ERROR', 'Connection failed');
      
      expect(error.type).toBe('NETWORK_ERROR');
      expect(error.message).toBe('Connection failed');
      expect(error.userMessage).toContain('Connection issue');
      expect(error.recoverable).toBe(true);
      expect(error.recoveryActions.length).toBeGreaterThan(0);
      expect(error.timestamp).toBeTypeOf('number');
    });

    it('should handle Error objects', () => {
      const originalError = new Error('Test error');
      const error = ErrorHandler.createError('PARSE_ERROR', originalError);
      
      expect(error.originalError).toBe(originalError);
      expect(error.message).toBe('Test error');
    });

    it('should include context in technical message', () => {
      const context = { fileName: 'test.pdf', fileSize: 1024 };
      const error = ErrorHandler.createError('FILE_TOO_LARGE', 'File too big', context);
      
      expect(error.technicalMessage).toContain('FILE_TOO_LARGE');
      expect(error.technicalMessage).toContain('test.pdf');
      expect(error.context).toEqual(context);
    });
  });

  describe('handleError', () => {
    it('should classify network errors correctly', () => {
      const networkError = new Error('Network request failed');
      const error = ErrorHandler.handleError(networkError);
      
      expect(error.type).toBe('NETWORK_ERROR');
      expect(error.userMessage).toContain('Connection issue');
    });

    it('should classify authentication errors correctly', () => {
      const authError = new Error('Unauthorized access');
      const error = ErrorHandler.handleError(authError);
      
      expect(error.type).toBe('AUTH_ERROR');
      expect(error.userMessage).toContain('issue with your account');
    });

    it('should classify parsing errors correctly', () => {
      const parseError = new Error('Invalid PDF structure');
      const error = ErrorHandler.handleError(parseError);
      
      expect(error.type).toBe('PARSE_ERROR');
      expect(error.userMessage).toContain('couldn\'t read your document');
    });

    it('should handle unknown errors', () => {
      const unknownError = new Error('Something weird happened');
      const error = ErrorHandler.handleError(unknownError);
      
      expect(error.type).toBe('UNKNOWN_ERROR');
      expect(error.userMessage).toContain('unexpected happened');
    });
  });

  describe('recovery actions', () => {
    it('should provide appropriate recovery actions for network errors', () => {
      const error = ErrorHandler.createError('NETWORK_ERROR', 'Connection failed');
      
      expect(error.recoveryActions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: 'Check Connection',
            icon: 'wifi',
          }),
          expect.objectContaining({
            label: 'Try Again',
            icon: 'refresh',
          }),
        ])
      );
    });

    it('should provide appropriate recovery actions for auth errors', () => {
      const error = ErrorHandler.createError('AUTH_ERROR', 'Token expired');
      
      expect(error.recoveryActions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: 'Login Again',
            icon: 'user',
          }),
        ])
      );
    });

    it('should provide upgrade action for usage limit errors', () => {
      const error = ErrorHandler.createError('USAGE_LIMIT_EXCEEDED', 'Daily limit reached');
      
      expect(error.recoveryActions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: 'Upgrade to Premium',
            icon: 'crown',
          }),
        ])
      );
    });
  });

  describe('error statistics', () => {
    it('should track error frequency', () => {
      ErrorHandler.createError('NETWORK_ERROR', 'Error 1');
      ErrorHandler.createError('NETWORK_ERROR', 'Error 2');
      ErrorHandler.createError('AUTH_ERROR', 'Error 3');
      
      const stats = ErrorHandler.getErrorStats();
      
      expect(stats.NETWORK_ERROR.count).toBe(2);
      expect(stats.AUTH_ERROR.count).toBe(1);
      expect(stats.NETWORK_ERROR.lastOccurrence).toBeTypeOf('number');
    });

    it('should clear error statistics', () => {
      ErrorHandler.createError('NETWORK_ERROR', 'Error 1');
      ErrorHandler.clearErrorStats();
      
      const stats = ErrorHandler.getErrorStats();
      expect(Object.keys(stats)).toHaveLength(0);
    });
  });

  describe('reportError', () => {
    it('should not report errors in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = ErrorHandler.createError('NETWORK_ERROR', 'Test error');
      await ErrorHandler.reportError(error);
      
      expect(fetch).not.toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should report errors in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      (fetch as unknown).mockResolvedValueOnce({ ok: true });
      
      const error = ErrorHandler.createError('NETWORK_ERROR', 'Test error');
      await ErrorHandler.reportError(error);
      
      expect(fetch).toHaveBeenCalledWith('/api/error-report', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('NETWORK_ERROR'),
      }));
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('withErrorHandling', () => {
  it('should return data on successful operation', async () => {
    const successfulOperation = async () => 'success';
    
    const result = await withErrorHandling(successfulOperation);
    
    expect(result.data).toBe('success');
    expect(result.error).toBeUndefined();
  });

  it('should return error on failed operation', async () => {
    const failingOperation = async () => {
      throw new Error('Operation failed');
    };
    
    const result = await withErrorHandling(failingOperation);
    
    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe('UNKNOWN_ERROR');
    expect(result.error?.message).toBe('Operation failed');
  });

  it('should include context in error', async () => {
    const failingOperation = async () => {
      throw new Error('Operation failed');
    };
    
    const context = { userId: '123', action: 'test' };
    const result = await withErrorHandling(failingOperation, context);
    
    expect(result.error?.context).toEqual(context);
  });
});