'use client';

import React from 'react';
import { usageTracker } from '@/lib/storage/usageTracker';
import { AlertTriangle, Crown, TrendingUp, Share2, Heart } from 'lucide-react';

interface UsageGuardProps {
  children: React.ReactNode;
  onUpgradeClick?: () => void;
  onShareClick?: () => void;
}

/**
 * Usage Guard Component - Mobile-first design
 * Prevents analysis when daily limit is reached and shows upgrade prompts
 */
export function UsageGuard({ 
  children, 
  onUpgradeClick,
  onShareClick 
}: UsageGuardProps) {
  const canAnalyze = usageTracker.canAnalyze();
  const remaining = usageTracker.getRemainingAnalyses();
  const usage = usageTracker.getCurrentUsage();

  // If user can analyze, render children normally
  if (canAnalyze) {
    return <>{children}</>;
  }

  // Show limit reached screen with upgrade prompts
  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6">
      {/* Main Limit Reached Card - Mobile-first */}
      <div className="bg-card border border-border rounded-lg p-6 md:p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-orange-600" />
          </div>
          
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            Daily Limit Reached
          </h2>
          
          <p className="text-muted-foreground mb-4">
            You&apos;ve used all {usage.dailyCount} of your free daily analyses. 
            Your limit will reset tomorrow.
          </p>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 rounded-full text-sm">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            {usage.dailyCount}/5 analyses used today
          </div>
        </div>

        {/* Upgrade to Premium Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Crown className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold">Upgrade to Premium</h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Get unlimited analyses and advanced features
          </p>
          
          {/* Premium Features List - Mobile-optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              Unlimited daily analyses
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              Advanced AI models
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              Resume builder & templates
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              Priority support
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              Export to PDF/DOCX
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              Analysis history
            </div>
          </div>
          
          <button
            onClick={onUpgradeClick}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            Upgrade Now - $9.99/month
          </button>
        </div>

        {/* Alternative Options */}
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Or try these free alternatives:
          </div>
          
          {/* Social Sharing for Viral Marketing */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <Share2 className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium">Share & Get Bonus Analysis</h4>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Share our tool with your network and get 1 bonus analysis today!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={onShareClick}
                className="flex-1 min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 text-sm"
              >
                <Share2 className="w-4 h-4" />
                Share on LinkedIn
              </button>
              
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Free ATS Resume Checker',
                      text: 'Check how ATS-friendly your resume is with this free AI-powered tool!',
                      url: window.location.origin
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.origin);
                  }
                }}
                className="flex-1 min-h-[44px] px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center gap-2 text-sm"
              >
                <Heart className="w-4 h-4" />
                Share with Friends
              </button>
            </div>
          </div>

          {/* Wait Until Tomorrow */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="font-medium mb-2">Wait Until Tomorrow</h4>
            <p className="text-sm text-muted-foreground">
              Your free analyses will reset at midnight. Come back tomorrow for 5 more free analyses!
            </p>
            
            <div className="mt-3 text-xs text-muted-foreground">
              Next reset: {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()} at 12:00 AM
            </div>
          </div>
        </div>

        {/* Footer with stats */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {usage.totalAnalyses}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Analyses
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {Math.round(usage.totalAnalyses > 0 ? (usage.totalAnalyses * 2.5) : 0)}
              </div>
              <div className="text-xs text-muted-foreground">
                Hours Saved
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsageGuard;