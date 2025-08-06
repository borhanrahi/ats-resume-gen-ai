export interface ResumeBlock {
  id: string;
  type: 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'certifications' | 'custom';
  title: string;
  content: any;
  order: number;
  isVisible: boolean;
  isEditing: boolean;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  category: 'modern' | 'professional' | 'creative';
  structure: TemplateStructure;
  styling: TemplateStyles;
  isActive: boolean;
  preview: string;
}

export interface TemplateStructure {
  layout: 'single-column' | 'two-column' | 'three-column';
  sections: {
    [key: string]: {
      order: number;
      column: number;
      required: boolean;
    };
  };
}

export interface TemplateStyles {
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
    size: {
      heading: string;
      subheading: string;
      body: string;
      small: string;
    };
  };
  spacing: {
    section: string;
    paragraph: string;
    line: string;
  };
  borders: {
    width: string;
    style: string;
    color: string;
  };
}

export interface EditorState {
  blocks: ResumeBlock[];
  selectedBlockId: string | null;
  isDragging: boolean;
  draggedBlockId: string | null;
  template: ResumeTemplate | null;
  isPreviewMode: boolean;
  hasUnsavedChanges: boolean;
}

export interface DragDropResult {
  draggedId: string;
  targetId: string;
  position: 'before' | 'after';
}

export interface BlockPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}