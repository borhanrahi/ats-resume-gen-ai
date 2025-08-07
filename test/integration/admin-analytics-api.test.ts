import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getUsers } from '@/app/api/admin/analytics/users/route';
import { GET as getFunnel } from '@/app/api/admin/analytics/funnel/route';
import { GET as getFeatures } from '@/app/api/admin/analytics/features/route';
import { GET as getRevenue } from '@/app/api/admin/analytics/revenue/route';
import { GET as getExport } from '@/app/api/admin/analytics/export/route';

// Mock URL constructor for Node.js environment
global.URL = global.URL || class URL {
  constructor(url: string) {
    this.href = url;
    this.origin = 'http://localhost:3000';
    this.pathname = url.replace('http://localhost:3000', '');
    this.searchParams = new URLSearchParams(url.split('?')[1] || '');
  }
  href: string;
  origin: string;
  pathname: string;
  searchParams: URLSearchParams;
};

describe('Admin Analytics API Routes', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    // Create a proper mock request object
    mockRequest = {
      url: 'http://localhost:3000/api/admin/analytics/users',
      method: 'GET',
      headers: new Headers(),
      nextUrl: {
        searchParams: new URLSearchParams()
      }
    } as NextRequest;
  });

  describe('/api/admin/analytics/users', () => {
    it('returns user analytics data', async () => {
      const response = await getUsers(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalUsers');
      expect(data.data).toHaveProperty('activeUsers');
      expect(data.data).toHaveProperty('newUsers');
      expect(data.data).toHaveProperty('premiumUsers');
      expect(data.data).toHaveProperty('userGrowth');
      expect(data.data).toHaveProperty('userBehavior');

      // Validate data types
      expect(typeof data.data.totalUsers).toBe('number');
      expect(typeof data.data.activeUsers).toBe('number');
      expect(typeof data.data.newUsers).toBe('number');
      expect(typeof data.data.premiumUsers).toBe('number');

      // Validate user growth array
      expect(Array.isArray(data.data.userGrowth)).toBe(true);
      data.data.userGrowth.forEach((entry: any) => {
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('total');
        expect(entry).toHaveProperty('new');
        expect(entry).toHaveProperty('premium');
        expect(new Date(entry.date)).toBeInstanceOf(Date);
        expect(typeof entry.total).toBe('number');
        expect(typeof entry.new).toBe('number');
        expect(typeof entry.premium).toBe('number');
      });

      // Validate user behavior
      expect(data.data.userBehavior).toHaveProperty('avgSessionDuration');
      expect(data.data.userBehavior).toHaveProperty('avgAnalysesPerUser');
      expect(data.data.userBehavior).toHaveProperty('bounceRate');
      expect(data.data.userBehavior).toHaveProperty('returnUserRate');
      expect(typeof data.data.userBehavior.avgSessionDuration).toBe('number');
      expect(typeof data.data.userBehavior.avgAnalysesPerUser).toBe('number');
      expect(typeof data.data.userBehavior.bounceRate).toBe('number');
      expect(typeof data.data.userBehavior.returnUserRate).toBe('number');
    });

    it('returns reasonable user metrics', async () => {
      const response = await getUsers(mockRequest);
      const data = await response.json();

      // Validate reasonable ranges
      expect(data.data.totalUsers).toBeGreaterThan(0);
      expect(data.data.activeUsers).toBeGreaterThan(0);
      expect(data.data.activeUsers).toBeLessThanOrEqual(data.data.totalUsers);
      expect(data.data.premiumUsers).toBeLessThanOrEqual(data.data.totalUsers);
      expect(data.data.userBehavior.bounceRate).toBeGreaterThanOrEqual(0);
      expect(data.data.userBehavior.bounceRate).toBeLessThanOrEqual(1);
      expect(data.data.userBehavior.returnUserRate).toBeGreaterThanOrEqual(0);
      expect(data.data.userBehavior.returnUserRate).toBeLessThanOrEqual(1);
    });

    it('handles date range parameters', async () => {
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-01-31');
      const requestWithParams = {
        url: `http://localhost:3000/api/admin/analytics/users?from=${fromDate.toISOString()}&to=${toDate.toISOString()}`,
        method: 'GET',
        headers: new Headers(),
        nextUrl: {
          searchParams: new URLSearchParams(`from=${fromDate.toISOString()}&to=${toDate.toISOString()}`)
        }
      } as NextRequest;

      const response = await getUsers(requestWithParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.userGrowth)).toBe(true);
    });
  });

  describe('/api/admin/analytics/funnel', () => {
    it('returns conversion funnel data', async () => {
      const response = await getFunnel(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('steps');
      expect(data.data).toHaveProperty('overallConversion');

      // Validate steps array
      expect(Array.isArray(data.data.steps)).toBe(true);
      expect(data.data.steps.length).toBeGreaterThan(0);
      
      data.data.steps.forEach((step: any, index: number) => {
        expect(step).toHaveProperty('name');
        expect(step).toHaveProperty('users');
        expect(step).toHaveProperty('conversionRate');
        expect(typeof step.name).toBe('string');
        expect(typeof step.users).toBe('number');
        expect(typeof step.conversionRate).toBe('number');
        expect(step.users).toBeGreaterThan(0);
        expect(step.conversionRate).toBeGreaterThan(0);
        expect(step.conversionRate).toBeLessThanOrEqual(100);

        // Each step should have fewer users than the previous (funnel effect)
        if (index > 0) {
          expect(step.users).toBeLessThanOrEqual(data.data.steps[index - 1].users);
        }
      });

      // Validate overall conversion
      expect(typeof data.data.overallConversion).toBe('number');
      expect(data.data.overallConversion).toBeGreaterThan(0);
      expect(data.data.overallConversion).toBeLessThanOrEqual(100);
    });

    it('has logical funnel progression', async () => {
      const response = await getFunnel(mockRequest);
      const data = await response.json();

      const steps = data.data.steps;
      
      // First step should have 100% conversion rate
      expect(steps[0].conversionRate).toBe(100);
      
      // Each subsequent step should have lower conversion rate
      for (let i = 1; i < steps.length; i++) {
        expect(steps[i].conversionRate).toBeLessThan(steps[i - 1].conversionRate);
      }
    });
  });

  describe('/api/admin/analytics/features', () => {
    it('returns feature usage data', async () => {
      const response = await getFeatures(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('features');
      expect(data.data).toHaveProperty('popularFeatures');
      expect(data.data).toHaveProperty('underutilizedFeatures');

      // Validate features array
      expect(Array.isArray(data.data.features)).toBe(true);
      data.data.features.forEach((feature: any) => {
        expect(feature).toHaveProperty('name');
        expect(feature).toHaveProperty('usage');
        expect(feature).toHaveProperty('growth');
        expect(feature).toHaveProperty('tier');
        expect(typeof feature.name).toBe('string');
        expect(typeof feature.usage).toBe('number');
        expect(typeof feature.growth).toBe('number');
        expect(['free', 'premium']).toContain(feature.tier);
        expect(feature.usage).toBeGreaterThan(0);
      });

      // Validate popular and underutilized features
      expect(Array.isArray(data.data.popularFeatures)).toBe(true);
      expect(Array.isArray(data.data.underutilizedFeatures)).toBe(true);
      data.data.popularFeatures.forEach((feature: any) => {
        expect(typeof feature).toBe('string');
      });
      data.data.underutilizedFeatures.forEach((feature: any) => {
        expect(typeof feature).toBe('string');
      });
    });

    it('has both free and premium features', async () => {
      const response = await getFeatures(mockRequest);
      const data = await response.json();

      const freeFeatures = data.data.features.filter((f: any) => f.tier === 'free');
      const premiumFeatures = data.data.features.filter((f: any) => f.tier === 'premium');

      expect(freeFeatures.length).toBeGreaterThan(0);
      expect(premiumFeatures.length).toBeGreaterThan(0);
    });
  });

  describe('/api/admin/analytics/revenue', () => {
    it('returns revenue analytics data', async () => {
      const response = await getRevenue(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalRevenue');
      expect(data.data).toHaveProperty('monthlyRecurring');
      expect(data.data).toHaveProperty('averageRevenuePerUser');
      expect(data.data).toHaveProperty('churnRate');
      expect(data.data).toHaveProperty('revenueGrowth');

      // Validate data types
      expect(typeof data.data.totalRevenue).toBe('number');
      expect(typeof data.data.monthlyRecurring).toBe('number');
      expect(typeof data.data.averageRevenuePerUser).toBe('number');
      expect(typeof data.data.churnRate).toBe('number');

      // Validate revenue growth array
      expect(Array.isArray(data.data.revenueGrowth)).toBe(true);
      data.data.revenueGrowth.forEach((entry: any) => {
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('revenue');
        expect(entry).toHaveProperty('subscriptions');
        expect(new Date(entry.date)).toBeInstanceOf(Date);
        expect(typeof entry.revenue).toBe('number');
        expect(typeof entry.subscriptions).toBe('number');
        expect(entry.revenue).toBeGreaterThanOrEqual(0);
        expect(entry.subscriptions).toBeGreaterThanOrEqual(0);
      });
    });

    it('returns reasonable revenue metrics', async () => {
      const response = await getRevenue(mockRequest);
      const data = await response.json();

      // Validate reasonable ranges
      expect(data.data.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(data.data.monthlyRecurring).toBeGreaterThanOrEqual(0);
      expect(data.data.averageRevenuePerUser).toBeGreaterThanOrEqual(0);
      expect(data.data.churnRate).toBeGreaterThanOrEqual(0);
      expect(data.data.churnRate).toBeLessThanOrEqual(1);
    });
  });

  describe('/api/admin/analytics/export', () => {
    it('exports CSV data by default', async () => {
      const response = await getExport(mockRequest);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Disposition')).toContain('.csv');

      const content = await response.text();
      expect(content).toContain('Date,Total Users,New Users,Active Users,Premium Users');
    });

    it('exports Excel data when requested', async () => {
      const requestWithFormat = {
        url: 'http://localhost:3000/api/admin/analytics/export?format=xlsx',
        method: 'GET',
        headers: new Headers(),
        nextUrl: {
          searchParams: new URLSearchParams('format=xlsx')
        }
      } as NextRequest;

      const response = await getExport(requestWithFormat);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers.get('Content-Disposition')).toContain('.xlsx');
    });

    it('exports PDF data when requested', async () => {
      const requestWithFormat = {
        url: 'http://localhost:3000/api/admin/analytics/export?format=pdf',
        method: 'GET',
        headers: new Headers(),
        nextUrl: {
          searchParams: new URLSearchParams('format=pdf')
        }
      } as NextRequest;

      const response = await getExport(requestWithFormat);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain('.pdf');
    });

    it('handles different metrics for export', async () => {
      const metrics = ['users', 'funnel', 'features', 'revenue'];

      for (const metric of metrics) {
        const requestWithMetric = {
          url: `http://localhost:3000/api/admin/analytics/export?metric=${metric}`,
          method: 'GET',
          headers: new Headers(),
          nextUrl: {
            searchParams: new URLSearchParams(`metric=${metric}`)
          }
        } as NextRequest;

        const response = await getExport(requestWithMetric);
        expect(response.status).toBe(200);

        const content = await response.text();
        expect(content.length).toBeGreaterThan(0);
      }
    });

    it('includes date range in filename', async () => {
      const fromDate = '2024-01-01';
      const toDate = '2024-01-31';
      const requestWithDates = {
        url: `http://localhost:3000/api/admin/analytics/export?from=${fromDate}&to=${toDate}`,
        method: 'GET',
        headers: new Headers(),
        nextUrl: {
          searchParams: new URLSearchParams(`from=${fromDate}&to=${toDate}`)
        }
      } as NextRequest;

      const response = await getExport(requestWithDates);
      const contentDisposition = response.headers.get('Content-Disposition');
      
      expect(contentDisposition).toContain('2024-01-01');
      expect(contentDisposition).toContain('2024-01-31');
    });
  });

  describe('Error Handling', () => {
    it('handles invalid requests gracefully', async () => {
      const routes = [getUsers, getFunnel, getFeatures, getRevenue, getExport];
      
      for (const route of routes) {
        const response = await route(mockRequest);
        expect(response).toBeInstanceOf(Response);
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(600);
      }
    });
  });

  describe('Response Format Consistency', () => {
    it('all analytics routes return consistent response format', async () => {
      const routes = [
        { route: getUsers, name: 'users' },
        { route: getFunnel, name: 'funnel' },
        { route: getFeatures, name: 'features' },
        { route: getRevenue, name: 'revenue' }
      ];

      for (const { route, name } of routes) {
        const response = await route(mockRequest);
        const data = await response.json();

        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('data');
        expect(typeof data.success).toBe('boolean');
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
      }
    });
  });

  describe('Data Validation', () => {
    it('user growth data is chronologically ordered', async () => {
      const response = await getUsers(mockRequest);
      const data = await response.json();

      const userGrowth = data.data.userGrowth;
      for (let i = 1; i < userGrowth.length; i++) {
        const prevDate = new Date(userGrowth[i - 1].date);
        const currDate = new Date(userGrowth[i].date);
        expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
      }
    });

    it('revenue growth data is chronologically ordered', async () => {
      const response = await getRevenue(mockRequest);
      const data = await response.json();

      const revenueGrowth = data.data.revenueGrowth;
      for (let i = 1; i < revenueGrowth.length; i++) {
        const prevDate = new Date(revenueGrowth[i - 1].date);
        const currDate = new Date(revenueGrowth[i].date);
        expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
      }
    });

    it('funnel steps are in logical order', async () => {
      const response = await getFunnel(mockRequest);
      const data = await response.json();

      const steps = data.data.steps;
      const expectedOrder = [
        'Landing Page Visitors',
        'Resume Upload Started',
        'Analysis Completed',
        'Results Viewed',
        'Account Created',
        'Premium Subscription'
      ];

      steps.forEach((step: any, index: number) => {
        expect(step.name).toBe(expectedOrder[index]);
      });
    });
  });
});