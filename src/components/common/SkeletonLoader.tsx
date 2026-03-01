/**
 * @file SkeletonLoader.tsx
 * @description Skeleton loading placeholder component
 * @author VLS Team
 * @date 2026-02-15
 */
import React from 'react';

interface SkeletonLoaderProps {
  rows?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ rows = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse flex gap-3">
          <div className="w-12 h-12 bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-700)] rounded-lg" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-700)] rounded w-3/4" />
            <div className="h-3 bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-700)] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
