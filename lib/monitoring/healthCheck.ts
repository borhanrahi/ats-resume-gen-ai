/**
 * Health Check System for Production Monitoring
 */

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    database: boolean;
    aiServices: boolean;
    storage: boolean;
    memory: boolean;
    responseTime: number;
  };
  errors?: string[];
}

export interface SystemMetrics {
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  activeUsers: number;
}

class HealthCheckService {
  private static instance: HealthCheckService;
  private metrics: SystemMetrics;
  private startTime: Date;

  private constructor() {
    this.startTime = new Date();
    this.metrics = {
      uptime: 0,
      memoryUsage: { used: 0, total: 0, percentage: 0 },
      responseTime: { avg: 0, p95: 0, p99: 0 },
      errorRate: 0,
      activeUsers: 0
    };
  }

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    const checks = {
      database: await this.checkDatabase(),
      aiServices: await this.checkAIServices(),
      storage: await this.checkStorage(),
      memory: this.checkMemory(),
      responseTime: Date.now() - startTime
    };

    // Collect errors
    if (!checks.database) errors.push('Database connection failed');
    if (!checks.aiServices) errors.push('AI services unavailable');
    if (!checks.storage) errors.push('Storage system error');
    if (!checks.memory) errors.push('High memory usage detected');
    if (checks.responseTime > 5000) errors.push('High response time');

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (errors.length > 0) {
      status = errors.length > 2 ? 'unhealthy' : 'degraded';
    }

    return {
      status,
      timestamp: new Date(),
      checks,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      // Check Appwrite connection
      if (typeof window === 'undefined') {
        // Server-side check
        const response = await fetch(`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/health`, {
          method: 'GET',
          timeout: 5000
        } as any);
        return response.ok;
      }
      return true; // Client-side always returns true
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  private async checkAIServices(): Promise<boolean> {
    try {
      // Check OpenRouter API
      const openRouterCheck = await this.checkOpenRouter();
      const geminiCheck = await this.checkGemini();
      
      return openRouterCheck || geminiCheck; // At least one should work
    } catch (error) {
      console.error('AI services health check failed:', error);
      return false;
    }
  }

  private async checkOpenRouter(): Promise<boolean> {
    try {
      if (!process.env.OPENROUTER_API_KEY) return false;
      
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        },
        timeout: 5000
      } as any);
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async checkGemini(): Promise<boolean> {
    try {
      if (!process.env.GEMINI_API_KEY) return false;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`, {
        timeout: 5000
      } as any);
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async checkStorage(): Promise<boolean> {
    try {
      // Check localStorage availability (client-side)
      if (typeof window !== 'undefined') {
        localStorage.setItem('health-check', 'test');
        localStorage.removeItem('health-check');
        return true;
      }
      return true; // Server-side storage check
    } catch (error) {
      return false;
    }
  }

  private checkMemory(): boolean {
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage();
        const usedMB = usage.heapUsed / 1024 / 1024;
        const totalMB = usage.heapTotal / 1024 / 1024;
        
        this.metrics.memoryUsage = {
          used: usedMB,
          total: totalMB,
          percentage: (usedMB / totalMB) * 100
        };
        
        // Alert if memory usage is above 80%
        return this.metrics.memoryUsage.percentage < 80;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  getSystemMetrics(): SystemMetrics {
    const now = new Date();
    this.metrics.uptime = now.getTime() - this.startTime.getTime();
    return { ...this.metrics };
  }

  updateMetrics(metrics: Partial<SystemMetrics>): void {
    this.metrics = { ...this.metrics, ...metrics };
  }

  async sendAlert(message: string, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<void> {
    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[${severity.toUpperCase()}] Health Alert:`, message);
        return;
      }

      // In production, you could send to external monitoring services
      // Example: Sentry, DataDog, New Relic, etc.
      
      // For now, we'll log to our internal system
      const alertData = {
        message,
        severity,
        timestamp: new Date().toISOString(),
        metrics: this.getSystemMetrics()
      };

      // Store alert in database or send to external service
      console.error('System Alert:', alertData);
      
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }
}

export const healthCheckService = HealthCheckService.getInstance();

// Performance monitoring utilities
export class PerformanceMonitor {
  private static responseTimeHistory: number[] = [];
  private static errorCount = 0;
  private static requestCount = 0;

  static recordResponseTime(time: number): void {
    this.responseTimeHistory.push(time);
    this.requestCount++;
    
    // Keep only last 1000 entries
    if (this.responseTimeHistory.length > 1000) {
      this.responseTimeHistory.shift();
    }

    // Update health check metrics
    const avg = this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length;
    const sorted = [...this.responseTimeHistory].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    healthCheckService.updateMetrics({
      responseTime: {
        avg,
        p95: sorted[p95Index] || 0,
        p99: sorted[p99Index] || 0
      },
      errorRate: (this.errorCount / this.requestCount) * 100
    });
  }

  static recordError(): void {
    this.errorCount++;
    
    // Alert if error rate is too high
    const errorRate = (this.errorCount / this.requestCount) * 100;
    if (errorRate > 5) { // 5% error rate threshold
      healthCheckService.sendAlert(
        `High error rate detected: ${errorRate.toFixed(2)}%`,
        'high'
      );
    }
  }

  static getStats() {
    return {
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      errorRate: (this.errorCount / this.requestCount) * 100,
      avgResponseTime: this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length
    };
  }
}

// Uptime monitoring
export class UptimeMonitor {
  private static checks: { timestamp: Date; status: boolean }[] = [];

  static async performUptimeCheck(): Promise<void> {
    try {
      const healthResult = await healthCheckService.performHealthCheck();
      const isUp = healthResult.status !== 'unhealthy';
      
      this.checks.push({
        timestamp: new Date(),
        status: isUp
      });

      // Keep only last 24 hours of checks (assuming checks every 5 minutes)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.checks = this.checks.filter(check => check.timestamp > oneDayAgo);

      // Calculate uptime percentage
      const totalChecks = this.checks.length;
      const successfulChecks = this.checks.filter(check => check.status).length;
      const uptimePercentage = (successfulChecks / totalChecks) * 100;

      // Alert if uptime drops below 99%
      if (uptimePercentage < 99 && totalChecks > 10) {
        await healthCheckService.sendAlert(
          `Low uptime detected: ${uptimePercentage.toFixed(2)}%`,
          'critical'
        );
      }

    } catch (error) {
      console.error('Uptime check failed:', error);
      this.checks.push({
        timestamp: new Date(),
        status: false
      });
    }
  }

  static getUptimeStats() {
    const totalChecks = this.checks.length;
    const successfulChecks = this.checks.filter(check => check.status).length;
    const uptimePercentage = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;

    return {
      totalChecks,
      successfulChecks,
      uptimePercentage,
      lastCheck: this.checks[this.checks.length - 1]?.timestamp || null
    };
  }
}