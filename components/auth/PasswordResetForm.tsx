'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { authService } from '@/lib/auth/appwrite';
import { parseAuthError } from '@/lib/auth/authUtils';

// Form validation schemas
const requestResetSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
});

const completeResetSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number, and special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type RequestResetData = z.infer<typeof requestResetSchema>;
type CompleteResetData = z.infer<typeof completeResetSchema>;

interface PasswordResetFormProps {
  mode?: 'request' | 'complete';
  userId?: string;
  secret?: string;
  onSuccess?: () => void;
  onBack?: () => void;
  className?: string;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  mode = 'request',
  userId,
  secret,
  onSuccess,
  onBack,
  className = ''
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // Request reset form
  const requestForm = useForm<RequestResetData>({
    resolver: zodResolver(requestResetSchema),
    mode: 'onChange'
  });

  // Complete reset form
  const completeForm = useForm<CompleteResetData>({
    resolver: zodResolver(completeResetSchema),
    mode: 'onChange'
  });

  const handleRequestReset = async (data: RequestResetData) => {
    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);

    try {
      await authService.sendPasswordRecovery(data.email);
      setSuccess(true);
    } catch (err) {
      const { message } = parseAuthError(err);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteReset = async (data: CompleteResetData) => {
    if (isSubmitting || !userId || !secret) return;

    setError('');
    setIsSubmitting(true);

    try {
      await authService.completePasswordRecovery(userId, secret, data.password);
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      const { message } = parseAuthError(err);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === 'request') {
    if (success) {
      return (
        <div className={`w-full max-w-md mx-auto ${className}`}>
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Check Your Email
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6">
              We&apos;ve sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
            </p>
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reset Password
          </h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 md:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Reset Request Form */}
        <form onSubmit={requestForm.handleSubmit(handleRequestReset)} className="space-y-4 md:space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...requestForm.register('email')}
                type="email"
                id="email"
                autoComplete="email"
                disabled={isSubmitting}
                className={`
                  block w-full pl-10 pr-3 py-3 md:py-3.5 text-base
                  border rounded-lg shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                  dark:bg-gray-800 dark:border-gray-600 dark:text-white
                  dark:focus:ring-blue-400 dark:focus:border-blue-400
                  ${requestForm.formState.errors.email 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                  }
                `}
                placeholder="Enter your email address"
              />
            </div>
            {requestForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {requestForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!requestForm.formState.isValid || isSubmitting}
            className={`
              w-full flex justify-center items-center py-3 md:py-3.5 px-4
              border border-transparent rounded-lg shadow-sm text-base font-medium text-white
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              disabled:cursor-not-allowed disabled:opacity-50
              ${!requestForm.formState.isValid || isSubmitting
                ? 'bg-gray-400 dark:bg-gray-600'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              }
            `}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Sending Reset Link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Back to Login */}
        {onBack && (
          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              disabled={isSubmitting}
              className="inline-flex items-center text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </button>
          </div>
        )}
      </div>
    );
  }

  // Complete reset mode
  if (success) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Password Reset Complete
          </h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Set New Password
        </h2>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Enter your new password below.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 md:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Complete Reset Form */}
      <form onSubmit={completeForm.handleSubmit(handleCompleteReset)} className="space-y-4 md:space-y-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Password
          </label>
          <input
            {...completeForm.register('password')}
            type="password"
            id="password"
            autoComplete="new-password"
            disabled={isSubmitting}
            className={`
              block w-full px-3 py-3 md:py-3.5 text-base
              border rounded-lg shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              dark:bg-gray-800 dark:border-gray-600 dark:text-white
              dark:focus:ring-blue-400 dark:focus:border-blue-400
              ${completeForm.formState.errors.password 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-300 dark:border-gray-600'
              }
            `}
            placeholder="Enter your new password"
          />
          {completeForm.formState.errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {completeForm.formState.errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm New Password
          </label>
          <input
            {...completeForm.register('confirmPassword')}
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            disabled={isSubmitting}
            className={`
              block w-full px-3 py-3 md:py-3.5 text-base
              border rounded-lg shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              dark:bg-gray-800 dark:border-gray-600 dark:text-white
              dark:focus:ring-blue-400 dark:focus:border-blue-400
              ${completeForm.formState.errors.confirmPassword 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-300 dark:border-gray-600'
              }
            `}
            placeholder="Confirm your new password"
          />
          {completeForm.formState.errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {completeForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!completeForm.formState.isValid || isSubmitting}
          className={`
            w-full flex justify-center items-center py-3 md:py-3.5 px-4
            border border-transparent rounded-lg shadow-sm text-base font-medium text-white
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            disabled:cursor-not-allowed disabled:opacity-50
            ${!completeForm.formState.isValid || isSubmitting
              ? 'bg-gray-400 dark:bg-gray-600'
              : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Resetting Password...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </div>
  );
};