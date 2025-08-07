'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useErrorHandling } from '@/lib/hooks/useErrorHandling';
import { useLoadingManager } from '@/lib/utils/loadingManager';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Loading } from '@/components/ui/loading';
import { OfflineGuard } from '@/components/layout/OfflineIndicator';

/**
 * Example component demonstrating comprehensive error handling and user feedback
 */
export default function ErrorHandlingExample() {
  const [fileName, setFileName] = useState('');
  const [simulateError, setSimulateError] = useState('');
  const { 
    handleError, 
    handleSuccess, 
    handleWarning, 
    handleFileError,
    withErrorHandling 
  } = useErrorHandling();
  const { startLoading, stopLoading, isLoading } = useLoadingManager();

  // Simulate different types of operations with error handling
  const simulateFileUpload = async () => {
    const loadingId = startLoading('document_upload', 'Uploading your file...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload time
      
      if (simulateError === 'network') {
        throw new Error('Network connection failed');
      } else if (simulateError === 'file_too_large') {
        throw new Error('File too large');
      } else if (simulateError === 'parse') {
        throw new Error('Invalid PDF structure');
      }
      
      handleSuccess('File uploaded successfully!', `${fileName} has been processed.`);
    } catch (error) {
      handleFileError(error, fileName);
    } finally {
      stopLoading(loadingId);
    }
  };

  const simulateAnalysis = async () => {
    const result = await withErrorHandling(
      async () => {
        const loadingId = startLoading('ai_analysis', 'Analyzing your resume...');
        
        try {
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          if (simulateError === 'ai_api') {
            throw new Error('OpenRouter API key invalid');
          } else if (simulateError === 'usage_limit') {
            throw new Error('Daily usage limit exceeded');
          }
          
          return { score: 85, recommendations: ['Improve keywords', 'Add more experience'] };
        } finally {
          stopLoading(loadingId);
        }
      },
      { fileName, operation: 'analysis' },
      {
        successMessage: 'Analysis completed successfully!',
        showErrorToast: true,
      }
    );

    if (result.data) {
      console.log('Analysis result:', result.data);
    }
  };

  const simulateAuthError = () => {
    const authError = new Error('JWT token expired');
    handleError(authError, { action: 'premium_access' });
  };

  const simulateWarning = () => {
    handleWarning(
      'Storage almost full',
      'You have used 90% of your local storage. Consider clearing old data.',
      {
        label: 'Clear Storage',
        onClick: () => {
          localStorage.clear();
          handleSuccess('Storage cleared', 'All local data has been removed.');
        }
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Error Handling & User Feedback Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="resume.pdf"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="errorType">Simulate Error</Label>
              <select
                id="errorType"
                value={simulateError}
                onChange={(e) => setSimulateError(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">No Error</option>
                <option value="network">Network Error</option>
                <option value="file_too_large">File Too Large</option>
                <option value="parse">Parse Error</option>
                <option value="ai_api">AI API Error</option>
                <option value="usage_limit">Usage Limit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <OfflineGuard feature="upload">
              <Button
                onClick={simulateFileUpload}
                disabled={isLoading || !fileName}
                className="w-full"
              >
                {isLoading ? (
                  <Loading variant="spinner" size="sm" />
                ) : (
                  'Upload File'
                )}
              </Button>
            </OfflineGuard>

            <OfflineGuard feature="analyze">
              <Button
                onClick={simulateAnalysis}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                Analyze Resume
              </Button>
            </OfflineGuard>

            <Button
              onClick={simulateAuthError}
              variant="outline"
              className="w-full"
            >
              Auth Error
            </Button>

            <Button
              onClick={simulateWarning}
              variant="outline"
              className="w-full"
            >
              Show Warning
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading States Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Loading States</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Spinner Loading</h4>
              <Loading variant="spinner" message="Processing..." />
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Progress Loading</h4>
              <Loading variant="progress" progress={65} message="Uploading..." />
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Dots Loading</h4>
              <Loading variant="dots" message="Analyzing..." />
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Skeleton Loading</h4>
              <Loading variant="skeleton" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Error Display Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorDisplay
            error={{
              type: 'NETWORK_ERROR',
              message: 'Connection failed',
              userMessage: 'Connection issue detected. Please check your internet connection and try again.',
              technicalMessage: 'NETWORK_ERROR: Connection failed',
              timestamp: Date.now(),
              recoverable: true,
              recoveryActions: [
                {
                  label: 'Check Connection',
                  action: () => window.open('https://www.google.com', '_blank'),
                  icon: 'wifi',
                },
                {
                  label: 'Try Again',
                  action: () => window.location.reload(),
                  icon: 'refresh',
                },
              ],
            }}
            showTechnicalDetails={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}