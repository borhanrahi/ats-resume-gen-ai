import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResumeTemplate, ResumeBlock, TemplateStyles } from '@/types/editor';
import {
  defaultTemplates,
  colorPalettes,
  fontCombinations,
  customizeTemplate,
  generateCSSVariables,
  validateTemplate,
  applyTemplate
} from '@/lib/templateUtils';
import {
  applyTemplateToUserContent,
  generateTemplateCSS,
  validateContentTemplateCompatibility,
  createContentBackup,
  restoreContentFromBackup
} from '@/lib/templateApplication';
import TemplateSelector from '@/components/editor/TemplateSelector';

// Mock data
const mockTemplate: ResumeTemplate = {
  id: 'test-template',
  name: 'Test Template',
  category: 'modern',
  preview: '/test-preview.png',
  isActive: true,
  structure: {
    layout: 'single-column',
    sections: {
      contact: { order: 0, column: 0, required: true },
      summary: { order: 1, column: 0, required: false },
      experience: { order: 2, column: 0, required: false }
    }
  },
  styling: {
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      text: '#1e293b',
      background: '#ffffff',
      accent: '#3b82f6'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      size: {
        heading: '1.5rem',
        subheading: '1.25rem',
        body: '1rem',
        small: '0.875rem'
      }
    },
    spacing: {
      section: '2rem',
      paragraph: '1rem',
      line: '1.5'
    },
    borders: {
      width: '1px',
      style: 'solid',
      color: '#e2e8f0'
    }
  }
};

const mockUserBlocks: ResumeBlock[] = [
  {
    id: 'contact-1',
    type: 'contact',
    title: 'Contact Information',
    content: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-0123'
    },
    order: 0,
    isVisible: true,
    isEditing: false
  },
  {
    id: 'experience-1',
    type: 'experience',
    title: 'Work Experience',
    content: [
      {
        title: 'Software Engineer',
        company: 'Tech Corp',
        startDate: '2020-01-01',
        endDate: '2024-01-01',
        description: 'Developed web applications'
      }
    ],
    order: 1,
    isVisible: true,
    isEditing: false
  }
];

describe('Template Utils', () => {
  describe('defaultTemplates', () => {
    it('should contain valid templates', () => {
      expect(defaultTemplates.length).toBeGreaterThan(0);
      
      defaultTemplates.forEach(template => {
        expect(validateTemplate(template)).toBe(true);
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('category');
        expect(['modern', 'professional', 'creative']).toContain(template.category);
      });
    });
  });

  describe('colorPalettes', () => {
    it('should contain valid color palettes', () => {
      expect(colorPalettes.length).toBeGreaterThan(0);
      
      colorPalettes.forEach(palette => {
        expect(palette).toHaveProperty('name');
        expect(palette).toHaveProperty('colors');
        expect(palette.colors).toHaveProperty('primary');
        expect(palette.colors).toHaveProperty('secondary');
        expect(palette.colors).toHaveProperty('text');
        expect(palette.colors).toHaveProperty('background');
        expect(palette.colors).toHaveProperty('accent');
      });
    });
  });

  describe('fontCombinations', () => {
    it('should contain valid font combinations', () => {
      expect(fontCombinations.length).toBeGreaterThan(0);
      
      fontCombinations.forEach(combo => {
        expect(combo).toHaveProperty('name');
        expect(combo).toHaveProperty('fonts');
        expect(combo.fonts).toHaveProperty('heading');
        expect(combo.fonts).toHaveProperty('body');
      });
    });
  });

  describe('customizeTemplate', () => {
    it('should customize template colors', () => {
      const customColors = {
        primary: '#ff0000',
        accent: '#00ff00'
      };

      const customized = customizeTemplate(mockTemplate, { colors: customColors });

      expect(customized.styling.colors.primary).toBe('#ff0000');
      expect(customized.styling.colors.accent).toBe('#00ff00');
      expect(customized.styling.colors.secondary).toBe(mockTemplate.styling.colors.secondary);
    });

    it('should customize template fonts', () => {
      const customFonts = {
        heading: 'Georgia',
        body: 'Times New Roman'
      };

      const customized = customizeTemplate(mockTemplate, { fonts: customFonts });

      expect(customized.styling.fonts.heading).toBe('Georgia');
      expect(customized.styling.fonts.body).toBe('Times New Roman');
    });

    it('should preserve original template', () => {
      const originalColors = { ...mockTemplate.styling.colors };
      
      customizeTemplate(mockTemplate, { 
        colors: { primary: '#ff0000' } 
      });

      expect(mockTemplate.styling.colors).toEqual(originalColors);
    });
  });

  describe('generateCSSVariables', () => {
    it('should generate correct CSS variables', () => {
      const variables = generateCSSVariables(mockTemplate.styling);

      expect(variables).toHaveProperty('--template-color-primary', '#2563eb');
      expect(variables).toHaveProperty('--template-color-secondary', '#64748b');
      expect(variables).toHaveProperty('--template-font-heading', 'Inter');
      expect(variables).toHaveProperty('--template-font-body', 'Inter');
      expect(variables).toHaveProperty('--template-spacing-section', '2rem');
    });
  });

  describe('validateTemplate', () => {
    it('should validate correct template', () => {
      expect(validateTemplate(mockTemplate)).toBe(true);
    });

    it('should reject template without id', () => {
      const invalidTemplate = { ...mockTemplate, id: '' };
      expect(validateTemplate(invalidTemplate)).toBe(false);
    });

    it('should reject template without required colors', () => {
      const invalidTemplate = {
        ...mockTemplate,
        styling: {
          ...mockTemplate.styling,
          colors: {
            primary: '#000000'
            // Missing other required colors
          } as any
        }
      };
      expect(validateTemplate(invalidTemplate)).toBe(false);
    });
  });

  describe('applyTemplate', () => {
    it('should apply template with user content', () => {
      const userContent = {
        customStyles: {
          colors: {
            primary: '#custom-color'
          }
        }
      };

      const applied = applyTemplate(mockTemplate, userContent);

      expect(applied.id).toBe(mockTemplate.id);
      expect(applied.name).toBe(mockTemplate.name);
    });
  });
});

describe('Template Application', () => {
  describe('applyTemplateToUserContent', () => {
    it('should successfully apply template to user content', () => {
      const userContent = {
        blocks: mockUserBlocks,
        customStyles: {
          colors: {
            primary: '#custom-primary'
          }
        }
      };

      const result = applyTemplateToUserContent(mockTemplate, userContent);

      expect(result.success).toBe(true);
      expect(result.template).toBeTruthy();
      expect(result.preservedBlocks).toHaveLength(2);
      expect(result.error).toBeUndefined();
    });

    it('should preserve user block content', () => {
      const userContent = { blocks: mockUserBlocks };
      const result = applyTemplateToUserContent(mockTemplate, userContent);

      const contactBlock = result.preservedBlocks.find(b => b.type === 'contact');
      expect(contactBlock?.content.name).toBe('John Doe');
      expect(contactBlock?.content.email).toBe('john@example.com');
    });

    it('should handle invalid template', () => {
      const invalidTemplate = { ...mockTemplate, id: '' };
      const userContent = { blocks: mockUserBlocks };

      const result = applyTemplateToUserContent(invalidTemplate, userContent);

      expect(result.success).toBe(false);
      expect(result.template).toBeNull();
      expect(result.error).toBe('Invalid template provided');
    });

    it('should create placeholder blocks for required sections', () => {
      const userContent = {
        blocks: [mockUserBlocks[1]] // Only experience, missing required contact
      };

      const result = applyTemplateToUserContent(mockTemplate, userContent);

      expect(result.success).toBe(true);
      const contactBlock = result.preservedBlocks.find(b => b.type === 'contact');
      expect(contactBlock).toBeTruthy();
      expect(contactBlock?.id).toContain('placeholder-contact');
    });
  });

  describe('generateTemplateCSS', () => {
    it('should generate valid CSS', () => {
      const css = generateTemplateCSS(mockTemplate);

      expect(css).toContain('.resume-template');
      expect(css).toContain('--template-color-primary: #2563eb');
      expect(css).toContain('.section-header');
      expect(css).toContain('.single-column');
    });
  });

  describe('validateContentTemplateCompatibility', () => {
    it('should validate compatible content', () => {
      const userContent = { blocks: mockUserBlocks };
      const result = validateContentTemplateCompatibility(userContent, mockTemplate);

      expect(result.compatible).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing required sections', () => {
      const userContent = {
        blocks: [mockUserBlocks[1]] // Missing required contact section
      };
      const result = validateContentTemplateCompatibility(userContent, mockTemplate);

      expect(result.compatible).toBe(false);
      expect(result.issues).toContain('Required section "contact" is missing or empty');
    });

    it('should detect too many sections for layout', () => {
      const manyBlocks = Array.from({ length: 12 }, (_, i) => ({
        ...mockUserBlocks[0],
        id: `block-${i}`,
        type: 'custom' as const
      }));

      const threeColumnTemplate = {
        ...mockTemplate,
        structure: {
          ...mockTemplate.structure,
          layout: 'three-column' as const
        }
      };

      const userContent = { blocks: manyBlocks };
      const result = validateContentTemplateCompatibility(userContent, threeColumnTemplate);

      expect(result.compatible).toBe(false);
      expect(result.issues.some(issue => issue.includes('Too many sections'))).toBe(true);
    });
  });

  describe('createContentBackup and restoreContentFromBackup', () => {
    it('should create and restore backup successfully', () => {
      const userContent = {
        blocks: mockUserBlocks,
        customStyles: {
          colors: {
            primary: '#backup-test'
          }
        }
      };

      const backup = createContentBackup(userContent);
      expect(backup).toBeTruthy();

      const restored = restoreContentFromBackup(backup);
      expect(restored).toBeTruthy();
      expect(restored?.blocks).toHaveLength(2);
      expect(restored?.customStyles?.colors?.primary).toBe('#backup-test');
    });

    it('should handle invalid backup string', () => {
      const restored = restoreContentFromBackup('invalid json');
      expect(restored).toBeNull();
    });

    it('should handle backup without blocks', () => {
      const invalidBackup = JSON.stringify({ customStyles: {} });
      const restored = restoreContentFromBackup(invalidBackup);
      expect(restored).toBeNull();
    });
  });
});

describe('TemplateSelector Component', () => {
  const mockProps = {
    selectedTemplate: null,
    onTemplateSelect: vi.fn(),
    onTemplateCustomize: vi.fn(),
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render template selector', () => {
    render(<TemplateSelector {...mockProps} />);
    
    expect(screen.getByText('Choose Template')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Customize')).toBeInTheDocument();
  });

  it('should display category filters', () => {
    render(<TemplateSelector {...mockProps} />);
    
    expect(screen.getByText('All Templates')).toBeInTheDocument();
    expect(screen.getByText('Modern')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Creative')).toBeInTheDocument();
  });

  it('should display templates', () => {
    render(<TemplateSelector {...mockProps} />);
    
    // Should show at least some default templates
    expect(screen.getByText('Modern Minimal')).toBeInTheDocument();
    expect(screen.getByText('Professional Classic')).toBeInTheDocument();
  });

  it('should filter templates by category', async () => {
    render(<TemplateSelector {...mockProps} />);
    
    // Click on Modern category
    fireEvent.click(screen.getByText('Modern'));
    
    // Should show modern templates
    expect(screen.getByText('Modern Minimal')).toBeInTheDocument();
    expect(screen.getByText('Modern Two Column')).toBeInTheDocument();
  });

  it('should call onTemplateSelect when template is clicked', async () => {
    render(<TemplateSelector {...mockProps} />);
    
    // Find and click a template
    const templateCard = screen.getByText('Modern Minimal').closest('div');
    if (templateCard) {
      fireEvent.click(templateCard);
    }
    
    await waitFor(() => {
      expect(mockProps.onTemplateSelect).toHaveBeenCalled();
    });
  });

  it('should show customize tab when template is selected', async () => {
    const propsWithSelected = {
      ...mockProps,
      selectedTemplate: mockTemplate
    };
    
    render(<TemplateSelector {...propsWithSelected} />);
    
    // Click customize tab (use role to be more specific)
    const customizeTab = screen.getByRole('tab', { name: /customize/i });
    fireEvent.click(customizeTab);
    
    expect(screen.getByText('Customize Template')).toBeInTheDocument();
    expect(screen.getByText('Colors')).toBeInTheDocument();
    expect(screen.getByText('Fonts')).toBeInTheDocument();
  });

  it('should close when close button is clicked', () => {
    render(<TemplateSelector {...mockProps} />);
    
    // Find the close button by its X icon
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should show preview when eye icon is clicked', async () => {
    render(<TemplateSelector {...mockProps} />);
    
    // Find preview button (eye icon) - look for buttons without text
    const buttons = screen.getAllByRole('button');
    const previewButton = buttons.find(button => 
      button.textContent === '' && 
      button.querySelector('svg')
    );
    
    if (previewButton) {
      fireEvent.click(previewButton);
      
      await waitFor(() => {
        expect(screen.getByText('Full template preview would be rendered here')).toBeInTheDocument();
      });
    }
  });

  it('should apply template when Apply Template button is clicked', async () => {
    const propsWithSelected = {
      ...mockProps,
      selectedTemplate: mockTemplate
    };
    
    render(<TemplateSelector {...propsWithSelected} />);
    
    // Go to customize tab using role
    const customizeTab = screen.getByRole('tab', { name: /customize/i });
    fireEvent.click(customizeTab);
    
    // Click Apply Template button
    const applyButton = screen.getByText('Apply Template');
    fireEvent.click(applyButton);
    
    expect(mockProps.onTemplateCustomize).toHaveBeenCalled();
    expect(mockProps.onClose).toHaveBeenCalled();
  });
});