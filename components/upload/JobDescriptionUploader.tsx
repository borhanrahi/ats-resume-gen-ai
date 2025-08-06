'use client';

import React, { useState, useCallback } from 'react';
import { Type, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface JobDescriptionUploaderProps {
  onContentChange?: (content: string) => void;
  onClear?: () => void;
  maxTextLength?: number; // default 10000 characters
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  defaultValue?: string;
}

interface UploadState {
  textContent: string;
  error: string | null;
}

export default function JobDescriptionUploader({
  onContentChange,
  onClear,
  maxTextLength = 10000,
  disabled = false,
  className,
  placeholder = "Paste the job description here...\n\nExample:\nSoftware Engineer - Frontend\n\nWe are looking for a skilled Frontend Developer to join our team...\n\nRequired Skills:\n- React, TypeScript\n- 3+ years experience\n- CSS, HTML5",
  defaultValue = ''
}: JobDescriptionUploaderProps) {
  const [state, setState] = useState<UploadState>({
    textContent: defaultValue,
    error: null
  });

  // Validate text content
  const validateTextContent = useCallback((content: string): string | null => {
    if (content.length > maxTextLength) {
      return `Job description must be less than ${maxTextLength.toLocaleString()} characters`;
    }

    if (content.trim().length > 0 && content.trim().length < 50) {
      return 'Job description is too short (minimum 50 characters)';
    }

    return null;
  }, [maxTextLength]);

  // Handle text input change
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    const validationError = validateTextContent(content);
    
    setState(prev => ({ 
      ...prev, 
      textContent: content, 
      error: validationError
    }));
    
    onContentChange?.(content);
  }, [onContentChange, validateTextContent]);

  // Handle clear/reset
  const handleClear = useCallback(() => {
    setState({
      textContent: '',
      error: null
    });
    onClear?.();
  }, [onClear]);

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Job Description</span>
        </div>
        {state.textContent && (
          <button
            onClick={handleClear}
            disabled={disabled}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Text Input */}
      <div className="space-y-3">
        <div className="relative">
          <textarea
            value={state.textContent}
            onChange={handleTextChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full min-h-[200px] sm:min-h-[240px] md:min-h-[280px] p-4 text-sm",
              "border border-border rounded-lg resize-y",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "placeholder:text-muted-foreground",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              state.error && "border-destructive focus:ring-destructive"
            )}
            maxLength={maxTextLength}
          />
          
          {/* Character count - mobile-friendly positioning */}
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            {state.textContent.length.toLocaleString()}/{maxTextLength.toLocaleString()}
          </div>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{state.error}</p>
          </div>
        )}

        {/* Success indicator */}
        {state.textContent.trim().length >= 50 && !state.error && (
          <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
            <p className="text-sm text-success">
              Job description ready for analysis ({state.textContent.trim().split(/\s+/).length} words)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}