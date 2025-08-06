'use client';

import { useEffect } from 'react';

interface AdSenseScriptProps {
  clientId?: string;
}

/**
 * AdSense Script Component
 * Loads Google AdSense script for ad serving
 * Only loads in production or when clientId is provided
 */
export function AdSenseScript({ clientId }: AdSenseScriptProps) {
  useEffect(() => {
    // Only load AdSense in production or when clientId is explicitly provided
    if (process.env.NODE_ENV !== 'production' && !clientId) {
      console.log('AdSense: Skipping script load in development mode');
      return;
    }

    const adsenseClientId = clientId || process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
    
    if (!adsenseClientId) {
      console.warn('AdSense: No client ID provided');
      return;
    }

    // Check if script is already loaded
    if (document.querySelector(`script[src*="pagead2.googlesyndication.com"]`)) {
      console.log('AdSense: Script already loaded');
      return;
    }

    try {
      // Create and load AdSense script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`;
      script.crossOrigin = 'anonymous';
      
      // Add error handling
      script.onerror = () => {
        console.error('AdSense: Failed to load script');
      };
      
      script.onload = () => {
        console.log('AdSense: Script loaded successfully');
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error('AdSense: Error loading script:', error);
    }
  }, [clientId]);

  return null;
}