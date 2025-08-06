'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  testMode?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

/**
 * AdSense Ad Unit Component
 * Renders individual ad units with proper mobile-first responsive design
 */
export function AdUnit({
  slot,
  format = 'auto',
  responsive = true,
  className,
  style,
  testMode = false
}: AdUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Skip in development unless testMode is enabled
    if (process.env.NODE_ENV !== 'production' && !testMode) {
      return;
    }

    // Skip if no client ID is configured
    const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
    if (!clientId && !testMode) {
      return;
    }

    // Prevent double initialization
    if (isInitialized.current) {
      return;
    }

    try {
      // Initialize adsbygoogle array if not exists
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || [];
        
        // Push ad configuration
        window.adsbygoogle.push({});
        isInitialized.current = true;
        
        console.log(`AdSense: Ad unit initialized - slot: ${slot}`);
      }
    } catch (error) {
      console.error('AdSense: Error initializing ad unit:', error);
    }
  }, [slot, testMode]);

  // Don't render in development unless testMode is enabled
  if (process.env.NODE_ENV !== 'production' && !testMode) {
    return (
      <div 
        className={cn(
          'bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-sm text-gray-500',
          'min-h-[100px] flex items-center justify-center',
          className
        )}
        style={style}
      >
        AdSense Ad Placeholder (Development Mode)
      </div>
    );
  }

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!clientId && !testMode) {
    return null;
  }

  return (
    <div 
      className={cn('ad-container', className)}
      style={style}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ 
          display: 'block',
          ...style 
        }}
        data-ad-client={testMode ? 'ca-pub-test' : clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}