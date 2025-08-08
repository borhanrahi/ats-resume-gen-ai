/**
 * Admin Security and IP Restrictions for Production
 */

export interface SecurityConfig {
  allowedIPs: string[];
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  sessionTimeout: number; // in minutes
  requireMFA: boolean;
  allowedCountries?: string[];
}

export interface LoginAttempt {
  ip: string;
  timestamp: Date;
  success: boolean;
  userAgent: string;
  location?: string;
}

export interface SecurityAlert {
  id: string;
  type: 'suspicious_login' | 'brute_force' | 'unauthorized_access' | 'ip_blocked';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  ip: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class AdminSecurityService {
  private static instance: AdminSecurityService;
  private loginAttempts: Map<string, LoginAttempt[]> = new Map();
  private blockedIPs: Set<string> = new Set();
  private securityAlerts: SecurityAlert[] = [];
  private config: SecurityConfig;

  private constructor() {
    this.config = {
      allowedIPs: this.parseAllowedIPs(),
      maxLoginAttempts: 5,
      lockoutDuration: 30, // 30 minutes
      sessionTimeout: 120, // 2 hours
      requireMFA: process.env.NODE_ENV === 'production',
      allowedCountries: process.env.ADMIN_ALLOWED_COUNTRIES?.split(',')
    };
  }

  static getInstance(): AdminSecurityService {
    if (!AdminSecurityService.instance) {
      AdminSecurityService.instance = new AdminSecurityService();
    }
    return AdminSecurityService.instance;
  }

  private parseAllowedIPs(): string[] {
    const allowedIPs = process.env.ADMIN_ALLOWED_IPS;
    if (!allowedIPs) {
      console.warn('ADMIN_ALLOWED_IPS not configured - admin access will be restricted to localhost');
      return ['127.0.0.1', '::1', 'localhost'];
    }
    return allowedIPs.split(',').map(ip => ip.trim());
  }

  isIPAllowed(ip: string): boolean {
    // In development, allow all IPs
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // Check if IP is blocked
    if (this.blockedIPs.has(ip)) {
      this.createSecurityAlert('ip_blocked', 'high', `Blocked IP attempted access: ${ip}`, ip);
      return false;
    }

    // Check against allowed IPs
    const isAllowed = this.config.allowedIPs.some(allowedIP => {
      if (allowedIP.includes('/')) {
        // CIDR notation support
        return this.isIPInCIDR(ip, allowedIP);
      }
      return ip === allowedIP || allowedIP === '*';
    });

    if (!isAllowed) {
      this.createSecurityAlert('unauthorized_access', 'high', `Unauthorized IP attempted admin access: ${ip}`, ip);
    }

    return isAllowed;
  }

  private isIPInCIDR(ip: string, cidr: string): boolean {
    // Simple CIDR check - in production, use a proper IP library
    const [network, prefixLength] = cidr.split('/');
    const prefix = parseInt(prefixLength, 10);
    
    // This is a simplified implementation
    // In production, use libraries like 'ip-range-check' or 'netmask'
    if (prefix === 24) {
      const networkParts = network.split('.');
      const ipParts = ip.split('.');
      return networkParts.slice(0, 3).join('.') === ipParts.slice(0, 3).join('.');
    }
    
    return ip === network;
  }

  recordLoginAttempt(ip: string, success: boolean, userAgent: string, location?: string): void {
    const attempt: LoginAttempt = {
      ip,
      timestamp: new Date(),
      success,
      userAgent,
      location
    };

    if (!this.loginAttempts.has(ip)) {
      this.loginAttempts.set(ip, []);
    }

    const attempts = this.loginAttempts.get(ip)!;
    attempts.push(attempt);

    // Keep only last 24 hours of attempts
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.loginAttempts.set(ip, attempts.filter(a => a.timestamp > oneDayAgo));

    // Check for brute force attempts
    if (!success) {
      this.checkBruteForce(ip);
    }

    // Check for suspicious patterns
    this.checkSuspiciousActivity(ip);
  }

  private checkBruteForce(ip: string): void {
    const attempts = this.loginAttempts.get(ip) || [];
    const recentFailures = attempts.filter(a => 
      !a.success && 
      a.timestamp > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
    );

    if (recentFailures.length >= this.config.maxLoginAttempts) {
      this.blockIP(ip, this.config.lockoutDuration);
      this.createSecurityAlert(
        'brute_force',
        'critical',
        `Brute force attack detected from IP: ${ip}. ${recentFailures.length} failed attempts in 15 minutes.`,
        ip,
        { attempts: recentFailures.length }
      );
    }
  }

  private checkSuspiciousActivity(ip: string): void {
    const attempts = this.loginAttempts.get(ip) || [];
    const recentAttempts = attempts.filter(a => 
      a.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    // Check for multiple user agents (possible bot)
    const userAgents = new Set(recentAttempts.map(a => a.userAgent));
    if (userAgents.size > 3 && recentAttempts.length > 10) {
      this.createSecurityAlert(
        'suspicious_login',
        'medium',
        `Suspicious activity: Multiple user agents from IP ${ip}`,
        ip,
        { userAgents: Array.from(userAgents), attempts: recentAttempts.length }
      );
    }

    // Check for rapid succession attempts
    const rapidAttempts = recentAttempts.filter((attempt, index) => {
      if (index === 0) return false;
      const prevAttempt = recentAttempts[index - 1];
      return attempt.timestamp.getTime() - prevAttempt.timestamp.getTime() < 1000; // Less than 1 second apart
    });

    if (rapidAttempts.length > 5) {
      this.createSecurityAlert(
        'suspicious_login',
        'high',
        `Rapid succession login attempts from IP ${ip}`,
        ip,
        { rapidAttempts: rapidAttempts.length }
      );
    }
  }

  private blockIP(ip: string, durationMinutes: number): void {
    this.blockedIPs.add(ip);
    
    // Auto-unblock after duration
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      console.log(`IP ${ip} has been automatically unblocked`);
    }, durationMinutes * 60 * 1000);

    console.warn(`IP ${ip} has been blocked for ${durationMinutes} minutes due to security violations`);
  }

  private createSecurityAlert(
    type: SecurityAlert['type'],
    severity: SecurityAlert['severity'],
    message: string,
    ip: string,
    metadata?: Record<string, any>
  ): void {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      ip,
      timestamp: new Date(),
      metadata
    };

    this.securityAlerts.push(alert);

    // Keep only last 1000 alerts
    if (this.securityAlerts.length > 1000) {
      this.securityAlerts.shift();
    }

    // Send immediate notification for critical alerts
    if (severity === 'critical') {
      this.sendCriticalSecurityAlert(alert);
    }

    console.warn(`Security Alert [${severity.toUpperCase()}]:`, message);
  }

  private async sendCriticalSecurityAlert(alert: SecurityAlert): Promise<void> {
    try {
      // In production, integrate with alerting systems
      if (process.env.SECURITY_WEBHOOK_URL) {
        await fetch(process.env.SECURITY_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: `🚨 Critical Security Alert`,
            attachments: [{
              color: 'danger',
              fields: [
                { title: 'Type', value: alert.type, short: true },
                { title: 'IP Address', value: alert.ip, short: true },
                { title: 'Message', value: alert.message, short: false },
                { title: 'Time', value: alert.timestamp.toISOString(), short: true }
              ]
            }]
          }),
        });
      }

      // Log to external security monitoring service
      if (process.env.SECURITY_LOG_ENDPOINT) {
        await fetch(process.env.SECURITY_LOG_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SECURITY_LOG_TOKEN}`
          },
          body: JSON.stringify(alert),
        });
      }
    } catch (error) {
      console.error('Failed to send critical security alert:', error);
    }
  }

  getSecurityMetrics(): {
    blockedIPs: string[];
    recentAlerts: SecurityAlert[];
    loginAttemptStats: {
      totalAttempts: number;
      successfulLogins: number;
      failedAttempts: number;
      uniqueIPs: number;
    };
  } {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAlerts = this.securityAlerts.filter(alert => alert.timestamp > oneDayAgo);

    let totalAttempts = 0;
    let successfulLogins = 0;
    let failedAttempts = 0;
    const uniqueIPs = new Set<string>();

    for (const [ip, attempts] of this.loginAttempts.entries()) {
      const recentAttempts = attempts.filter(a => a.timestamp > oneDayAgo);
      totalAttempts += recentAttempts.length;
      successfulLogins += recentAttempts.filter(a => a.success).length;
      failedAttempts += recentAttempts.filter(a => !a.success).length;
      if (recentAttempts.length > 0) {
        uniqueIPs.add(ip);
      }
    }

    return {
      blockedIPs: Array.from(this.blockedIPs),
      recentAlerts: recentAlerts.slice(-50), // Last 50 alerts
      loginAttemptStats: {
        totalAttempts,
        successfulLogins,
        failedAttempts,
        uniqueIPs: uniqueIPs.size
      }
    };
  }

  unblockIP(ip: string): boolean {
    if (this.blockedIPs.has(ip)) {
      this.blockedIPs.delete(ip);
      console.log(`IP ${ip} has been manually unblocked`);
      return true;
    }
    return false;
  }

  addAllowedIP(ip: string): void {
    if (!this.config.allowedIPs.includes(ip)) {
      this.config.allowedIPs.push(ip);
      console.log(`IP ${ip} has been added to allowed list`);
    }
  }

  removeAllowedIP(ip: string): void {
    const index = this.config.allowedIPs.indexOf(ip);
    if (index > -1) {
      this.config.allowedIPs.splice(index, 1);
      console.log(`IP ${ip} has been removed from allowed list`);
    }
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Security configuration updated');
  }
}

export const adminSecurityService = AdminSecurityService.getInstance();

// Middleware helper for checking admin access
export function checkAdminAccess(ip: string, userAgent: string): {
  allowed: boolean;
  reason?: string;
} {
  if (!adminSecurityService.isIPAllowed(ip)) {
    return {
      allowed: false,
      reason: 'IP address not authorized for admin access'
    };
  }

  return { allowed: true };
}

// Rate limiting for admin endpoints
export class AdminRateLimiter {
  private static requests: Map<string, number[]> = new Map();
  private static readonly WINDOW_SIZE = 15 * 60 * 1000; // 15 minutes
  private static readonly MAX_REQUESTS = 100; // Max requests per window

  static isAllowed(ip: string): boolean {
    const now = Date.now();
    const windowStart = now - this.WINDOW_SIZE;

    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }

    const requests = this.requests.get(ip)!;
    
    // Remove old requests
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    this.requests.set(ip, recentRequests);

    // Check if under limit
    if (recentRequests.length >= this.MAX_REQUESTS) {
      adminSecurityService.recordLoginAttempt(ip, false, 'rate-limited', 'Rate limit exceeded');
      return false;
    }

    // Add current request
    recentRequests.push(now);
    return true;
  }
}