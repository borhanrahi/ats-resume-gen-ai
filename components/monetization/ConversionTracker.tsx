'use client';

import React, { useEffect } from 'react';

interface ConversionEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

interface ConversionTrackerProps {
  events: ConversionEvent[];
  userId?: string;
  sessionId?: string;
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

/**
 * Conversion Tracker Component
 * Tracks user interactions and conversion events for analytics
 */
export function ConversionTracker({ events, userId, sessionId }: ConversionTrackerProps) {
  useEffect(() => {
    // Only track in production or when explicitly enabled
    if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_ENABLE_ANALYTICS) {
      console.log('Analytics: Tracking disabled in development');
      return;
    }

    // Initialize Google Analytics if not already done
    if (typeof window !== 'undefined' && !window.gtag) {
      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };

      // Set up basic configuration
      window.gtag('js', new Date());
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID', {
        user_id: userId,
        session_id: sessionId,
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      });
    }

    // Track events
    events.forEach(event => {
      try {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', event.action, {
            event_category: event.category,
            event_label: event.label,
            value: event.value,
            user_id: userId,
            session_id: sessionId,
            timestamp: new Date().toISOString()
          });

          console.log('Analytics: Event tracked', event);
        }
      } catch (error) {
        console.error('Analytics: Error tracking event', error);
      }
    });
  }, [events, userId, sessionId]);

  return null;
}

/**
 * Hook for tracking conversion events
 */
export function useConversionTracking() {
  const trackEvent = (event: ConversionEvent) => {
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          timestamp: new Date().toISOString()
        });

        console.log('Analytics: Event tracked via hook', event);
      }
    } catch (error) {
      console.error('Analytics: Error tracking event via hook', error);
    }
  };

  const trackConversion = (type: 'signup' | 'upgrade' | 'analysis' | 'export', value?: number) => {
    trackEvent({
      action: `conversion_${type}`,
      category: 'conversion',
      label: type,
      value
    });
  };

  const trackUserInteraction = (element: string, action: string) => {
    trackEvent({
      action: 'user_interaction',
      category: 'engagement',
      label: `${element}_${action}`
    });
  };

  return {
    trackEvent,
    trackConversion,
    trackUserInteraction
  };
}