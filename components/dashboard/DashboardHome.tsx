'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  FileText, 
  Target, 
  Clock, 
  Award, 
  BarChart3,
  ArrowRight,
  Calendar,
  Download,
  Eye,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types/user';
import { ATSAnalysis } from '@/types/analysis';

interface DashboardHomeProps {
  user: User;
  recentAnalyses: Array<{
    id: string;
    resumeName: string;
    score: number;
    createdAt: Date;
    jobTitle?: string;
  }>;
  totalAnalyses: number;
  averageScore: number;
  improvementTrend: number;
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function DashboardHome({
  user,
  recentAnalyses,
  totalAnalyses,
  averageScore,
  improvementTrend
}: DashboardHomeProps) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  const quickActions: QuickAction[] = [
    {
      title: 'New Analysis',
      description: 'Analyze a new resume',
      href: '/analyze',
      icon: Plus,
      color: 'bg-primary text-primary-foreground'
    },
    {
      title: 'Resume Editor',
      description: 'Build or edit resume',
      href: '/editor',
      icon: FileText,
      color: 'bg-secondary text-secondary-foreground'
    },
    {
      title: 'View History',
      description: 'See all analyses',
      href: '/dashboard/history',
      icon: Clock,
      color: 'bg-accent text-accent-foreground'
    },
    {
      title: 'Templates',
      description: 'Browse templates',
      href: '/templates',
      icon: Award,
      color: 'bg-chart-1 text-white'
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="container-mobile py-6 md:py-8">
      {/* Welcome Section - Mobile-first */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
          {greeting}, {user.name}!
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Welcome back to your resume optimization dashboard
        </p>
      </div>

      {/* Metrics Overview - Mobile-first grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Total Analyses */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              {totalAnalyses}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              Resumes analyzed
            </p>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Target className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-xs text-muted-foreground">Average</span>
          </div>
          <div className="space-y-1">
            <p className={`text-2xl md:text-3xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(0)}%
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              ATS Score
            </p>
          </div>
        </div>

        {/* Improvement Trend */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-accent/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xs text-muted-foreground">Trend</span>
          </div>
          <div className="space-y-1">
            <p className={`text-2xl md:text-3xl font-bold ${
              improvementTrend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {improvementTrend >= 0 ? '+' : ''}{improvementTrend.toFixed(1)}%
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              This month
            </p>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-chart-1/10 rounded-lg">
              <Award className="w-5 h-5 text-chart-1" />
            </div>
            <span className="text-xs text-muted-foreground">Plan</span>
          </div>
          <div className="space-y-1">
            <p className="text-lg md:text-xl font-bold text-foreground capitalize">
              {user.subscription.plan}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              {user.subscription.status === 'active' ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Mobile-first */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-primary/50"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-medium text-foreground mb-1">
                  {action.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity - Mobile-first */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Analyses */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              Recent Analyses
            </h2>
            <Link
              href="/dashboard/history"
              className="text-sm text-primary hover:underline flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentAnalyses.length > 0 ? (
              recentAnalyses.slice(0, 5).map((analysis) => (
                <div
                  key={analysis.id}
                  className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getScoreBgColor(analysis.score)}`}>
                        <span className={`text-sm font-bold ${getScoreColor(analysis.score)}`}>
                          {analysis.score}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {analysis.resumeName}
                        </p>
                        {analysis.jobTitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            for {analysis.jobTitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">
                        {formatDate(analysis.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>ATS Score: {analysis.score}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-muted rounded transition-colors">
                        <Eye className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <button className="p-1 hover:bg-muted rounded transition-colors">
                        <Download className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-2">
                  No analyses yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by analyzing your first resume to see your progress here
                </p>
                <Link
                  href="/analyze"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Analyze Resume</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Progress Tracking */}
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4">
            Progress Tracking
          </h2>
          
          <div className="space-y-4">
            {/* Score Progress */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">Score Progress</h3>
                <span className={`text-sm font-medium ${getScoreColor(averageScore)}`}>
                  {averageScore.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    averageScore >= 80 ? 'bg-green-500' :
                    averageScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(averageScore, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {averageScore >= 80 ? 'Excellent' :
                 averageScore >= 60 ? 'Good' : 'Needs improvement'}
              </p>
            </div>

            {/* Monthly Goal */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">Monthly Goal</h3>
                <Target className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Analyses</span>
                  <span className="font-medium">{Math.min(totalAnalyses, 10)}/10</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((totalAnalyses / 10) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalAnalyses >= 10 ? 'Goal achieved!' : `${10 - totalAnalyses} more to go`}
                </p>
              </div>
            </div>

            {/* Improvement Tips */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3">
                Improvement Tips
              </h3>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Use action verbs to start bullet points
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Include relevant keywords from job descriptions
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Keep resume length to 1-2 pages
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}