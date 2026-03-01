/**
 * @file LoadingSpinner.tsx
 * @description Reusable loading spinner component
 * @author VLS Team
 * @date 2026-02-15
 */
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const SIZES = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', message }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${SIZES[size]} border-2 border-[var(--color-neutral-300)] border-t-[var(--color-primary-500)] rounded-full animate-spin`}
      />
      {message && (
        <p className="text-sm text-[var(--color-neutral-500)]">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
