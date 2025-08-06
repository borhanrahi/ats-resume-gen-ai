'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  AlertCircle, 
  CheckCircle,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIResumePrompt } from './AIResumePrompt';
import { AIResumeReview } from './AIResumeReview';
import { AIResumeBuilder as AIResumeBuilderService } from '@/lib/ai/aiResumeBuilder';
import type { 
  AIResumePrompt as AIResumePromptType, 
  AIGeneratedContent, 
  AIBuilderState 
} from '@/types/ai-builder';
import type { ResumeData } from '@/types/resume';

interface AIResumeBuilderProps {
  onComplete: (resumeData: ResumeData) => void;
  onCancel: () => void;
  className?: string;
}

export function AIResumeBuilder({
  onComplete,
  onCancel,
  className = ''
}: AIResumeBuilderProps) {
  const [state, setState] = useState<AIBuilderState>({
    step: 'prompt',
    prompt: {},
    generatedContent: null,
    isGenerating: false,
    error: null,
    progress: 0
  });

  // Initialize AI service (in real app, this would come from context/config)
  const [aiService] = useState(() => {
    // This would normally come from environment/config
    const config = {
      tier: 'premium' as const,
      openRouterConfig: {
        apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || 'test-key',
        model: 'anthropic/claude-3.5-sonnet'
      }
    };
    
    return new AIResumeBuilderService(config);
  });

  const handlePromptSubmit = useCallback(async (prompt: AIResumePromptType) => {
    setState(prev => ({
      ...prev,
      step: 'generating',
      prompt,
      isGenerating: true,
      error: null,
      progress: 0
    }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 500);

      const generatedContent = await aiService.generateResumeContent(prompt);

      clearInterval(progressInterval);

      setState(prev => ({
        ...prev,
        step: 'review',
        generatedContent,
        isGenerating: false,
        progress: 100
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        step: 'prompt',
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate resume content',
        progress: 0
      }));
    }
  }, [aiService]);

  const handleRegenerate = useCallback(async (prompt: AIResumePromptType) => {
    setState(prev => ({
      ...prev,
      step: 'generating',
      prompt,
      isGenerating: true,
      error: null,
      progress: 0
    }));

    try {
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 15, 90)
        }));
      }, 400);

      const generatedContent = await aiService.generateResumeContent(prompt);

      clearInterval(progressInterval);

      setState(prev => ({
        ...prev,
        step: 'review',
        generatedContent,
        isGenerating: false,
        progress: 100
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        step: 'review',
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to regenerate resume content'
      }));
    }
  }, [aiService]);

  const handleAcceptContent = useCallback((content: AIGeneratedContent) => {
    // Convert AI content to ResumeData format
    const resumeData = aiService.convertToResumeData(content, {
      name: '',
      email: '',
      phone: '',
      location: ''
    });

    onComplete(resumeData);
  }, [aiService, onComplete]);

  const handleEditInEditor = useCallback((resumeData: ResumeData) => {
    onComplete(resumeData);
  }, [onComplete]);

  const handleBackToPrompt = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: 'prompt',
      error: null
    }));
  }, []);

  const renderGeneratingStep = () => (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <Card>
        <CardContent className="p-8 md:p-12 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Generating Your Resume
            </h2>
            <p className="text-gray-600 mb-6">
              Our AI is crafting professional, ATS-optimized content based on your information...
            </p>
          </motion.div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${state.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-gray-500 mb-6">
            {state.progress}% complete
          </p>

          {/* Loading animation */}
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">
              {state.progress < 30 && 'Analyzing your information...'}
              {state.progress >= 30 && state.progress < 60 && 'Crafting professional content...'}
              {state.progress >= 60 && state.progress < 90 && 'Optimizing for ATS systems...'}
              {state.progress >= 90 && 'Finalizing your resume...'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderError = () => (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {state.error}
        </AlertDescription>
      </Alert>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="outline"
          onClick={handleBackToPrompt}
          className="min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Form
        </Button>
        <Button
          onClick={onCancel}
          className="min-h-[44px]"
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <AnimatePresence mode="wait">
        {state.step === 'prompt' && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AIResumePrompt
              onSubmit={handlePromptSubmit}
              onCancel={onCancel}
              isLoading={state.isGenerating}
            />
            {state.error && renderError()}
          </motion.div>
        )}

        {state.step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen flex items-center justify-center"
          >
            {renderGeneratingStep()}
          </motion.div>
        )}

        {state.step === 'review' && state.generatedContent && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AIResumeReview
              generatedContent={state.generatedContent}
              originalPrompt={state.prompt as AIResumePromptType}
              onAccept={handleAcceptContent}
              onRegenerate={handleRegenerate}
              onEdit={handleEditInEditor}
              isRegenerating={state.isGenerating}
            />
            {state.error && (
              <div className="max-w-4xl mx-auto px-4 md:px-6 mt-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {state.error}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}