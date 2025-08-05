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
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PDFParser, PDFParseResult, PDFParseException } from '@/lib/parsers/pdfParser';
import { DOCXParser, DOCXParseResult, DOCXParseException } from '@/lib/parsers/docxParser';

// Types for the component
export interface DocumentUploadResult {
  file: File;
  content: string;
  metadata: {
    fileName: string;
    fileType: 'pdf' | 'docx';
    uploadDate: Date;
    wordCount: number;
    fileSize: number;
  };
  parseResult: PDFParseResult | DOCXParseResult;
}

export interface DocumentUploaderProps {
  onUploadComplete?: (result: DocumentUploadResult) => void;
  onUploadError?: (error: string) => void;
  onFileRemove?: () => void;
  maxFileSize?: number; // in bytes, default 10MB
  acceptedFileTypes?: string[];
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
  allowMultiple?: boolean;
}

interface UploadState {
  file: File | null;
  isUploading: boolean;
  isProcessing: boolean;
  progress: number;
  error: string | null;
  result: DocumentUploadResult | null;
  showPreview: boolean;
}

export default function DocumentUploader({
  onUploadComplete,
  onUploadError,
  onFileRemove,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = ['.pdf', '.docx'],
  disabled = false,
  className,
  showPreview = true,
  allowMultiple = false
}: DocumentUploaderProps) {
  const [state, setState] = useState<UploadState>({
    file: null,
    isUploading: false,
    isProcessing: false,
    progress: 0,
    error: null,
    result: null,
    showPreview: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

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

  // Process uploaded file
  const processFile = useCallback(async (file: File) => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      progress: 10,
      error: null 
    }));

    try {
      let parseResult: PDFParseResult | DOCXParseResult;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      // Update progress
      setState(prev => ({ ...prev, progress: 30 }));

      if (fileExtension === 'pdf') {
        parseResult = await PDFParser.parse(file);
      } else if (fileExtension === 'docx') {
        parseResult = await DOCXParser.parse(file);
      } else {
        throw new Error('Unsupported file type');
      }

      // Update progress
      setState(prev => ({ ...prev, progress: 70 }));

      // Create result object
      const result: DocumentUploadResult = {
        file,
        content: parseResult.content,
        metadata: {
          fileName: parseResult.metadata.fileName,
          fileType: parseResult.metadata.fileType,
          uploadDate: parseResult.metadata.uploadDate,
          wordCount: parseResult.metadata.wordCount,
          fileSize: file.size
        },
        parseResult
      };

      // Update progress
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
      let errorMessage = 'Failed to process document';
      
      if (error instanceof PDFParseException || error instanceof DOCXParseException) {
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
      isUploading: true
    }));

    // Process the file
    await processFile(file);
    
    setState(prev => ({ ...prev, isUploading: false }));
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
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: allowMultiple ? undefined : 1,
    disabled: disabled || state.isProcessing,
    multiple: allowMultiple
  });

  // Handle manual file input click
  const handleFileInputClick = useCallback(() => {
    if (!disabled && !state.isProcessing) {
      fileInputRef.current?.click();
    }
  }, [disabled, state.isProcessing]);

  // Handle file removal
  const handleRemoveFile = useCallback(() => {
    setState({
      file: null,
      isUploading: false,
      isProcessing: false,
      progress: 0,
      error: null,
      result: null,
      showPreview: false
    });
    onFileRemove?.();
  }, [onFileRemove]);

  // Toggle preview
  const togglePreview = useCallback(() => {
    setState(prev => ({ ...prev, showPreview: !prev.showPreview }));
  }, []);

  // Get upload area styling based on state
  const getUploadAreaClasses = useCallback(() => {
    return cn(
      // Base mobile-first styles - 44px+ touch targets
      'relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer',
      'min-h-[120px] p-4 flex flex-col items-center justify-center',
      'text-center touch-manipulation', // Optimize for touch
      
      // Responsive sizing - larger on bigger screens
      'sm:min-h-[140px] sm:p-5',
      'md:min-h-[160px] md:p-6',
      'lg:min-h-[180px] lg:p-8',
      
      // State-based styling
      {
        // Default state
        'border-border bg-background hover:border-primary/50 hover:bg-muted/30': 
          !isDragActive && !isDragReject && !state.error && !state.result,
        
        // Drag active state
        'border-primary bg-primary/5 text-primary': 
          isDragActive && !isDragReject,
        
        // Drag reject state
        'border-destructive bg-destructive/5 text-destructive': 
          isDragReject,
        
        // Error state
        'border-destructive bg-destructive/5': 
          state.error,
        
        // Success state
        'border-success bg-success/5': 
          state.result && !state.error,
        
        // Disabled state
        'opacity-50 cursor-not-allowed': 
          disabled || state.isProcessing,
        
        // Processing state
        'border-primary bg-primary/5': 
          state.isProcessing
      },
      
      className
    );
  }, [isDragActive, isDragReject, state.error, state.result, state.isProcessing, disabled, className]);

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={getUploadAreaClasses()}
        role="button"
        tabIndex={0}
        aria-label="Upload document"
      >
        <input {...getInputProps()} ref={fileInputRef} />
        
        {/* Upload Content */}
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
                {state.progress >= 30 && state.progress < 70 && 'Extracting content...'}
                {state.progress >= 70 && 'Finalizing...'}
              </p>
            </div>
          </div>
        ) : state.result ? (
          // Success State
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Document processed successfully
              </p>
              <p className="text-xs text-muted-foreground">
                {state.result.metadata.wordCount} words • {formatFileSize(state.result.metadata.fileSize)}
              </p>
            </div>
            
            {/* Action buttons - mobile-first with proper touch targets */}
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
                  handleRemoveFile();
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
                  ? 'Drop your document here' 
                  : 'Upload your resume'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Drag & drop or tap to browse files
              </p>
            </div>
            
            {/* Supported formats - responsive layout */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 bg-muted rounded text-xs">PDF</span>
              <span className="px-2 py-1 bg-muted rounded text-xs">DOCX</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-xs">Max {formatFileSize(maxFileSize)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="flex items-start gap-3 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Upload Error</p>
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

      {/* File Preview */}
      {state.showPreview && state.result && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-3">
              <File className="w-5 h-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {state.result.metadata.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {state.result.metadata.wordCount} words • {formatFileSize(state.result.metadata.fileSize)}
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