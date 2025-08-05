'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  File,
  Loader2,
  Eye,
  Trash2,
  Type,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { JobDescriptionParser, JobDescriptionParseResult, JobDescriptionParseException } from '@/lib/parsers/jobDescriptionParser';
import { PDFParser, PDFParseException } from '@/lib/parsers/pdfParser';
import { DOCXParser, DOCXParseException } from '@/lib/parsers/docxParser';

// Types for the component
export interface JobDescriptionUploadResult {
  content: string;
  extractedKeywords: string[];
  requiredSkills: string[];
  experienceLevel: string;
  jobTitle: string;
  metadata: {
    wordCount: number;
    processedDate: Date;
    source: 'text' | 'file';
    fileName?: string;
    fileSize?: number;
  };
  parseResult: JobDescriptionParseResult;
}

export interface JobDescriptionUploaderProps {
  onUploadComplete?: (result: JobDescriptionUploadResult) => void;
  onUploadError?: (error: string) => void;
  onContentChange?: (content: string) => void;
  onClear?: () => void;
  maxFileSize?: number; // in bytes, default 5MB
  maxTextLength?: number; // default 10000 characters
  acceptedFileTypes?: string[];
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
  placeholder?: string;
  defaultValue?: string;
}

interface UploadState {
  textContent: string;
  file: File | null;
  isProcessing: boolean;
  progress: number;
  error: string | null;
  result: JobDescriptionUploadResult | null;
  showPreview: boolean;
  inputMethod: 'text' | 'file';
}

export default function JobDescriptionUploader({
  onUploadComplete,
  onUploadError,
  onContentChange,
  onClear,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  maxTextLength = 10000,
  acceptedFileTypes = ['.pdf', '.docx', '.txt'],
  disabled = false,
  className,
  showPreview = true,
  placeholder = "Paste the job description here...\n\nExample:\nSoftware Engineer - Frontend\n\nWe are looking for a skilled Frontend Developer to join our team...\n\nRequired Skills:\n- React, TypeScript\n- 3+ years experience\n- CSS, HTML5",
  defaultValue = ''
}: JobDescriptionUploaderProps) {
  const [state, setState] = useState<UploadState>({
    textContent: defaultValue,
    file: null,
    isProcessing: false,
    progress: 0,
    error: null,
    result: null,
    showPreview: false,
    inputMethod: 'text'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Validate text content
  const validateTextContent = useCallback((content: string): string | null => {
    if (!content || content.trim().length === 0) {
      return 'Job description cannot be empty';
    }

    if (content.length > maxTextLength) {
      return `Job description must be less than ${maxTextLength.toLocaleString()} characters`;
    }

    if (content.trim().length < 50) {
      return 'Job description is too short (minimum 50 characters)';
    }

    // Validate using parser
    const validation = JobDescriptionParser.validate(content);
    if (!validation.isValid) {
      return validation.errors[0];
    }

    return null;
  }, [maxTextLength]);

  // Validate file before processing
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size must be less than ${formatFileSize(maxFileSize)}`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      return `Only ${acceptedFileTypes.join(', ')} files are supported`;
    }

    // Check if file is empty
    if (file.size === 0) {
      return 'File appears to be empty';
    }

    return null;
  }, [maxFileSize, acceptedFileTypes, formatFileSize]);

  // Process text content
  const processTextContent = useCallback(async (content: string) => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      progress: 20,
      error: null 
    }));

    try {
      // Validate content
      const validationError = validateTextContent(content);
      if (validationError) {
        throw new Error(validationError);
      }

      setState(prev => ({ ...prev, progress: 50 }));

      // Parse job description
      const parseResult = await JobDescriptionParser.parse(content, 'text');

      setState(prev => ({ ...prev, progress: 80 }));

      // Create result object
      const result: JobDescriptionUploadResult = {
        content: parseResult.content,
        extractedKeywords: parseResult.extractedKeywords,
        requiredSkills: parseResult.requiredSkills,
        experienceLevel: parseResult.experienceLevel,
        jobTitle: parseResult.jobTitle,
        metadata: {
          ...parseResult.metadata,
          source: 'text'
        },
        parseResult
      };

      setState(prev => ({ ...prev, progress: 100 }));

      // Update state with successful result
      setState(prev => ({
        ...prev,
        result,
        isProcessing: false,
        progress: 0
      }));

      // Call success callback
      onUploadComplete?.(result);

    } catch (error) {
      let errorMessage = 'Failed to process job description';
      
      if (error instanceof JobDescriptionParseException) {
        errorMessage = error.error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false,
        progress: 0
      }));

      onUploadError?.(errorMessage);
    }
  }, [validateTextContent, onUploadComplete, onUploadError]);

  // Process uploaded file
  const processFile = useCallback(async (file: File) => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      progress: 10,
      error: null 
    }));

    try {
      let content: string;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      setState(prev => ({ ...prev, progress: 30 }));

      // Extract text from file based on type
      if (fileExtension === 'pdf') {
        const pdfResult = await PDFParser.parse(file);
        content = pdfResult.content;
      } else if (fileExtension === 'docx') {
        const docxResult = await DOCXParser.parse(file);
        content = docxResult.content;
      } else if (fileExtension === 'txt') {
        content = await file.text();
      } else {
        throw new Error('Unsupported file type');
      }

      setState(prev => ({ ...prev, progress: 50 }));

      // Parse job description
      const parseResult = await JobDescriptionParser.parse(content, 'file');

      setState(prev => ({ ...prev, progress: 80 }));

      // Create result object
      const result: JobDescriptionUploadResult = {
        content: parseResult.content,
        extractedKeywords: parseResult.extractedKeywords,
        requiredSkills: parseResult.requiredSkills,
        experienceLevel: parseResult.experienceLevel,
        jobTitle: parseResult.jobTitle,
        metadata: {
          ...parseResult.metadata,
          source: 'file',
          fileName: file.name,
          fileSize: file.size
        },
        parseResult
      };

      setState(prev => ({ ...prev, progress: 100 }));

      // Update state with successful result
      setState(prev => ({
        ...prev,
        result,
        textContent: content, // Update text content with file content
        isProcessing: false,
        progress: 0
      }));

      // Call success callback
      onUploadComplete?.(result);

    } catch (error) {
      let errorMessage = 'Failed to process document';
      
      if (error instanceof PDFParseException || error instanceof DOCXParseException || error instanceof JobDescriptionParseException) {
        errorMessage = error.error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false,
        progress: 0
      }));

      onUploadError?.(errorMessage);
    }
  }, [onUploadComplete, onUploadError]);

  // Handle text input change
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setState(prev => ({ 
      ...prev, 
      textContent: content, 
      error: null, 
      result: null,
      inputMethod: 'text'
    }));
    onContentChange?.(content);
  }, [onContentChange]);

  // Handle text analysis
  const handleAnalyzeText = useCallback(async () => {
    if (state.textContent.trim()) {
      await processTextContent(state.textContent);
    }
  }, [state.textContent, processTextContent]);

  // Handle file drop or selection
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0]; // Take first file only
    
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      return;
    }

    // Update state with new file
    setState(prev => ({
      ...prev,
      file,
      error: null,
      result: null,
      inputMethod: 'file'
    }));

    // Process the file
    await processFile(file);
  }, [validateFile, processFile]);

  // Handle file rejection
  const onDropRejected = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: `Please upload only ${acceptedFileTypes.join(', ')} files`
    }));
  }, [acceptedFileTypes]);

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: disabled || state.isProcessing,
    multiple: false,
    noClick: true // We'll handle clicks manually
  });

  // Handle clear/reset
  const handleClear = useCallback(() => {
    setState({
      textContent: '',
      file: null,
      isProcessing: false,
      progress: 0,
      error: null,
      result: null,
      showPreview: false,
      inputMethod: 'text'
    });
    onClear?.();
  }, [onClear]);

  // Toggle preview
  const togglePreview = useCallback(() => {
    setState(prev => ({ ...prev, showPreview: !prev.showPreview }));
  }, []);

  // Handle file input click
  const handleFileInputClick = useCallback(() => {
    if (!disabled && !state.isProcessing) {
      fileInputRef.current?.click();
    }
  }, [disabled, state.isProcessing]);

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Input Method Tabs - Mobile-first */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setState(prev => ({ ...prev, inputMethod: 'text', error: null }))}
          disabled={disabled || state.isProcessing}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
            "min-h-[44px] touch-manipulation", // Mobile-first touch targets
            state.inputMethod === 'text'
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Type className="w-4 h-4" />
          <span>Paste Text</span>
        </button>
        <button
          onClick={() => setState(prev => ({ ...prev, inputMethod: 'file', error: null }))}
          disabled={disabled || state.isProcessing}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
            "min-h-[44px] touch-manipulation border-t sm:border-t-0 sm:border-l border-border",
            state.inputMethod === 'file'
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Upload className="w-4 h-4" />
          <span>Upload File</span>
        </button>
      </div>

      {/* Text Input Method */}
      {state.inputMethod === 'text' && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={state.textContent}
              onChange={handleTextChange}
              placeholder={placeholder}
              disabled={disabled || state.isProcessing}
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

          {/* Analyze button - mobile-first */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleAnalyzeText}
              disabled={disabled || state.isProcessing || !state.textContent.trim()}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3",
                "min-h-[44px] text-sm font-medium rounded-lg transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "touch-manipulation"
              )}
            >
              {state.isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Briefcase className="w-4 h-4" />
                  <span>Analyze Job Description</span>
                </>
              )}
            </button>
            
            {(state.textContent || state.result) && (
              <button
                onClick={handleClear}
                disabled={disabled || state.isProcessing}
                className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors touch-manipulation"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* File Upload Method */}
      {state.inputMethod === 'file' && (
        <div
          {...getRootProps()}
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
            "min-h-[160px] sm:min-h-[180px] md:min-h-[200px] p-4 sm:p-6",
            "flex flex-col items-center justify-center text-center touch-manipulation",
            {
              "border-border bg-background hover:border-primary/50 hover:bg-muted/30": 
                !isDragActive && !isDragReject && !state.error && !state.result,
              "border-primary bg-primary/5 text-primary": 
                isDragActive && !isDragReject,
              "border-destructive bg-destructive/5 text-destructive": 
                isDragReject,
              "border-destructive bg-destructive/5": 
                state.error,
              "border-success bg-success/5": 
                state.result && !state.error,
              "opacity-50 cursor-not-allowed": 
                disabled || state.isProcessing,
              "border-primary bg-primary/5": 
                state.isProcessing
            }
          )}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          
          {state.isProcessing ? (
            // Processing State
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Processing document...
                </p>
                <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {state.progress < 30 && 'Reading file...'}
                  {state.progress >= 30 && state.progress < 50 && 'Extracting content...'}
                  {state.progress >= 50 && state.progress < 80 && 'Analyzing job description...'}
                  {state.progress >= 80 && 'Finalizing...'}
                </p>
              </div>
            </div>
          ) : state.result && state.file ? (
            // Success State
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Job description processed successfully
                </p>
                <p className="text-xs text-muted-foreground">
                  {state.result.metadata.wordCount} words • {state.result.metadata.fileName}
                </p>
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                {showPreview && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePreview();
                    }}
                    className="btn-touch flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="btn-touch flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-destructive bg-destructive/10 rounded-lg hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              </div>
            </div>
          ) : (
            // Default Upload State
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                {isDragActive ? (
                  <Upload className="w-6 h-6 text-primary" />
                ) : (
                  <FileText className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-base sm:text-lg font-medium text-foreground">
                  {isDragActive 
                    ? 'Drop your job description here' 
                    : 'Upload job description'
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Drag & drop or{' '}
                  <button
                    onClick={handleFileInputClick}
                    className="text-primary hover:underline font-medium"
                  >
                    browse files
                  </button>
                </p>
              </div>
              
              {/* Supported formats */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 bg-muted rounded text-xs">PDF</span>
                <span className="px-2 py-1 bg-muted rounded text-xs">DOCX</span>
                <span className="px-2 py-1 bg-muted rounded text-xs">TXT</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-xs">Max {formatFileSize(maxFileSize)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {state.error && (
        <div className="flex items-start gap-3 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Processing Error</p>
            <p className="text-sm text-destructive/80 mt-1">{state.error}</p>
          </div>
          <button
            onClick={() => setState(prev => ({ ...prev, error: null }))}
            className="p-1 hover:bg-destructive/20 rounded transition-colors"
          >
            <X className="w-4 h-4 text-destructive" />
          </button>
        </div>
      )}

      {/* Success Summary */}
      {state.result && !state.error && (
        <div className="p-3 sm:p-4 bg-success/10 border border-success/20 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-success">Job Description Analyzed</p>
              <p className="text-sm text-success/80 mt-1">
                Found {state.result.requiredSkills.length} technical skills and {state.result.extractedKeywords.length} keywords
              </p>
            </div>
          </div>
          
          {/* Quick summary - mobile-first layout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-background/50 p-2 rounded">
              <p className="font-medium text-foreground">Job Title</p>
              <p className="text-muted-foreground truncate">{state.result.jobTitle}</p>
            </div>
            <div className="bg-background/50 p-2 rounded">
              <p className="font-medium text-foreground">Experience Level</p>
              <p className="text-muted-foreground capitalize">{state.result.experienceLevel}</p>
            </div>
            <div className="bg-background/50 p-2 rounded">
              <p className="font-medium text-foreground">Word Count</p>
              <p className="text-muted-foreground">{state.result.metadata.wordCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content Preview */}
      {state.showPreview && state.result && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-3">
              <File className="w-5 h-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  Job Description Preview
                </p>
                <p className="text-xs text-muted-foreground">
                  {state.result.metadata.wordCount} words
                </p>
              </div>
            </div>
            <button
              onClick={togglePreview}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-3 sm:p-4 max-h-48 sm:max-h-64 overflow-y-auto">
            <pre className="text-xs sm:text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {state.result.content.substring(0, 1000)}
              {state.result.content.length > 1000 && '...'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}