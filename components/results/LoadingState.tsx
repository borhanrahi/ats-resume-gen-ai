'use client';

export default function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="loading-skeleton w-16 h-16 rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    </div>
  );
}