export type AdminPermission =
  | "user_management"
  | "payment_management"
  | "ai_model_config"
  | "system_analytics"
  | "feature_management"
  | "super_admin";

export interface AdminUser {
  id: string;
  email: string;
  role: "super_admin" | "admin" | "moderator";
  permissions: AdminPermission[];
  lastLogin: Date;
}

export interface AIModelConfig {
  id: string;
  name: string;
  provider: "openrouter" | "gemini" | "claude" | "custom";
  apiKey: string;
  endpoint: string;
  tier: "free" | "premium";
  priority: number;
  isActive: boolean;
  fallbackModels: string[];
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

export interface SystemMetrics {
  activeUsers: number;
  totalAnalyses: number;
  apiUsage: {
    [modelId: string]: {
      requests: number;
      failures: number;
      avgResponseTime: number;
    };
  };
  errorRate: number;
  revenue: {
    daily: number;
    monthly: number;
    total: number;
  };
}

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "idea" | "planned" | "in_progress" | "completed" | "cancelled";
  complexity: "simple" | "medium" | "complex";
  businessValue: number;
  requestedBy: string;
  createdAt: Date;
  estimatedHours: number;
}

export interface AdminConfig {
  $id: string;
  key: string;
  value: string | number | boolean | object;
  category: "ai_models" | "system" | "features" | "payments";
  updatedBy: string;
  updatedAt: Date;
}

export interface SystemLog {
  $id: string;
  level: "info" | "warning" | "error" | "critical";
  message: string;
  context: Record<string, unknown>;
  userId?: string;
  adminId?: string;
  createdAt: Date;
}

export interface FallbackChainConfig {
  tier: 'free' | 'premium';
  primaryModel: string;
  fallbackModels: string[];
  maxRetries: number;
  timeoutMs: number;
}

export interface ModelConfigUpdate {
  modelId: string;
  changes: Partial<AIModelConfig>;
  adminId: string;
  reason: string;
}
