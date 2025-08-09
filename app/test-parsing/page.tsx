'use client';

import { useState } from 'react';
import DocumentUploader from '@/components/upload/DocumentUploader';

export default function TestParsingPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (uploadResult: any) => {
    console.log('Upload completed:', uploadResult);
    setResult(uploadResult);
    setError(null);
  };

  const handleUploadError = (errorMessage: string) => {
    console.error('Upload error:', errorMessage);
    setError(errorMessage);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Document Parsing Test</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Upload a Document</h2>
            <DocumentUploader
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              showPreview={true}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Parsing Successful!</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>File:</strong> {result.metadata.fileName}</p>
                  <p><strong>Type:</strong> {result.metadata.fileType}</p>
                  <p><strong>Word Count:</strong> {result.metadata.wordCount}</p>
                  <p><strong>File Size:</strong> {result.metadata.fileSize} bytes</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Extracted Content (First 500 chars):</h3>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {result.content.substring(0, 500)}
                  {result.content.length > 500 && '...'}
                </pre>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Parse Result Details:</h3>
                <pre className="text-xs text-blue-700 whitespace-pre-wrap">
                  {JSON.stringify(result.parseResult.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}