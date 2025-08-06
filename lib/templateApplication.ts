import { ResumeTemplate, ResumeBlock, TemplateStyles } from '@/types/editor';
import { generateCSSVariables, validateTemplate } from '@/lib/templateUtils';

export interface TemplateApplicationResult {
  success: boolean;
  template: ResumeTemplate | null;
  preservedBlocks: ResumeBlock[];
  error?: string;
}

export interface UserContent {
  blocks: ResumeBlock[];
  customStyles?: Partial<TemplateStyles>;
  metadata?: {
    lastModified: Date;
    version: string;
  };
}

/**
 * Apply a template to user content while preserving all user data
 */
export function applyTemplateToUserContent(
  template: ResumeTemplate,
  userContent: UserContent
): TemplateApplicationResult {
  try {
    // Validate template
    if (!validateTemplate(template)) {
      return {
        success: false,
        template: null,
        preservedBlocks: userContent.blocks,
        error: 'Invalid template provided'
      };
    }

    // Create a copy of the template to avoid mutations
    const appliedTemplate: ResumeTemplate = {
      ...template,
      id: `applied-${template.id}-${Date.now()}`,
      styling: {
        ...template.styling,
        // Merge user's custom styles if they exist
        ...(userContent.customStyles || {})
      }
    };

    // Map user blocks to template structure
    const preservedBlocks = mapBlocksToTemplateStructure(
      userContent.blocks,
      appliedTemplate
    );

    return {
      success: true,
      template: appliedTemplate,
      preservedBlocks,
    };
  } catch (error) {
    return {
      success: false,
      template: null,
      preservedBlocks: userContent.blocks,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Map user blocks to template structure while preserving content
 */
function mapBlocksToTemplateStructure(
  userBlocks: ResumeBlock[],
  template: ResumeTemplate
): ResumeBlock[] {
  const templateSections = template.structure.sections;
  const mappedBlocks: ResumeBlock[] = [];

  // Create a map of existing user blocks by type
  const userBlocksByType = userBlocks.reduce((acc, block) => {
    if (!acc[block.type]) {
      acc[block.type] = [];
    }
    acc[block.type].push(block);
    return acc;
  }, {} as Record<string, ResumeBlock[]>);

  // Map each template section to user blocks
  Object.entries(templateSections).forEach(([sectionType, sectionConfig]) => {
    const userBlocksOfType = userBlocksByType[sectionType] || [];
    
    if (userBlocksOfType.length > 0) {
      // Use existing user blocks
      userBlocksOfType.forEach((block, index) => {
        mappedBlocks.push({
          ...block,
          order: sectionConfig.order + (index * 0.1), // Maintain sub-ordering
          isVisible: true
        });
      });
    } else if (sectionConfig.required) {
      // Create placeholder block for required sections
      mappedBlocks.push(createPlaceholderBlock(sectionType, sectionConfig.order));
    }
  });

  // Add any user blocks that don't match template sections
  userBlocks.forEach(block => {
    if (!templateSections[block.type]) {
      mappedBlocks.push({
        ...block,
        order: 999 + mappedBlocks.length // Put at end
      });
    }
  });

  // Sort by order
  return mappedBlocks.sort((a, b) => a.order - b.order);
}

/**
 * Create a placeholder block for required template sections
 */
function createPlaceholderBlock(type: string, order: number): ResumeBlock {
  const placeholderContent = {
    contact: {
      name: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: ''
    },
    summary: {
      text: ''
    },
    experience: [],
    education: [],
    skills: [],
    certifications: []
  };

  return {
    id: `placeholder-${type}-${Date.now()}`,
    type: type as ResumeBlock['type'],
    title: type.charAt(0).toUpperCase() + type.slice(1),
    content: placeholderContent[type as keyof typeof placeholderContent] || {},
    order,
    isVisible: true,
    isEditing: false
  };
}

/**
 * Generate template-specific CSS for a resume
 */
export function generateTemplateCSS(template: ResumeTemplate): string {
  const variables = generateCSSVariables(template.styling);
  
  const cssVariables = Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  return `
.resume-template {
${cssVariables}
}

.resume-template .section-header {
  color: var(--template-color-primary);
  font-family: var(--template-font-heading);
  font-size: var(--template-font-size-heading);
  margin-bottom: var(--template-spacing-paragraph);
  border-bottom: var(--template-border-width) var(--template-border-style) var(--template-border-color);
  padding-bottom: calc(var(--template-spacing-paragraph) / 2);
}

.resume-template .section-content {
  font-family: var(--template-font-body);
  font-size: var(--template-font-size-body);
  line-height: var(--template-line-height);
  color: var(--template-color-text);
  margin-bottom: var(--template-spacing-section);
}

.resume-template .subsection-header {
  color: var(--template-color-primary);
  font-family: var(--template-font-heading);
  font-size: var(--template-font-size-subheading);
  font-weight: 600;
  margin-bottom: calc(var(--template-spacing-paragraph) / 2);
}

.resume-template .meta-text {
  color: var(--template-color-secondary);
  font-size: var(--template-font-size-small);
  font-style: italic;
}

.resume-template .accent-line {
  background-color: var(--template-color-accent);
  height: 2px;
  width: 100%;
  margin: var(--template-spacing-paragraph) 0;
}

.resume-template .skill-tag {
  background-color: var(--template-color-accent);
  color: var(--template-color-background);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: var(--template-font-size-small);
  display: inline-block;
  margin: 0.125rem;
}

/* Layout-specific styles */
.resume-template.single-column {
  display: block;
}

.resume-template.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.resume-template.three-column {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1.5rem;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .resume-template.two-column,
  .resume-template.three-column {
    display: block;
  }
}
`;
}

/**
 * Validate that user content is compatible with template
 */
export function validateContentTemplateCompatibility(
  userContent: UserContent,
  template: ResumeTemplate
): { compatible: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check if required sections have content
  Object.entries(template.structure.sections).forEach(([sectionType, config]) => {
    if (config.required) {
      const hasContent = userContent.blocks.some(
        block => block.type === sectionType && block.content
      );
      
      if (!hasContent) {
        issues.push(`Required section "${sectionType}" is missing or empty`);
      }
    }
  });

  // Check for layout compatibility
  const blockCount = userContent.blocks.length;
  const layoutCapacity = {
    'single-column': Infinity,
    'two-column': 10, // Reasonable limit for two columns
    'three-column': 8   // Reasonable limit for three columns
  };

  const maxCapacity = layoutCapacity[template.structure.layout];
  if (blockCount > maxCapacity) {
    issues.push(`Too many sections (${blockCount}) for ${template.structure.layout} layout`);
  }

  return {
    compatible: issues.length === 0,
    issues
  };
}

/**
 * Create a backup of user content before applying template
 */
export function createContentBackup(userContent: UserContent): string {
  const backup = {
    ...userContent,
    backupDate: new Date().toISOString(),
    version: '1.0'
  };
  
  return JSON.stringify(backup);
}

/**
 * Restore user content from backup
 */
export function restoreContentFromBackup(backupString: string): UserContent | null {
  try {
    const backup = JSON.parse(backupString);
    
    // Validate backup structure
    if (!backup.blocks || !Array.isArray(backup.blocks)) {
      return null;
    }

    return {
      blocks: backup.blocks,
      customStyles: backup.customStyles,
      metadata: backup.metadata
    };
  } catch (error) {
    return null;
  }
}