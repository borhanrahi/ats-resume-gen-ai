import fs from 'fs';
import path from 'path';

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  tier: 'free' | 'premium';
  isActive: boolean;
  priority: number;
  apiKey?: string;
}

// Default model configurations
const defaultModelConfigs: ModelConfig[] = [
  // Premium Models (Priority 1, 2, 3, etc. within premium tier)
  {
    id: 'openrouter-gpt4',
    name: 'GPT-4 Turbo (OpenRouter)',
    provider: 'OpenRouter',
    model: 'openai/gpt-4-turbo',
    tier: 'premium' as const,
    isActive: true,
    priority: 1, // Primary premium model
  },
  {
    id: 'gemini-pro-premium',
    name: 'Gemini 1.5 Pro (Premium)',
    provider: 'Google',
    model: 'gemini-1.5-pro',
    tier: 'premium' as const,
    isActive: true,
    priority: 2,
    apiKey: 'AIzaSyCLJWOfkLrCqQLopTVmgOx1I8XO_mmqGa4',
  },
  {
    id: 'openai-gpt4',
    name: 'GPT-4',
    provider: 'OpenAI',
    model: 'openai/gpt-4',
    tier: 'premium' as const,
    isActive: true,
    priority: 3,
  },
  {
    id: 'claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    model: 'anthropic/claude-3.5-sonnet',
    tier: 'premium' as const,
    isActive: false,
    priority: 4,
  },
  
  // Free Models (Priority 1, 2, 3, etc. within free tier)
  {
    id: 'gemini-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    model: 'gemini-1.5-flash',
    tier: 'free' as const,
    isActive: true,
    priority: 1, // Primary free model
    apiKey: 'AIzaSyCLJWOfkLrCqQLopTVmgOx1I8XO_mmqGa4',
  },
  {
    id: 'openrouter-claude',
    name: 'Claude 3.5 Sonnet (OpenRouter)',
    provider: 'OpenRouter',
    model: 'anthropic/claude-3.5-sonnet',
    tier: 'free' as const,
    isActive: true,
    priority: 2,
  },
  {
    id: 'moonshot-kimi',
    name: 'Moonshot Kimi K2',
    provider: 'Moonshot',
    model: 'moonshotai/kimi-k2:free',
    tier: 'free' as const,
    isActive: true,
    priority: 3,
  },
  {
    id: 'glm-4-air',
    name: 'GLM-4.5 Air',
    provider: 'Z-AI',
    model: 'z-ai/glm-4.5-air:free',
    tier: 'free' as const,
    isActive: true,
    priority: 4,
  },
  {
    id: 'openai-gpt35',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    model: 'openai/gpt-3.5-turbo',
    tier: 'free' as const,
    isActive: true,
    priority: 5,
  },
  {
    id: 'claude-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    model: 'anthropic/claude-3-haiku',
    tier: 'free' as const,
    isActive: true,
    priority: 6,
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    model: 'gemini-1.5-pro',
    tier: 'free' as const,
    isActive: true,
    priority: 7,
    apiKey: 'AIzaSyCLJWOfkLrCqQLopTVmgOx1I8XO_mmqGa4',
  },
  {
    id: 'llama-3.1-70b',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    model: 'meta-llama/llama-3.1-70b-instruct',
    tier: 'free' as const,
    isActive: true,
    priority: 8,
  },
];

const MODELS_FILE_PATH = path.join(process.cwd(), 'data', 'models.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(MODELS_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load models from file or return defaults
export function loadModels(): ModelConfig[] {
  try {
    ensureDataDirectory();
    
    if (fs.existsSync(MODELS_FILE_PATH)) {
      const data = fs.readFileSync(MODELS_FILE_PATH, 'utf8');
      const models = JSON.parse(data);
      
      // Validate that loaded models have required properties
      if (Array.isArray(models) && models.length > 0) {
        return models;
      }
    }
  } catch (error) {
    console.error('Error loading models from file:', error);
  }
  
  // Return default models if file doesn't exist or is invalid
  return [...defaultModelConfigs];
}

// Save models to file
export function saveModels(models: ModelConfig[]): boolean {
  try {
    ensureDataDirectory();
    fs.writeFileSync(MODELS_FILE_PATH, JSON.stringify(models, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving models to file:', error);
    return false;
  }
}

// Get primary model for a specific tier
export function getPrimaryModel(models: ModelConfig[], tier: 'free' | 'premium'): ModelConfig | null {
  const tierModels = models.filter(m => m.tier === tier && m.isActive);
  return tierModels.find(m => m.priority === 1) || tierModels[0] || null;
}

// Get active models sorted by priority
export function getActiveModels(tier?: 'free' | 'premium'): ModelConfig[] {
  const models = loadModels();
  let activeModels = models.filter(m => m.isActive);
  
  if (tier) {
    activeModels = activeModels.filter(m => m.tier === tier);
  }
  
  return activeModels.sort((a, b) => a.priority - b.priority);
}

// Function to normalize priorities within each tier
export function normalizePriorities(models: ModelConfig[]): void {
  // Separate models by tier
  const freeModels = models.filter(m => m.tier === 'free').sort((a, b) => a.priority - b.priority);
  const premiumModels = models.filter(m => m.tier === 'premium').sort((a, b) => a.priority - b.priority);
  
  // Reassign priorities within each tier (1, 2, 3, etc.)
  freeModels.forEach((model, index) => {
    model.priority = index + 1;
  });
  
  premiumModels.forEach((model, index) => {
    model.priority = index + 1;
  });
}
