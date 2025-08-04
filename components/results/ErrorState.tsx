'use client';

import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  error: string;
  onBackHome: () => void;
}

export default function ErrorState({ error, onBackHome }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Results Not Found</h1>
        <p className="text-muted-foreground mb-6">{error || 'The analysis results could not be loaded.'}</p>
        <button
          onClick={onBackHome}
          className="btn-touch bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}