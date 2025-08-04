'use client';

import { ArrowLeft, Download, Share2, FileText, Clock } from 'lucide-react';

interface ResultsHeaderProps {
  fileName: string;
  createdAt: string;
  onBackHome: () => void;
}

export default function ResultsHeader({ fileName, createdAt, onBackHome }: ResultsHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container-mobile py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBackHome}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center space-x-3">
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="container-mobile py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Analysis Results</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-muted-foreground">
                File: <span className="font-medium text-foreground">{fileName}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Analyzed on {new Date(createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Analysis completed in 2.3 seconds
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}