'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Layout, 
  Type, 
  Check, 
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResumeTemplate, TemplateStyles } from '@/types/editor';
import { 
  defaultTemplates, 
  colorPalettes, 
  fontCombinations,
  customizeTemplate,
  generateCSSVariables
} from '@/lib/templateUtils';

interface TemplateSelectorProps {
  selectedTemplate: ResumeTemplate | null;
  onTemplateSelect: (template: ResumeTemplate) => void;
  onTemplateCustomize: (template: ResumeTemplate, styles: TemplateStyles) => void;
  onClose: () => void;
  className?: string;
}

export default function TemplateSelector({
  selectedTemplate,
  onTemplateSelect,
  onTemplateCustomize,
  onClose,
  className = ''
}: TemplateSelectorProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'customize'>('templates');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'modern' | 'professional' | 'creative'>('all');
  const [customizingTemplate, setCustomizingTemplate] = useState<ResumeTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null);

  // Filter templates by category
  const filteredTemplates = defaultTemplates.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  );

  const handleTemplateSelect = useCallback((template: ResumeTemplate) => {
    onTemplateSelect(template);
    setCustomizingTemplate(template);
    setActiveTab('customize');
  }, [onTemplateSelect]);

  const handleCustomize = useCallback(() => {
    if (customizingTemplate) {
      onTemplateCustomize(customizingTemplate, customizingTemplate.styling);
      onClose();
    }
  }, [customizingTemplate, onTemplateCustomize, onClose]);

  const handleColorChange = useCallback((colors: any) => {
    if (customizingTemplate) {
      const updatedTemplate = customizeTemplate(customizingTemplate, { colors });
      setCustomizingTemplate(updatedTemplate);
    }
  }, [customizingTemplate]);

  const handleFontChange = useCallback((fonts: any) => {
    if (customizingTemplate) {
      const updatedTemplate = customizeTemplate(customizingTemplate, { fonts });
      setCustomizingTemplate(updatedTemplate);
    }
  }, [customizingTemplate]);

  return (
    <div className={`fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-900">
              {activeTab === 'templates' ? 'Choose Template' : 'Customize Template'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="customize" className="flex items-center gap-2" disabled={!customizingTemplate}>
                <Palette className="w-4 h-4" />
                Customize
              </TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="mt-6">
              {/* Category Filter */}
              <div className="flex gap-2 mb-6">
                {[
                  { key: 'all', label: 'All Templates' },
                  { key: 'modern', label: 'Modern' },
                  { key: 'professional', label: 'Professional' },
                  { key: 'creative', label: 'Creative' }
                ].map((category) => (
                  <Button
                    key={category.key}
                    variant={selectedCategory === category.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.key as any)}
                    className="text-sm"
                  >
                    {category.label}
                  </Button>
                ))}
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto">
                {filteredTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        selectedTemplate?.id === template.id 
                          ? 'ring-2 ring-blue-500 shadow-lg' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      {/* Template Preview */}
                      <div className="aspect-[3/4] bg-gray-100 rounded-t-lg relative overflow-hidden">
                        <div 
                          className="w-full h-full p-4 text-xs"
                          style={generateCSSVariables(template.styling)}
                        >
                          {/* Mock resume preview */}
                          <div className="space-y-3">
                            <div 
                              className="font-bold text-lg"
                              style={{ 
                                color: template.styling.colors.primary,
                                fontFamily: template.styling.fonts.heading
                              }}
                            >
                              John Doe
                            </div>
                            <div 
                              className="text-sm"
                              style={{ 
                                color: template.styling.colors.secondary,
                                fontFamily: template.styling.fonts.body
                              }}
                            >
                              Software Engineer
                            </div>
                            <div 
                              className="h-px"
                              style={{ 
                                backgroundColor: template.styling.colors.accent,
                                width: '60%'
                              }}
                            />
                            <div className="space-y-2">
                              <div 
                                className="font-semibold text-sm"
                                style={{ 
                                  color: template.styling.colors.primary,
                                  fontFamily: template.styling.fonts.heading
                                }}
                              >
                                Experience
                              </div>
                              <div className="space-y-1">
                                <div 
                                  className="text-xs font-medium"
                                  style={{ 
                                    color: template.styling.colors.text,
                                    fontFamily: template.styling.fonts.body
                                  }}
                                >
                                  Senior Developer
                                </div>
                                <div 
                                  className="text-xs"
                                  style={{ 
                                    color: template.styling.colors.secondary,
                                    fontFamily: template.styling.fonts.body
                                  }}
                                >
                                  Tech Company • 2020-2024
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Selection indicator */}
                        {selectedTemplate?.id === template.id && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Template Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{template.category}</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: template.styling.colors.primary }}
                            />
                            <div 
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: template.styling.colors.accent }}
                            />
                            <div 
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: template.styling.colors.secondary }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewTemplate(template);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Customize Tab */}
            <TabsContent value="customize" className="mt-6">
              {customizingTemplate && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-h-96 overflow-y-auto">
                  {/* Customization Options */}
                  <div className="space-y-6">
                    {/* Color Customization */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        Colors
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {colorPalettes.map((palette, index) => (
                          <button
                            key={index}
                            onClick={() => handleColorChange(palette.colors)}
                            className="p-3 border rounded-lg hover:shadow-md transition-shadow text-left"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: palette.colors.primary }}
                              />
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: palette.colors.accent }}
                              />
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: palette.colors.secondary }}
                              />
                            </div>
                            <div className="text-sm font-medium">{palette.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Customization */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Type className="w-5 h-5" />
                        Fonts
                      </h3>
                      <div className="space-y-2">
                        {fontCombinations.map((fontCombo, index) => (
                          <button
                            key={index}
                            onClick={() => handleFontChange(fontCombo.fonts)}
                            className="w-full p-3 border rounded-lg hover:shadow-md transition-shadow text-left"
                          >
                            <div className="font-medium mb-1" style={{ fontFamily: fontCombo.fonts.heading }}>
                              {fontCombo.name}
                            </div>
                            <div className="text-sm text-gray-500" style={{ fontFamily: fontCombo.fonts.body }}>
                              Heading: {fontCombo.fonts.heading} • Body: {fontCombo.fonts.body}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Preview</h3>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div 
                        className="bg-white p-6 rounded shadow-sm"
                        style={generateCSSVariables(customizingTemplate.styling)}
                      >
                        <div className="space-y-4">
                          <div 
                            className="text-2xl font-bold"
                            style={{ 
                              color: customizingTemplate.styling.colors.primary,
                              fontFamily: customizingTemplate.styling.fonts.heading
                            }}
                          >
                            John Doe
                          </div>
                          <div 
                            className="text-lg"
                            style={{ 
                              color: customizingTemplate.styling.colors.secondary,
                              fontFamily: customizingTemplate.styling.fonts.body
                            }}
                          >
                            Software Engineer
                          </div>
                          <div 
                            className="h-px"
                            style={{ 
                              backgroundColor: customizingTemplate.styling.colors.accent,
                              width: '100%'
                            }}
                          />
                          <div>
                            <div 
                              className="text-lg font-semibold mb-2"
                              style={{ 
                                color: customizingTemplate.styling.colors.primary,
                                fontFamily: customizingTemplate.styling.fonts.heading
                              }}
                            >
                              Experience
                            </div>
                            <div className="space-y-2">
                              <div 
                                className="font-medium"
                                style={{ 
                                  color: customizingTemplate.styling.colors.text,
                                  fontFamily: customizingTemplate.styling.fonts.body
                                }}
                              >
                                Senior Software Developer
                              </div>
                              <div 
                                className="text-sm"
                                style={{ 
                                  color: customizingTemplate.styling.colors.secondary,
                                  fontFamily: customizingTemplate.styling.fonts.body
                                }}
                              >
                                Tech Company • 2020-2024
                              </div>
                              <div 
                                className="text-sm"
                                style={{ 
                                  color: customizingTemplate.styling.colors.text,
                                  fontFamily: customizingTemplate.styling.fonts.body,
                                  lineHeight: customizingTemplate.styling.spacing.line
                                }}
                              >
                                Led development of scalable web applications using React and Node.js. 
                                Collaborated with cross-functional teams to deliver high-quality software solutions.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            {activeTab === 'customize' && (
              <Button
                variant="outline"
                onClick={() => setActiveTab('templates')}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Templates
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {activeTab === 'templates' && selectedTemplate && (
              <Button onClick={() => setActiveTab('customize')}>
                Customize
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {activeTab === 'customize' && customizingTemplate && (
              <Button onClick={handleCustomize}>
                Apply Template
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setPreviewTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{previewTemplate.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewTemplate(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div 
                className="border rounded-lg p-8 bg-white"
                style={generateCSSVariables(previewTemplate.styling)}
              >
                {/* Full template preview content would go here */}
                <div className="text-center text-gray-500">
                  Full template preview would be rendered here
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
        