'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  GripVertical, 
  Edit3, 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ResumeBlock, DragDropResult } from '@/types/editor';

interface DragDropBlocksProps {
  blocks: ResumeBlock[];
  selectedBlockId: string | null;
  onBlockSelect: (blockId: string) => void;
  onBlockReorder: (result: DragDropResult) => void;
  onBlockToggleVisibility: (blockId: string) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockEdit: (blockId: string) => void;
  onAddBlock: (type: ResumeBlock['type']) => void;
  className?: string;
}

const blockIcons = {
  contact: User,
  summary: FileText,
  experience: Briefcase,
  education: GraduationCap,
  skills: Settings,
  certifications: Award,
  custom: Plus
};

const blockColors = {
  contact: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  summary: 'bg-green-50 border-green-200 hover:bg-green-100',
  experience: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  education: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
  skills: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
  certifications: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  custom: 'bg-gray-50 border-gray-200 hover:bg-gray-100'
};

export function DragDropBlocks({
  blocks,
  selectedBlockId,
  onBlockSelect,
  onBlockReorder,
  onBlockToggleVisibility,
  onBlockDelete,
  onBlockEdit,
  onAddBlock,
  className = ''
}: DragDropBlocksProps) {
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // Mobile-first touch handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);

  const handleDragStart = useCallback((blockId: string) => {
    setDraggedBlockId(blockId);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedBlockId && dragOverBlockId && dragPosition) {
      onBlockReorder({
        draggedId: draggedBlockId,
        targetId: dragOverBlockId,
        position: dragPosition
      });
    }
    setDraggedBlockId(null);
    setDragOverBlockId(null);
    setDragPosition(null);
  }, [draggedBlockId, dragOverBlockId, dragPosition, onBlockReorder]);

  const handleDragOver = useCallback((e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    if (draggedBlockId === blockId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'before' : 'after';

    setDragOverBlockId(blockId);
    setDragPosition(position);
  }, [draggedBlockId]);

  // Touch handlers for mobile drag-and-drop
  const handleTouchStart = useCallback((e: React.TouchEvent, blockId: string) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setDraggedBlockId(blockId);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart || !draggedBlockId) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    if (deltaX > 10 || deltaY > 10) {
      setIsTouchDragging(true);
    }
  }, [touchStart, draggedBlockId]);

  const handleTouchEnd = useCallback(() => {
    setTouchStart(null);
    setIsTouchDragging(false);
    if (draggedBlockId && dragOverBlockId && dragPosition) {
      onBlockReorder({
        draggedId: draggedBlockId,
        targetId: dragOverBlockId,
        position: dragPosition
      });
    }
    setDraggedBlockId(null);
    setDragOverBlockId(null);
    setDragPosition(null);
  }, [draggedBlockId, dragOverBlockId, dragPosition, onBlockReorder]);

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className={`space-y-2 md:space-y-3 ${className}`}>
      {/* Mobile-first header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="text-lg md:text-xl font-semibold text-gray-900">
          Resume Sections
        </h3>
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {Object.entries(blockIcons).map(([type, Icon]) => {
            if (type === 'custom') return null;
            return (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => onAddBlock(type as ResumeBlock['type'])}
                className="min-h-[44px] text-xs sm:text-sm"
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Blocks list */}
      <AnimatePresence>
        {sortedBlocks.map((block, index) => {
          const Icon = blockIcons[block.type];
          const isSelected = selectedBlockId === block.id;
          const isDragged = draggedBlockId === block.id;
          const isDraggedOver = dragOverBlockId === block.id;

          return (
            <motion.div
              key={block.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isDragged ? 0.5 : 1, 
                y: 0,
                scale: isDragged ? 0.95 : 1
              }}
              exit={{ opacity: 0, y: -20 }}
              className="relative"
            >
              {/* Drag indicator */}
              {isDraggedOver && dragPosition === 'before' && (
                <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />
              )}

              <Card
                className={`
                  p-3 md:p-4 cursor-pointer transition-all duration-200
                  ${blockColors[block.type]}
                  ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  ${isDraggedOver ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}
                  ${!block.isVisible ? 'opacity-60' : ''}
                `}
                draggable
                onDragStart={() => handleDragStart(block.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, block.id)}
                onTouchStart={(e) => handleTouchStart(e, block.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => onBlockSelect(block.id)}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  {/* Drag handle */}
                  <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  </div>

                  {/* Block icon */}
                  <div className="flex-shrink-0">
                    <Icon className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                  </div>

                  {/* Block content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm md:text-base font-medium text-gray-900 truncate">
                          {block.title}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-500 truncate">
                          {typeof block.content === 'string' 
                            ? block.content.slice(0, 50) + (block.content.length > 50 ? '...' : '')
                            : `${Object.keys(block.content || {}).length} items`
                          }
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBlockToggleVisibility(block.id);
                          }}
                          className="min-h-[44px] min-w-[44px] p-2"
                        >
                          {block.isVisible ? (
                            <Eye className="w-3 h-3 md:w-4 md:h-4" />
                          ) : (
                            <EyeOff className="w-3 h-3 md:w-4 md:h-4" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBlockEdit(block.id);
                          }}
                          className="min-h-[44px] min-w-[44px] p-2"
                        >
                          <Edit3 className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBlockDelete(block.id);
                          }}
                          className="min-h-[44px] min-w-[44px] p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Drag indicator */}
              {isDraggedOver && dragPosition === 'after' && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty state */}
      {sortedBlocks.length === 0 && (
        <Card className="p-6 md:p-8 text-center border-dashed">
          <FileText className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mx-auto mb-3 md:mb-4" />
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
            No sections added yet
          </h3>
          <p className="text-sm md:text-base text-gray-500 mb-4">
            Add your first resume section to get started
          </p>
          <Button
            onClick={() => onAddBlock('summary')}
            className="min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Summary Section
          </Button>
        </Card>
      )}
    </div>
  );
}