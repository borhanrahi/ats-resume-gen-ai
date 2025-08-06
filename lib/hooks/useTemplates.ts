import { useState, useCallback, useEffect } from 'react';
import { ResumeTemplate, TemplateStyles } from '@/types/editor';
import { 
  defaultTemplates, 
  applyTemplate, 
  customizeTemplate,
  validateTemplate 
} from '@/lib/templateUtils';

interface UseTemplatesReturn {
  templates: ResumeTemplate[];
  selectedTemplate: ResumeTemplate | null;
  isLoading: boolean;
  error: string | null;
  selectTemplate: (template: ResumeTemplate) => void;
  customizeSelectedTemplate: (customizations: Partial<TemplateStyles>) => void;
  applyTemplateToContent: (userContent: any) => ResumeTemplate | null;
  resetTemplate: () => void;
  saveCustomTemplate: (template: ResumeTemplate) => Promise<boolean>;
  loadUserTemplates: () => Promise<ResumeTemplate[]>;
}

export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<ResumeTemplate[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's custom templates from localStorage on mount
  useEffect(() => {
    loadUserTemplates();
  }, []);

  const selectTemplate = useCallback((template: ResumeTemplate) => {
    if (!validateTemplate(template)) {
      setError('Invalid template selected');
      return;
    }
    
    setSelectedTemplate(template);
    setError(null);
  }, []);

  const customizeSelectedTemplate = useCallback((customizations: Partial<TemplateStyles>) => {
    if (!selectedTemplate) {
      setError('No template selected for customization');
      return;
    }

    try {
      const customizedTemplate = customizeTemplate(selectedTemplate, customizations);
      setSelectedTemplate(customizedTemplate);
      setError(null);
    } catch (err) {
      setError('Failed to customize template');
    }
  }, [selectedTemplate]);

  const applyTemplateToContent = useCallback((userContent: any): ResumeTemplate | null => {
    if (!selectedTemplate) {
      setError('No template selected to apply');
      return null;
    }

    try {
      const appliedTemplate = applyTemplate(selectedTemplate, userContent);
      setError(null);
      return appliedTemplate;
    } catch (err) {
      setError('Failed to apply template to content');
      return null;
    }
  }, [selectedTemplate]);

  const resetTemplate = useCallback(() => {
    setSelectedTemplate(null);
    setError(null);
  }, []);

  const saveCustomTemplate = useCallback(async (template: ResumeTemplate): Promise<boolean> => {
    if (!validateTemplate(template)) {
      setError('Invalid template cannot be saved');
      return false;
    }

    try {
      setIsLoading(true);
      
      // Get existing custom templates from localStorage
      const existingTemplates = JSON.parse(
        localStorage.getItem('customTemplates') || '[]'
      ) as ResumeTemplate[];

      // Add or update the template
      const updatedTemplates = existingTemplates.filter(t => t.id !== template.id);
      updatedTemplates.push({
        ...template,
        id: template.id || `custom-${Date.now()}`,
        isActive: true
      });

      // Save to localStorage
      localStorage.setItem('customTemplates', JSON.stringify(updatedTemplates));

      // Update templates state
      const allTemplates = [...defaultTemplates, ...updatedTemplates];
      setTemplates(allTemplates);
      
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to save custom template');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUserTemplates = useCallback(async (): Promise<ResumeTemplate[]> => {
    try {
      setIsLoading(true);
      
      // Load custom templates from localStorage
      const customTemplates = JSON.parse(
        localStorage.getItem('customTemplates') || '[]'
      ) as ResumeTemplate[];

      // Validate custom templates
      const validCustomTemplates = customTemplates.filter(validateTemplate);

      // Combine with default templates
      const allTemplates = [...defaultTemplates, ...validCustomTemplates];
      setTemplates(allTemplates);
      
      setError(null);
      return validCustomTemplates;
    } catch (err) {
      setError('Failed to load user templates');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    templates,
    selectedTemplate,
    isLoading,
    error,
    selectTemplate,
    customizeSelectedTemplate,
    applyTemplateToContent,
    resetTemplate,
    saveCustomTemplate,
    loadUserTemplates
  };
}

// Hook for template preview functionality
export function useTemplatePreview() {
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const showPreview = useCallback((template: ResumeTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewMode(true);
  }, []);

  const hidePreview = useCallback(() => {
    setPreviewTemplate(null);
    setIsPreviewMode(false);
  }, []);

  const togglePreview = useCallback((template?: ResumeTemplate) => {
    if (isPreviewMode) {
      hidePreview();
    } else if (template) {
      showPreview(template);
    }
  }, [isPreviewMode, showPreview, hidePreview]);

  return {
    previewTemplate,
    isPreviewMode,
    showPreview,
    hidePreview,
    togglePreview
  };
}