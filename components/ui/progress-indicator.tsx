'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Brain, CheckCircle, AlertCircle, Upload, Download, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSteps, LoadingStep } from '@/components/ui/loading';
import { cn } from '@/lib/utils';

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  estimatedDuration?: number; // in milliseconds
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  progress?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showEstimatedTime?: boolean;
}

/**
 * Comprehensive progress indicator for multi-step operations
 */
export function ProgressIndicator({
  steps,
  currentStep,
  progress,
  title,
  subtitle,
  className,
  variant = 'default',
  showEstimatedTime = true,
}: ProgressIndicatorProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showEstimatedTime && steps.length > 0 && currentStep >= 0) {
      const totalEstimatedTime = steps.reduce((sum, step) => 
        sum + (step.estimatedDuration || 5000), 0
      );
      
      const completedTime = steps
        .slice(0, currentStep)
        .reduce((sum, step) => sum + (step.estimatedDuration || 5000), 0);
      
      const remaining = Math.max(0, totalEstimatedTime - completedTime);
      setEstimatedTimeRemaining(remaining);
    }
  }, [currentStep, steps, showEstimatedTime]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getOverallProgress = (): number => {
    if (progress !== undefined) return progress;
    if (steps.length === 0) return 0;
    return Math.round((currentStep / steps.length) * 100);
  };

  const convertToLoadingSteps = (): LoadingStep[] => {
    return steps.map((step, index) => ({
      id: step.id,
      label: step.label,
      description: step.description,
      icon: step.icon,
      status: index < currentStep ? 'completed' : 
              index === currentStep ? 'active' : 'pending',
    }));
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Progress value={getOverallProgress()} className="flex-1" />
        <div className="text-sm text-muted-foreground min-w-0">
          {currentStep < steps.length ? steps[currentStep].label : 'Complete'}
        </div>
        <div className="text-xs text-muted-foreground">
          {getOverallProgress()}%
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center space-y-1">
            {title && (
              <h3 className="text-lg font-semibold">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {getOverallProgress()}%
            </span>
          </div>
          <Progress value={getOverallProgress()} className="w-full" />
        </div>

        {/* Time Information */}
        {showEstimatedTime && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Elapsed: {formatTime(elapsedTime)}</span>
            {estimatedTimeRemaining !== null && (
              <span>Est. remaining: {formatTime(estimatedTimeRemaining)}</span>
            )}
          </div>
        )}

        {/* Step Details */}
        {variant === 'detailed' ? (
          <LoadingSteps 
            steps={convertToLoadingSteps()} 
            currentStep={currentStep}
          />
        ) : (
          <div className="space-y-2">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const IconComponent = step.icon || FileText;

              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg transition-colors',
                    isActive && 'bg-primary/5 border border-primary/20',
                    isCompleted && 'opacity-75'
                  )}
                >
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : isActive ? (
                      <IconComponent className="w-4 h-4 text-primary animate-pulse" />
                    ) : (
                      <IconComponent className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium',
                      isActive && 'text-primary',
                      isCompleted && 'text-muted-foreground',
                      !isActive && !isCompleted && 'text-muted-foreground'
                    )}>
                      {step.label}
                    </p>
                    {step.description && isActive && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Predefined progress configurations for common operations
 */
export const PROGRESS_CONFIGS = {
  DOCUMENT_ANALYSIS: {
    title: 'Analyzing Your Resume',
    subtitle: 'Please wait while we process your document',
    steps: [
      {
        id: 'upload',
        label: 'Uploading Document',
        description: 'Securely uploading your resume',
        estimatedDuration: 2000,
        icon: Upload,
      },
      {
        id: 'parse',
        label: 'Parsing Content',
        description: 'Extracting text and structure',
        estimatedDuration: 3000,
        icon: FileText,
      },
      {
        id: 'analyze',
        label: 'AI Analysis',
        description: 'Analyzing with advanced AI models',
        estimatedDuration: 8000,
        icon: Brain,
      },
      {
        id: 'generate',
        label: 'Generating Report',
        description: 'Creating your personalized report',
        estimatedDuration: 2000,
        icon: CheckCircle,
      },
    ],
  },

  RESUME_EXPORT: {
    title: 'Exporting Resume',
    subtitle: 'Generating your professional resume',
    steps: [
      {
        id: 'prepare',
        label: 'Preparing Content',
        description: 'Organizing your resume data',
        estimatedDuration: 1000,
        icon: FileText,
      },
      {
        id: 'format',
        label: 'Applying Template',
        description: 'Formatting with selected template',
        estimatedDuration: 2000,
        icon: Zap,
      },
      {
        id: 'generate',
        label: 'Generating File',
        description: 'Creating PDF/DOCX file',
        estimatedDuration: 3000,
        icon: Download,
      },
    ],
  },

  AI_RESUME_BUILDER: {
    title: 'Building Your Resume',
    subtitle: 'AI is creating your personalized resume',
    steps: [
      {
        id: 'analyze_job',
        label: 'Analyzing Job Requirements',
        description: 'Understanding the position requirements',
        estimatedDuration: 3000,
        icon: Brain,
      },
      {
        id: 'generate_content',
        label: 'Generating Content',
        description: 'Creating tailored resume sections',
        estimatedDuration: 8000,
        icon: FileText,
      },
      {
        id: 'optimize',
        label: 'Optimizing Keywords',
        description: 'Enhancing for ATS compatibility',
        estimatedDuration: 4000,
        icon: Zap,
      },
      {
        id: 'finalize',
        label: 'Finalizing Resume',
        description: 'Applying final touches',
        estimatedDuration: 2000,
        icon: CheckCircle,
      },
    ],
  },
};

/**
 * Hook for managing progress state
 */
export function useProgressIndicator(config: typeof PROGRESS_CONFIGS[keyof typeof PROGRESS_CONFIGS]) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStep = () => {
    setCurrentStep(prev => {
      const next = prev + 1;
      if (next >= config.steps.length) {
        setIsComplete(true);
        return prev;
      }
      return next;
    });
  };

  const setStep = (step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, config.steps.length - 1)));
    setIsComplete(step >= config.steps.length);
  };

  const reset = () => {
    setCurrentStep(0);
    setIsComplete(false);
    setError(null);
  };

  const setErrorState = (errorMessage: string) => {
    setError(errorMessage);
  };

  return {
    currentStep,
    isComplete,
    error,
    nextStep,
    setStep,
    reset,
    setError: setErrorState,
    config,
  };
}