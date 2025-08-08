'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SimpleUploaderProps {
  onFileSelect?: (file: File) => void;
  onError?: (error: string) => void;
}

export default function SimpleUploader({ onFileSelect, onError }: SimpleUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      setError('No file selected');
      return;
    }

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.docx'];
    
    const isValidType = validTypes.includes(file.type) || 
                       validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
      setError('Please select a PDF or DOCX file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      <div
        onClick={handleClick}
        className="relative border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all duration-200"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
            {selectedFile ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <Upload className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-foreground mb-2">
              {selectedFile ? 'File Selected' : 'Upload your resume'}
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedFile ? selectedFile.name : 'Click to browse or drag & drop'}
            </p>
            {selectedFile && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatFileSize(selectedFile.size)}
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-muted rounded">PDF</span>
            <span className="px-2 py-1 bg-muted rounded">DOCX</span>
            <span>• Max 10MB</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* File Info */}
      {selectedFile && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}