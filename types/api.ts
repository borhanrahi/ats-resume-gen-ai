import type { ResumeData } from './resume';

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface AnalysisRequest {
  resumeContent: string;
  jobDescription?: string;
  userId?: string;
  tier: 'free' | 'premium';
}

export interface ExportRequest {
  resumeData: ResumeData;
  format: 'pdf' | 'docx';
  templateId?: string;
  userId: string;
}

export interface ModelConfigUpdate {
  modelId: string;
  changes: Partial<import('./admin').AIModelConfig>;
  adminId: string;
  reason: string;
}

export interface FallbackChainConfig {
  tier: 'free' | 'premium';
  primaryModel: string;
  fallbackModels: string[];
  maxRetries: number;
  timeoutMs: number;
}