'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Loader2, Check, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { validatePassword } from '@/lib/auth/authUtils';

// Form validation schema
const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((password) => validatePassword(password).isValid, {
      message: 'Password must contain uppercase, lowercase, number, and special character'
    }),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  className?: string;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSuccess,
  onSwitchToLogin,
  className = ''
}) => {
  const { signup, loginWithGoogle, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange'
  });

  const watchedPassword = watch('password');
  const passwordValidation = watchedPassword ? validatePassword(watchedPassword) : null;

  const onSubmit = async (data: SignupFormData) => {
    if (isSubmitting || isLoading) return;

    setError('');
    setIsSubmitting(true);

    try {
      await signup(data.email, data.password, data.name);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (isSubmitting || isLoading) return;

    setError('');
    setIsSubmitting(true);

    try {
      await loginWithGoogle();
      // OAuth will redirect, so onSuccess is not called here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google signup failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isSubmitting || isLoading;

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create Account
        </h2>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Join thousands of job seekers improving their resumes
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 md:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('name')}
              type="text"
              id="name"
              autoComplete="name"
              disabled={isFormDisabled}
              className={`
                block w-full pl-10 pr-3 py-3 md:py-3.5 text-base
                border rounded-lg shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
                dark:focus:ring-blue-400 dark:focus:border-blue-400
                ${errors.name 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
                }
              `}
              placeholder="Enter your full name"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

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
              autoComplete="new-password"
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
              placeholder="Create a strong password"
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
          
          {/* Password Requirements */}
          {watchedPassword && passwordValidation && (
            <div className="mt-2 space-y-1">
              {passwordValidation.errors.map((error, index) => (
                <div key={index} className="flex items-center text-xs">
                  {passwordValidation.isValid ? (
                    <Check className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <X className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={passwordValidation.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {error}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              disabled={isFormDisabled}
              className={`
                block w-full pl-10 pr-12 py-3 md:py-3.5 text-base
                border rounded-lg shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
                dark:focus:ring-blue-400 dark:focus:border-blue-400
                ${errors.confirmPassword 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
                }
              `}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isFormDisabled}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 dark:hover:text-gray-300 disabled:cursor-not-allowed"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              {...register('acceptTerms')}
              id="acceptTerms"
              type="checkbox"
              disabled={isFormDisabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="acceptTerms" className="text-gray-700 dark:text-gray-300">
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                Privacy Policy
              </a>
            </label>
          </div>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.acceptTerms.message}
          </p>
        )}

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
              Creating Account...
            </>
          ) : (
            'Create Account'
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

        {/* Google Signup Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
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

      {/* Switch to Login */}
      {onSwitchToLogin && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              disabled={isFormDisabled}
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sign in
            </button>
          </p>
        </div>
      )}
    </div>
  );
};