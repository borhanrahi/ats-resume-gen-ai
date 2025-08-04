// Theme utility functions for accessing CSS custom properties

export const theme = {
  // Mobile-First Breakpoints (min-width)
  breakpoints: {
    xxs: '350px',  // Very small phones (iPhone SE, etc.)
    xs: '420px',   // Small phones (iPhone 12 mini, etc.)
    sm: '640px',   // Large phones / small tablets
    md: '768px',   // Tablets (iPad mini, etc.)
    lg: '1024px',  // Small laptops / large tablets
    xl: '1280px',  // Laptops / desktops
    '2xl': '1536px', // Large screens
    '3xl': '1920px', // Extra large screens / 4K
  },

  // Colors (accessible via CSS variables)
  colors: {
    background: 'var(--color-background)',
    foreground: 'var(--color-foreground)',
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    destructive: 'var(--color-destructive)',
    info: 'var(--color-info)',
    border: 'var(--color-border)',
    ring: 'var(--color-ring)',
  },

  // ATS Score Colors
  atsScores: {
    excellent: 'var(--color-score-excellent)',
    good: 'var(--color-score-good)',
    fair: 'var(--color-score-fair)',
    poor: 'var(--color-score-poor)',
  },

  // Mobile-First Spacing
  spacing: {
    0.5: 'var(--spacing-0_5)',
    1.5: 'var(--spacing-1_5)',
    2.5: 'var(--spacing-2_5)',
    3.5: 'var(--spacing-3_5)',
    5.5: 'var(--spacing-5_5)',
    7.5: 'var(--spacing-7_5)',
    18: 'var(--spacing-18)',
    22: 'var(--spacing-22)',
    26: 'var(--spacing-26)',
    30: 'var(--spacing-30)',
    34: 'var(--spacing-34)',
    38: 'var(--spacing-38)',
  },

  // Container Widths
  containers: {
    xxs: 'var(--container-xxs)',
    xs: 'var(--container-xs)',
    sm: 'var(--container-sm)',
    md: 'var(--container-md)',
    lg: 'var(--container-lg)',
    xl: 'var(--container-xl)',
    '2xl': 'var(--container-2xl)',
  },

  // Border Radius
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
  },

  // Shadows
  shadows: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
  },

  // Z-Index
  zIndex: {
    dropdown: 'var(--z-index-dropdown)',
    sticky: 'var(--z-index-sticky)',
    fixed: 'var(--z-index-fixed)',
    modal: 'var(--z-index-modal)',
    popover: 'var(--z-index-popover)',
    tooltip: 'var(--z-index-tooltip)',
  },
} as const;

// Helper function to get ATS score color based on score value
export function getATSScoreColor(score: number): string {
  if (score >= 90) return theme.atsScores.excellent;
  if (score >= 75) return theme.atsScores.good;
  if (score >= 60) return theme.atsScores.fair;
  return theme.atsScores.poor;
}

// Helper function to get ATS score class based on score value
export function getATSScoreClass(score: number): string {
  if (score >= 90) return 'ats-score-excellent';
  if (score >= 75) return 'ats-score-good';
  if (score >= 60) return 'ats-score-fair';
  return 'ats-score-poor';
}

// Media query helpers for TypeScript (Mobile-First approach)
export const mediaQueries = {
  xxs: `(min-width: ${theme.breakpoints.xxs})`,
  xs: `(min-width: ${theme.breakpoints.xs})`,
  sm: `(min-width: ${theme.breakpoints.sm})`,
  md: `(min-width: ${theme.breakpoints.md})`,
  lg: `(min-width: ${theme.breakpoints.lg})`,
  xl: `(min-width: ${theme.breakpoints.xl})`,
  '2xl': `(min-width: ${theme.breakpoints['2xl']})`,
  '3xl': `(min-width: ${theme.breakpoints['3xl']})`,
} as const;

// Max-width media queries for when you need to target smaller screens
export const maxWidthQueries = {
  xxs: `(max-width: ${parseInt(theme.breakpoints.xs) - 1}px)`, // Up to 419px
  xs: `(max-width: ${parseInt(theme.breakpoints.sm) - 1}px)`,  // Up to 639px
  sm: `(max-width: ${parseInt(theme.breakpoints.md) - 1}px)`,  // Up to 767px
  md: `(max-width: ${parseInt(theme.breakpoints.lg) - 1}px)`,  // Up to 1023px
  lg: `(max-width: ${parseInt(theme.breakpoints.xl) - 1}px)`,  // Up to 1279px
  xl: `(max-width: ${parseInt(theme.breakpoints['2xl']) - 1}px)`, // Up to 1535px
  '2xl': `(max-width: ${parseInt(theme.breakpoints['3xl']) - 1}px)`, // Up to 1919px
} as const;

// Mobile-first utility functions
export const mobile = {
  // Check if current screen is mobile (under 640px)
  isMobile: () => window.matchMedia(maxWidthQueries.xs).matches,
  
  // Check if current screen is very small (under 420px)
  isVerySmall: () => window.matchMedia(maxWidthQueries.xxs).matches,
  
  // Check if current screen is tablet (640px - 1023px)
  isTablet: () => window.matchMedia(`${mediaQueries.sm} and ${maxWidthQueries.md}`).matches,
  
  // Check if current screen is desktop (1024px+)
  isDesktop: () => window.matchMedia(mediaQueries.lg).matches,
} as const;

// Responsive font size helper
export function getResponsiveFontSize(
  mobile: string,
  tablet?: string,
  desktop?: string
): Record<string, string> {
  return {
    fontSize: mobile,
    ...(tablet && { [`@media ${mediaQueries.md}`]: { fontSize: tablet } }),
    ...(desktop && { [`@media ${mediaQueries.lg}`]: { fontSize: desktop } }),
  };
}

// Responsive spacing helper
export function getResponsiveSpacing(
  mobile: string,
  tablet?: string,
  desktop?: string
): Record<string, string> {
  return {
    padding: mobile,
    ...(tablet && { [`@media ${mediaQueries.md}`]: { padding: tablet } }),
    ...(desktop && { [`@media ${mediaQueries.lg}`]: { padding: desktop } }),
  };
}