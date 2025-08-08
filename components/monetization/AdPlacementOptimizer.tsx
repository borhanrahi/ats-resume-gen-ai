'use client';

import { useState, useEffect, useRef } from 'react';
import { AdBanner } from './AdBanner';
import { PremiumUpgradePrompt } from './PremiumUpgradePrompt';
import { useConversionTracking } from './ConversionTracker';

interface AdPlacementOptimizerProps {
  userTier: 'free' | 'premium';
  pageType: 'landing' | 'analysis' | 'results' | 'dashboard';
  usageCount?: number;
  maxUsage?: number;
  children: React.ReactNode;
}

/**
 * Ad Placement Optimizer Component
 * Intelligently places ads and upgrade prompts based on user behavior and context
 */
export function AdPlacementOptimizer({
  userTier,
  pageType,
  usageCount = 0,
  maxUsage = 5,
  children
}: AdPlacementOptimizerProps) {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [adViewability, setAdViewability] = useState<Record<string, boolean>>({});
  const { trackEvent, trackConversion } = useConversionTracking();
  const intersectionObserver = useRef<IntersectionObserver | null>(null);

  // Don't show ads for premium users
  if (userTier === 'premium') {
    return <>{children}</>;
  }

  useEffect(() => {
    // Set up intersection observer for ad viewability tracking - only on client side
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      intersectionObserver.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const adId = entry.target.getAttribute('data-ad-id');
            if (adId) {
              setAdViewability(prev => ({
                ...prev,
                [adId]: entry.isIntersecting
              }));

              if (entry.isIntersecting) {
                trackEvent({
                  action: 'ad_view',
                  category: 'monetization',
                  label: adId
                });
              }
            }
          });
        },
        { threshold: 0.5 }
      );
    }

    return () => {
      intersectionObserver.current?.disconnect();
    };
  }, [trackEvent]);

  // Determine upgrade prompt trigger based on context
  const getUpgradePromptTrigger = () => {
    if (usageCount >= maxUsage) return 'usage_limit';
    if (pageType === 'results') return 'analysis_complete';
    if (usageCount >= maxUsage * 0.8) return 'feature_access';
    return 'ad_removal';
  };

  // Ad placement strategy based on page type and user behavior
  const shouldShowTopAd = () => {
    return pageType === 'landing' || pageType === 'analysis';
  };

  const shouldShowInlineAd = () => {
    return pageType === 'results' && usageCount >= 2;
  };

  const shouldShowBottomAd = () => {
    return pageType !== 'dashboard';
  };

  const shouldShowUpgradePrompt = () => {
    return (
      usageCount >= maxUsage || 
      (pageType === 'results' && usageCount >= maxUsage * 0.6) ||
      (pageType === 'analysis' && usageCount >= maxUsage * 0.8)
    );
  };

  const handleUpgradeClick = () => {
    trackConversion('upgrade');
    // Redirect to pricing page or open upgrade modal
    window.location.href = '/pricing';
  };

  return (
    <div className="ad-optimized-layout">
      {/* Top Ad - Landing and Analysis pages */}
      {shouldShowTopAd() && (
        <div 
          data-ad-id="top-banner"
          ref={(el) => {
            if (el && intersectionObserver.current) {
              intersectionObserver.current.observe(el);
            }
          }}
        >
          <AdBanner 
            position="top" 
            testMode={process.env.NODE_ENV !== 'production'}
          />
        </div>
      )}

      {/* Upgrade Prompt - Strategic placement */}
      {shouldShowUpgradePrompt() && (
        <div className="mb-6">
          <PremiumUpgradePrompt
            trigger={getUpgradePromptTrigger()}
            onUpgrade={handleUpgradeClick}
            onClose={() => setShowUpgradePrompt(false)}
            compact={pageType === 'results'}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="relative">
        {children}
        
        {/* Inline Ad - Results page after some usage */}
        {shouldShowInlineAd() && (
          <div 
            className="my-8"
            data-ad-id="inline-banner"
            ref={(el) => {
              if (el && intersectionObserver.current) {
                intersectionObserver.current.observe(el);
              }
            }}
          >
            <AdBanner 
              position="inline" 
              testMode={process.env.NODE_ENV !== 'production'}
            />
          </div>
        )}
      </div>

      {/* Bottom Ad - Most pages */}
      {shouldShowBottomAd() && (
        <div 
          className="mt-8"
          data-ad-id="bottom-banner"
          ref={(el) => {
            if (el && intersectionObserver.current) {
              intersectionObserver.current.observe(el);
            }
          }}
        >
          <AdBanner 
            position="bottom" 
            testMode={process.env.NODE_ENV !== 'production'}
          />
        </div>
      )}

      {/* Usage-based upgrade prompt */}
      {usageCount >= maxUsage && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <PremiumUpgradePrompt
            trigger="usage_limit"
            onUpgrade={handleUpgradeClick}
            onClose={() => setShowUpgradePrompt(false)}
            compact={true}
          />
        </div>
      )}
    </div>
  );
}