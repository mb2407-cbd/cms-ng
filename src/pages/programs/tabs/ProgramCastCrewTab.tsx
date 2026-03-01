/**
 * @file ProgramCastCrewTab.tsx
 * @description Cast and crew tab for managing program credits
 * @author VLS Team
 * @date 2026-02-15
 */
import React, { useMemo } from 'react';
import { User } from 'lucide-react';
import type { Program } from '../../../types';

interface ProgramCastCrewTabProps {
  program: Partial<Program>;
  onChange: (field: string, value: any) => void;
  readOnly: boolean;
}

const ProgramCastCrewTab: React.FC<ProgramCastCrewTabProps> = ({ program }) => {
  // Group credits by type
  const groupedCredits = useMemo(() => {
    const credits = program.credits || [];
    const groups: Record<string, any[]> = {};

    credits.forEach((credit) => {
      const type = credit.type || 'Other';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(credit);
    });

    // Sort each group by ord (order) if available
    Object.keys(groups).forEach((type) => {
      groups[type].sort((a, b) => {
        const ordA = parseInt(a.ord || '999', 10);
        const ordB = parseInt(b.ord || '999', 10);
        return ordA - ordB;
      });
    });

    return groups;
  }, [program.credits]);

  const getPersonName = (credit: any): string => {
    if (credit.name?.preferred) return credit.name.preferred;
    if (credit.castName) return credit.castName;
    if (credit.firstName && credit.lastName) {
      return `${credit.firstName} ${credit.lastName}`;
    }
    if (credit.firstName) return credit.firstName;
    if (credit.lastName) return credit.lastName;
    return 'Unknown';
  };

  const getCreditTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'Actor': '🎭 Cast',
      'Director': '🎬 Directors',
      'Producer': '🎞️ Producers',
      'Writer': '✍️ Writers',
      'Composer': '🎵 Composers',
      'Cinematographer': '📹 Cinematography',
      'Editor': '✂️ Editors',
      'Executive Producer': '📊 Executive Producers',
    };
    return labels[type] || `👤 ${type}`;
  };

  if (!program.credits || program.credits.length === 0) {
    return (
      <div className="max-w-5xl">
        <div className="flex flex-col items-center justify-center py-20">
          <User size={48} className="text-[var(--color-neutral-300)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">
            No Cast & Crew Information
          </h3>
          <p className="text-sm text-[var(--color-neutral-500)]">
            No credits available for this program
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {Object.entries(groupedCredits).map(([type, credits]) => (
        <section key={type}>
          <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
            {getCreditTypeLabel(type)} ({credits.length})
          </h2>
          <div className="space-y-2">
            {credits.map((credit, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-[var(--color-neutral-800)] dark:text-white">
                      {getPersonName(credit)}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      {credit.role && (
                        <div className="text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                          <span className="font-medium">Role:</span> {credit.role}
                        </div>
                      )}
                      {credit.characterName && (
                        <div className="text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                          <span className="font-medium">Character:</span> {credit.characterName}
                        </div>
                      )}
                      {credit.creditType && (
                        <span className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          {credit.creditType}
                        </span>
                      )}
                    </div>
                    {credit.personId && (
                      <div className="text-xs text-[var(--color-neutral-500)] font-mono mt-2">
                        ID: {credit.personId}
                      </div>
                    )}
                  </div>
                  {credit.ord && (
                    <div className="text-sm text-[var(--color-neutral-500)] ml-4">
                      #{credit.ord}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ProgramCastCrewTab;
