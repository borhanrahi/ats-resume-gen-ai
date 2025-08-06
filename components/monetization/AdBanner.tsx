'use client';

import { AdUnit } from './AdUnit';
import { cn } from '@/lib/utils';

interface AdBannerProps {
  position: 'top' | 'bottom' | 'sidebar' | 'inline';
  className?: string;
  testMode?: boolean;
}

/**
 * AdSense Banner Component
 * Pre-configured ad units for different positions with mobile-first design
 */
export function AdBanner({ position, className, testMode = false }: AdBannerProps) {
  // Ad slot configurations for different positions
  const adConfigs = {
    top: {
      slot: '1234567890', // Replace with actual slot ID
      format: 'horizontal' as const,
      className: 'w-full max-w-4xl mx-auto mb-6'
    },
    bottom: {
      slot: '1234567891', // Replace with actual slot ID
      format: 'horizontal' as const,
      className: 'w-full max-w-4xl mx-auto mt-6'
    },
    sidebar: {
      slot: '1234567892', // Replace with actual slot ID
      format: 'vertical' as const,
      className: 'w-full max-w-xs'
    },
    inline: {
      slot: '1234567893', // Replace with actual slot ID
      format: 'rectangle' as const,
      className: 'w-full max-w-md mx-auto my-4'
    }
  };

  const config = adConfigs[position];

  return (
    <div 
      className={cn(
        'ad-banner',
        // Mobile-first responsive design
        'flex justify-center items-center',
        // Position-specific styling
        position === 'top' && 'border-b border-gray-200 pb-4',
        position === 'bottom' && 'border-t border-gray-200 pt-4',
        position === 'sidebar' && 'sticky top-4',
        position === 'inline' && 'my-6',
        config.className,
        className
      )}
    >
      <AdUnit
        slot={config.slot}
        format={config.format}
        responsive={true}
        testMode={testMode}
        className="w-full"
      />
    </div>
  );
}