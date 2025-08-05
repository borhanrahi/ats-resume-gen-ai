'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, Mail, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { authService } from '@/lib/auth/appwrite';
import { useAuth } from '@/lib/auth/AuthContext';
import { parseAuthError } from '@/lib/auth/authUtils';

interface EmailVerificationProps {
  mode?: 'verify' | 'send';
  userId?: string;
  secret?: string;
  onSuccess?: () => void;
  onResend?: () => void;
  className?: string;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  mode = 'send',
  userId,
  secret,
  onSuccess,
  onResend,
  className = ''
}) => {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto-verify if userId and secret are provided
  useEffect(() => {
    if (mode === 'verify' && userId && secret && !success && !isLoading) {
      handleVerifyEmail();
    }
  }, [mode, userId, secret]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCooldown]);

  const handleVerifyEmail = async () => {
    if (!userId || !secret || isLoading) return;

    setError('');
    setIsLoading(true);

    try {
      await authService.completeEmailVerification(userId, secret);
      setSuccess(true);
      
      // Refresh user data to update verification status
      await refreshUser();
      
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      const { message } = parseAuthError(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerification = async () => {
    if (isLoading || !canResend) return;

    setError('');
    setIsLoading(true);

    try {
      await authService.sendEmailVerification();
      setSuccess(true);
      setCanResend(false);
      setResendCooldown(60); // 60 second cooldown
      onResend?.();
    } catch (err) {
      const { message } = parseAuthError(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'verify') {
    if (isLoading) {
      return (
        <div className={`w-full max-w-md mx-auto ${className}`}>
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Verifying Email
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      );
    }

    if (success) {
      return (
        <div className={`w-full max-w-md mx-auto ${className}`}>
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Email Verified!
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6">
              Your email address has been successfully verified. You now have full access to your account.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`w-full max-w-md mx-auto ${className}`}>
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Verification Failed
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleVerifyEmail}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  // Send verification mode
  if (success) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          <div className="text-center">
            <Mail className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verification Email Sent
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6">
              We&apos;ve sent a verification link to your email address. Please check your inbox and click the link to verify your account.
            </p>
            
            {/* Resend option */}
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Didn&apos;t receive the email?
              </p>
              <button
                onClick={handleSendVerification}
                disabled={!canResend || isLoading}
                className={`
                  inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  disabled:cursor-not-allowed disabled:opacity-50
                  ${canResend && !isLoading
                    ? 'text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300'
                    : 'text-gray-400 dark:text-gray-500'
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {canResend ? 'Resend Email' : `Resend in ${resendCooldown}s`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verify Your Email
          </h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            To complete your account setup, please verify your email address.
          </p>
        </div>

        {/* User email display */}
        {user?.email && (
          <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              We&apos;ll send a verification link to:
            </p>
            <p className="text-base font-medium text-gray-900 dark:text-white text-center mt-1">
              {user.email}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Send verification button */}
        <button
          onClick={handleSendVerification}
          disabled={!canResend || isLoading}
          className={`
            w-full flex justify-center items-center py-3 md:py-3.5 px-4
            border border-transparent rounded-lg shadow-sm text-base font-medium text-white
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            disabled:cursor-not-allowed disabled:opacity-50
            ${canResend && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              : 'bg-gray-400 dark:bg-gray-600'
            }
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Sending Verification Email...
            </>
          ) : canResend ? (
            'Send Verification Email'
          ) : (
            `Resend in ${resendCooldown}s`
          )}
        </button>

        {/* Skip for now option */}
        <div className="mt-4 text-center">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};