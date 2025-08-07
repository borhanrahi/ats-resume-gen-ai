'use client';

import React, { Suspense, useEffect, useState, ComponentType } from 'react';
import { performanceMonitor } from '@/lib/utils/performanceMonitor';
import { Loading } from './loading';

interface PerformanceWrapperProps {
  children: React.ReactNode;
  componentName: string;
  fallback?: React.ReactNode;
  enableProfiling?: boolean;
  className?: string;
}

/**
 * Performance wrapper component that tracks render performance and provides optimizations
 */
export function PerformanceWrapper({
  children,
  componentName,
  fallback,
  enableProfiling = process.env.NODE_ENV === 'development',
  className = '',
}: PerformanceWrapperProps) {
  const [renderComplete, setRenderComplete] = useState(false);

  useEffect(() => {
    if (enableProfiling) {
      const endTracking = performanceMonitor.trackRenderPerformance(componentName);
      
      // Mark render as complete
      setRenderComplete(true);
      endTracking();

      return () => {
        // Cleanup if needed
      };
    }
  }, [componentName, enableProfiling]);

  return (
    <div className={className} data-component={componentName}>
      <Suspense fallback={fallback || <Loading />}>
        {children}
      </Suspense>
      {enableProfiling && !renderComplete && (
        <div className="sr-only" aria-hidden="true">
          Loading {componentName}...
        </div>
      )}
    </div>
  );
}

/**
 * HOC for wrapping components with performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  Component: ComponentType<P>,
  componentName: string,
  options: {
    enableCaching?: boolean;
    enableProfiling?: boolean;
    fallback?: React.ReactNode;
  } = {}
) {
  const {
    enableCaching = true,
    enableProfiling = process.env.NODE_ENV === 'development',
    fallback,
  } = options;

  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    return (
      <PerformanceWrapper
        componentName={componentName}
        fallback={fallback}
        enableProfiling={enableProfiling}
      >
        <Component {...props} ref={ref} />
      </PerformanceWrapper>
    );
  });

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`;

  return WrappedComponent;
}

/**
 * Hook for tracking component performance manually
 */
export function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    const endTracking = performanceMonitor.trackRenderPerformance(componentName);
    return endTracking;
  }, [componentName]);

  return {
    trackOperation: <T>(operation: () => Promise<T>) =>
      performanceMonitor.trackComponentPerformance(componentName, operation),
  };
}

/**
 * Optimized image component with performance monitoring
 */
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}
      
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${hasError ? 'hidden' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
      
      {hasError && (
        <div 
          className="flex items-center justify-center bg-gray-100 text-gray-500 text-sm"
          style={{ width, height }}
        >
          Failed to load image
        </div>
      )}
    </div>
  );
}

/**
 * Performance-optimized list component with virtualization for large datasets
 */
interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  className?: string;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  className = '',
  overscan = 5,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan);

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) =>
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Debounced input component for performance optimization
 */
interface DebouncedInputProps {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
  placeholder?: string;
  className?: string;
}

export function DebouncedInput({
  value,
  onChange,
  delay = 300,
  placeholder,
  className = '',
}: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange, delay]);

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}

/**
 * Memoized component wrapper for preventing unnecessary re-renders
 */
export function MemoizedComponent<P extends object>({
  Component,
  props,
  dependencies = [],
}: {
  Component: ComponentType<P>;
  props: P;
  dependencies?: any[];
}) {
  const MemoizedComp = React.useMemo(
    () => <Component {...props} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies
  );

  return MemoizedComp;
}