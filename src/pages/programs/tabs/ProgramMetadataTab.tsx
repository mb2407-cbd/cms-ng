/**
 * @file ProgramMetadataTab.tsx
 * @description Metadata tab for system info and advanced fields
 * @author VLS Team
 * @date 2026-02-15
 */
import React from 'react';
import type { Program } from '../../../types';

interface ProgramMetadataTabProps {
  program: Partial<Program>;
  onChange: (field: string, value: any) => void;
  readOnly: boolean;
}

const ProgramMetadataTab: React.FC<ProgramMetadataTabProps> = ({
  program,
}) => {
  return (
    <div className="max-w-5xl space-y-6">
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
          System Information
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-200)] mb-2">
              Program ID
            </label>
            <input
              type="text"
              value={program.programId || (program.id && program.id.length > 14 && /^[A-Z]{2}/.test(program.id) ? program.id.substring(0, 14) : program.id) || ''}
              readOnly
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-200)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-200)] mb-2">
              VRIO ID
            </label>
            <input
              type="text"
              value={program.vrioId || ''}
              readOnly
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-200)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-200)] mb-2">
              Version
            </label>
            <input
              type="text"
              value={program.version || ''}
              readOnly
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-200)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-200)] mb-2">
              Color Code
            </label>
            <input
              type="text"
              value={program.colorCode || ''}
              readOnly
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-200)]"
            />
          </div>
        </div>
      </section>

      {/* Provider Info */}
      {(program.providerInfo || []).length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
            Provider Info ({(program.providerInfo || []).length})
          </h2>
          <div className="rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-800)]">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">System</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">SubType</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Key</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Value</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Lang</th>
                </tr>
              </thead>
              <tbody>
                {(program.providerInfo || []).map((info, index) => (
                  <tr key={index} className="border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
                    <td className="px-3 py-2 text-[var(--color-neutral-800)] dark:text-white font-medium">
                      {info.system || '—'}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                      {info.progType || '—'}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                      {info.subType || '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                      {info.key || '—'}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-neutral-800)] dark:text-white break-all">
                      {info.value || '—'}
                    </td>
                    <td className="px-3 py-2">
                      {info.lang ? (
                        <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          {info.lang.toUpperCase()}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Production Companies */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
          Production Companies ({(program.productionCompanies || []).length})
        </h2>
        <div className="space-y-2">
          {(program.productionCompanies || []).map((company, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)]"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏢</span>
                <span className="text-sm font-medium text-[var(--color-neutral-800)] dark:text-white">
                  {company}
                </span>
              </div>
            </div>
          ))}
          {(program.productionCompanies || []).length === 0 && (
            <div className="text-sm text-[var(--color-neutral-500)]">
              No production companies listed
            </div>
          )}
        </div>
      </section>

      {/* Countries */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
          Countries ({(program.countries || []).length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {(program.countries || []).map((country, index) => (
            <span
              key={index}
              className="px-3 py-2 rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)] text-sm font-medium text-[var(--color-neutral-800)] dark:text-white"
            >
              🌍 {country}
            </span>
          ))}
          {(program.countries || []).length === 0 && (
            <div className="text-sm text-[var(--color-neutral-500)]">
              No countries specified
            </div>
          )}
        </div>
      </section>

      {/* Release Dates */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
          Release Dates ({(program.releases || []).length})
        </h2>
        <div className="space-y-3">
          {(program.releases || []).map((release, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">📅</span>
                    <div>
                      <div className="font-semibold text-[var(--color-neutral-800)] dark:text-white">
                        {new Date(release.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-sm text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                        {release.country}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-8">
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      {release.type}
                    </span>
                    {release.medium && (
                      <span className="px-2 py-1 text-xs rounded bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                        {release.medium}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(program.releases || []).length === 0 && (
            <div className="text-sm text-[var(--color-neutral-500)]">
              No release dates available
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProgramMetadataTab;
