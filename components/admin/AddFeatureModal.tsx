'use client';

import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { FeatureRequest } from '@/types/admin';

interface AddFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (feature: Omit<FeatureRequest, 'id' | 'createdAt'>) => Promise<void>;
  editingFeature?: FeatureRequest | null;
}

export default function AddFeatureModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingFeature 
}: AddFeatureModalProps) {
  const [formData, setFormData] = useState({
    title: editingFeature?.title || '',
    description: editingFeature?.description || '',
    priority: editingFeature?.priority || 'medium' as FeatureRequest['priority'],
    status: editingFeature?.status || 'idea' as FeatureRequest['status'],
    complexity: editingFeature?.complexity || 'medium' as FeatureRequest['complexity'],
    businessValue: editingFeature?.businessValue || 50,
    estimatedHours: editingFeature?.estimatedHours || 8,
    requestedBy: editingFeature?.requestedBy || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.requestedBy.trim()) {
      newErrors.requestedBy = 'Requested by is required';
    }
    
    if (formData.businessValue < 0 || formData.businessValue > 100) {
      newErrors.businessValue = 'Business value must be between 0 and 100';
    }
    
    if (formData.estimatedHours < 1) {
      newErrors.estimatedHours = 'Estimated hours must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'idea',
        complexity: 'medium',
        businessValue: 50,
        estimatedHours: 8,
        requestedBy: ''
      });
    } catch (error) {
      console.error('Failed to save feature:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <h2 className="text-lg md:text-xl font-bold text-foreground">
            {editingFeature ? 'Edit Feature Request' : 'Add Feature Request'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Feature Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-3 md:py-2 text-base md:text-sm border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-border'
              }`}
              placeholder="Enter feature title..."
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-3 md:py-2 text-base md:text-sm border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical ${
                errors.description ? 'border-red-500' : 'border-border'
              }`}
              placeholder="Describe the feature in detail..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Priority and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-3 md:py-2 text-base md:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-3 md:py-2 text-base md:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="idea">💡 Idea</option>
                <option value="planned">🎯 Planned</option>
                <option value="in_progress">⚡ In Progress</option>
                <option value="completed">✅ Completed</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
            </div>
          </div>

          {/* Complexity and Business Value Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Complexity
              </label>
              <select
                value={formData.complexity}
                onChange={(e) => handleInputChange('complexity', e.target.value)}
                className="w-full px-3 py-3 md:py-2 text-base md:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="simple">Simple</option>
                <option value="medium">Medium</option>
                <option value="complex">Complex</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Business Value (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.businessValue}
                onChange={(e) => handleInputChange('businessValue', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-3 md:py-2 text-base md:text-sm border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.businessValue ? 'border-red-500' : 'border-border'
                }`}
              />
              {errors.businessValue && (
                <p className="mt-1 text-sm text-red-500">{errors.businessValue}</p>
              )}
            </div>
          </div>

          {/* Estimated Hours and Requested By Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                min="1"
                value={formData.estimatedHours}
                onChange={(e) => handleInputChange('estimatedHours', parseInt(e.target.value) || 1)}
                className={`w-full px-3 py-3 md:py-2 text-base md:text-sm border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.estimatedHours ? 'border-red-500' : 'border-border'
                }`}
              />
              {errors.estimatedHours && (
                <p className="mt-1 text-sm text-red-500">{errors.estimatedHours}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Requested By *
              </label>
              <input
                type="text"
                value={formData.requestedBy}
                onChange={(e) => handleInputChange('requestedBy', e.target.value)}
                className={`w-full px-3 py-3 md:py-2 text-base md:text-sm border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.requestedBy ? 'border-red-500' : 'border-border'
                }`}
                placeholder="Team or person name..."
              />
              {errors.requestedBy && (
                <p className="mt-1 text-sm text-red-500">{errors.requestedBy}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-3 md:py-2 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none px-4 py-3 md:py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{editingFeature ? 'Update Feature' : 'Add Feature'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}