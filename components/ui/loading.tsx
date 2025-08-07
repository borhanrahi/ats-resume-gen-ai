'use client';

import React from 'react';
import { Loader2, FileText, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'progress';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  progress?: number;
  steps?: LoadingStep[];
  currentStep?: number;
  className?: string;
}

export interface LoadingStep {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  status?: 'pending' | 'active' | 'completed' | 'error';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const messageSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

/**
 * Spinner Loading Component
 */
export function LoadingSpinner({ 
  size = 'md', 
  message, 
  className 
}: Pick<LoadingProps, 'size' | 'message' | 'className'>) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {message && (
        <p className={cn('text-muted-foreground text-center', messageSizeClasses[size])}>
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * Dots Loading Component
 */
export function LoadingDots({ 
  size = 'md', 
  message, 
  className 
}: Pick<LoadingProps, 'size' | 'message' | 'className'>) {
  const dotSize = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-primary rounded-full animate-pulse',
              dotSize[size]
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s',
            }}
          />
        ))}
      </div>
      {message && (
        <p className={cn('text-muted-foreground text-center', messageSizeClasses[size])}>
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * Pulse Loading Component
 */
export function LoadingPulse({ 
  size = 'md', 
  message, 
  className 
}: Pick<LoadingProps, 'size' | 'message' | 'className'>) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className={cn(
        'bg-primary rounded-full animate-pulse',
        sizeClasses[size]
      )} />
      {message && (
        <p className={cn('text-muted-foreground text-center', messageSizeClasses[size])}>
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * Skeleton Loading Component
 */
export function LoadingSkeleton({ 
  className,
  lines = 3,
}: { 
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-muted rounded animate-pulse',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Progress Loading Component
 */
export function LoadingProgress({ 
  progress = 0, 
  message, 
  className 
}: Pick<LoadingProps, 'progress' | 'message' | 'className'>) {
  return (
    <div className={cn('w-full max-w-md space-y-3', className)}>
      <Progress value={progress} className="w-full" />
      <div className="flex justify-between items-center">
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
        <span className="text-sm font-medium">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

/**
 * Step-by-step Loading Component
 */
export function LoadingSteps({ 
  steps = [], 
  currentStep = 0, 
  className 
}: Pick<LoadingProps, 'steps' | 'currentStep' | 'className'>) {
  const getStepIcon = (step: LoadingStep, index: number) => {
    const IconComponent = step.icon || FileText;
    
    if (step.status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    
    if (step.status === 'error') {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    
    if (step.status === 'active' || index === currentStep) {
      return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    }
    
    return <IconComponent className="w-5 h-5 text-muted-foreground" />;
  };

  const getStepStatus = (step: LoadingStep, index: number) => {
    if (step.status) return step.status;
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className={cn('w-full max-w-md space-y-4', className)}>
      {steps.map((step, index) => {
        const status = getStepStatus(step, index);
        
        return (
          <div
            key={step.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg transition-colors',
              status === 'active' && 'bg-primary/5 border border-primary/20',
              status === 'completed' && 'bg-green-50 dark:bg-green-950/20',
              status === 'error' && 'bg-red-50 dark:bg-red-950/20'
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getStepIcon(step, index)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-medium',
                status === 'active' && 'text-primary',
                status === 'completed' && 'text-green-700 dark:text-green-300',
                status === 'error' && 'text-red-700 dark:text-red-300',
                status === 'pending' && 'text-muted-foreground'
              )}>
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Main Loading Component
 */
export function Loading({
  variant = 'spinner',
  size = 'md',
  message,
  progress,
  steps,
  currentStep,
  className,
}: LoadingProps) {
  switch (variant) {
    case 'dots':
      return <LoadingDots size={size} message={message} className={className} />;
    case 'pulse':
      return <LoadingPulse size={size} message={message} className={className} />;
    case 'skeleton':
      return <LoadingSkeleton className={className} />;
    case 'progress':
      return <LoadingProgress progress={progress} message={message} className={className} />;
    case 'spinner':
    default:
      if (steps && steps.length > 0) {
        return <LoadingSteps steps={steps} currentStep={currentStep} className={className} />;
      }
      return <LoadingSpinner size={size} message={message} className={className} />;
  }
}

/**
 * Full-screen Loading Overlay
 */
export function LoadingOverlay({
  variant = 'spinner',
  size = 'lg',
  message = 'Loading...',
  progress,
  steps,
  currentStep,
  className,
}: LoadingProps) {
  return (
    <div className={cn(
      'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
      'flex items-center justify-center p-4',
      className
    )}>
      <div className="bg-card border rounded-lg shadow-lg p-6 max-w-sm w-full">
        <Loading
          variant={variant}
          size={size}
          message={message}
          progress={progress}
          steps={steps}
          currentStep={currentStep}
        />
      </div>
    </div>
  );
}

/**
 * Inline Loading Component for buttons and small spaces
 */
export function InlineLoading({
  size = 'sm',
  message,
  className,
}: Pick<LoadingProps, 'size' | 'message' | 'className'>) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {message && (
        <span className={cn('text-muted-foreground', messageSizeClasses[size])}>
          {message}
        </span>
      )}
    </div>
  );
}

export default Loading;