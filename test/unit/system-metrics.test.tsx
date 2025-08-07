import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import SystemMetrics from '@/components/admin/SystemMetrics';

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

const mockSystemMetrics = {
  activeUsers: 150,
  totalAnalyses: 5000,
  apiUsage: {
    'openrouter-gpt4': {
      requests: 1000,
      failures: 20,
      avgResponseTime: 1200
    },
    'gemini-pro': {
      requests: 800,
      failures: 8,
      avgResponseTime: 800
    }
  },
  errorRate: 1.5,
  revenue: {
    daily: 250,
    monthly: 7500,
    total: 45000
  }
};

const mockSystemHealth = {
  status: 'healthy' as const,
  uptime: 2592000, // 30 days
  lastUpdated: new Date(),
  services: {
    api: 'online' as const,
    database: 'online' as const,
    aiModels: 'online' as const,
    storage: 'online' as const
  }
};

const mockPerformanceMetrics = {
  responseTime: {
    avg: 800,
    p95: 1200,
    p99: 1800
  },
  throughput: {
    requestsPerSecond: 25,
    analysesPerHour: 650
  },
  resourceUsage: {
    cpu: 45,
    memory: 60,
    storage: 30
  }
};

const mockErrorMetrics = {
  errorRate: 1.5,
  criticalErrors: 2,
  warningCount: 5,
  recentErrors: [
    {
      id: 'error-1',
      timestamp: new Date(),
      level: 'error' as const,
      message: 'AI model timeout exceeded',
      service: 'ai-models'
    },
    {
      id: 'error-2',
      timestamp: new Date(),
      level: 'warning' as const,
      message: 'High memory usage detected',
      service: 'api'
    }
  ]
};

const mockAlerts = [
  {
    id: 'alert-1',
    name: 'High Error Rate',
    condition: 'Error Rate',
    threshold: 5,
    isActive: true,
    lastTriggered: new Date()
  },
  {
    id: 'alert-2',
    name: 'High CPU Usage',
    condition: 'CPU Usage',
    threshold: 80,
    isActive: true
  }
];

describe('SystemMetrics Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    
    // Setup default mock responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSystemMetrics })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSystemHealth })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPerformanceMetrics })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockErrorMetrics })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAlerts })
      });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders loading state initially', () => {
    render(<SystemMetrics />);
    
    expect(screen.getByText('System Metrics')).toBeInTheDocument();
    expect(screen.getByText('Real-time system health and performance monitoring')).toBeInTheDocument();
    
    // Should show loading spinner
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('fetches and displays system metrics data', async () => {
    render(<SystemMetrics />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/system/metrics');
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/system/health');
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/system/performance');
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/system/errors');
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/system/alerts');
    });

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Active users
      expect(screen.getByText('1.50%')).toBeInTheDocument(); // Error rate
      expect(screen.getByText('healthy')).toBeInTheDocument(); // System status
    });
  });

  it('displays system health overview cards', async () => {
    render(<SystemMetrics />);

    await waitFor(() => {
      expect(screen.getByText('System Status')).toBeInTheDocument();
      expect(screen.getByText('Uptime')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('Error Rate')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('healthy')).toBeInTheDocument();
      expect(screen.getByText('30d 0h 0m')).toBeInTheDocument(); // Formatted uptime
    });
  });

  it('handles refresh button click', async () => {
    render(<SystemMetrics />);

    await waitFor(() => {
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });

    // Reset mock for refresh call
    mockFetch.mockClear();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSystemMetrics })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSystemHealth })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPerformanceMetrics })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockErrorMetrics })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAlerts })
      });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });
  });

  it('toggles auto-refresh functionality', async () => {
    render(<SystemMetrics />);

    await waitFor(() => {
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });

    const autoRefreshButton = screen.getByRole('button', { name: /auto/i });
    fireEvent.click(autoRefreshButton);

    expect(screen.getByText('Manual')).toBeInTheDocument();
  });

  it('displays API usage metrics in overview tab', async () => {
    render(<SystemMetrics />);

    await waitFor(() => {
      expect(screen.getByText('API Usage')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Openrouter-gpt4')).toBeInTheDocument();
      expect(screen.getByText('Gemini-pro')).toBeInTheDocument();
      expect(screen.getByText('1000 requests')).toBeInTheDocument();
      expect(screen.getByText('800 requests')).toBeInTheDocument();
    });
  });

  it('displays revenue information', async () => {
    render(<SystemMetrics />);

    await waitFor(() => {
      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('$250.00')).toBeInTheDocument(); // Daily revenue
      expect(screen.getByText('$7,500.00')).toBeInTheDocument(); // Monthly revenue
      expect(screen.getByText('$45,000.00')).toBeInTheDocument(); // Total revenue
    });
  });

  it('switches between different tabs', async () => {
    render(<SystemMetrics />);

    await waitFor(() => {
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });

    // Click on Performance tab
    const performanceTab = screen.getByRole('tab', { name: /performance/i });
    fireEvent.click(performanceTab);

    await waitFor(() => {
      expect(screen.getByText('Response Time')).toBeInTheDocument();
      expect(screen.getByText('Resource Usage')).toBeInTheDocument();
      expect(screen.getByText('Throughput')).toBeInTheDocument();
    });

    // Click on Services tab
    const servicesTab = screen.getByRole('tab', { name: /services/i });
    fireEvent.click(servicesTab);

    await waitFor(() => {
      expect(screen.getByText('Api')).toBeInTheDocument();
      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('Aimodels')).toBeInTheDocument();
      expect(screen.getByText('Storage')).toBeInTheDocument();
    });

    // Click on Alerts tab
    const alertsTab = screen.getByRole('tab', { name: /alerts/i });
    fireEvent.click(alertsTab);

    await waitFor(() => {
      expect(screen.getByText('Recent Errors')).toBeInTheDocument();
      expect(screen.getByText('Alert Configuration')).toBeInTheDocument();
    });
  });

  it('displays performance metrics correctly', async () => {
    render(<SystemMetrics />);

    await waitFor(() => {
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });

    // Switch to performance tab
    const performanceTab = screen.getByRole('tab', { name: /performance/i });
    fireEvent.click(performanceTab);

    await waitFor(() => {
      expect(screen.getByText('800ms')).toBeInTheDocument(); // Average response time
      expect(screen.getByText('1200ms')).toBeInTheDocument(); // 95th percentile
      expect(screen.getByText('1800ms')).toBeInTheDocument(); // 99th percentile
      expect(screen.getByText('45%')).toBeInTheDocument(); // CPU usage
      expect(screen.getByText('60%')).toBeInTheDocument(); // Memory usage
      expect(screen.getByText('30%')).toBeInTheDocument(); // Storage usage
      expect(screen.getByText('25')).toBeInTheDocument(); // Requests per second
      expect(screen.getByText('650')).toBeInTheDocument(); // Analyses per hour
    });
  });

  it('displays recent errors in alerts tab', async () => {
    render(<SystemMetrics />);

    await waitFor(() => {
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });

    // Switch to alerts tab
    const alertsTab = screen.getByRole('tab', { name: /alerts/i });
    fireEvent.click(alertsTab);

    await waitFor(() => {
      expect(screen.getByText('AI model timeout exceeded')).toBeInTheDocument();
      expect(screen.getByText('High memory usage detected')).toBeInTheDocument();
      expect(screen.getByText('ai-models')).toBeInTheDocument();
      expect(screen.getByText('api')).toBeInTheDocument();
    });
  });

  it('displays alert configurations', async () => {
    render(<SystemMetrics />);

    await waitFor(() => {
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });

    // Switch to alerts tab
    const alertsTab = screen.getByRole('tab', { name: /alerts/i });
    fireEvent.click(alertsTab);

    await waitFor(() => {
      expect(screen.getByText('High Error Rate')).toBeInTheDocument();
      expect(screen.getByText('High CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('Error Rate > 5')).toBeInTheDocument();
      expect(screen.getByText('CPU Usage > 80')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockClear();
    mockFetch.mockRejectedValue(new Error('API Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<SystemMetrics />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch system metrics:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('formats numbers correctly', async () => {
    const largeNumberMetrics = {
      ...mockSystemMetrics,
      activeUsers: 1500000, // Should format as 1.5M
      totalAnalyses: 25000 // Should format as 25.0K
    };

    mockFetch.mockClear();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: largeNumberMetrics })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSystemHealth })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPerformanceMetrics })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockErrorMetrics })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAlerts })
      });

    render(<SystemMetrics />);

    await waitFor(() => {
      expect(screen.getByText('1.5M')).toBeInTheDocument(); // Formatted active users
    });
  });

  it('displays uptime in correct format', async () => {
    const uptimeTestCases = [
      { uptime: 3600, expected: '60m' }, // 1 hour
      { uptime: 7200, expected: '2h 0m' }, // 2 hours
      { uptime: 90000, expected: '1d 1h 0m' }, // 1 day 1 hour
    ];

    for (const testCase of uptimeTestCases) {
      const healthWithUptime = {
        ...mockSystemHealth,
        uptime: testCase.uptime
      };

      mockFetch.mockClear();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSystemMetrics })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: healthWithUptime })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPerformanceMetrics })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockErrorMetrics })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockAlerts })
        });

      const { unmount } = render(<SystemMetrics />);

      await waitFor(() => {
        expect(screen.getByText(testCase.expected)).toBeInTheDocument();
      });

      unmount();
    }
  });
});