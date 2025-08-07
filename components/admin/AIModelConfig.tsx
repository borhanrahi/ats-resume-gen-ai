"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Cpu, 
  RefreshCw, 
  Save, 
  TestTube, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Shield,
  Zap
} from "lucide-react";
import { AIModelConfig as AIModelConfigType, FallbackChainConfig } from "@/types/admin";

interface AIModelConfigProps {
  models: AIModelConfigType[];
  fallbackChains: Record<string, FallbackChainConfig>;
  loading: boolean;
  onUpdateModel: (modelId: string, updates: Partial<AIModelConfigType>) => Promise<void>;
  onTestModel: (modelId: string) => Promise<{ success: boolean; message: string; responseTime?: number }>;
  onUpdateFallbackChain: (tier: 'free' | 'premium', config: FallbackChainConfig) => Promise<void>;
  onDeleteModel: (modelId: string) => Promise<void>;
  onAddModel: (model: Omit<AIModelConfigType, 'id'>) => Promise<void>;
}

interface ModelTestResult {
  modelId: string;
  success: boolean;
  message: string;
  responseTime?: number;
  timestamp: Date;
}

const getProviderIcon = (provider: string) => {
  switch (provider.toLowerCase()) {
    case "openrouter": return "🔀";
    case "gemini": return "🔍";
    case "claude": return "🧠";
    case "openai": return "🤖";
    case "anthropic": return "🧠";
    default: return "🔮";
  }
};

const getProviderColor = (provider: string) => {
  switch (provider.toLowerCase()) {
    case "openrouter": return "from-indigo-500 to-purple-600";
    case "gemini": return "from-blue-500 to-indigo-600";
    case "claude": return "from-purple-500 to-pink-600";
    case "openai": return "from-green-500 to-teal-600";
    case "anthropic": return "from-purple-500 to-pink-600";
    default: return "from-gray-500 to-gray-600";
  }
};

export default function AIModelConfig({
  models,
  fallbackChains,
  loading,
  onUpdateModel,
  onTestModel,
  onUpdateFallbackChain,
  onDeleteModel,
  onAddModel
}: AIModelConfigProps) {
  const [testResults, setTestResults] = useState<Record<string, ModelTestResult>>({});
  const [testingModels, setTestingModels] = useState<Set<string>>(new Set());
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModel, setNewModel] = useState<Partial<AIModelConfigType>>({
    name: "",
    provider: "openrouter",
    apiKey: "",
    endpoint: "",
    tier: "free",
    priority: 1,
    isActive: true,
    fallbackModels: [],
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerDay: 1000
    }
  });

  // Group models by tier and sort by priority
  const freeModels = models
    .filter(m => m.tier === 'free')
    .sort((a, b) => a.priority - b.priority);
  
  const premiumModels = models
    .filter(m => m.tier === 'premium')
    .sort((a, b) => a.priority - b.priority);

  const handleTestModel = async (modelId: string) => {
    setTestingModels(prev => new Set(prev).add(modelId));
    
    try {
      const result = await onTestModel(modelId);
      setTestResults(prev => ({
        ...prev,
        [modelId]: {
          modelId,
          ...result,
          timestamp: new Date()
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [modelId]: {
          modelId,
          success: false,
          message: error instanceof Error ? error.message : 'Test failed',
          timestamp: new Date()
        }
      }));
    } finally {
      setTestingModels(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelId);
        return newSet;
      });
    }
  };

  const handleUpdatePriority = async (modelId: string, direction: 'up' | 'down') => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;

    const tierModels = models.filter(m => m.tier === model.tier);
    const currentIndex = tierModels.findIndex(m => m.id === modelId);
    
    if (direction === 'up' && currentIndex > 0) {
      const targetModel = tierModels[currentIndex - 1];
      await onUpdateModel(modelId, { priority: targetModel.priority });
      await onUpdateModel(targetModel.id, { priority: model.priority });
    } else if (direction === 'down' && currentIndex < tierModels.length - 1) {
      const targetModel = tierModels[currentIndex + 1];
      await onUpdateModel(modelId, { priority: targetModel.priority });
      await onUpdateModel(targetModel.id, { priority: model.priority });
    }
  };

  const handleAddModel = async () => {
    if (!newModel.name || !newModel.provider || !newModel.apiKey) return;
    
    await onAddModel(newModel as Omit<AIModelConfigType, 'id'>);
    setNewModel({
      name: "",
      provider: "openrouter",
      apiKey: "",
      endpoint: "",
      tier: "free",
      priority: 1,
      isActive: true,
      fallbackModels: [],
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerDay: 1000
      }
    });
    setShowAddForm(false);
  };

  const ModelCard = ({ model }: { model: AIModelConfigType }) => {
    const isEditing = editingModel === model.id;
    const testResult = testResults[model.id];
    const isTesting = testingModels.has(model.id);

    return (
      <div className="bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-md transition-all">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start">
          {/* Model Info - Mobile: Full width, Desktop: 4 columns */}
          <div className="lg:col-span-4">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${getProviderColor(model.provider)} rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                {getProviderIcon(model.provider)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-foreground flex items-center space-x-2 text-sm md:text-base">
                  <span className="truncate">{model.name}</span>
                  {model.priority === 1 && (
                    <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${
                      model.tier === 'premium' 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg' 
                        : 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg'
                    }`}>
                      {model.tier === 'premium' ? '👑 PRIMARY' : '🆓 PRIMARY'}
                    </span>
                  )}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground font-mono truncate">
                  {model.provider} • Priority {model.priority}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  {model.isActive ? (
                    <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-success" />
                  ) : (
                    <XCircle className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                  )}
                  <span className={`text-xs font-medium ${
                    model.isActive ? "text-success" : "text-muted-foreground"
                  }`}>
                    {model.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration - Mobile: Full width, Desktop: 4 columns */}
          <div className="lg:col-span-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Tier
                </label>
                <select
                  value={model.tier}
                  onChange={(e) => onUpdateModel(model.id, { tier: e.target.value as 'free' | 'premium' })}
                  className="w-full h-8 md:h-10 px-2 md:px-3 text-xs md:text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground"
                  disabled={loading}
                >
                  <option value="free">🆓 Free</option>
                  <option value="premium">👑 Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Priority
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={model.priority}
                    onChange={(e) => onUpdateModel(model.id, { priority: parseInt(e.target.value) })}
                    className="flex-1 h-8 md:h-10 px-2 md:px-3 text-xs md:text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground"
                    min="1"
                    max="10"
                    disabled={loading}
                  />
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => handleUpdatePriority(model.id, 'up')}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      disabled={loading}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleUpdatePriority(model.id, 'down')}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      disabled={loading}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Rate Limits */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  RPM
                </label>
                <input
                  type="number"
                  value={model.rateLimits.requestsPerMinute}
                  onChange={(e) => onUpdateModel(model.id, { 
                    rateLimits: { 
                      ...model.rateLimits, 
                      requestsPerMinute: parseInt(e.target.value) 
                    } 
                  })}
                  className="w-full h-8 md:h-10 px-2 md:px-3 text-xs md:text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  RPD
                </label>
                <input
                  type="number"
                  value={model.rateLimits.requestsPerDay}
                  onChange={(e) => onUpdateModel(model.id, { 
                    rateLimits: { 
                      ...model.rateLimits, 
                      requestsPerDay: parseInt(e.target.value) 
                    } 
                  })}
                  className="w-full h-8 md:h-10 px-2 md:px-3 text-xs md:text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Actions & Status - Mobile: Full width, Desktop: 4 columns */}
          <div className="lg:col-span-4">
            {/* Test Result */}
            {testResult && (
              <div className={`p-2 md:p-3 rounded-lg mb-3 ${
                testResult.success 
                  ? 'bg-success/10 border border-success/20' 
                  : 'bg-destructive/10 border border-destructive/20'
              }`}>
                <div className="flex items-center space-x-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  <span className={`text-xs md:text-sm font-medium ${
                    testResult.success ? 'text-success' : 'text-destructive'
                  }`}>
                    {testResult.message}
                  </span>
                </div>
                {testResult.responseTime && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Response time: {testResult.responseTime}ms
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={model.isActive}
                  onChange={(e) => onUpdateModel(model.id, { isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-2 border-border focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
                <span className="text-xs md:text-sm font-medium">Active</span>
              </label>
              
              <button
                onClick={() => handleTestModel(model.id)}
                className="flex items-center space-x-1 px-2 md:px-3 py-1 md:py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all duration-200 font-medium text-xs md:text-sm"
                disabled={loading || isTesting}
              >
                <TestTube className="w-3 h-3 md:w-4 md:h-4" />
                <span>{isTesting ? 'Testing...' : 'Test'}</span>
              </button>

              <button
                onClick={() => onDeleteModel(model.id)}
                className="flex items-center space-x-1 px-2 md:px-3 py-1 md:py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all duration-200 font-medium text-xs md:text-sm"
                disabled={loading}
              >
                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground flex items-center space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <span>AI Model Configuration</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Manage AI models, priorities, and fallback chains
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-colors text-sm md:text-base"
          >
            <Plus className="w-4 h-4" />
            <span>Add Model</span>
          </button>
        </div>
      </div>

      {/* Models Grid */}
      <div className="space-y-6 md:space-y-8">
        {/* Premium Models Section */}
        {premiumModels.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <span className="text-yellow-800 dark:text-yellow-200 text-xs md:text-sm font-bold">👑</span>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-foreground">Premium Models</h3>
              <span className="text-xs md:text-sm text-muted-foreground">({premiumModels.length} models)</span>
            </div>
            <div className="grid gap-4">
              {premiumModels.map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          </div>
        )}

        {/* Free Models Section */}
        {freeModels.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <span className="text-green-800 dark:text-green-200 text-xs md:text-sm font-bold">🆓</span>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-foreground">Free Models</h3>
              <span className="text-xs md:text-sm text-muted-foreground">({freeModels.length} models)</span>
            </div>
            <div className="grid gap-4">
              {freeModels.map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {models.length === 0 && !loading && (
        <div className="text-center py-8 md:py-12">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Cpu className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
          </div>
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
            No Models Configured
          </h3>
          <p className="text-sm md:text-base text-muted-foreground">
            AI models will appear here once they are configured
          </p>
        </div>
      )}

      {/* Add Model Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-foreground">Add New Model</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={newModel.name}
                      onChange={(e) => setNewModel(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full h-10 px-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground"
                      placeholder="e.g., GPT-4 Turbo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Provider
                    </label>
                    <select
                      value={newModel.provider}
                      onChange={(e) => setNewModel(prev => ({ ...prev, provider: e.target.value as any }))}
                      className="w-full h-10 px-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground"
                    >
                      <option value="openrouter">OpenRouter</option>
                      <option value="gemini">Gemini</option>
                      <option value="claude">Claude</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={newModel.apiKey}
                    onChange={(e) => setNewModel(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full h-10 px-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground"
                    placeholder="Enter API key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Endpoint (Optional)
                  </label>
                  <input
                    type="url"
                    value={newModel.endpoint}
                    onChange={(e) => setNewModel(prev => ({ ...prev, endpoint: e.target.value }))}
                    className="w-full h-10 px-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground"
                    placeholder="https://api.example.com/v1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Tier
                    </label>
                    <select
                      value={newModel.tier}
                      onChange={(e) => setNewModel(prev => ({ ...prev, tier: e.target.value as 'free' | 'premium' }))}
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
                      value={newModel.priority}
                      onChange={(e) => setNewModel(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                      className="w-full h-10 px-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 h-10 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddModel}
                    className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    disabled={!newModel.name || !newModel.provider || !newModel.apiKey}
                  >
                    Add Model
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}