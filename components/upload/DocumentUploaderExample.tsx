'use client';

import React, { useState } from 'react';
import DocumentUploader, { DocumentUploadResult } from './DocumentUploader';

/**
 * Example component demonstrating how to use the DocumentUploader
 * This shows the mobile-first design in action
 */
export default function DocumentUploaderExample() {
  const [uploadResult, setUploadResult] = useState<DocumentUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (result: DocumentUploadResult) => {
    console.log('Upload completed:', result);
    setUploadResult(result);
    setError(null);
  };

  const handleUploadError = (errorMessage: string) => {
    console.error('Upload error:', errorMessage);
    setError(errorMessage);
    setUploadResult(null);
  };

  const handleFileRemove = () => {
    console.log('File removed');
    setUploadResult(null);
    setError(null);
  };

  return (
    <div className="container-mobile py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Document Uploader Demo
        </h1>
        <p className="text-muted-foreground">
          Upload a PDF or DOCX resume to see the mobile-first design in action.
        </p>
      </div>

      {/* Document Uploader */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Upload Your Resume
        </h2>
        
        <DocumentUploader
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          onFileRemove={handleFileRemove}
          maxFileSize={10 * 1024 * 1024} // 10MB
          acceptedFileTypes={['.pdf', '.docx']}
          showPreview={true}
          className="max-w-2xl"
        />
      </div>

      {/* Results Display */}
      {uploadResult && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Upload Results
          </h2>
          
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">File Name</p>
                <p className="text-foreground">{uploadResult.metadata.fileName}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">File Type</p>
                <p className="text-foreground uppercase">{uploadResult.metadata.fileType}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Word Count</p>
                <p className="text-foreground">{uploadResult.metadata.wordCount.toLocaleString()}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">File Size</p>
                <p className="text-foreground">
                  {(uploadResult.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Content Preview</p>
              <div className="bg-muted rounded-lg p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
                  {uploadResult.content.substring(0, 500)}
                  {uploadResult.content.length > 500 && '...'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-destructive mb-1">Upload Error</h3>
          <p className="text-sm text-destructive/80">{error}</p>
        </div>
      )}

      {/* Mobile-First Design Notes */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Mobile-First Design Features
        </h3>
        
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
            <span>
              <strong>Touch-Friendly:</strong> All interactive elements have minimum 44px touch targets
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
            <span>
              <strong>Responsive Layout:</strong> Adapts from 350px (very small phones) to desktop
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
            <span>
              <strong>Progressive Enhancement:</strong> Basic functionality on mobile, enhanced features on desktop
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
            <span>
              <strong>Mobile-Optimized Interactions:</strong> Tap to upload on mobile, drag-and-drop on desktop
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
            <span>
              <strong>Accessible:</strong> Proper ARIA labels, keyboard navigation, and screen reader support
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}