'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Crown, Zap, Shield, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumUpgradePromptProps {
  trigger: 'usage_limit' | 'ad_removal' | 'feature_access' | 'analysis_complete';
  onClose?: () => void;
  onUpgrade?: () => void;
  className?: string;
  compact?: boolean;
}

/**
 * Premium Upgrade Prompt Component
 * Mobile-first conversion funnel for premium upgrades
 */
export function PremiumUpgradePrompt({
  trigger,
  onClose,
  onUpgrade,
  className,
  compact = false
}: PremiumUpgradePromptProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleUpgrade = () => {
    onUpgrade?.();
    // Track conversion event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'premium_upgrade_click', {
        event_category: 'conversion',
        event_label: trigger,
        value: 1
      });
    }
  };

  if (!isVisible) return null;

  // Content based on trigger
  const content = {
    usage_limit: {
      title: 'Daily Limit Reached',
      description: 'You\'ve used all 5 free analyses today. Upgrade for unlimited access!',
      icon: <Zap className="h-5 w-5" />,
      urgency: 'high'
    },
    ad_removal: {
      title: 'Remove Ads Forever',
      description: 'Enjoy an ad-free experience with premium features.',
      icon: <Shield className="h-5 w-5" />,
      urgency: 'medium'
    },
    feature_access: {
      title: 'Unlock Premium Features',
      description: 'Access AI resume builder, templates, and advanced analytics.',
      icon: <Crown className="h-5 w-5" />,
      urgency: 'medium'
    },
    analysis_complete: {
      title: 'Want More Insights?',
      description: 'Get detailed recommendations and track your progress over time.',
      icon: <TrendingUp className="h-5 w-5" />,
      urgency: 'low'
    }
  };

  const currentContent = content[trigger];

  const benefits = [
    'Unlimited resume analyses',
    'AI-powered resume builder',
    'Professional templates',
    'No advertisements',
    'Priority support',
    'Advanced analytics'
  ];

  if (compact) {
    return (
      <Card className={cn(
        'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-purple-50',
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-blue-600">
                {currentContent.icon}
              </div>
              <div>
                <h4 className="font-semibold text-sm">{currentContent.title}</h4>
                <p className="text-xs text-gray-600">{currentContent.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Upgrade
              </Button>
              {onClose && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50',
      'shadow-lg',
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
              {currentContent.icon}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {currentContent.title}
                {currentContent.urgency === 'high' && (
                  <Badge variant="destructive" className="text-xs">
                    Limited Time
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                {currentContent.description}
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Benefits Grid - Mobile First */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              $9.99
              <span className="text-sm font-normal text-gray-500">/month</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Cancel anytime • 7-day free trial
            </p>
          </div>
        </div>

        {/* CTA Buttons - Mobile First */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleUpgrade}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
          >
            <Crown className="h-4 w-4 mr-2" />
            Start Free Trial
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 border-gray-300"
            onClick={() => {
              // Track "maybe later" event
              if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'premium_upgrade_dismiss', {
                  event_category: 'conversion',
                  event_label: trigger
                });
              }
              handleClose();
            }}
          >
            Maybe Later
          </Button>
        </div>

        {/* Social Proof */}
        <div className="text-center text-xs text-gray-500">
          Join 10,000+ professionals who upgraded their careers
        </div>
      </CardContent>
    </Card>
  );
}