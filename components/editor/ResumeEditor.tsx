'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Save, 
  Download, 
  Undo, 
  Redo,
  Settings,
  Layout,
  Palette,
  FileText,
  Smartphone,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DragDropBlocks } from './DragDropBlocks';
import { ResumePreview } from './ResumePreview';
import { BlockEditor } from './BlockEditor';
import { ResumeBlock, EditorState, DragDropResult } from '@/types/editor';
import { ResumeData } from '@/types/resume';
import { v4 as uuidv4 } from 'uuid';

interface ResumeEditorProps {
  initialData?: ResumeData;
  onSave?: (data: ResumeData) => void;
  onExport?: (format: 'pdf' | 'docx') => void;
  className?: string;
}

const defaultBlocks: ResumeBlock[] = [
  {
    id: uuidv4(),
    type: 'contact',
    title: 'Contact Information',
    content: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: ''
    },
    order: 0,
    isVisible: true,
    isEditing: false
  },
  {
    id: uuidv4(),
    type: 'summary',
    title: 'Professional Summary',
    content: '',
    order: 1,
    isVisible: true,
    isEditing: false
  }
];

export function ResumeEditor({
  initialData,
  onSave,
  onExport,
  className = ''
}: ResumeEditorProps) {
  const [editorState, setEditorState] = useState<EditorState>({
    blocks: initialData ? convertResumeDataToBlocks(initialData) : defaultBlocks,
    selectedBlockId: null,
    isDragging: false,
    draggedBlockId: null,
    template: null,
    isPreviewMode: false,
    hasUnsavedChanges: false
  });

  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Mobile-first responsive handling
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Block management functions
  const handleBlockSelect = useCallback((blockId: string) => {
    setEditorState(prev => ({
      ...prev,
      selectedBlockId: prev.selectedBlockId === blockId ? null : blockId
    }));
  }, []);

  const handleBlockReorder = useCallback((result: DragDropResult) => {
    setEditorState(prev => {
      const blocks = [...prev.blocks];
      const draggedIndex = blocks.findIndex(b => b.id === result.draggedId);
      const targetIndex = blocks.findIndex(b => b.id === result.targetId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const [draggedBlock] = blocks.splice(draggedIndex, 1);
      const newTargetIndex = result.position === 'before' ? targetIndex : targetIndex + 1;
      blocks.splice(newTargetIndex, 0, draggedBlock);

      // Update order values
      blocks.forEach((block, index) => {
        block.order = index;
      });

      return {
        ...prev,
        blocks,
        hasUnsavedChanges: true
      };
    });
  }, []);

  const handleBlockToggleVisibility = useCallback((blockId: string) => {
    setEditorState(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.id === blockId
          ? { ...block, isVisible: !block.isVisible }
          : block
      ),
      hasUnsavedChanges: true
    }));
  }, []);

  const handleBlockDelete = useCallback((blockId: string) => {
    setEditorState(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId),
      selectedBlockId: prev.selectedBlockId === blockId ? null : prev.selectedBlockId,
      hasUnsavedChanges: true
    }));
  }, []);

  const handleBlockEdit = useCallback((blockId: string) => {
    setEditorState(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.id === blockId
          ? { ...block, isEditing: !block.isEditing }
          : { ...block, isEditing: false }
      ),
      selectedBlockId: blockId
    }));
  }, []);

  const handleAddBlock = useCallback((type: ResumeBlock['type']) => {
    const newBlock: ResumeBlock = {
      id: uuidv4(),
      type,
      title: getDefaultTitle(type),
      content: getDefaultContent(type),
      order: editorState.blocks.length,
      isVisible: true,
      isEditing: true
    };

    setEditorState(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
      selectedBlockId: newBlock.id,
      hasUnsavedChanges: true
    }));
  }, [editorState.blocks.length]);

  const handleBlockUpdate = useCallback((blockId: string, updates: Partial<ResumeBlock>) => {
    setEditorState(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.id === blockId
          ? { ...block, ...updates }
          : block
      ),
      hasUnsavedChanges: true
    }));
  }, []);

  const handleSave = useCallback(() => {
    if (onSave) {
      const resumeData = convertBlocksToResumeData(editorState.blocks);
      onSave(resumeData);
      setEditorState(prev => ({ ...prev, hasUnsavedChanges: false }));
    }
  }, [editorState.blocks, onSave]);

  const handleExport = useCallback((format: 'pdf' | 'docx') => {
    if (onExport) {
      onExport(format);
    }
  }, [onExport]);

  const selectedBlock = editorState.selectedBlockId 
    ? editorState.blocks.find(b => b.id === editorState.selectedBlockId)
    : null;

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Mobile-first header */}
      <div className="flex-shrink-0 border-b bg-white p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">
              Resume Editor
            </h1>
            {editorState.hasUnsavedChanges && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                Unsaved
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle - desktop only */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('mobile')}
                className="min-h-[36px] px-3"
              >
                <Smartphone className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('desktop')}
                className="min-h-[36px] px-3"
              >
                <Monitor className="w-4 h-4" />
              </Button>
            </div>

            {/* Action buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!editorState.hasUnsavedChanges}
              className="min-h-[44px]"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              className="min-h-[44px]"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Mobile tabs */}
        {isMobile && (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')} className="mt-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="min-h-[44px]">
                <Settings className="w-4 h-4 mr-2" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="min-h-[44px]">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {isMobile ? (
          // Mobile: Tabbed interface
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')} className="h-full">
            <TabsContent value="edit" className="h-full m-0">
              <div className="h-full overflow-auto p-3 md:p-4">
                <DragDropBlocks
                  blocks={editorState.blocks}
                  selectedBlockId={editorState.selectedBlockId}
                  onBlockSelect={handleBlockSelect}
                  onBlockReorder={handleBlockReorder}
                  onBlockToggleVisibility={handleBlockToggleVisibility}
                  onBlockDelete={handleBlockDelete}
                  onBlockEdit={handleBlockEdit}
                  onAddBlock={handleAddBlock}
                />

                {/* Block editor */}
                <AnimatePresence>
                  {selectedBlock && selectedBlock.isEditing && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mt-4"
                    >
                      <BlockEditor
                        block={selectedBlock}
                        onUpdate={(updates) => handleBlockUpdate(selectedBlock.id, updates)}
                        onClose={() => handleBlockEdit(selectedBlock.id)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="h-full m-0">
              <div className="h-full overflow-auto p-3 md:p-4">
                <ResumePreview
                  blocks={editorState.blocks.filter(b => b.isVisible)}
                  template={editorState.template}
                  viewMode="mobile"
                />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // Desktop: Side-by-side layout
          <div className="h-full flex">
            {/* Left panel: Editor */}
            <div className="w-1/2 border-r overflow-auto p-4">
              <DragDropBlocks
                blocks={editorState.blocks}
                selectedBlockId={editorState.selectedBlockId}
                onBlockSelect={handleBlockSelect}
                onBlockReorder={handleBlockReorder}
                onBlockToggleVisibility={handleBlockToggleVisibility}
                onBlockDelete={handleBlockDelete}
                onBlockEdit={handleBlockEdit}
                onAddBlock={handleAddBlock}
              />

              {/* Block editor */}
              <AnimatePresence>
                {selectedBlock && selectedBlock.isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-6"
                  >
                    <BlockEditor
                      block={selectedBlock}
                      onUpdate={(updates) => handleBlockUpdate(selectedBlock.id, updates)}
                      onClose={() => handleBlockEdit(selectedBlock.id)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right panel: Preview */}
            <div className="w-1/2 overflow-auto p-4 bg-gray-50">
              <ResumePreview
                blocks={editorState.blocks.filter(b => b.isVisible)}
                template={editorState.template}
                viewMode={viewMode}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getDefaultTitle(type: ResumeBlock['type']): string {
  const titles = {
    contact: 'Contact Information',
    summary: 'Professional Summary',
    experience: 'Work Experience',
    education: 'Education',
    skills: 'Skills',
    certifications: 'Certifications',
    custom: 'Custom Section'
  };
  return titles[type];
}

function getDefaultContent(type: ResumeBlock['type']): any {
  switch (type) {
    case 'contact':
      return {
        name: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        website: ''
      };
    case 'experience':
      return [];
    case 'education':
      return [];
    case 'skills':
      return [];
    case 'certifications':
      return [];
    default:
      return '';
  }
}

function convertResumeDataToBlocks(data: ResumeData): ResumeBlock[] {
  const blocks: ResumeBlock[] = [];
  let order = 0;

  // Contact block
  blocks.push({
    id: uuidv4(),
    type: 'contact',
    title: 'Contact Information',
    content: data.sections.contact,
    order: order++,
    isVisible: true,
    isEditing: false
  });

  // Summary block
  if (data.sections.summary) {
    blocks.push({
      id: uuidv4(),
      type: 'summary',
      title: 'Professional Summary',
      content: data.sections.summary,
      order: order++,
      isVisible: true,
      isEditing: false
    });
  }

  // Experience block
  if (data.sections.experience.length > 0) {
    blocks.push({
      id: uuidv4(),
      type: 'experience',
      title: 'Work Experience',
      content: data.sections.experience,
      order: order++,
      isVisible: true,
      isEditing: false
    });
  }

  // Education block
  if (data.sections.education.length > 0) {
    blocks.push({
      id: uuidv4(),
      type: 'education',
      title: 'Education',
      content: data.sections.education,
      order: order++,
      isVisible: true,
      isEditing: false
    });
  }

  // Skills block
  if (data.sections.skills.length > 0) {
    blocks.push({
      id: uuidv4(),
      type: 'skills',
      title: 'Skills',
      content: data.sections.skills,
      order: order++,
      isVisible: true,
      isEditing: false
    });
  }

  // Certifications block
  if (data.sections.certifications.length > 0) {
    blocks.push({
      id: uuidv4(),
      type: 'certifications',
      title: 'Certifications',
      content: data.sections.certifications,
      order: order++,
      isVisible: true,
      isEditing: false
    });
  }

  return blocks;
}

function convertBlocksToResumeData(blocks: ResumeBlock[]): ResumeData {
  const data: Partial<ResumeData> = {
    id: uuidv4(),
    content: '',
    metadata: {
      fileName: 'resume.pdf',
      fileType: 'pdf',
      uploadDate: new Date(),
      wordCount: 0
    },
    sections: {
      contact: {
        name: '',
        email: '',
        phone: '',
        location: ''
      },
      summary: '',
      experience: [],
      education: [],
      skills: [],
      certifications: []
    }
  };

  blocks.forEach(block => {
    if (!block.isVisible) return;

    switch (block.type) {
      case 'contact':
        data.sections!.contact = block.content;
        break;
      case 'summary':
        data.sections!.summary = block.content;
        break;
      case 'experience':
        data.sections!.experience = block.content;
        break;
      case 'education':
        data.sections!.education = block.content;
        break;
      case 'skills':
        data.sections!.skills = block.content;
        break;
      case 'certifications':
        data.sections!.certifications = block.content;
        break;
    }
  });

  return data as ResumeData;
}