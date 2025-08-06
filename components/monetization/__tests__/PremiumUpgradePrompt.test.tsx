import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PremiumUpgradePrompt } from '../PremiumUpgradePrompt';

// Mock window.gtag
Object.defineProperty(window, 'gtag', {
  value: vi.fn(),
  writable: true
});

describe('PremiumUpgradePrompt', () => {
  const mockOnClose = vi.fn();
  const mockOnUpgrade = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders usage limit trigger correctly', () => {
    render(
      <PremiumUpgradePrompt 
        trigger="usage_limit"
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    expect(screen.getByText('Daily Limit Reached')).toBeInTheDocument();
    expect(screen.getByText(/You've used all 5 free analyses today/)).toBeInTheDocument();
    expect(screen.getByText('Limited Time')).toBeInTheDocument();
  });

  it('renders ad removal trigger correctly', () => {
    render(
      <PremiumUpgradePrompt 
        trigger="ad_removal"
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    expect(screen.getByText('Remove Ads Forever')).toBeInTheDocument();
    expect(screen.getByText(/Enjoy an ad-free experience/)).toBeInTheDocument();
  });

  it('renders feature access trigger correctly', () => {
    render(
      <PremiumUpgradePrompt 
        trigger="feature_access"
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    expect(screen.getByText('Unlock Premium Features')).toBeInTheDocument();
    expect(screen.getByText(/Access AI resume builder/)).toBeInTheDocument();
  });

  it('renders analysis complete trigger correctly', () => {
    render(
      <PremiumUpgradePrompt 
        trigger="analysis_complete"
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    expect(screen.getByText('Want More Insights?')).toBeInTheDocument();
    expect(screen.getByText(/Get detailed recommendations/)).toBeInTheDocument();
  });

  it('displays all premium benefits', () => {
    render(
      <PremiumUpgradePrompt 
        trigger="feature_access"
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    const benefits = [
      'Unlimited resume analyses',
      'AI-powered resume builder',
      'Professional templates',
      'No advertisements',
      'Priority support',
      'Advanced analytics'
    ];

    benefits.forEach(benefit => {
      expect(screen.getByText(benefit)).toBeInTheDocument();
    });
  });

  it('displays pricing information', () => {
    render(
      <PremiumUpgradePrompt 
        trigger="feature_access"
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('/month')).toBeInTheDocument();
    expect(screen.getByText('Cancel anytime • 7-day free trial')).toBeInTheDocument();
  });

  it('calls onUpgrade when upgrade button is clicked', () => {
    render(
      <PremiumUpgradePrompt 
        trigger="feature_access"
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    const upgradeButton = screen.getByText('Start Free Trial');
    fireEvent.click(upgradeButton);

    expect(mockOnUpgrade).toHaveBeenCalledTimes(1);
    expect(window.gtag).toHaveBeenCalledWith('event', 'premium_upgrade_click', {
      event_category: 'conversion',
      event_label: 'feature_access',
      value: 1
    });
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <PremiumUpgradePrompt 
        trigger="feature_access"
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('tracks dismiss event when "Maybe Later" is clicked', () => {
    render(
      <PremiumUpgradePrompt 
        trigger="feature_access"
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    const maybeLaterButton = screen.getByText('Maybe Later');
    fireEvent.click(maybeLaterButton);

    expect(window.gtag).toHaveBeenCalledWith('event', 'premium_upgrade_dismiss', {
      event_category: 'conversion',
      event_label: 'feature_access'
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders compact version correctly', () => {
    render(
      <PremiumUpgradePrompt 
        trigger="usage_limit"
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
        compact={true}
      />
    );

    expect(screen.getByText('Daily Limit Reached')).toBeInTheDocument();
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
    
    // Compact version should not show full benefits list
    expect(screen.queryByText('Unlimited resume analyses')).not.toBeInTheDocument();
  });

  it('hides when closed', () => {
    const { rerender } = render(
      <PremiumUpgradePrompt 
        trigger="feature_access"
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    expect(screen.getByText('Unlock Premium Features')).toBeInTheDocument();

    // Click close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Component should be hidden
    expect(screen.queryByText('Unlock Premium Features')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PremiumUpgradePrompt 
        trigger="feature_access"
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
        className="custom-prompt-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-prompt-class');
  });

  it('displays social proof', () => {
    render(
      <PremiumUpgradePrompt 
        trigger="feature_access"
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    expect(screen.getByText('Join 10,000+ professionals who upgraded their careers')).toBeInTheDocument();
  });
});