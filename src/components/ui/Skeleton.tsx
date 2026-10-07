'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', width, height, animation = 'pulse', ...props }, ref) => {
    const variantStyles: Record<string, React.CSSProperties> = {
      text: { borderRadius: '0.25rem' },
      circular: { borderRadius: '9999px' },
      rectangular: { borderRadius: '0.5rem' },
      card: { borderRadius: '1rem' },
    };

    const animationClasses = {
      pulse: 'animate-pulse-soft',
      wave: 'animate-shimmer',
      none: '',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800',
          'bg-[length:200%_100%]',
          animationClasses[animation],
          className
        )}
        style={{
          width,
          height,
          ...variantStyles[variant],
          ...props.style,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export function SkeletonText({ lines = 3, className, ...props }: { lines?: number } & Omit<SkeletonProps, 'variant'>) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" height={i === lines - 1 ? '60%' : '100%'} {...props} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, ...props }: Omit<SkeletonProps, 'variant'>) {
  return (
    <div className={cn('space-y-4', className)}>
      <Skeleton variant="rectangular" height="160px" width="100%" {...props} />
      <div className="space-y-2 px-2">
        <Skeleton variant="text" width="40%" {...props} />
        <Skeleton variant="text" width="60%" {...props} />
        <Skeleton variant="text" width="80%" {...props} />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton variant="circular" width="80px" height="32px" {...props} />
        <Skeleton variant="circular" width="80px" height="32px" {...props} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className, ...props }: { rows?: number; columns?: number } & Omit<SkeletonProps, 'variant'>) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 font-medium text-text-muted">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" width={`${100 / columns}%`} height="1rem" {...props} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 px-4 py-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`${rowIndex}-${colIndex}`} variant="text" width={`${100 / columns}%`} height="1rem" {...props} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className, ...props }: Omit<SkeletonProps, 'variant'>) {
  return (
    <Skeleton variant="card" height="300px" width="100%" className={className} {...props} />
  );
}

export function SkeletonStatCard({ className, ...props }: Omit<SkeletonProps, 'variant'>) {
  return (
    <div className={cn('glass-card p-6 space-y-3', className)}>
      <Skeleton variant="text" width="50%" height="1rem" {...props} />
      <Skeleton variant="text" width="80%" height="2.5rem" {...props} />
      <Skeleton variant="text" width="40%" height="0.875rem" {...props} />
    </div>
  );
}