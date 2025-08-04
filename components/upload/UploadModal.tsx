'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisType: 'normal' | 'job';
}

export default function UploadModal({ isOpen, onClose, analysisType }: UploadModalProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    onDropRejected: () => {
      setError('Please upload only PDF, DOC, or DOCX files');
    }
  });

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please upload a resume file');
      return;
    }

    if (analysisType === 'job' && !jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setError('');

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('analysisType', analysisType);
      if (analysisType === 'job') {
        formData.append('jobDescription', jobDescription);
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      
      setProgress(100);
      
      // Store result in localStorage for simple results page
      if (result.result) {
        localStorage.setItem('latestAnalysis', JSON.stringify(result.result));
      }
      
      // Navigate to results page (simple for free users)
      setTimeout(() => {
        router.push('/results');
      }, 500);

    } catch {
      setError('Analysis failed. Please try again.');
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {analysisType === 'normal' ? 'Upload Resume for ATS Check' : 'Upload Resume & Job Description'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {analysisType === 'normal' 
                ? 'Get comprehensive ATS compatibility analysis'
                : 'Compare your resume against specific job requirements'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={isAnalyzing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-3 text-foreground">
              Resume File (PDF, DOC, DOCX)
            </label>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
                ${isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : file 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2 text-foreground">
                    {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Drag & drop or click to browse files
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                    <span className="px-2 py-1 bg-muted rounded">PDF</span>
                    <span className="px-2 py-1 bg-muted rounded">DOC</span>
                    <span className="px-2 py-1 bg-muted rounded">DOCX</span>
                    <span>• Max 10MB</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Job Description (only for job-specific analysis) */}
          {analysisType === 'job' && (
            <div>
              <label className="block text-sm font-medium mb-3 text-foreground">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here..."
                className="w-full h-32 p-4 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground placeholder:text-muted-foreground"
                disabled={isAnalyzing}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Include job requirements, responsibilities, and qualifications for better analysis
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Analyzing resume...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {progress < 30 && 'Parsing document...'}
                {progress >= 30 && progress < 60 && 'Analyzing content...'}
                {progress >= 60 && progress < 90 && 'Generating recommendations...'}
                {progress >= 90 && 'Finalizing results...'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 h-12 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              disabled={isAnalyzing}
            >
              Cancel
            </button>
            <button
              onClick={handleAnalyze}
              className="flex-1 h-12 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={!file || isAnalyzing || (analysisType === 'job' && !jobDescription.trim())}
            >
              {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}