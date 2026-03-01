/**
 * @file ProgramsPage.tsx
 * @description Programs management page with sidebar layout and compact list
 * @author VLS Team
 * @date 2026-02-15
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Film,
  Lock,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { searchPrograms, getAllEpisodesOfSeries } from '../../services/program.service';
import { PROGRAM_TYPE_NAMES, PLATFORMS } from '../../constants/app.constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { Program, ProgramSearchRequest } from '../../types';

/**
 * Search filter options.
 * IMPORTANT: values must be 2-letter API codes (MV, SH, SV, SP) — NOT long names.
 */
const PROGRAM_TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Movie', value: 'MV' },
  { label: 'Series', value: 'SH' },
  { label: 'Show', value: 'SV' },
  { label: 'Sport', value: 'SP' },
  { label: 'Episode', value: 'EP' },
];

const PLATFORM_OPTIONS = [
  { label: 'All Platforms', value: '' },
  { label: 'OTT', value: PLATFORMS.OTT },
  { label: 'DTH', value: PLATFORMS.DTH },
];

/** Simple module-level cache so the listing survives detail page navigation */
let cachedSearchState: {
  query: string;
  typeFilter: string;
  platformFilter: string;
  programs: Program[];
  page: number;
  totalPages: number;
  totalResults: number;
} | null = null;

const MAX_EPISODE_PREVIEW = 10;
const PROGRAM_COLUMNS_STORAGE_KEY = 'vls_programs_columns';

type ProgramColumnKey = 'image' | 'type' | 'title' | 'programId' | 'platform' | 'year' | 'status' | 'actions';
type ReorderableProgramColumnKey = Exclude<ProgramColumnKey, 'actions'>;

const DEFAULT_PROGRAM_COLUMNS: ReorderableProgramColumnKey[] = [
  'image',
  'type',
  'title',
  'programId',
  'platform',
  'year',
  'status',
];

const PROGRAM_COLUMN_META: Record<ProgramColumnKey, { label: string; headerClass: string; cellClass: string }> = {
  image: { label: 'Image', headerClass: 'col-span-1', cellClass: 'col-span-1' },
  type: { label: 'Type', headerClass: 'col-span-1', cellClass: 'col-span-1' },
  title: { label: 'Title', headerClass: 'col-span-3', cellClass: 'col-span-3 min-w-0' },
  programId: { label: 'Program Id', headerClass: 'col-span-2', cellClass: 'col-span-2 text-xs text-[var(--color-neutral-500)] truncate font-mono' },
  platform: { label: 'Platform', headerClass: 'col-span-2', cellClass: 'col-span-2' },
  year: { label: 'Year', headerClass: 'col-span-1 text-center', cellClass: 'col-span-1 text-center text-xs text-[var(--color-neutral-500)]' },
  status: { label: 'Status', headerClass: 'col-span-1 text-center', cellClass: 'col-span-1 text-center' },
  actions: { label: '', headerClass: 'col-span-1', cellClass: 'col-span-1 text-right flex items-center justify-end gap-1' },
};

const loadStoredProgramColumns = (): ReorderableProgramColumnKey[] => {
  try {
    const raw = localStorage.getItem(PROGRAM_COLUMNS_STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRAM_COLUMNS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_PROGRAM_COLUMNS;
    const valid = parsed.filter((k): k is ReorderableProgramColumnKey => DEFAULT_PROGRAM_COLUMNS.includes(k as ReorderableProgramColumnKey));
    if (valid.length !== DEFAULT_PROGRAM_COLUMNS.length) return DEFAULT_PROGRAM_COLUMNS;
    return valid;
  } catch {
    return DEFAULT_PROGRAM_COLUMNS;
  }
};

const ProgramsPage: React.FC = () => {
  const navigate = useNavigate();

  // Restore cached state if available (avoids reload on back-navigation)
  const [searchQuery, setSearchQuery] = useState(cachedSearchState?.query ?? '');
  const [typeFilter, setTypeFilter] = useState(cachedSearchState?.typeFilter ?? '');
  const [platformFilter, setPlatformFilter] = useState(cachedSearchState?.platformFilter ?? '');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [programs, setPrograms] = useState<Program[]>(cachedSearchState?.programs ?? []);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(cachedSearchState?.page ?? 0);
  const [totalPages, setTotalPages] = useState(cachedSearchState?.totalPages ?? 0);
  const [totalResults, setTotalResults] = useState(cachedSearchState?.totalResults ?? 0);
  const pageSize = 20;
  const [columnOrder, setColumnOrder] = useState<ReorderableProgramColumnKey[]>(loadStoredProgramColumns);
  const [draggedColumn, setDraggedColumn] = useState<ReorderableProgramColumnKey | null>(null);

  // Expanded series state: map of programId -> episodes[]
  const [expandedSeries, setExpandedSeries] = useState<Record<string, any[]>>({});
  const [loadingEpisodes, setLoadingEpisodes] = useState<string | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(!!cachedSearchState);

  /**
   * Execute program search against the API.
   */
  const executeSearch = useCallback(async (query: string, typeFilters: string[], platform: string, pageNum: number) => {
    setLoading(true);
    try {
      const request: ProgramSearchRequest = {
        searchString: query,
        filters: typeFilters,
      };

      const response: any = await searchPrograms(request, pageNum, pageSize);

      let data: Program[];
      let total: number;
      let pages: number;

      if (Array.isArray(response)) {
        // Demo mode
        data = response;
        total = response.length;
        pages = 1;
      } else {
        data = response.response || [];
        total = response.totalElements || data.length;
        pages = response.totalPages || Math.ceil(data.length / pageSize);
      }

      // Client-side platform filter (API filters only accept type codes)
      if (platform) {
        data = data.filter(p => {
          const tp = (p.targetPlatform || '').toLowerCase();
          if (platform === 'both') return true;
          return tp === platform || tp === 'both';
        });
      }

      setPrograms(data);
      setTotalResults(total);
      setTotalPages(pages);

      // Cache state for back-navigation
      cachedSearchState = {
        query,
        typeFilter,
        platformFilter: platform,
        programs: data,
        page: pageNum,
        totalPages: pages,
        totalResults: total,
      };
    } catch (error) {
      console.error('Program search failed:', error);
      setPrograms([]);
      setTotalResults(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize, typeFilter]);

  /**
   * Build type filter array from current filter state.
   * Default: MV + SH (movies & series) — excludes raw episodes.
   */
  const buildTypeFilters = useCallback((): string[] => {
    if (typeFilter) {
      return [typeFilter];
    }
    // Default: show Movies, Series, Shows, Sports — but not episodes
    return ['MV', 'SH', 'SV', 'SP'];
  }, [typeFilter]);

  /**
   * Handle search input changes with debounce.
   */
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setPage(0);
      executeSearch(value, buildTypeFilters(), platformFilter, 0);
    }, 500);
  }, [buildTypeFilters, platformFilter, executeSearch]);

  /**
   * Navigate to specific page.
   */
  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 0 && newPage < totalPages && !loading) {
      setPage(newPage);
      executeSearch(searchQuery, buildTypeFilters(), platformFilter, newPage);
      const contentArea = document.querySelector('.flex-1.overflow-auto');
      if (contentArea) contentArea.scrollTop = 0;
    }
  }, [totalPages, loading, searchQuery, buildTypeFilters, platformFilter, executeSearch]);

  /**
   * Handle filter changes — re-trigger search.
   */
  useEffect(() => {
    setPage(0);
    executeSearch(searchQuery, buildTypeFilters(), platformFilter, 0);
  }, [typeFilter, platformFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Load initial programs on mount (only if no cached state).
   */
  useEffect(() => {
    if (!initialLoadDone.current) {
      executeSearch('', buildTypeFilters(), '', 0);
      initialLoadDone.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem(PROGRAM_COLUMNS_STORAGE_KEY, JSON.stringify(columnOrder));
  }, [columnOrder]);

  /**
   * Toggle episode expansion for a series.
   */
  const toggleSeriesExpansion = useCallback(async (programId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't navigate to the program detail

    if (expandedSeries[programId]) {
      // Collapse
      setExpandedSeries(prev => {
        const next = { ...prev };
        delete next[programId];
        return next;
      });
      return;
    }

    // Expand — fetch episodes
    setLoadingEpisodes(programId);
    try {
      const baseId = programId.length > 14 && /^[A-Z]{2}/.test(programId)
        ? programId.substring(0, 14)
        : programId;

      const response: any = await getAllEpisodesOfSeries(baseId);
      const episodes = response?.response || response || [];
      const sliced = Array.isArray(episodes) ? episodes.slice(0, MAX_EPISODE_PREVIEW) : [];
      setExpandedSeries(prev => ({ ...prev, [programId]: sliced }));
    } catch (err) {
      console.error('Failed to fetch episodes for', programId, err);
      setExpandedSeries(prev => ({ ...prev, [programId]: [] }));
    } finally {
      setLoadingEpisodes(null);
    }
  }, [expandedSeries]);

  // ——————————— Helpers ———————————

  const getDisplayTitle = (program: Program): string => {
    return (
      program.englishTitle?.value ||
      program.titles?.find((t) => t.lang === 'en')?.value ||
      program.titles?.[0]?.value ||
      program.originalTitle?.value ||
      'Untitled'
    );
  };

  const getProgramImageUrl = (program: Program): string | null => {
    if (program.pictures && Object.keys(program.pictures).length > 0) {
      return program.pictures['16:9'] || program.pictures[Object.keys(program.pictures)[0]] || null;
    }
    return null;
  };

  const getTypeBadgeColor = (type: string): string => {
    const colors: Record<string, string> = {
      MV: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      SH: 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/30 dark:text-[var(--color-primary-300)]',
      SV: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      SP: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      EP: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      SE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  /** Can this program type have child episodes? */
  const canHaveEpisodes = (type: string): boolean => {
    return ['SH', 'SP', 'SERIES', 'SPORT'].includes(type);
  };

  const hasActiveFilters = typeFilter || platformFilter;

  const handleColumnDrop = useCallback((target: ReorderableProgramColumnKey) => {
    if (!draggedColumn || draggedColumn === target) return;
    setColumnOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(draggedColumn);
      const to = next.indexOf(target);
      if (from < 0 || to < 0) return prev;
      next.splice(from, 1);
      next.splice(to, 0, draggedColumn);
      return next;
    });
    setDraggedColumn(null);
  }, [draggedColumn]);

  // ——————————— Render ———————————

  return (
    <div className="flex flex-row-reverse h-full bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-900)]">
      {/* Right Sidebar */}
      <div
        className={`flex-shrink-0 bg-white dark:bg-[var(--color-neutral-800)] border-l border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] transition-all duration-300 ${
          sidebarCollapsed ? 'w-12' : 'w-80'
        }`}
      >
        {sidebarCollapsed ? (
          <div className="flex flex-col items-center py-4 gap-4">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 rounded-lg hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-600)]"
              title="Expand sidebar"
            >
              <ChevronDown size={20} />
            </button>
            <button className="p-2 rounded-lg hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-600)]" title="Search">
              <Search size={20} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
              <h2 className="text-sm font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                Search & Filters
              </h2>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 rounded hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-500)]"
                title="Collapse sidebar"
              >
                <ChevronUp size={16} />
              </button>
            </div>

            {/* Search Section */}
            <div className="p-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search programs..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              </div>
            </div>

            {/* Filters Section */}
            <div className="p-4 space-y-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
              <div>
                <label className="block text-xs font-medium text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">
                  Program Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  {PROGRAM_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">
                  Platform
                </label>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  {PLATFORM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => { setTypeFilter(''); setPlatformFilter(''); }}
                  className="w-full text-xs text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="page-header-bar flex items-center justify-between px-6 py-3">
          <div className="text-sm text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
            {loading && programs.length === 0 ? (
              'Loading...'
            ) : totalResults > 0 ? (
              <>
                Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalResults)} of {totalResults} program{totalResults !== 1 ? 's' : ''}
              </>
            ) : (
              'No programs'
            )}
          </div>
          <button
            onClick={() => navigate('/programs/new')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded-lg transition-colors"
          >
            <Plus size={16} />
            New Program
          </button>
        </div>

        {/* Compact Program List */}
        <div className="flex-1 overflow-auto">
          {loading && programs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
            </div>
          ) : programs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Film size={48} className="text-[var(--color-neutral-300)] mb-3" />
              <h3 className="text-lg font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">
                {searchQuery ? 'No programs found' : 'No programs available'}
              </h3>
              <p className="text-sm text-[var(--color-neutral-400)] max-w-md">
                {searchQuery
                  ? 'Try adjusting your search terms or removing some filters.'
                  : 'No programs have been added to the system yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-neutral-200)] dark:divide-[var(--color-neutral-700)]">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-2 bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-xs font-medium text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] sticky top-0 z-10">
                {columnOrder.map((columnKey) => {
                  const meta = PROGRAM_COLUMN_META[columnKey];
                  const isDragged = draggedColumn === columnKey;
                  return (
                    <div
                      key={columnKey}
                      draggable
                      onDragStart={() => setDraggedColumn(columnKey)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleColumnDrop(columnKey)}
                      onDragEnd={() => setDraggedColumn(null)}
                      className={`${meta.headerClass} flex items-center gap-1 cursor-move select-none ${isDragged ? 'opacity-60' : ''}`}
                      title="Drag to reorder columns"
                    >
                      <GripVertical size={12} className="text-[var(--color-neutral-400)]" />
                      {meta.label}
                    </div>
                  );
                })}
                <div className={PROGRAM_COLUMN_META.actions.headerClass}></div>
              </div>

              {/* Program Rows */}
              {programs.map((program) => {
                const imageUrl = getProgramImageUrl(program);
                const programIdForNav = program.programId || program.id;
                const isSeries = canHaveEpisodes(program.programType);
                const isExpanded = !!expandedSeries[program.id];
                const episodes = expandedSeries[program.id];
                const isLoadingEps = loadingEpisodes === program.id;
                // Display base ID (no version suffix)
                const displayId = program.programId || (program.id && program.id.length > 14 && /^[A-Z]{2}/.test(program.id) ? program.id.substring(0, 14) : program.id);

                return (
                  <React.Fragment key={program._id || program.id}>
                    {/* Main Program Row */}
                    <div
                      onClick={() => navigate(`/programs/${programIdForNav}`)}
                      className="grid grid-cols-12 gap-4 px-6 py-2.5 hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-800)] cursor-pointer transition-colors text-sm items-center"
                    >
                      {columnOrder.map((columnKey) => {
                        const meta = PROGRAM_COLUMN_META[columnKey];
                        if (columnKey === 'image') {
                          return (
                            <div key={columnKey} className={meta.cellClass}>
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={getDisplayTitle(program)}
                                  className="w-16 h-9 object-cover rounded"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling!.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-16 h-9 flex items-center justify-center bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-700)] rounded text-[10px] text-[var(--color-neutral-400)] ${imageUrl ? 'hidden' : ''}`}>
                                <Film size={16} />
                              </div>
                            </div>
                          );
                        }
                        if (columnKey === 'type') {
                          return (
                            <div key={columnKey} className={meta.cellClass}>
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getTypeBadgeColor(program.programType)}`}>
                                {PROGRAM_TYPE_NAMES[program.programType] || program.programType}
                              </span>
                            </div>
                          );
                        }
                        if (columnKey === 'title') {
                          return (
                            <div key={columnKey} className={meta.cellClass}>
                              <div className="flex items-center gap-2">
                                {program.contentLock && (
                                  <Lock size={14} className="text-amber-500 flex-shrink-0" />
                                )}
                                <span className="font-medium text-[var(--color-neutral-800)] dark:text-white truncate">
                                  {getDisplayTitle(program)}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        if (columnKey === 'programId') {
                          return <div key={columnKey} className={meta.cellClass}>{displayId}</div>;
                        }
                        if (columnKey === 'platform') {
                          return (
                            <div key={columnKey} className={meta.cellClass}>
                              {program.targetPlatform && (
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-700)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                                  {program.targetPlatform.toUpperCase()}
                                </span>
                              )}
                            </div>
                          );
                        }
                        if (columnKey === 'year') {
                          return <div key={columnKey} className={meta.cellClass}>{program.releaseYear || '-'}</div>;
                        }
                        if (columnKey === 'status') {
                          return (
                            <div key={columnKey} className={meta.cellClass}>
                              {program.published && (
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  Published
                                </span>
                              )}
                            </div>
                          );
                        }
                      })}
                      <div className={PROGRAM_COLUMN_META.actions.cellClass}>
                        {isSeries && (
                          <button
                            onClick={(e) => toggleSeriesExpansion(program.id, e)}
                            className="p-1 rounded hover:bg-[var(--color-neutral-200)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-500)] transition-colors"
                            title={isExpanded ? 'Collapse episodes' : 'Show episodes'}
                          >
                            {isLoadingEps ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : isExpanded ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Episode Preview */}
                    {isExpanded && episodes && (
                      <div className="bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-900)] border-l-4 border-[var(--color-primary-300)]">
                        {episodes.length === 0 ? (
                          <div className="px-10 py-3 text-xs text-[var(--color-neutral-500)]">
                            No episodes found
                          </div>
                        ) : (
                          <>
                            <div className="px-10 py-1.5 text-[10px] font-semibold text-[var(--color-neutral-500)] uppercase tracking-wider">
                              Episodes (showing up to {MAX_EPISODE_PREVIEW})
                            </div>
                            {episodes.map((ep: any, idx: number) => {
                              const epTitle =
                                ep.titles?.find((t: any) => t.lang === 'es')?.value ||
                                ep.titles?.find((t: any) => t.lang === 'en')?.value ||
                                ep.name ||
                                ep.episodeTitle ||
                                ep.titles?.[0]?.value ||
                                'Untitled Episode';
                              const epId = ep.programId || ep.id;
                              const seasonNum = ep.seasonNumber || ep.season || '?';
                              const episodeNum = ep.episodeNumber || ep.episode || idx + 1;

                              return (
                                <div
                                  key={epId || idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/programs/${epId}`);
                                  }}
                                  className="grid grid-cols-12 gap-4 px-10 py-1.5 hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-900)]/10 cursor-pointer transition-colors text-xs items-center"
                                >
                                  <div className="col-span-1">
                                    <span className="px-1.5 py-0.5 rounded bg-[var(--color-primary-100)] dark:bg-[var(--color-primary-900)]/30 text-[var(--color-primary-700)] dark:text-[var(--color-primary-300)] font-semibold text-[10px]">
                                      S{seasonNum}E{episodeNum}
                                    </span>
                                  </div>
                                  <div className="col-span-1">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${getTypeBadgeColor(ep.programType || 'EP')}`}>
                                      {PROGRAM_TYPE_NAMES[ep.programType] || 'Episode'}
                                    </span>
                                  </div>
                                  <div className="col-span-3 truncate text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                                    {epTitle}
                                  </div>
                                  <div className="col-span-2 font-mono text-[var(--color-neutral-400)] truncate">
                                    {epId}
                                  </div>
                                  <div className="col-span-2 text-[var(--color-neutral-500)]">
                                    {ep.origAirDate || ''}
                                  </div>
                                  <div className="col-span-1 text-center text-[var(--color-neutral-500)]">
                                    {ep.releaseYear || ''}
                                  </div>
                                  <div className="col-span-1 text-center">
                                    {(ep.published || ep.publish) && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        Pub
                                      </span>
                                    )}
                                  </div>
                                  <div className="col-span-1 text-right">
                                    <ChevronRight size={12} className="text-[var(--color-neutral-400)] inline" />
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 0 || loading}
                    className="px-4 py-2 text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>

                  <div className="text-sm text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                    Page {page + 1} of {totalPages}
                  </div>

                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages - 1 || loading}
                    className="px-4 py-2 text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramsPage;
