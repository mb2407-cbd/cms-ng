/**
 * @file ProgramEpisodesTab.tsx
 * @description Episodes tab for Series/Sports programs – fetches and displays episodes
 * @author VLS Team
 * @date 2026-02-17
 */
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllEpisodesOfSeries } from '../../../services/program.service';
import type { Program } from '../../../types';

interface ProgramEpisodesTabProps {
  program: Partial<Program>;
}

const ProgramEpisodesTab: React.FC<ProgramEpisodesTabProps> = ({ program }) => {
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());

  // Base program ID (without version suffix) — used to fetch episodes
  const programBaseId = useMemo(() => {
    // Try programId field first (it's the base ID without version)
    if (program.programId) return program.programId;
    // Fall back to stripping version suffix from id
    const id = program.id || '';
    if (id.length > 14 && /^[A-Z]{2}/.test(id)) {
      return id.substring(0, 14);
    }
    return id;
  }, [program.id, program.programId]);

  // Fetch episodes using only the canonical endpoint: GET /programs/{seriesId}/episodes
  useEffect(() => {
    if (!programBaseId) return;
    setIsLoading(true);
    setError(null);
    getAllEpisodesOfSeries(programBaseId)
      .then((response: any) => {
        const eps = response?.response || response || [];
        if (Array.isArray(eps)) {
          setEpisodes(eps);
          if (eps.length > 0) {
            const firstSeason = eps[0]?.seasonNumber || eps[0]?.season || 0;
            setExpandedSeasons(new Set([Number(firstSeason)]));
          } else {
            setExpandedSeasons(new Set());
          }
        } else {
          setEpisodes([]);
          setExpandedSeasons(new Set());
        }
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load episodes');
      })
      .finally(() => setIsLoading(false));
  }, [programBaseId]);

  // Group episodes by season, sorted by episode number
  const episodesBySeason = useMemo(() => {
    const grouped: Record<number, any[]> = {};
    episodes.forEach((ep: any) => {
      const sn = Number(ep.seasonNumber || ep.season || 0);
      if (!grouped[sn]) grouped[sn] = [];
      grouped[sn].push(ep);
    });
    Object.values(grouped).forEach(eps =>
      eps.sort((a, b) => (Number(a.episodeNumber || a.episode || 0)) - (Number(b.episodeNumber || b.episode || 0)))
    );
    return grouped;
  }, [episodes]);

  // Merge season numbers from program.seasons metadata + fetched episodes
  const sortedSeasonNums = useMemo(() => {
    const nums = new Set<number>();
    (program.seasons || []).forEach(s => nums.add(s.seasonNumber));
    Object.keys(episodesBySeason).forEach(sn => nums.add(Number(sn)));
    return Array.from(nums).sort((a, b) => a - b);
  }, [program.seasons, episodesBySeason]);

  const toggleSeason = (seasonNum: number) => {
    setExpandedSeasons(prev => {
      const next = new Set(prev);
      if (next.has(seasonNum)) next.delete(seasonNum);
      else next.add(seasonNum);
      return next;
    });
  };

  const expandAll = () => setExpandedSeasons(new Set(sortedSeasonNums));
  const collapseAll = () => setExpandedSeasons(new Set());

  if (isLoading) {
    return (
      <div className="max-w-5xl">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="text-[var(--color-primary-500)] mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">
            Loading Episodes...
          </h3>
          <p className="text-sm text-[var(--color-neutral-500)]">
            Fetching episodes for {programBaseId}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle size={48} className="text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">
            Failed to Load Episodes
          </h3>
          <p className="text-sm text-[var(--color-neutral-500)]">{error}</p>
          <p className="text-xs text-[var(--color-neutral-400)] mt-2">
            Program ID: {programBaseId}
          </p>
        </div>
      </div>
    );
  }

  if (sortedSeasonNums.length === 0) {
    return (
      <div className="max-w-5xl">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle size={48} className="text-[var(--color-neutral-300)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">
            No Episodes Found
          </h3>
          <p className="text-sm text-[var(--color-neutral-500)]">
            No episode data available for this program
          </p>
          <p className="text-xs text-[var(--color-neutral-400)] mt-2">
            Program ID: {programBaseId} | Type: {program.programType}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
          <span className="font-medium">{sortedSeasonNums.length} season{sortedSeasonNums.length !== 1 ? 's' : ''}</span>
          <span className="text-[var(--color-neutral-400)]">|</span>
          <span>{episodes.length} episode{episodes.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-medium text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-medium text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] rounded transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Seasons */}
      <div className="space-y-3">
        {sortedSeasonNums.map(seasonNum => {
          const seasonMeta = (program.seasons || []).find(s => s.seasonNumber === seasonNum);
          const seasonEpisodes = episodesBySeason[seasonNum] || [];
          const isExpanded = expandedSeasons.has(seasonNum);
          const totalEps = seasonMeta?.totalSeasonEpisodes || seasonEpisodes.length;

          return (
            <div
              key={seasonNum}
              className="rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)] overflow-hidden"
            >
              {/* Season Header */}
              <button
                onClick={() => toggleSeason(seasonNum)}
                className="w-full px-4 py-3 bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="text-sm font-semibold text-[var(--color-neutral-800)] dark:text-white">
                      Season {seasonNum}
                    </span>
                    {seasonMeta?.seasonYear && (
                      <span className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {seasonMeta.seasonYear}
                      </span>
                    )}
                    <span className="text-xs text-[var(--color-neutral-500)]">
                      {totalEps} episode{totalEps !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-neutral-500)]">
                    {seasonMeta?.seasonPremiere && (
                      <span>Premiere: {new Date(seasonMeta.seasonPremiere).toLocaleDateString()}</span>
                    )}
                    {seasonMeta?.seasonFinale && (
                      <span>Finale: {new Date(seasonMeta.seasonFinale).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                {seasonMeta?.titles && seasonMeta.titles.length > 0 && (
                  <div className="text-xs text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mt-1 ml-7">
                    {seasonMeta.titles.find(t => t.lang === 'es')?.value || seasonMeta.titles[0]?.value}
                  </div>
                )}
              </button>

              {/* Episode List */}
              {isExpanded && seasonEpisodes.length > 0 && (
                <div className="border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-800)]">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] w-16">Ep #</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Title</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] w-32">Air Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] w-40">Program ID</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasonEpisodes.map((ep: any, idx: number) => {
                        const epNum = ep.episodeNumber || ep.episode || idx + 1;
                        const epTitle =
                          ep.titles?.find((t: any) => t.lang === 'es')?.value
                          || ep.titles?.find((t: any) => t.lang === 'en')?.value
                          || ep.name
                          || ep.episodeTitle
                          || ep.titles?.[0]?.value
                          || '';
                        const epId = ep.programId || ep.id;
                        return (
                          <tr
                            key={epId || idx}
                            className="border-t border-[var(--color-neutral-100)] dark:border-[var(--color-neutral-800)] hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-900)]/10 cursor-pointer transition-colors"
                            onClick={() => navigate(`/programs/${epId}`)}
                          >
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[var(--color-primary-100)] dark:bg-[var(--color-primary-900)]/30 text-[var(--color-primary-700)] dark:text-[var(--color-primary-300)]">
                                {epNum}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-[var(--color-neutral-800)] dark:text-white">
                              <div className="flex items-center gap-2">
                                <span className="truncate max-w-sm">{epTitle || 'Untitled'}</span>
                                <ExternalLink size={12} className="text-[var(--color-neutral-400)] flex-shrink-0" />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                              {ep.origAirDate || '—'}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                              {epId || '—'}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {(ep.published || ep.publish) ? (
                                <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Pub</span>
                              ) : (
                                <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-[var(--color-neutral-500)]">Draft</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {isExpanded && seasonEpisodes.length === 0 && (
                <div className="px-4 py-3 text-sm text-[var(--color-neutral-500)] border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
                  No episodes loaded for this season
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgramEpisodesTab;
