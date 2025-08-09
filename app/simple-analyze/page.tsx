'use client';

import { useState } from 'react';
import SimpleFileUploader from '@/components/upload/SimpleFileUploader';

export default function SimpleAnalyzePage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeContent, setResumeContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResumeUpload = (result: unknown) => {
    console.log('Resume uploaded:', result);
    setResumeFile(result.file);
    setResumeContent(result.content);
    setError(null);
  };

  const handleUploadError = (errorMessage: string) => {
    console.error('Upload error:', errorMessage);
    setError(errorMessage);
  };

  const handleAnalyze = async () => {
    if (!resumeFile) {
      setError('Please upload a resume first');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', resumeFile);
      formData.append('analysisType', 'normal');

      // Try the simple test endpoint
      console.log('Making API call to /api/simple-test');
      const response = await fetch('/api/simple-test', {
        method: 'POST',
        body: formData,
      });
      console.log('API response status:', response.status);

      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        let errorData;
        try {
          errorData = await response.json();
          console.error('API Error Data:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || `HTTP ${response.status}: Analysis failed`);
      }

      const result = await response.json();
      console.log('Analysis result:', result);
      alert('Analysis completed! Check console for results.');
      
    } catch (err) {
      console.error('Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">🧪 Simple Resume Analysis (Test Mode)</h1>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <p className="text-sm text-blue-800">
            <strong>Test Mode:</strong> This page uses a mock analysis endpoint that should always work.
          </p>
        </div>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Upload Your Resume</h2>
            <SimpleFileUploader
              onUploadComplete={handleResumeUpload}
              onUploadError={handleUploadError}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {resumeContent && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Resume Uploaded Successfully!</h3>
                <p className="text-sm text-green-700">
                  File: {resumeFile?.name} ({resumeContent.length} characters)
                </p>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Content Preview:</h3>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {resumeContent.substring(0, 500)}
                  {resumeContent.length > 500 && '...'}
                </pre>
              </div>

              <button
                onClick={handleAnalyze}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                🧪 Test Analysis (Mock)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}