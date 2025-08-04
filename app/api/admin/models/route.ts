import { NextRequest, NextResponse } from 'next/server';
import { loadModels, saveModels, ModelConfig } from '../../../../lib/models-storage';

// Load models from persistent storage
export let modelConfigs: ModelConfig[] = loadModels();

export async function GET() {
  // Always reload fresh models from persistent storage
  modelConfigs = loadModels();
  return NextResponse.json({ models: modelConfigs });
}

export async function PUT(request: NextRequest) {
  try {
    // Always reload fresh models from persistent storage
    modelConfigs = loadModels();
    
    const { modelId, updates } = await request.json();

    const modelIndex = modelConfigs.findIndex(m => m.id === modelId);
    if (modelIndex === -1) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    modelConfigs[modelIndex] = { ...modelConfigs[modelIndex], ...updates };

    // Save to persistent storage
    const saved = saveModels(modelConfigs);
    if (!saved) {
      return NextResponse.json({ error: 'Failed to save model configuration' }, { status: 500 });
    }

    return NextResponse.json({ success: true, model: modelConfigs[modelIndex] });
  } catch {
    return NextResponse.json({ error: 'Failed to update model' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Always reload fresh models from persistent storage
    modelConfigs = loadModels();
    
    const { name, provider, model, tier, isActive, apiKey } = await request.json();

    if (!name || !provider || !model || !tier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate ID from name
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Check if model already exists
    if (modelConfigs.find(m => m.id === id)) {
      return NextResponse.json({ error: 'Model with this name already exists' }, { status: 400 });
    }

    // Get the highest priority in the tier and add 1
    const tierModels = modelConfigs.filter(m => m.tier === tier);
    const maxPriority = tierModels.length > 0 ? Math.max(...tierModels.map(m => m.priority)) : 0;

    const newModel: ModelConfig = {
      id,
      name,
      provider,
      model,
      tier: tier as 'free' | 'premium',
      isActive: isActive ?? true,
      priority: maxPriority + 1,
      ...(apiKey && { apiKey }),
    };

    modelConfigs.push(newModel);
    
    // Save to persistent storage
    const saved = saveModels(modelConfigs);
    if (!saved) {
      return NextResponse.json({ error: 'Failed to save model configuration' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Model added successfully',
      model: newModel 
    });
  } catch (error) {
    console.error('Error adding model:', error);
    return NextResponse.json({ error: 'Failed to add model' }, { status: 500 });
  }
}