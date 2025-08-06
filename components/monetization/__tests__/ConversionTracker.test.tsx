import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConversionTracker, useConversionTracking } from '../ConversionTracker';
import { renderHook, act } from '@testing-library/react';

// Mock environment variables
const mockEnv = vi.hoisted(() => ({
  NODE_ENV: 'test',
  NEXT_PUBLIC_GA_MEASUREMENT_ID: 'GA-TEST-123',
  NEXT_PUBLIC_ENABLE_ANALYTICS: 'true'
}));

vi.mock('process', () => ({
  env: mockEnv
}));

// Mock window.gtag and dataLayer
Object.defineProperty(window, 'gtag', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(window, 'dataLayer', {
  value: [],
  writable: true
});

describe('ConversionTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.dataLayer = [];
    window.gtag = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes Google Analytics correctly', () => {
    mockEnv.NODE_ENV = 'production';
    
    const events = [
      {
        action: 'test_event',
        category: 'engagement',
        label: 'test',
        value: 1
      }
    ];

    render(
      <ConversionTracker 
        events={events}
        userId="user123"
        sessionId="session456"
      />
    );

    expect(window.gtag).toHaveBeenCalledWith('js', expect.any(Date));
    expect(window.gtag).toHaveBeenCalledWith('config', 'GA-TEST-123', {
      user_id: 'user123',
      session_id: 'session456',
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  });

  it('tracks events correctly', () => {
    mockEnv.NODE_ENV = 'production';
    
    const events = [
      {
        action: 'analysis_complete',
        category: 'engagement',
        label: 'resume_analysis',
        value: 1
      },
      {
        action: 'upgrade_click',
        category: 'conversion',
        label: 'premium_upgrade',
        value: 9.99
      }
    ];

    render(
      <ConversionTracker 
        events={events}
        userId="user123"
        sessionId="session456"
      />
    );

    expect(window.gtag).toHaveBeenCalledWith('event', 'analysis_complete', {
      event_category: 'engagement',
      event_label: 'resume_analysis',
      value: 1,
      user_id: 'user123',
      session_id: 'session456',
      timestamp: expect.any(String)
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'upgrade_click', {
      event_category: 'conversion',
      event_label: 'premium_upgrade',
      value: 9.99,
      user_id: 'user123',
      session_id: 'session456',
      timestamp: expect.any(String)
    });
  });

  it('does not track in development mode without explicit enable', () => {
    mockEnv.NODE_ENV = 'development';
    mockEnv.NEXT_PUBLIC_ENABLE_ANALYTICS = '';

    const events = [
      {
        action: 'test_event',
        category: 'engagement'
      }
    ];

    render(<ConversionTracker events={events} />);

    expect(window.gtag).not.toHaveBeenCalled();
  });

  it('handles missing gtag gracefully', () => {
    const originalGtag = window.gtag;
    // @ts-ignore
    window.gtag = undefined;

    const events = [
      {
        action: 'test_event',
        category: 'engagement'
      }
    ];

    expect(() => {
      render(<ConversionTracker events={events} />);
    }).not.toThrow();

    // Restore original gtag
    window.gtag = originalGtag;
  });
});

describe('useConversionTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.gtag = vi.fn();
  });

  it('tracks events via hook', () => {
    const { result } = renderHook(() => useConversionTracking());

    act(() => {
      result.current.trackEvent({
        action: 'button_click',
        category: 'engagement',
        label: 'cta_button',
        value: 1
      });
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'button_click', {
      event_category: 'engagement',
      event_label: 'cta_button',
      value: 1,
      timestamp: expect.any(String)
    });
  });

  it('tracks conversions via hook', () => {
    const { result } = renderHook(() => useConversionTracking());

    act(() => {
      result.current.trackConversion('signup', 1);
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'conversion_signup', {
      event_category: 'conversion',
      event_label: 'signup',
      value: 1,
      timestamp: expect.any(String)
    });

    act(() => {
      result.current.trackConversion('upgrade', 9.99);
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'conversion_upgrade', {
      event_category: 'conversion',
      event_label: 'upgrade',
      value: 9.99,
      timestamp: expect.any(String)
    });
  });

  it('tracks user interactions via hook', () => {
    const { result } = renderHook(() => useConversionTracking());

    act(() => {
      result.current.trackUserInteraction('upload_button', 'click');
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'user_interaction', {
      event_category: 'engagement',
      event_label: 'upload_button_click',
      timestamp: expect.any(String)
    });
  });

  it('handles missing gtag gracefully in hook', () => {
    const originalGtag = window.gtag;
    // @ts-ignore
    window.gtag = undefined;

    const { result } = renderHook(() => useConversionTracking());

    expect(() => {
      act(() => {
        result.current.trackEvent({
          action: 'test_event',
          category: 'engagement'
        });
      });
    }).not.toThrow();

    // Restore original gtag
    window.gtag = originalGtag;
  });
});