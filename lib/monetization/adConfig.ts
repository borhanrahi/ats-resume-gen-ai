/**
 * AdSense Configuration
 * Centralized configuration for ad units and monetization settings
 */

export interface AdSlotConfig {
  id: string;
  name: string;
  format: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  responsive: boolean;
  minWidth?: number;
  maxWidth?: number;
}

export interface MonetizationConfig {
  adsenseClientId: string;
  adSlots: Record<string, AdSlotConfig>;
  conversionTracking: {
    enabled: boolean;
    gaTrackingId?: string;
  };
  upgradePrompts: {
    usageLimitThreshold: number;
    showAfterAnalyses: number;
    dismissCooldown: number; // hours
  };
}

// Default configuration - will be overridden by environment variables
export const defaultMonetizationConfig: MonetizationConfig = {
  adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '',
  adSlots: {
    topBanner: {
      id: '1234567890',
      name: 'Top Banner',
      format: 'horizontal',
      responsive: true,
      minWidth: 320,
      maxWidth: 1200
    },
    bottomBanner: {
      id: '1234567891',
      name: 'Bottom Banner',
      format: 'horizontal',
      responsive: true,
      minWidth: 320,
      maxWidth: 1200
    },
    sidebar: {
      id: '1234567892',
      name: 'Sidebar',
      format: 'vertical',
      responsive: true,
      minWidth: 160,
      maxWidth: 300
    },
    inlineRectangle: {
      id: '1234567893',
      name: 'Inline Rectangle',
      format: 'rectangle',
      responsive: true,
      minWidth: 300,
      maxWidth: 336
    },
    mobileSticky: {
      id: '1234567894',
      name: 'Mobile Sticky',
      format: 'horizontal',
      responsive: true,
      minWidth: 320,
      maxWidth: 480
    }
  },
  conversionTracking: {
    enabled: process.env.NODE_ENV === 'production',
    gaTrackingId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  },
  upgradePrompts: {
    usageLimitThreshold: 5,
    showAfterAnalyses: 3,
    dismissCooldown: 24 // 24 hours
  }
};

/**
 * Get ad slot configuration by position
 */
export function getAdSlotConfig(position: string): AdSlotConfig | null {
  return defaultMonetizationConfig.adSlots[position] || null;
}

/**
 * Check if ads should be displayed
 */
export function shouldDisplayAds(userTier: 'free' | 'premium'): boolean {
  return userTier === 'free' && !!defaultMonetizationConfig.adsenseClientId;
}

/**
 * Get upgrade prompt configuration
 */
export function getUpgradePromptConfig() {
  return defaultMonetizationConfig.upgradePrompts;
}

/**
 * Check if conversion tracking is enabled
 */
export function isConversionTrackingEnabled(): boolean {
  return defaultMonetizationConfig.conversionTracking.enabled;
}