import { ResumeTemplate, TemplateStyles, TemplateStructure } from '@/types/editor';

// Default template styles
export const defaultTemplateStyles: Record<string, TemplateStyles> = {
  modern: {
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
  },
  professional: {
    colors: {
      primary: '#1f2937',
      secondary: '#6b7280',
      text: '#111827',
      background: '#ffffff',
      accent: '#374151'
    },
    fonts: {
      heading: 'Georgia',
      body: 'Georgia',
      size: {
        heading: '1.5rem',
        subheading: '1.25rem',
        body: '1rem',
        small: '0.875rem'
      }
    },
    spacing: {
      section: '1.75rem',
      paragraph: '0.875rem',
      line: '1.4'
    },
    borders: {
      width: '2px',
      style: 'solid',
      color: '#d1d5db'
    }
  },
  creative: {
    colors: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      text: '#1f2937',
      background: '#ffffff',
      accent: '#8b5cf6'
    },
    fonts: {
      heading: 'Poppins',
      body: 'Open Sans',
      size: {
        heading: '1.625rem',
        subheading: '1.375rem',
        body: '1rem',
        small: '0.875rem'
      }
    },
    spacing: {
      section: '2.25rem',
      paragraph: '1.125rem',
      line: '1.6'
    },
    borders: {
      width: '1px',
      style: 'dashed',
      color: '#c4b5fd'
    }
  }
};

// Default template structures
export const defaultTemplateStructures: Record<string, TemplateStructure> = {
  singleColumn: {
    layout: 'single-column',
    sections: {
      contact: { order: 0, column: 0, required: true },
      summary: { order: 1, column: 0, required: false },
      experience: { order: 2, column: 0, required: false },
      education: { order: 3, column: 0, required: false },
      skills: { order: 4, column: 0, required: false },
      certifications: { order: 5, column: 0, required: false }
    }
  },
  twoColumn: {
    layout: 'two-column',
    sections: {
      contact: { order: 0, column: 0, required: true },
      summary: { order: 1, column: 0, required: false },
      experience: { order: 2, column: 0, required: false },
      education: { order: 3, column: 0, required: false },
      skills: { order: 0, column: 1, required: false },
      certifications: { order: 1, column: 1, required: false }
    }
  },
  threeColumn: {
    layout: 'three-column',
    sections: {
      contact: { order: 0, column: 0, required: true },
      summary: { order: 1, column: 0, required: false },
      experience: { order: 0, column: 1, required: false },
      education: { order: 1, column: 1, required: false },
      skills: { order: 0, column: 2, required: false },
      certifications: { order: 1, column: 2, required: false }
    }
  }
};

// Default templates
export const defaultTemplates: ResumeTemplate[] = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    category: 'modern',
    preview: '/templates/modern-minimal.png',
    isActive: true,
    structure: defaultTemplateStructures.singleColumn,
    styling: defaultTemplateStyles.modern
  },
  {
    id: 'modern-two-column',
    name: 'Modern Two Column',
    category: 'modern',
    preview: '/templates/modern-two-column.png',
    isActive: true,
    structure: defaultTemplateStructures.twoColumn,
    styling: {
      ...defaultTemplateStyles.modern,
      colors: {
        ...defaultTemplateStyles.modern.colors,
        primary: '#059669',
        accent: '#10b981'
      }
    }
  },
  {
    id: 'professional-classic',
    name: 'Professional Classic',
    category: 'professional',
    preview: '/templates/professional-classic.png',
    isActive: true,
    structure: defaultTemplateStructures.singleColumn,
    styling: defaultTemplateStyles.professional
  },
  {
    id: 'professional-executive',
    name: 'Professional Executive',
    category: 'professional',
    preview: '/templates/professional-executive.png',
    isActive: true,
    structure: defaultTemplateStructures.twoColumn,
    styling: {
      ...defaultTemplateStyles.professional,
      colors: {
        ...defaultTemplateStyles.professional.colors,
        primary: '#0f172a',
        secondary: '#475569'
      }
    }
  },
  {
    id: 'creative-bold',
    name: 'Creative Bold',
    category: 'creative',
    preview: '/templates/creative-bold.png',
    isActive: true,
    structure: defaultTemplateStructures.singleColumn,
    styling: defaultTemplateStyles.creative
  },
  {
    id: 'creative-artistic',
    name: 'Creative Artistic',
    category: 'creative',
    preview: '/templates/creative-artistic.png',
    isActive: true,
    structure: defaultTemplateStructures.threeColumn,
    styling: {
      ...defaultTemplateStyles.creative,
      colors: {
        ...defaultTemplateStyles.creative.colors,
        primary: '#dc2626',
        accent: '#ef4444'
      }
    }
  }
];

// Color palette options
export const colorPalettes = [
  {
    name: 'Blue Professional',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      text: '#1e293b',
      background: '#ffffff',
      accent: '#3b82f6'
    }
  },
  {
    name: 'Green Modern',
    colors: {
      primary: '#059669',
      secondary: '#6b7280',
      text: '#1f2937',
      background: '#ffffff',
      accent: '#10b981'
    }
  },
  {
    name: 'Purple Creative',
    colors: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      text: '#1f2937',
      background: '#ffffff',
      accent: '#8b5cf6'
    }
  },
  {
    name: 'Red Bold',
    colors: {
      primary: '#dc2626',
      secondary: '#6b7280',
      text: '#1f2937',
      background: '#ffffff',
      accent: '#ef4444'
    }
  },
  {
    name: 'Gray Classic',
    colors: {
      primary: '#1f2937',
      secondary: '#6b7280',
      text: '#111827',
      background: '#ffffff',
      accent: '#374151'
    }
  },
  {
    name: 'Teal Fresh',
    colors: {
      primary: '#0d9488',
      secondary: '#64748b',
      text: '#1e293b',
      background: '#ffffff',
      accent: '#14b8a6'
    }
  }
];

// Font combinations
export const fontCombinations = [
  {
    name: 'Inter Modern',
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    }
  },
  {
    name: 'Georgia Classic',
    fonts: {
      heading: 'Georgia',
      body: 'Georgia'
    }
  },
  {
    name: 'Poppins Creative',
    fonts: {
      heading: 'Poppins',
      body: 'Open Sans'
    }
  },
  {
    name: 'Roboto Clean',
    fonts: {
      heading: 'Roboto',
      body: 'Roboto'
    }
  },
  {
    name: 'Playfair Elegant',
    fonts: {
      heading: 'Playfair Display',
      body: 'Source Sans Pro'
    }
  }
];

/**
 * Apply template to user content while preserving data
 */
export function applyTemplate(
  template: ResumeTemplate,
  userContent: any
): ResumeTemplate {
  return {
    ...template,
    // Preserve any user-specific customizations
    styling: {
      ...template.styling,
      // Allow user content to override template styles if needed
      ...(userContent.customStyles || {})
    }
  };
}

/**
 * Customize template styles
 */
export function customizeTemplate(
  template: ResumeTemplate,
  customizations: Partial<TemplateStyles>
): ResumeTemplate {
  return {
    ...template,
    styling: {
      ...template.styling,
      ...customizations,
      colors: {
        ...template.styling.colors,
        ...(customizations.colors || {})
      },
      fonts: {
        ...template.styling.fonts,
        ...(customizations.fonts || {}),
        size: {
          ...template.styling.fonts.size,
          ...(customizations.fonts?.size || {})
        }
      },
      spacing: {
        ...template.styling.spacing,
        ...(customizations.spacing || {})
      },
      borders: {
        ...template.styling.borders,
        ...(customizations.borders || {})
      }
    }
  };
}

/**
 * Generate CSS variables from template styles
 */
export function generateCSSVariables(styles: TemplateStyles): Record<string, string> {
  return {
    '--template-color-primary': styles.colors.primary,
    '--template-color-secondary': styles.colors.secondary,
    '--template-color-text': styles.colors.text,
    '--template-color-background': styles.colors.background,
    '--template-color-accent': styles.colors.accent,
    '--template-font-heading': styles.fonts.heading,
    '--template-font-body': styles.fonts.body,
    '--template-font-size-heading': styles.fonts.size.heading,
    '--template-font-size-subheading': styles.fonts.size.subheading,
    '--template-font-size-body': styles.fonts.size.body,
    '--template-font-size-small': styles.fonts.size.small,
    '--template-spacing-section': styles.spacing.section,
    '--template-spacing-paragraph': styles.spacing.paragraph,
    '--template-line-height': styles.spacing.line,
    '--template-border-width': styles.borders.width,
    '--template-border-style': styles.borders.style,
    '--template-border-color': styles.borders.color
  };
}

/**
 * Validate template structure
 */
export function validateTemplate(template: ResumeTemplate): boolean {
  try {
    // Check required fields
    if (!template.id || !template.name || !template.category) {
      return false;
    }

    // Check structure
    if (!template.structure || !template.structure.layout) {
      return false;
    }

    // Check styling
    if (!template.styling || !template.styling.colors || !template.styling.fonts) {
      return false;
    }

    // Check required color properties
    const requiredColors = ['primary', 'secondary', 'text', 'background', 'accent'];
    for (const color of requiredColors) {
      if (!template.styling.colors[color as keyof typeof template.styling.colors]) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}