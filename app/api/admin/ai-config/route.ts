import { NextRequest, NextResponse } from 'next/server';
import { getAIModelManager, initializeAIModelManager } from '@/lib/ai/aiModelManager';
import type { AIModelConfig } from '@/types/admin';

// Mock admin authentication - replace with real auth
function isAdminAuthenticated(request: NextRequest): boolean {
  // TODO: Implement real admin authentication
  const authHeader = request.headers.get('authorization');
  return authHeader === 'Bearer admin-token';
}

/**
 * GET /api/admin/ai-config
 * Get all AI model configurations
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required' } },
        { status: 401 }
      );
    }

    // Initialize with default models if not already initialized
    if (!getAIModelManager()) {
      const defaultModels: AIModelConfig[] = [
        {
          id: 'openrouter-free',
          name: 'OpenRouter Free',
          provider: 'openrouter',
          apiKey: process.env.OPENROUTER_API_KEY || '',
          endpoint: 'https://openrouter.ai/api/v1',
          tier: 'free',
          priority: 1,
          isActive: true,
          fallbackModels: [],
          rateLimits: {
            requestsPerMinute: 20,
            requestsPerDay: 200
          }
        },
        {
          id: 'gemini-free',
          name: 'Gemini Free',
          provider: 'gemini',
          apiKey: process.env.GEMINI_API_KEY || '',
          endpoint: '',
          tier: 'free',
          priority: 2,
          isActive: true,
          fallbackModels: [],
          rateLimits: {
            requestsPerMinute: 15,
            requestsPerDay: 1500
          }
        }
      ];

      initializeAIModelManager({ models: defaultModels });
    }

    const manager = getAIModelManager();
    const models = manager.getAllModels();
    const stats = manager.getStats();
    const healthStatus = manager.getHealthStatus();
    const performanceMetrics = manager.getPerformanceMetrics();

    return NextResponse.json({
      success: true,
      data: {
        models,
        stats,
        healthStatus,
        performanceMetrics
      }
    });

  } catch (error) {
    console.error('Error fetching AI config:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch AI configuration',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ai-config
 * Add a new AI model
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { model } = body;

    if (!model || !model.name || !model.provider || !model.apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing required model fields: name, provider, apiKey'
          }
        },
        { status: 400 }
      );
    }

    // Generate ID if not provided
    if (!model.id) {
      model.id = `${model.provider}-${Date.now()}`;
    }

    // Set defaults
    const newModel: AIModelConfig = {
      id: model.id,
      name: model.name,
      provider: model.provider,
      apiKey: model.apiKey,
      endpoint: model.endpoint || '',
      tier: model.tier || 'free',
      priority: model.priority || 1,
      isActive: model.isActive ?? true,
      fallbackModels: model.fallbackModels || [],
      rateLimits: model.rateLimits || {
        requestsPerMinute: 60,
        requestsPerDay: 1000
      }
    };

    const manager = getAIModelManager();
    await manager.addModel(newModel);

    return NextResponse.json({
      success: true,
      data: { model: newModel }
    });

  } catch (error) {
    console.error('Error adding AI model:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to add AI model',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/ai-config
 * Update AI model configuration
 */
export async function PUT(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { modelId, updates } = body;

    if (!modelId || !updates) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing required fields: modelId, updates'
          }
        },
        { status: 400 }
      );
    }

    const manager = getAIModelManager();
    await manager.updateModel(modelId, updates);

    const updatedModel = manager.getModel(modelId);

    return NextResponse.json({
      success: true,
      data: { model: updatedModel }
    });

  } catch (error) {
    console.error('Error updating AI model:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update AI model',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}