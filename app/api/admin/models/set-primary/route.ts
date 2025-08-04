import { NextRequest, NextResponse } from 'next/server';

// Import the models from the main route (in a real app, this would be from a database)
import { modelConfigs } from '../route';

export async function POST(request: NextRequest) {
  try {
    const { modelId } = await request.json();

    if (!modelId) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
    }

    // Find the model to set as primary
    const targetModel = modelConfigs.find(m => m.id === modelId);
    if (!targetModel) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Update priorities: set target model to priority 1, increment others
    modelConfigs.forEach(model => {
      if (model.id === modelId) {
        model.priority = 1;
      } else if (model.priority === 1) {
        // Find the next available priority
        const maxPriority = Math.max(...modelConfigs.map(m => m.priority));
        model.priority = maxPriority + 1;
      }
    });

    // Sort models by priority to maintain order
    modelConfigs.sort((a, b) => a.priority - b.priority);

    return NextResponse.json({ 
      success: true, 
      message: `${targetModel.name} is now the primary model`,
      models: modelConfigs 
    });
  } catch (error) {
    console.error('Error setting primary model:', error);
    return NextResponse.json({ error: 'Failed to set primary model' }, { status: 500 });
  }
}