import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo (replace with database later)
const modelConfigs = [
  {
    id: 'moonshot-kimi',
    name: 'Moonshot Kimi K2',
    provider: 'Moonshot',
    model: 'moonshotai/kimi-k2:free',
    tier: 'free' as const,
    isActive: true,
    priority: 1,
  },
  {
    id: 'glm-4-air',
    name: 'GLM-4.5 Air',
    provider: 'Z-AI',
    model: 'z-ai/glm-4.5-air:free',
    tier: 'free' as const,
    isActive: true,
    priority: 2,
  },
  {
    id: 'openai-gpt35',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    model: 'openai/gpt-3.5-turbo',
    tier: 'free' as const,
    isActive: true,
    priority: 3,
  },
  {
    id: 'claude-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    model: 'anthropic/claude-3-haiku',
    tier: 'free' as const,
    isActive: true,
    priority: 4,
  },
  {
    id: 'openai-gpt4',
    name: 'GPT-4',
    provider: 'OpenAI',
    model: 'openai/gpt-4',
    tier: 'premium' as const,
    isActive: true,
    priority: 1,
  },
  {
    id: 'claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    model: 'anthropic/claude-3.5-sonnet',
    tier: 'premium' as const,
    isActive: false,
    priority: 2,
  },
];

export async function GET() {
  return NextResponse.json({ models: modelConfigs });
}

export async function PUT(request: NextRequest) {
  try {
    const { modelId, updates } = await request.json();

    const modelIndex = modelConfigs.findIndex(m => m.id === modelId);
    if (modelIndex === -1) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    modelConfigs[modelIndex] = { ...modelConfigs[modelIndex], ...updates };

    return NextResponse.json({ success: true, model: modelConfigs[modelIndex] });
  } catch {
    return NextResponse.json({ error: 'Failed to update model' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newModel = await request.json();
    const model = {
      id: `custom-${Date.now()}`,
      name: newModel.name,
      provider: newModel.provider,
      model: newModel.model,
      tier: newModel.tier,
      isActive: true,
      priority: newModel.priority,
    };
    
    modelConfigs.push(model);
    
    return NextResponse.json({ success: true, model });
  } catch {
    return NextResponse.json({ error: 'Failed to create model' }, { status: 500 });
  }
}