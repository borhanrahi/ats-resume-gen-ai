'use client';

import { useState } from 'react';
import SimpleFileUploader from '@/components/upload/SimpleFileUploader';

export default function TestUploadPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (uploadResult: unknown) => {
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">File Upload Test</h1>
        
        <div className="space-y-6">
          <SimpleFileUploader
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Success!</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>File:</strong> {result.metadata.fileName}</p>
                  <p><strong>Type:</strong> {result.metadata.fileType}</p>
                  <p><strong>Word Count:</strong> {result.metadata.wordCount}</p>
                  <p><strong>Content Length:</strong> {result.content.length} characters</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Content Preview:</h3>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {result.content.substring(0, 500)}
                  {result.content.length > 500 && '...'}
                </pre>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Test Analysis API:</h3>
                <button
                  onClick={async () => {
                    try {
                      const formData = new FormData();
                      formData.append('file', result.file);
                      formData.append('analysisType', 'normal');

                      const response = await fetch('/api/test-parsing', {
                        method: 'POST',
                        body: formData,
                      });

                      const apiResult = await response.json();
                      console.log('API test result:', apiResult);
                      alert(response.ok ? 'API test successful!' : `API test failed: ${apiResult.error}`);
                    } catch (err) {
                      console.error('API test error:', err);
                      alert('API test failed');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Test API Parsing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}