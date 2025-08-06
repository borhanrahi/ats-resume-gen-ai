'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import DashboardHome from '@/components/dashboard/DashboardHome';
import { useAuth } from '@/lib/auth/AuthContext';
import { User } from '@/types/user';

// Mock data for development - replace with real API calls
const mockRecentAnalyses = [
  {
    id: '1',
    resumeName: 'Software_Engineer_Resume.pdf',
    score: 85,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    jobTitle: 'Senior Software Engineer'
  },
  {
    id: '2',
    resumeName: 'Frontend_Developer_Resume.pdf',
    score: 78,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    jobTitle: 'Frontend Developer'
  },
  {
    id: '3',
    resumeName: 'Product_Manager_Resume.pdf',
    score: 92,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    jobTitle: 'Product Manager'
  }
];

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    recentAnalyses: mockRecentAnalyses,
    totalAnalyses: 15,
    averageScore: 82.5,
    improvementTrend: 5.2
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
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
        <DashboardHome
          user={user}
          recentAnalyses={dashboardData.recentAnalyses}
          totalAnalyses={dashboardData.totalAnalyses}
          averageScore={dashboardData.averageScore}
          improvementTrend={dashboardData.improvementTrend}
        />
      </div>
    </AuthGuard>
  );
}