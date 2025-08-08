import { NextRequest, NextResponse } from 'next/server';
import { withAIModelConfigAuth } from '../../../lib/auth/adminMiddleware';
import { getAIModelManager, initializeAIModelManager } from '../../../lib/ai/aiModelManager';
import type { AIModelConfig, FallbackChainConfig } from '../../../types/admin';
import { databases, DATABASE_ID, COLLECTIONS } from '../../../lib/auth/appwrite';
import { ID, Query } from 'appwrite';

// Get AI model configurations from database
async function getAIModelsFromDatabase(): Promise<AIModelConfig[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.ADMIN_CONFIGS,
      [
        Query.equal('category', 'ai_models'),
        Query.orderAsc('value.priority')
      ]
    );

    return response.documents.map(doc => doc.value as AIModelConfig);
  } catch (error) {
    console.warn('Database query failed, using default models');
    
    // Return default models if database fails
    return [
      {
        id: 'openrouter-free',
        name: 'OpenRouter Free',
        provider: 'openrouter',
        apiKey: process.env.OPENROUTER_API_KEY || '',
        endpoint: 'https://openrouter.ai/api/v1',
        tier: 'free',
        priority: 1,
        isActive: true,
        fallbackModels: ['gemini-free'],
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
      },
      {
        id: 'openrouter-premium',
        name: 'OpenRouter Premium',
        provider: 'openrouter',
        apiKey: process.env.OPENROUTER_API_KEY || '',
        endpoint: 'https://openrouter.ai/api/v1',
        tier: 'premium',
        priority: 1,
        isActive: true,
        fallbackModels: ['gemini-premium'],
        rateLimits: {
          requestsPerMinute: 100,
          requestsPerDay: 10000
        }
      },
      {
        id: 'gemini-premium',
        name: 'Gemini Premium',
        provider: 'gemini',
        apiKey: process.env.GEMINI_API_KEY || '',
        endpoint: '',
        tier: 'premium',
        priority: 2,
        isActive: true,
        fallbackModels: [],
        rateLimits: {
          requestsPerMinute: 60,
          requestsPerDay: 5000
        }
      }
    ];
  }
}

// Get fallback chain configurations
async function getFallbackChains(): Promise<FallbackChainConfig[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.ADMIN_CONFIGS,
      [
        Query.equal('category', 'ai_models'),
        Query.equal('key', 'fallback_chain')
      ]
    );

    if (response.documents.length > 0) {
      return response.documents.map(doc => doc.value as FallbackChainConfig);
    }

    // Return default fallback chains
    return [
      {
        tier: 'free',
        primaryModel: 'openrouter-free',
        fallbackModels: ['gemini-free'],
        maxRetries: 3,
        timeoutMs: 30000
      },
      {
        tier: 'premium',
        primaryModel: 'openrouter-premium',
        fallbackModels: ['gemini-premium', 'openrouter-free'],
        maxRetries: 5,
        timeoutMs: 45000
      }
    ];
  } catch (error) {
    console.warn('Failed to get fallback chains, using defaults');
    return [
      {
        tier: 'free',
        primaryModel: 'openrouter-free',
        fallbackModels: ['gemini-free'],
        maxRetries: 3,
        timeoutMs: 30000
      },
      {
        tier: 'premium',
        primaryModel: 'openrouter-premium',
        fallbackModels: ['gemini-premium'],
        maxRetries: 5,
        timeoutMs: 45000
      }
    ];
  }
}

/**
 * GET /api/admin/ai-config
 * Get all AI model configurations
 */
const getAIConfigHandler = async (request: NextRequest, { user }: { user: any }) => {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('stats') !== 'false';
    const includeHealth = searchParams.get('health') !== 'false';
    const includeMetrics = searchParams.get('metrics') !== 'false';
    const includeFallbacks = searchParams.get('fallbacks') !== 'false';

    // Get models from database
    const models = await getAIModelsFromDatabase();
    
    const response: any = {
      success: true,
      models,
      timestamp: new Date().toISOString()
    };

    // Include fallback chains if requested
    if (includeFallbacks) {
      response.fallbackChains = await getFallbackChains();
    }

    // Initialize AI model manager if needed
    if (!getAIModelManager()) {
      initializeAIModelManager({ models });
    }

    const manager = getAIModelManager();

    // Include stats if requested
    if (includeStats) {
      response.stats = manager.getStats();
    }

    // Include health status if requested
    if (includeHealth) {
      response.healthStatus = manager.getHealthStatus();
    }

    // Include performance metrics if requested
    if (includeMetrics) {
      response.performanceMetrics = manager.getPerformanceMetrics();
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching AI config:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch AI configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const GET = withAIModelConfigAuth(getAIConfigHandler);

/**
 * POST /api/admin/ai-config
 * Add a new AI model
 */
const addAIModelHandler = async (request: NextRequest, { user }: { user: any }) => {
  try {
    const body = await request.json();
    const { model } = body;

    // Validate required fields
    if (!model || !model.name || !model.provider) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Model name and provider are required',
          requiredFields: ['name', 'provider']
        },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = ['openrouter', 'gemini', 'claude', 'custom'];
    if (!validProviders.includes(model.provider)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid provider',
          message: `Provider must be one of: ${validProviders.join(', ')}`,
          validProviders
        },
        { status: 400 }
      );
    }

    // Validate tier
    if (model.tier && !['free', 'premium'].includes(model.tier)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid tier',
          message: 'Tier must be either "free" or "premium"'
        },
        { status: 400 }
      );
    }

    // Generate ID if not provided
    if (!model.id) {
      model.id = `${model.provider}-${Date.now()}`;
    }

    // Check if model ID already exists
    const existingModels = await getAIModelsFromDatabase();
    if (existingModels.some(m => m.id === model.id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Model ID already exists',
          message: `A model with ID "${model.id}" already exists`
        },
        { status: 409 }
      );
    }

    // Set defaults
    const newModel: AIModelConfig = {
      id: model.id,
      name: model.name.trim(),
      provider: model.provider,
      apiKey: model.apiKey || '',
      endpoint: model.endpoint || '',
      tier: model.tier || 'free',
      priority: model.priority || 1,
      isActive: model.isActive ?? true,
      fallbackModels: model.fallbackModels || [],
      rateLimits: model.rateLimits || {
        requestsPerMinute: model.tier === 'premium' ? 100 : 60,
        requestsPerDay: model.tier === 'premium' ? 10000 : 1000
      }
    };

    // Save to database
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ADMIN_CONFIGS,
        ID.unique(),
        {
          key: `ai_model_${newModel.id}`,
          value: newModel,
          category: 'ai_models',
          updatedBy: user.id,
          updatedAt: new Date().toISOString()
        }
      );
    } catch (dbError) {
      console.error('Database save failed:', dbError);
      // Continue with in-memory addition for development
    }

    // Add to AI model manager
    const manager = getAIModelManager();
    if (manager) {
      await manager.addModel(newModel);
    }

    return NextResponse.json({
      success: true,
      model: newModel,
      message: 'AI model added successfully',
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding AI model:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add AI model',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const POST = withAIModelConfigAuth(addAIModelHandler);

/**
 * PUT /api/admin/ai-config
 * Update AI model configuration
 */
const updateAIModelHandler = async (request: NextRequest, { user }: { user: any }) => {
  try {
    const body = await request.json();
    const { modelId, updates } = body;

    if (!modelId || !updates) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Model ID and updates are required',
          requiredFields: ['modelId', 'updates']
        },
        { status: 400 }
      );
    }

    // Validate modelId format
    if (!modelId.match(/^[a-zA-Z0-9_-]+$/)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid model ID format',
          message: 'Model ID contains invalid characters'
        },
        { status: 400 }
      );
    }

    // Get existing models
    const existingModels = await getAIModelsFromDatabase();
    const existingModel = existingModels.find(m => m.id === modelId);

    if (!existingModel) {
      return NextResponse.json(
        {
          success: false,
          error: 'Model not found',
          message: `AI model with ID "${modelId}" does not exist`
        },
        { status: 404 }
      );
    }

    // Validate updates
    const allowedFields = [
      'name', 'apiKey', 'endpoint', 'tier', 'priority', 
      'isActive', 'fallbackModels', 'rateLimits'
    ];

    const validUpdates: Partial<AIModelConfig> = {};
    const changedFields: string[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        validUpdates[key as keyof AIModelConfig] = value;
        changedFields.push(key);
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid fields to update',
          message: 'Please provide valid fields to update',
          allowedFields
        },
        { status: 400 }
      );
    }

    // Validate specific fields
    if (validUpdates.tier && !['free', 'premium'].includes(validUpdates.tier)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid tier',
          message: 'Tier must be either "free" or "premium"'
        },
        { status: 400 }
      );
    }

    if (validUpdates.priority && (validUpdates.priority < 1 || validUpdates.priority > 100)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid priority',
          message: 'Priority must be between 1 and 100'
        },
        { status: 400 }
      );
    }

    // Create updated model
    const updatedModel: AIModelConfig = {
      ...existingModel,
      ...validUpdates
    };

    // Update in database
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ADMIN_CONFIGS,
        [
          Query.equal('category', 'ai_models'),
          Query.equal('key', `ai_model_${modelId}`)
        ]
      );

      if (response.documents.length > 0) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.ADMIN_CONFIGS,
          response.documents[0].$id,
          {
            value: updatedModel,
            updatedBy: user.id,
            updatedAt: new Date().toISOString()
          }
        );
      }
    } catch (dbError) {
      console.error('Database update failed:', dbError);
      // Continue with in-memory update for development
    }

    // Update in AI model manager
    const manager = getAIModelManager();
    if (manager) {
      await manager.updateModel(modelId, validUpdates);
    }

    return NextResponse.json({
      success: true,
      model: updatedModel,
      message: 'AI model updated successfully',
      updatedFields: changedFields,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating AI model:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update AI model',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const PUT = withAIModelConfigAuth(updateAIModelHandler);

/**
 * DELETE /api/admin/ai-config
 * Delete AI model configuration
 */
const deleteAIModelHandler = async (request: NextRequest, { user }: { user: any }) => {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');

    if (!modelId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing model ID',
          message: 'Model ID is required as a query parameter'
        },
        { status: 400 }
      );
    }

    // Get existing models
    const existingModels = await getAIModelsFromDatabase();
    const existingModel = existingModels.find(m => m.id === modelId);

    if (!existingModel) {
      return NextResponse.json(
        {
          success: false,
          error: 'Model not found',
          message: `AI model with ID "${modelId}" does not exist`
        },
        { status: 404 }
      );
    }

    // Check if model is being used as fallback
    const modelsUsingAsFallback = existingModels.filter(m => 
      m.fallbackModels.includes(modelId)
    );

    if (modelsUsingAsFallback.length > 0) {
      const force = searchParams.get('force') === 'true';
      
      if (!force) {
        return NextResponse.json(
          {
            success: false,
            error: 'Model is used as fallback',
            message: `Cannot delete model that is used as fallback by other models. Use force=true to override.`,
            dependentModels: modelsUsingAsFallback.map(m => ({ id: m.id, name: m.name }))
          },
          { status: 409 }
        );
      }
    }

    // Delete from database
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ADMIN_CONFIGS,
        [
          Query.equal('category', 'ai_models'),
          Query.equal('key', `ai_model_${modelId}`)
        ]
      );

      if (response.documents.length > 0) {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.ADMIN_CONFIGS,
          response.documents[0].$id
        );
      }
    } catch (dbError) {
      console.error('Database deletion failed:', dbError);
      // Continue with in-memory deletion for development
    }

    // Remove from AI model manager
    const manager = getAIModelManager();
    if (manager) {
      await manager.removeModel(modelId);
    }

    return NextResponse.json({
      success: true,
      message: `AI model "${modelId}" deleted successfully`,
      deletedModel: {
        id: existingModel.id,
        name: existingModel.name,
        provider: existingModel.provider
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting AI model:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete AI model',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const DELETE = withAIModelConfigAuth(deleteAIModelHandler);