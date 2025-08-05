'use client';

import { useState, useEffect } from 'react';

// Mobile-first breakpoints matching the design system
const breakpoints = {
  xxs: 350,  // Very small phones
  xs: 420,   // Small phones
  sm: 640,   // Large phones / small tablets
  md: 768,   // Tablets
  lg: 1024,  // Small laptops
  xl: 1280,  // Laptops
  '2xl': 1536, // Large screens
  '3xl': 1920  // Extra large screens
} as const;

type Breakpoint = keyof typeof breakpoints;

interface BreakpointState {
  current: Breakpoint;
  isXXS: boolean;
  isXS: boolean;
  isSM: boolean;
  isMD: boolean;
  isLG: boolean;
  isXL: boolean;
  is2XL: boolean;
  is3XL: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

/**
 * Custom hook for responsive breakpoint detection
 * Follows mobile-first design principles
 */
export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(() => {
    // Default to mobile-first approach (smallest breakpoint)
    const defaultWidth = typeof window !== 'undefined' ? window.innerWidth : 350;
    return getBreakpointState(defaultWidth);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      setState(getBreakpointState(width));
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}

/**
 * Get breakpoint state based on window width
 */
function getBreakpointState(width: number): BreakpointState {
  // Determine current breakpoint (mobile-first)
  let current: Breakpoint = 'xxs';
  if (width >= breakpoints['3xl']) current = '3xl';
  else if (width >= breakpoints['2xl']) current = '2xl';
  else if (width >= breakpoints.xl) current = 'xl';
  else if (width >= breakpoints.lg) current = 'lg';
  else if (width >= breakpoints.md) current = 'md';
  else if (width >= breakpoints.sm) current = 'sm';
  else if (width >= breakpoints.xs) current = 'xs';

  // Individual breakpoint checks
  const isXXS = width < breakpoints.xs;
  const isXS = width >= breakpoints.xs && width < breakpoints.sm;
  const isSM = width >= breakpoints.sm && width < breakpoints.md;
  const isMD = width >= breakpoints.md && width < breakpoints.lg;
  const isLG = width >= breakpoints.lg && width < breakpoints.xl;
  const isXL = width >= breakpoints.xl && width < breakpoints['2xl'];
  const is2XL = width >= breakpoints['2xl'] && width < breakpoints['3xl'];
  const is3XL = width >= breakpoints['3xl'];

  // Device category helpers
  const isMobile = width < breakpoints.md; // < 768px
  const isTablet = width >= breakpoints.md && width < breakpoints.lg; // 768px - 1023px
  const isDesktop = width >= breakpoints.lg; // >= 1024px

  return {
    current,
    isXXS,
    isXS,
    isSM,
    isMD,
    isLG,
    isXL,
    is2XL,
    is3XL,
    isMobile,
    isTablet,
    isDesktop,
    width
  };
}

/**
 * Hook to check if current breakpoint matches a specific breakpoint or larger
 */
export function useBreakpointUp(breakpoint: Breakpoint): boolean {
  const { width } = useBreakpoint();
  return width >= breakpoints[breakpoint];
}

/**
 * Hook to check if current breakpoint matches a specific breakpoint or smaller
 */
export function useBreakpointDown(breakpoint: Breakpoint): boolean {
  const { width } = useBreakpoint();
  return width < breakpoints[breakpoint];
}

/**
 * Hook to check if current breakpoint is between two breakpoints
 */
export function useBreakpointBetween(min: Breakpoint, max: Breakpoint): boolean {
  const { width } = useBreakpoint();
  return width >= breakpoints[min] && width < breakpoints[max];
}