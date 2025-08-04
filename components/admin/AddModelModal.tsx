'use client';

import { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';

interface AddModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddModel: (model: {
    name: string;
    provider: string;
    model: string;
    tier: 'free' | 'premium';
    priority: number;
  }) => void;
}

const generateModelIcon = (provider: string): string => {
  const providerLower = provider.toLowerCase();
  
  // Common AI providers
  if (providerLower.includes('openai') || providerLower.includes('gpt')) return '🤖';
  if (providerLower.includes('anthropic') || providerLower.includes('claude')) return '🧠';
  if (providerLower.includes('google') || providerLower.includes('gemini') || providerLower.includes('bard')) return '🔍';
  if (providerLower.includes('meta') || providerLower.includes('llama')) return '🦙';
  if (providerLower.includes('microsoft') || providerLower.includes('copilot')) return '💼';
  if (providerLower.includes('cohere')) return '🌊';
  if (providerLower.includes('hugging') || providerLower.includes('face')) return '🤗';
  if (providerLower.includes('moonshot') || providerLower.includes('kimi')) return '🌙';
  if (providerLower.includes('z-ai') || providerLower.includes('glm')) return '⚡';
  if (providerLower.includes('mistral')) return '🌪️';
  if (providerLower.includes('together')) return '🤝';
  if (providerLower.includes('perplexity')) return '🔮';
  if (providerLower.includes('replicate')) return '🔄';
  
  // Fallback icons based on first letter
  const firstLetter = provider.charAt(0).toUpperCase();
  const iconMap: Record<string, string> = {
    'A': '🅰️', 'B': '🅱️', 'C': '🔵', 'D': '💎', 'E': '🟢', 'F': '🔥',
    'G': '🟡', 'H': '🏠', 'I': 'ℹ️', 'J': '🎯', 'K': '🔑', 'L': '🔗',
    'M': '🎯', 'N': '🆕', 'O': '⭕', 'P': '🟣', 'Q': '❓', 'R': '🔴',
    'S': '⭐', 'T': '🔺', 'U': '🔵', 'V': '✅', 'W': '⚪', 'X': '❌',
    'Y': '🟡', 'Z': '⚡'
  };
  
  return iconMap[firstLetter] || '🤖';
};

const generateProviderColor = (provider: string): string => {
  const providerLower = provider.toLowerCase();
  
  if (providerLower.includes('openai') || providerLower.includes('gpt')) return 'from-green-500 to-teal-600';
  if (providerLower.includes('anthropic') || providerLower.includes('claude')) return 'from-purple-500 to-pink-600';
  if (providerLower.includes('google') || providerLower.includes('gemini')) return 'from-blue-500 to-indigo-600';
  if (providerLower.includes('meta') || providerLower.includes('llama')) return 'from-blue-600 to-purple-600';
  if (providerLower.includes('moonshot') || providerLower.includes('kimi')) return 'from-blue-500 to-purple-600';
  if (providerLower.includes('z-ai') || providerLower.includes('glm')) return 'from-yellow-500 to-orange-600';
  if (providerLower.includes('mistral')) return 'from-orange-500 to-red-600';
  
  // Generate color based on provider name hash
  let hash = 0;
  for (let i = 0; i < provider.length; i++) {
    hash = provider.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    'from-red-500 to-pink-600',
    'from-blue-500 to-cyan-600',
    'from-green-500 to-emerald-600',
    'from-purple-500 to-violet-600',
    'from-yellow-500 to-amber-600',
    'from-indigo-500 to-blue-600',
    'from-pink-500 to-rose-600',
    'from-teal-500 to-cyan-600'
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

export default function AddModelModal({ isOpen, onClose, onAddModel }: AddModelModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    model: '',
    tier: 'free' as 'free' | 'premium',
    priority: 1
  });

  const [previewIcon, setPreviewIcon] = useState('🤖');
  const [previewColor, setPreviewColor] = useState('from-gray-500 to-gray-600');

  const handleProviderChange = (provider: string) => {
    setFormData(prev => ({ ...prev, provider }));
    setPreviewIcon(generateModelIcon(provider));
    setPreviewColor(generateProviderColor(provider));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.provider || !formData.model) {
      return;
    }

    onAddModel(formData);
    
    // Reset form
    setFormData({
      name: '',
      provider: '',
      model: '',
      tier: 'free',
      priority: 1
    });
    setPreviewIcon('🤖');
    setPreviewColor('from-gray-500 to-gray-600');
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Add Custom Model</h2>
              <p className="text-sm text-muted-foreground">Configure a new AI model</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Preview */}
          <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${previewColor} rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                {previewIcon}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {formData.name || 'Model Name'}
                </p>
                <p className="text-sm text-muted-foreground font-mono">
                  {formData.model || 'provider/model-name'}
                </p>
              </div>
            </div>
          </div>

          {/* Model Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Model Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., GPT-4 Turbo"
              className="w-full h-10 px-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground"
              required
            />
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Provider
            </label>
            <input
              type="text"
              value={formData.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              placeholder="e.g., OpenAI, Anthropic, Google"
              className="w-full h-10 px-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground"
              required
            />
          </div>

          {/* Model ID */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Model ID
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              placeholder="e.g., openai/gpt-4-turbo"
              className="w-full h-10 px-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground font-mono"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use the exact model ID from OpenRouter
            </p>
          </div>

          {/* Tier and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tier
              </label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData(prev => ({ ...prev, tier: e.target.value as 'free' | 'premium' }))}
                className="w-full h-10 px-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground"
              >
                <option value="free">🆓 Free</option>
                <option value="premium">👑 Premium</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                min="1"
                max="10"
                className="w-full h-10 px-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Add Model</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}