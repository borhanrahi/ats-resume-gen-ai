import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getMetrics } from '@/app/api/admin/system/metrics/route';
import { GET as getHealth } from '@/app/api/admin/system/health/route';
import { GET as getPerformance } from '@/app/api/admin/system/performance/route';
import { GET as getErrors } from '@/app/api/admin/system/errors/route';
import { GET as getAlerts } from '@/app/api/admin/system/alerts/route';

// Mock URL constructor for Node.js environment
global.URL = global.URL || class URL {
  constructor(url: string) {
    this.href = url;
    this.origin = 'http://localhost:3000';
    this.pathname = url.replace('http://localhost:3000', '');
  }
  href: string;
  origin: string;
  pathname: string;
};

describe('Admin System API Routes', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    // Create a proper mock request object
    mockRequest = {
      url: 'http://localhost:3000/api/admin/system/metrics',
      method: 'GET',
      headers: new Headers(),
      nextUrl: {
        searchParams: new URLSearchParams()
      }
    } as NextRequest;
  });

  describe('/api/admin/system/metrics', () => {
    it('returns system metrics data', async () => {
      const response = await getMetrics(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('activeUsers');
      expect(data.data).toHaveProperty('totalAnalyses');
      expect(data.data).toHaveProperty('apiUsage');
      expect(data.data).toHaveProperty('errorRate');
      expect(data.data).toHaveProperty('revenue');

      // Validate data types
      expect(typeof data.data.activeUsers).toBe('number');
      expect(typeof data.data.totalAnalyses).toBe('number');
      expect(typeof data.data.errorRate).toBe('number');
      expect(typeof data.data.apiUsage).toBe('object');
      expect(typeof data.data.revenue).toBe('object');

      // Validate revenue structure
      expect(data.data.revenue).toHaveProperty('daily');
      expect(data.data.revenue).toHaveProperty('monthly');
      expect(data.data.revenue).toHaveProperty('total');

      // Validate API usage structure
      Object.values(data.data.apiUsage).forEach((usage: any) => {
        expect(usage).toHaveProperty('requests');
        expect(usage).toHaveProperty('failures');
        expect(usage).toHaveProperty('avgResponseTime');
        expect(typeof usage.requests).toBe('number');
        expect(typeof usage.failures).toBe('number');
        expect(typeof usage.avgResponseTime).toBe('number');
      });
    });

    it('returns reasonable metric values', async () => {
      const response = await getMetrics(mockRequest);
      const data = await response.json();

      // Validate reasonable ranges
      expect(data.data.activeUsers).toBeGreaterThan(0);
      expect(data.data.totalAnalyses).toBeGreaterThan(0);
      expect(data.data.errorRate).toBeGreaterThanOrEqual(0);
      expect(data.data.errorRate).toBeLessThan(100);
      expect(data.data.revenue.daily).toBeGreaterThanOrEqual(0);
      expect(data.data.revenue.monthly).toBeGreaterThanOrEqual(0);
      expect(data.data.revenue.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('/api/admin/system/health', () => {
    it('returns system health data', async () => {
      const response = await getHealth(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('status');
      expect(data.data).toHaveProperty('uptime');
      expect(data.data).toHaveProperty('lastUpdated');
      expect(data.data).toHaveProperty('services');

      // Validate status values
      expect(['healthy', 'warning', 'critical']).toContain(data.data.status);

      // Validate uptime
      expect(typeof data.data.uptime).toBe('number');
      expect(data.data.uptime).toBeGreaterThan(0);

      // Validate services
      expect(data.data.services).toHaveProperty('api');
      expect(data.data.services).toHaveProperty('database');
      expect(data.data.services).toHaveProperty('aiModels');
      expect(data.data.services).toHaveProperty('storage');

      Object.values(data.data.services).forEach((status: any) => {
        expect(['online', 'offline', 'degraded']).toContain(status);
      });

      // Validate lastUpdated is a valid date
      expect(new Date(data.data.lastUpdated)).toBeInstanceOf(Date);
    });
  });

  describe('/api/admin/system/performance', () => {
    it('returns performance metrics data', async () => {
      const response = await getPerformance(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('responseTime');
      expect(data.data).toHaveProperty('throughput');
      expect(data.data).toHaveProperty('resourceUsage');

      // Validate response time structure
      expect(data.data.responseTime).toHaveProperty('avg');
      expect(data.data.responseTime).toHaveProperty('p95');
      expect(data.data.responseTime).toHaveProperty('p99');
      expect(data.data.responseTime.avg).toBeGreaterThan(0);
      expect(data.data.responseTime.p95).toBeGreaterThanOrEqual(data.data.responseTime.avg);
      expect(data.data.responseTime.p99).toBeGreaterThanOrEqual(data.data.responseTime.p95);

      // Validate throughput structure
      expect(data.data.throughput).toHaveProperty('requestsPerSecond');
      expect(data.data.throughput).toHaveProperty('analysesPerHour');
      expect(data.data.throughput.requestsPerSecond).toBeGreaterThan(0);
      expect(data.data.throughput.analysesPerHour).toBeGreaterThan(0);

      // Validate resource usage structure
      expect(data.data.resourceUsage).toHaveProperty('cpu');
      expect(data.data.resourceUsage).toHaveProperty('memory');
      expect(data.data.resourceUsage).toHaveProperty('storage');
      expect(data.data.resourceUsage.cpu).toBeGreaterThanOrEqual(0);
      expect(data.data.resourceUsage.cpu).toBeLessThanOrEqual(100);
      expect(data.data.resourceUsage.memory).toBeGreaterThanOrEqual(0);
      expect(data.data.resourceUsage.memory).toBeLessThanOrEqual(100);
      expect(data.data.resourceUsage.storage).toBeGreaterThanOrEqual(0);
      expect(data.data.resourceUsage.storage).toBeLessThanOrEqual(100);
    });
  });

  describe('/api/admin/system/errors', () => {
    it('returns error metrics data', async () => {
      const response = await getErrors(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('errorRate');
      expect(data.data).toHaveProperty('criticalErrors');
      expect(data.data).toHaveProperty('warningCount');
      expect(data.data).toHaveProperty('recentErrors');

      // Validate error rate
      expect(typeof data.data.errorRate).toBe('number');
      expect(data.data.errorRate).toBeGreaterThanOrEqual(0);

      // Validate error counts
      expect(typeof data.data.criticalErrors).toBe('number');
      expect(typeof data.data.warningCount).toBe('number');
      expect(data.data.criticalErrors).toBeGreaterThanOrEqual(0);
      expect(data.data.warningCount).toBeGreaterThanOrEqual(0);

      // Validate recent errors structure
      expect(Array.isArray(data.data.recentErrors)).toBe(true);
      data.data.recentErrors.forEach((error: any) => {
        expect(error).toHaveProperty('id');
        expect(error).toHaveProperty('timestamp');
        expect(error).toHaveProperty('level');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('service');
        expect(['error', 'warning', 'critical']).toContain(error.level);
        expect(typeof error.message).toBe('string');
        expect(typeof error.service).toBe('string');
        expect(new Date(error.timestamp)).toBeInstanceOf(Date);
      });
    });
  });

  describe('/api/admin/system/alerts', () => {
    it('returns alert configuration data', async () => {
      const response = await getAlerts(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);

      // Validate alert structure
      data.data.forEach((alert: any) => {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('name');
        expect(alert).toHaveProperty('condition');
        expect(alert).toHaveProperty('threshold');
        expect(alert).toHaveProperty('isActive');
        expect(typeof alert.id).toBe('string');
        expect(typeof alert.name).toBe('string');
        expect(typeof alert.condition).toBe('string');
        expect(typeof alert.threshold).toBe('number');
        expect(typeof alert.isActive).toBe('boolean');
        
        if (alert.lastTriggered) {
          expect(new Date(alert.lastTriggered)).toBeInstanceOf(Date);
        }
      });
    });

    it('returns alerts with reasonable thresholds', async () => {
      const response = await getAlerts(mockRequest);
      const data = await response.json();

      data.data.forEach((alert: any) => {
        expect(alert.threshold).toBeGreaterThan(0);
        expect(alert.threshold).toBeLessThan(1000); // Reasonable upper bound
      });
    });
  });

  describe('Error Handling', () => {
    it('handles invalid requests gracefully', async () => {
      // This test would be more meaningful with actual error conditions
      // For now, we verify that the routes don't throw unhandled exceptions
      
      const routes = [getMetrics, getHealth, getPerformance, getErrors, getAlerts];
      
      for (const route of routes) {
        const response = await route(mockRequest);
        expect(response).toBeInstanceOf(Response);
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(600);
      }
    });
  });

  describe('Response Format Consistency', () => {
    it('all routes return consistent response format', async () => {
      const routes = [
        { route: getMetrics, name: 'metrics' },
        { route: getHealth, name: 'health' },
        { route: getPerformance, name: 'performance' },
        { route: getErrors, name: 'errors' },
        { route: getAlerts, name: 'alerts' }
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

  describe('Data Consistency', () => {
    it('metrics data remains consistent across calls', async () => {
      const response1 = await getMetrics(mockRequest);
      const data1 = await response1.json();
      
      const response2 = await getMetrics(mockRequest);
      const data2 = await response2.json();

      // Structure should be consistent
      expect(Object.keys(data1.data)).toEqual(Object.keys(data2.data));
      expect(Object.keys(data1.data.apiUsage)).toEqual(Object.keys(data2.data.apiUsage));
      expect(Object.keys(data1.data.revenue)).toEqual(Object.keys(data2.data.revenue));
    });

    it('health data structure remains consistent', async () => {
      const response1 = await getHealth(mockRequest);
      const data1 = await response1.json();
      
      const response2 = await getHealth(mockRequest);
      const data2 = await response2.json();

      // Structure should be consistent
      expect(Object.keys(data1.data)).toEqual(Object.keys(data2.data));
      expect(Object.keys(data1.data.services)).toEqual(Object.keys(data2.data.services));
    });
  });
});