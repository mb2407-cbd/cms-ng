/**
 * @file StatusBar.tsx
 * @description Bottom status bar showing environment indicator, build version, API version, etc.
 *              Environment is read-only here — switching happens on the Login page
 *              (since JWT tokens are issued per-environment).
 * @author VLS Team
 * @date 2026-02-24
 */
import React from 'react';
import { useApp } from '../../context/AppContext';
import { Circle } from 'lucide-react';

const StatusBar: React.FC = () => {
  const { versionInfo, platform, environment } = useApp();

  const dotClass: Record<string, string> = {
    amber: 'fill-amber-400 text-amber-400',
    green: 'fill-green-400 text-green-400',
  };

  const labelClass: Record<string, string> = {
    amber: 'text-amber-400',
    green: 'text-green-400',
  };

  return (
    <footer className="bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-900)] border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-800)] px-4 py-1.5 text-xs text-[var(--color-neutral-500)] flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Circle size={8} className="fill-green-500 text-green-500" />
          Connected
        </span>
        <span>
          Platform: <strong className="text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">{platform.toUpperCase()}</strong>
        </span>
      </div>
      <div className="flex items-center gap-4">
        {/* Environment indicator (read-only) */}
        <span className="flex items-center gap-1.5">
          <Circle size={6} className={dotClass[environment.badgeColor]} />
          <strong className={labelClass[environment.badgeColor]}>{environment.label}</strong>
        </span>

        {versionInfo && (
          <>
            <span>API: v{versionInfo.version}</span>
            {versionInfo.buildDate && <span>Built: {versionInfo.buildDate}</span>}
          </>
        )}
        <span>UI: v2.0.0-alpha</span>
      </div>
    </footer>
  );
};

export default StatusBar;
