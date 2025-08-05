'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { validateEmail } from '@/lib/auth/authUtils';

// Form validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
  onForgotPassword?: () => void;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToSignup,
  onForgotPassword,
  className = ''
}) => {
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange'
  });

  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting || isLoading) return;

    setError('');
    setIsSubmitting(true);

    try {
      await login(data.email, data.password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isSubmitting || isLoading) return;

    setError('');
    setIsSubmitting(true);

    try {
      await loginWithGoogle();
      // OAuth will redirect, so onSuccess is not called here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isSubmitting || isLoading;

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome Back
        </h2>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Sign in to access your premium features
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 md:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('email')}
              type="email"
              id="email"
              autoComplete="email"
              disabled={isFormDisabled}
              className={`
                block w-full pl-10 pr-3 py-3 md:py-3.5 text-base
                border rounded-lg shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
                dark:focus:ring-blue-400 dark:focus:border-blue-400
                ${errors.email 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
                }
              `}
              placeholder="Enter your email"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              disabled={isFormDisabled}
              className={`
                block w-full pl-10 pr-12 py-3 md:py-3.5 text-base
                border rounded-lg shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
                dark:focus:ring-blue-400 dark:focus:border-blue-400
                ${errors.password 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
                }
              `}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isFormDisabled}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 dark:hover:text-gray-300 disabled:cursor-not-allowed"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              {...register('rememberMe')}
              id="rememberMe"
              type="checkbox"
              disabled={isFormDisabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Remember me
            </label>
          </div>
          
          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={isFormDisabled}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Forgot password?
            </button>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isFormDisabled}
          className={`
            w-full flex justify-center items-center py-3 md:py-3.5 px-4
            border border-transparent rounded-lg shadow-sm text-base font-medium text-white
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            disabled:cursor-not-allowed disabled:opacity-50
            ${!isValid || isFormDisabled
              ? 'bg-gray-400 dark:bg-gray-600'
              : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isFormDisabled}
          className={`
            w-full flex justify-center items-center py-3 md:py-3.5 px-4
            border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
            bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
            hover:bg-gray-50 dark:hover:bg-gray-700
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            disabled:cursor-not-allowed disabled:opacity-50
            text-base font-medium
          `}
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      {onSwitchToSignup && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              disabled={isFormDisabled}
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sign up
            </button>
          </p>
        </div>
      )}
    </div>
  );
};