'use client';

import React, { useState } from 'react';

interface SimpleFileUploaderProps {
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: string) => void;
}

export default function SimpleFileUploader({ onUploadComplete, onUploadError }: SimpleFileUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      setMessage('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);
    setMessage(`Selected: ${file.name}`);
    setIsProcessing(true);

    try {
      // Simple test - just read the file as text
      const text = await file.text();
      console.log('File read successfully, length:', text.length);
      
      // Create a simple result
      const result = {
        file: file,
        content: text.substring(0, 1000), // First 1000 chars
        metadata: {
          fileName: file.name,
          fileType: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx',
          uploadDate: new Date(),
          wordCount: text.split(/\s+/).length,
          fileSize: file.size,
        },
        parseResult: {
          content: text,
          metadata: {
            fileName: file.name,
            fileType: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx',
            uploadDate: new Date(),
            wordCount: text.split(/\s+/).length,
          }
        }
      };

      setMessage(`File processed: ${result.metadata.wordCount} words`);
      onUploadComplete?.(result);
      
    } catch (error) {
      console.error('File processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage(`Error: ${errorMessage}`);
      onUploadError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="space-y-4">
          <div className="text-lg font-medium">
            {isProcessing ? 'Processing...' : 'Upload Resume'}
          </div>
          
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          <div className="text-sm text-gray-500">
            PDF and DOCX files only, max 10MB
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm">{message}</p>
        </div>
      )}
    </div>
  );
}