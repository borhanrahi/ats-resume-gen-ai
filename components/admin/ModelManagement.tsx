"use client";

import { RefreshCw, Cpu, CheckCircle2, XCircle, Zap, Plus } from "lucide-react";
import { useState } from "react";
import AddModelModal from "./AddModelModal";

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  tier: "free" | "premium";
  isActive: boolean;
  priority: number;
}

interface ModelManagementProps {
  models: ModelConfig[];
  loading: boolean;
  message: string;
  onRefresh: () => void;
  onUpdateModel: (modelId: string, updates: Partial<ModelConfig>) => void;
  onTestModel: (modelId: string) => void;
  onAddModel: (model: {
    name: string;
    provider: string;
    model: string;
    tier: "free" | "premium";
    priority: number;
  }) => void;
}

const getProviderIcon = (provider: string) => {
  switch (provider.toLowerCase()) {
    case "moonshot":
      return "🌙";
    case "z-ai":
      return "⚡";
    case "openai":
      return "🤖";
    case "anthropic":
      return "🧠";
    default:
      return "🔮";
  }
};

const getProviderColor = (provider: string) => {
  switch (provider.toLowerCase()) {
    case "moonshot":
      return "from-blue-500 to-purple-600";
    case "z-ai":
      return "from-yellow-500 to-orange-600";
    case "openai":
      return "from-green-500 to-teal-600";
    case "anthropic":
      return "from-purple-500 to-pink-600";
    default:
      return "from-gray-500 to-gray-600";
  }
};

export default function ModelManagement({
  models,
  loading,
  message,
  onRefresh,
  onUpdateModel,
  onTestModel,
  onAddModel,
}: ModelManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <span>AI Model Configuration</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage AI models, priorities, and fallback chains
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Model</span>
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm font-medium text-primary">{message}</p>
        </div>
      )}

      {/* Models Grid */}
      <div className="grid gap-6">
        {models.map((model, index) => (
          <div
            key={model.id}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Model Info */}
              <div className="lg:col-span-4">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${getProviderColor(
                      model.provider
                    )} rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg`}
                  >
                    {getProviderIcon(model.provider)}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground flex items-center space-x-2">
                      <span>{model.name}</span>
                      {index === 0 && (
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                          PRIMARY
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      {model.model}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {model.provider} • Priority {model.priority}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tier Selection */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Tier
                </label>
                <select
                  value={model.tier}
                  onChange={(e) =>
                    onUpdateModel(model.id, {
                      tier: e.target.value as "free" | "premium",
                    })
                  }
                  className="w-full h-10 px-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground"
                >
                  <option value="free">🆓 Free</option>
                  <option value="premium">👑 Premium</option>
                </select>
              </div>

              {/* Priority */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Priority
                </label>
                <input
                  type="number"
                  value={model.priority}
                  onChange={(e) =>
                    onUpdateModel(model.id, {
                      priority: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-10 px-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background text-foreground"
                  min="1"
                  max="10"
                />
              </div>

              {/* Status & Actions */}
              <div className="lg:col-span-4">
                <div className="flex items-center justify-between">
                  {/* Active Toggle */}
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={model.isActive}
                      onChange={(e) =>
                        onUpdateModel(model.id, { isActive: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-2 border-border focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex items-center space-x-2">
                      {model.isActive ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          model.isActive
                            ? "text-success"
                            : "text-muted-foreground"
                        }`}
                      >
                        {model.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </label>

                  {/* Test Button */}
                  <button
                    onClick={() => onTestModel(model.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-all duration-200 font-medium"
                    disabled={loading}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Test</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {models.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Cpu className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Models Configured
          </h3>
          <p className="text-muted-foreground">
            AI models will appear here once they are configured
          </p>
        </div>
      )}

      {/* Add Model Modal */}
      <AddModelModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddModel={onAddModel}
      />
    </div>
  );
}
