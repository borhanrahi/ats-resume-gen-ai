import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock URL.createObjectURL and revokeObjectURL for export functionality
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

const mockUserAnalytics = {
  totalUsers: 1500,
  activeUsers: 980,
  newUsers: 45,
  premiumUsers: 225,
  userGrowth: [
    {
      date: '2024-01-01T00:00:00.000Z',
      total: 1000,
      new: 15,
      premium: 150
    },
    {
      date: '2024-01-02T00:00:00.000Z',
      total: 1015,
      new: 20,
      premium: 155
    }
  ],
  userBehavior: {
    avgSessionDuration: 240,
    avgAnalysesPerUser: 3.2,
    bounceRate: 0.35,
    returnUserRate: 0.45
  }
};

const mockConversionFunnel = {
  steps: [
    { name: 'Landing Page Visitors', users: 10000, conversionRate: 100 },
    { name: 'Resume Upload Started', users: 4500, conversionRate: 45 },
    { name: 'Analysis Completed', users: 3500, conversionRate: 35 },
    { name: 'Results Viewed', users: 3200, conversionRate: 32 },
    { name: 'Account Created', users: 800, conversionRate: 8 },
    { name: 'Premium Subscription', users: 250, conversionRate: 2.5 }
  ],
  overallConversion: 2.5
};

const mockFeatureUsage = {
  features: [
    { name: 'Resume Analysis', usage: 5000, growth: 15.5, tier: 'free' as const },
    { name: 'ATS Score', usage: 4800, growth: 12.3, tier: 'free' as const },
    { name: 'Visual Resume Editor', usage: 1200, growth: 8.7, tier: 'premium' as const },
    { name: 'AI Resume Builder', usage: 800, growth: 22.1, tier: 'premium' as const }
  ],
  popularFeatures: ['Resume Analysis', 'ATS Score', 'Keyword Matching'],
  underutilizedFeatures: ['Advanced Analytics', 'Keyword Optimization', 'Multiple Templates']
};

const mockRevenueAnalytics = {
  totalRevenue: 7500,
  monthlyRecurring: 6750,
  averageRevenuePerUser: 33.33,
  churnRate: 0.06,
  revenueGrowth: [
    {
      date: '2024-01-01T00:00:00.000Z',
      revenue: 200,
      subscriptions: 7
    },
    {
      date: '2024-01-02T00:00:00.000Z',
      revenue: 250,
      subscriptions: 8
    }
  ]
};

describe('AnalyticsCharts Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    
    // Setup default mock responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserAnalytics })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockConversionFunnel })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockFeatureUsage })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockRevenueAnalytics })
      });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders loading state initially', () => {
    render(<AnalyticsCharts />);
    
    expect(screen.getByText('Analytics & Reporting')).toBeInTheDocument();
    expect(screen.getByText('User behavior insights and business metrics')).toBeInTheDocument();
    
    // Should show loading spinner
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('fetches and displays analytics data', async () => {
    render(<AnalyticsCharts />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/analytics/users'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/analytics/funnel'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/analytics/features'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/analytics/revenue'));
    });

    await waitFor(() => {
      expect(screen.getByText('1.5K')).toBeInTheDocument(); // Total users
      expect(screen.getByText('980')).toBeInTheDocument(); // Active users
      expect(screen.getByText('225')).toBeInTheDocument(); // Premium users
    });
  });

  it('displays key metrics overview cards', async () => {
    render(<AnalyticsCharts />);

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('Premium Users')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('1.5K')).toBeInTheDocument(); // Total users
      expect(screen.getByText('+45 new')).toBeInTheDocument(); // New users
      expect(screen.getByText('65.3% of total')).toBeInTheDocument(); // Active users percentage
      expect(screen.getByText('15.0% conversion')).toBeInTheDocument(); // Premium conversion
      expect(screen.getByText('$7,500.00')).toBeInTheDocument(); // Total revenue
      expect(screen.getByText('$33.33 ARPU')).toBeInTheDocument(); // ARPU
    });
  });

  it('switches between different analytics tabs', async () => {
    render(<AnalyticsCharts />);

    await waitFor(() => {
      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    // Test Users tab (default)
    expect(screen.getByText('User Growth')).toBeInTheDocument();
    expect(screen.getByText('User Behavior')).toBeInTheDocument();

    // Click on Conversion tab
    const conversionTab = screen.getByRole('tab', { name: /conversion/i });
    fireEvent.click(conversionTab);

    await waitFor(() => {
      expect(screen.getByText('Conversion Funnel')).toBeInTheDocument();
      expect(screen.getByText('Conversion Rates')).toBeInTheDocument();
    });

    // Click on Features tab
    const featuresTab = screen.getByRole('tab', { name: /features/i });
    fireEvent.click(featuresTab);

    await waitFor(() => {
      expect(screen.getByText('Feature Usage')).toBeInTheDocument();
      expect(screen.getByText('Feature Insights')).toBeInTheDocument();
    });

    // Click on Revenue tab
    const revenueTab = screen.getByRole('tab', { name: /revenue/i });
    fireEvent.click(revenueTab);

    await waitFor(() => {
      expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
      expect(screen.getByText('Revenue Metrics')).toBeInTheDocument();
    });
  });

  it('displays user behavior metrics correctly', async () => {
    render(<AnalyticsCharts />);

    await waitFor(() => {
      expect(screen.getByText('User Behavior')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('4m 0s')).toBeInTheDocument(); // Session duration
      expect(screen.getByText('3.2')).toBeInTheDocument(); // Analyses per user
      expect(screen.getByText('35.0%')).toBeInTheDocument(); // Bounce rate
      expect(screen.getByText('45.0%')).toBeInTheDocument(); // Return user rate
    });
  });

  it('displays conversion funnel data', async () => {
    render(<AnalyticsCharts />);

    await waitFor(() => {
      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    // Switch to conversion tab
    const conversionTab = screen.getByRole('tab', { name: /conversion/i });
    fireEvent.click(conversionTab);

    await waitFor(() => {
      expect(screen.getByText('Landing Page Visitors')).toBeInTheDocument();
      expect(screen.getByText('Resume Upload Started')).toBeInTheDocument();
      expect(screen.getByText('Premium Subscription')).toBeInTheDocument();
      expect(screen.getByText('10.0K users')).toBeInTheDocument();
      expect(screen.getByText('4.5K users')).toBeInTheDocument();
      expect(screen.getByText('250 users')).toBeInTheDocument();
      expect(screen.getByText('2.5%')).toBeInTheDocument(); // Overall conversion
    });
  });

  it('displays feature usage and insights', async () => {
    render(<AnalyticsCharts />);

    await waitFor(() => {
      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    // Switch to features tab
    const featuresTab = screen.getByRole('tab', { name: /features/i });
    fireEvent.click(featuresTab);

    await waitFor(() => {
      expect(screen.getByText('Popular Features')).toBeInTheDocument();
      expect(screen.getByText('Underutilized Features')).toBeInTheDocument();
      expect(screen.getByText('Resume Analysis')).toBeInTheDocument();
      expect(screen.getByText('ATS Score')).toBeInTheDocument();
      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Free Features')).toBeInTheDocument();
      expect(screen.getByText('Premium Features')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Free features count
      expect(screen.getByText('2')).toBeInTheDocument(); // Premium features count
    });
  });

  it('displays revenue metrics correctly', async () => {
    render(<AnalyticsCharts />);

    await waitFor(() => {
      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    // Switch to revenue tab
    const revenueTab = screen.getByRole('tab', { name: /revenue/i });
    fireEvent.click(revenueTab);

    await waitFor(() => {
      expect(screen.getByText('Monthly Recurring')).toBeInTheDocument();
      expect(screen.getByText('Average Revenue per User')).toBeInTheDocument();
      expect(screen.getByText('Churn Rate')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('$6,750.00')).toBeInTheDocument(); // Monthly recurring
      expect(screen.getByText('$33.33')).toBeInTheDocument(); // ARPU
      expect(screen.getByText('6.0%')).toBeInTheDocument(); // Churn rate
      expect(screen.getByText('$7,500.00')).toBeInTheDocument(); // Total revenue
    });
  });

  it('handles date range selection', async () => {
    render(<AnalyticsCharts />);

    await waitFor(() => {
      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    // Find and click the date range button
    const dateRangeButton = screen.getByRole('button', { name: /Jan \d+ - Jan \d+/i });
    fireEvent.click(dateRangeButton);

    // Calendar should be visible
    await waitFor(() => {
      expect(document.querySelector('.rdp')).toBeInTheDocument();
    });
  });

  it('handles export functionality', async () => {
    // Mock blob response for export
    const mockBlob = new Blob(['test data'], { type: 'text/csv' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob
    });

    // Mock document methods
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();
    const mockClick = vi.fn();
    
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick
    };

    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
    vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

    render(<AnalyticsCharts />);

    await waitFor(() => {
      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    // Click export button
    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/analytics/export'));
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });
  });

  it('changes export format', async () => {
    render(<AnalyticsCharts />);

    await waitFor(() => {
      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    // Find the export format select
    const formatSelect = screen.getByRole('combobox');
    fireEvent.click(formatSelect);

    // Select Excel format
    await waitFor(() => {
      const excelOption = screen.getByText('Excel');
      fireEvent.click(excelOption);
    });

    // Verify the selection changed
    expect(screen.getByDisplayValue('xlsx')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockClear();
    mockFetch.mockRejectedValue(new Error('API Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AnalyticsCharts />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch analytics:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('formats currency correctly', async () => {
    render(<AnalyticsCharts />);

    await waitFor(() => {
      expect(screen.getByText('$7,500.00')).toBeInTheDocument(); // Total revenue
      expect(screen.getByText('$33.33 ARPU')).toBeInTheDocument(); // ARPU
    });
  });

  it('formats large numbers correctly', async () => {
    const largeNumberAnalytics = {
      ...mockUserAnalytics,
      totalUsers: 1500000, // Should format as 1.5M
      activeUsers: 25000 // Should format as 25.0K
    };

    mockFetch.mockClear();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: largeNumberAnalytics })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockConversionFunnel })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockFeatureUsage })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockRevenueAnalytics })
      });

    render(<AnalyticsCharts />);

    await waitFor(() => {
      expect(screen.getByText('1.5M')).toBeInTheDocument(); // Formatted total users
      expect(screen.getByText('25.0K')).toBeInTheDocument(); // Formatted active users
    });
  });

  it('calculates percentages correctly', async () => {
    render(<AnalyticsCharts />);

    await waitFor(() => {
      // Active users percentage: (980 / 1500) * 100 = 65.3%
      expect(screen.getByText('65.3% of total')).toBeInTheDocument();
      
      // Premium conversion: (225 / 1500) * 100 = 15.0%
      expect(screen.getByText('15.0% conversion')).toBeInTheDocument();
    });
  });

  it('displays session duration in correct format', async () => {
    const sessionTestCases = [
      { duration: 120, expected: '2m 0s' }, // 2 minutes
      { duration: 90, expected: '1m 30s' }, // 1 minute 30 seconds
      { duration: 240, expected: '4m 0s' }, // 4 minutes
    ];

    for (const testCase of sessionTestCases) {
      const analyticsWithDuration = {
        ...mockUserAnalytics,
        userBehavior: {
          ...mockUserAnalytics.userBehavior,
          avgSessionDuration: testCase.duration
        }
      };

      mockFetch.mockClear();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: analyticsWithDuration })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockConversionFunnel })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockFeatureUsage })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockRevenueAnalytics })
        });

      const { unmount } = render(<AnalyticsCharts />);

      await waitFor(() => {
        expect(screen.getByText(testCase.expected)).toBeInTheDocument();
      });

      unmount();
    }
  });
});