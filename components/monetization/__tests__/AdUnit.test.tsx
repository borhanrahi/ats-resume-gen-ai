import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdUnit } from '../AdUnit';

// Mock environment variables
const mockEnv = vi.hoisted(() => ({
  NODE_ENV: 'test',
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: 'ca-pub-test123'
}));

vi.mock('process', () => ({
  env: mockEnv
}));

// Mock window.adsbygoogle
Object.defineProperty(window, 'adsbygoogle', {
  value: [],
  writable: true
});

describe('AdUnit', () => {
  beforeEach(() => {
    // Reset environment
    mockEnv.NODE_ENV = 'test';
    mockEnv.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'ca-pub-test123';
    
    // Reset adsbygoogle array
    window.adsbygoogle = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders placeholder in development mode', () => {
    mockEnv.NODE_ENV = 'development';
    
    render(
      <AdUnit 
        slot="1234567890" 
        format="rectangle"
      />
    );

    expect(screen.getByText('AdSense Ad Placeholder (Development Mode)')).toBeInTheDocument();
  });

  it('renders ad unit in test mode', () => {
    render(
      <AdUnit 
        slot="1234567890" 
        format="rectangle"
        testMode={true}
      />
    );

    const adElement = document.querySelector('.adsbygoogle');
    expect(adElement).toBeInTheDocument();
    expect(adElement).toHaveAttribute('data-ad-client', 'ca-pub-test');
    expect(adElement).toHaveAttribute('data-ad-slot', '1234567890');
    expect(adElement).toHaveAttribute('data-ad-format', 'rectangle');
  });

  it('renders ad unit in production mode', () => {
    mockEnv.NODE_ENV = 'production';
    
    render(
      <AdUnit 
        slot="1234567890" 
        format="auto"
        responsive={true}
      />
    );

    const adElement = document.querySelector('.adsbygoogle');
    expect(adElement).toBeInTheDocument();
    expect(adElement).toHaveAttribute('data-ad-client', 'ca-pub-test123');
    expect(adElement).toHaveAttribute('data-ad-slot', '1234567890');
    expect(adElement).toHaveAttribute('data-ad-format', 'auto');
    expect(adElement).toHaveAttribute('data-full-width-responsive', 'true');
  });

  it('does not render without client ID in production', () => {
    mockEnv.NODE_ENV = 'production';
    mockEnv.NEXT_PUBLIC_ADSENSE_CLIENT_ID = '';
    
    const { container } = render(
      <AdUnit 
        slot="1234567890" 
        format="rectangle"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('applies custom className and styles', () => {
    render(
      <AdUnit 
        slot="1234567890" 
        format="rectangle"
        testMode={true}
        className="custom-ad-class"
        style={{ margin: '10px' }}
      />
    );

    const container = document.querySelector('.ad-container');
    expect(container).toHaveClass('custom-ad-class');
    expect(container).toHaveStyle({ margin: '10px' });
  });

  it('initializes adsbygoogle array', () => {
    render(
      <AdUnit 
        slot="1234567890" 
        format="rectangle"
        testMode={true}
      />
    );

    expect(window.adsbygoogle).toBeDefined();
    expect(Array.isArray(window.adsbygoogle)).toBe(true);
  });

  it('handles different ad formats correctly', () => {
    const formats = ['auto', 'rectangle', 'vertical', 'horizontal'] as const;
    
    formats.forEach(format => {
      const { unmount } = render(
        <AdUnit 
          slot="1234567890" 
          format={format}
          testMode={true}
        />
      );

      const adElement = document.querySelector('.adsbygoogle');
      expect(adElement).toHaveAttribute('data-ad-format', format);
      
      unmount();
    });
  });

  it('handles responsive configuration', () => {
    const { rerender } = render(
      <AdUnit 
        slot="1234567890" 
        format="auto"
        responsive={true}
        testMode={true}
      />
    );

    let adElement = document.querySelector('.adsbygoogle');
    expect(adElement).toHaveAttribute('data-full-width-responsive', 'true');

    rerender(
      <AdUnit 
        slot="1234567890" 
        format="auto"
        responsive={false}
        testMode={true}
      />
    );

    adElement = document.querySelector('.adsbygoogle');
    expect(adElement).toHaveAttribute('data-full-width-responsive', 'false');
  });
});