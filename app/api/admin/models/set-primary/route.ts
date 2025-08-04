import { NextRequest, NextResponse } from 'next/server';
import { loadModels, saveModels, normalizePriorities } from '../../../../../lib/models-storage';

export async function POST(request: NextRequest) {
  try {
    const { modelId } = await request.json();

    if (!modelId) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
    }

    // Load current models from persistent storage
    const modelConfigs = loadModels();

    // Find the model to set as primary
    const targetModel = modelConfigs.find(m => m.id === modelId);
    if (!targetModel) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Set the target model as priority 1 in its tier
    const sametierModels = modelConfigs.filter(m => m.tier === targetModel.tier && m.id !== modelId);
    
    // Set target model to priority 1
    targetModel.priority = 1;
    
    // Increment priority of other models in the same tier
    sametierModels.forEach(model => {
      model.priority = model.priority + 1;
    });

    // Normalize priorities to ensure sequential numbering (1, 2, 3, etc.) within each tier
    normalizePriorities(modelConfigs);

    // Sort all models by tier and priority for display
    modelConfigs.sort((a, b) => {
      // Primary model (priority 1) comes first regardless of tier
      if (a.priority === 1 && b.priority !== 1) return -1;
      if (b.priority === 1 && a.priority !== 1) return 1;
      
      // Then sort by tier (premium first, then free)
      if (a.tier !== b.tier) {
        return a.tier === 'premium' ? -1 : 1;
      }
      
      // Within same tier, sort by priority
      return a.priority - b.priority;
    });

    // Save to persistent storage
    const saved = saveModels(modelConfigs);
    if (!saved) {
      return NextResponse.json({ error: 'Failed to save model configuration' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `${targetModel.name} is now the primary model in ${targetModel.tier} tier`,
      models: modelConfigs 
    });
  } catch (error) {
    console.error('Error setting primary model:', error);
    return NextResponse.json({ error: 'Failed to set primary model' }, { status: 500 });
  }
}