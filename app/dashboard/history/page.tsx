'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import AnalysisHistory from '@/components/dashboard/AnalysisHistory';
import { useAuth } from '@/lib/auth/AuthContext';

export default function HistoryPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard/history');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading history...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // AuthGuard will handle the redirect
  }

  return (
    <AuthGuard requireAuth requirePremium>
      <div className="min-h-screen bg-background">
        {/* Mobile-first breadcrumb navigation */}
        <div className="border-b bg-card px-3 py-3 md:px-4 md:py-4">
          <div className="container-mobile">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-1 hover:text-foreground transition-colors min-h-[44px] px-2 -mx-2 rounded"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">Analysis History</span>
            </div>
          </div>
        </div>

        {/* Analysis History Component */}
        <div className="container-mobile py-6 md:py-8">
          <AnalysisHistory userId={user.$id} />
        </div>
      </div>
    </AuthGuard>
  );
}