/**
 * @file ProgramMappingPage.tsx
 * @description Program Mapping workflow page — matches VOD/PPV requests from Asset Management
 *              to VLS programs via drag-and-drop, manual search, or Gracenote enrichment.
 * @author VLS Team
 * @date 2026-02-24
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  Loader2,
  Check,
  X,
  Clock,
  AlertTriangle,
  Link2,
  Send,
  ArrowRight,
  GripVertical,
  Eye,
  Film,
  Tv,
  Clapperboard,
  Trophy,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  searchProgramMappings,
  requestProviderInfo,
  mapAndPublish,
  getMockMappings,
} from '../../services/programMapping.service';
import { searchPrograms, getProgramVersions, getProgramByVersion } from '../../services/program.service';
import type { ProgramMapping, MappingStatus } from '../../types/programMapping.types';
import type { Program, ProgramSearchRequest } from '../../types';
import { PROGRAM_TYPE_NAMES } from '../../constants/app.constants';

// ─── Constants ──────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE = 400;

const TYPE_FILTERS = [
  { abbrev: 'MV', label: 'Movies', icon: Film },
  { abbrev: 'SH', label: 'Series', icon: Tv },
  { abbrev: 'EP', label: 'Episodes', icon: Clapperboard },
  { abbrev: 'ES', label: 'Sports', icon: Trophy },
];

const STATUS_OPTIONS: { value: MappingStatus; label: string }[] = [
  { value: 'unmapped', label: 'Unmapped' },
  { value: 'mapped', label: 'Mapped' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'unmappable', label: 'Unmappable' },
];

// Demo mode check
const isDemoMode = (): boolean =>
  localStorage.getItem('vls_auth_token')?.startsWith('demo-token-') || false;

// ─── Helpers ────────────────────────────────────────────────────────

const getTitleByLang = (titles: any[] | undefined, lang: string): string => {
  if (!titles || titles.length === 0) return '';
  const match = titles.find((t: any) => t.lang?.includes(lang));
  return match?.value || titles[0]?.value || '';
};

const getFirstDescription = (descriptions: any[] | undefined): string => {
  if (!descriptions || descriptions.length === 0) return '';
  const en = descriptions.find((d: any) => d.lang === 'en');
  return en?.value || descriptions[0]?.value || '';
};

const formatProgramType = (type: string): string => {
  const map: Record<string, string> = {
    MOVIE: 'MV', EPISODE: 'EP', SERIES: 'SH', SHOW: 'SH', SPORT: 'SH',
  };
  return map[type] || type;
};

const getTypeBadgeStyle = (type: string): string => {
  const abbrev = formatProgramType(type);
  const styles: Record<string, string> = {
    MV: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    SH: 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/30 dark:text-[var(--color-primary-300)]',
    EP: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    ES: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };
  return styles[abbrev] || styles.EP;
};

const getStatusConfig = (status: MappingStatus) => {
  const config: Record<MappingStatus, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
    unmapped: {
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/10 border-l-amber-400',
      icon: <Link2 size={14} />,
      label: 'Unmapped',
    },
    mapped: {
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/10 border-l-green-500',
      icon: <Check size={14} />,
      label: 'Mapped',
    },
    incomplete: {
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/10 border-l-blue-400',
      icon: <Clock size={14} />,
      label: 'Awaiting Provider',
    },
    unmappable: {
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/10 border-l-red-400',
      icon: <AlertTriangle size={14} />,
      label: 'Unmappable',
    },
  };
  return config[status] || config.unmapped;
};

const getSystemBadge = (mapping: ProgramMapping): string => {
  if (!mapping.dmsId) return 'PPV';
  const tbx = mapping.externalRefs?.find(ref => ref.system === 'TBX');
  return tbx ? 'TBX' : 'DMS';
};

const skipMetadataEnrichment = (providerInfo: any[] = []): boolean => {
  const skip = providerInfo.find((p: any) => p.key === 'skipMetadataEnrichment');
  return skip?.value === 'true' || skip?.value === true;
};

const getUnmappableReason = (providerInfo: any[] = []): string => {
  let reason = 'No details provided';
  providerInfo.forEach((pInfo: any) => {
    if (pInfo.key === 'Unmappable.message' && pInfo.value?.reason) {
      reason = pInfo.value.reason;
      if (pInfo.value.detail) {
        reason += ': ' + pInfo.value.detail.join(', ');
      }
    }
  });
  return reason;
};

// ─── Main Component ─────────────────────────────────────────────────

const ProgramMappingPage: React.FC = () => {
  // ── Mapping list state ──
  const [mappings, setMappings] = useState<ProgramMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilters, setTypeFilters] = useState<Record<string, boolean>>({
    MV: true, SH: true, EP: true, ES: true,
  });
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    unmapped: true, mapped: false, incomplete: false, unmappable: false,
  });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<ProgramMapping | null>(null);

  // ── VLS Program search state (right panel) ──
  const [vlsSearchQuery, setVlsSearchQuery] = useState('');
  const [vlsPrograms, setVlsPrograms] = useState<Program[]>([]);
  const [vlsLoading, setVlsLoading] = useState(false);
  const [draggedProgram, setDraggedProgram] = useState<Program | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // ── Compare modal state ──
  const [compareMapping, setCompareMapping] = useState<ProgramMapping | null>(null);

  // ── Confirm modal state ──
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // ── Alert state ──
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vlsSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // ── Close status dropdown on outside click ──
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Auto-dismiss alerts ──
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // ── Fetch mappings ──
  const fetchMappings = useCallback(async (query: string, types: Record<string, boolean>, statuses: Record<string, boolean>, pageNum: number) => {
    setLoading(true);
    const searchData = {
      searchString: query,
      types: Object.entries(types).filter(([, v]) => v).map(([k]) => k),
      status: Object.entries(statuses).filter(([, v]) => v).map(([k]) => k),
    };

    if (searchData.types.length === 0 || searchData.status.length === 0) {
      setMappings([]);
      setTotalElements(0);
      setTotalPages(0);
      setLoading(false);
      return;
    }

    try {
      let result;
      if (isDemoMode()) {
        result = getMockMappings(searchData, pageNum, PAGE_SIZE);
      } else {
        result = await searchProgramMappings(searchData, pageNum, PAGE_SIZE);
      }
      setMappings(result.response || []);
      setTotalElements(result.totalElements || 0);
      setTotalPages(result.totalPages || Math.ceil((result.totalElements || 0) / PAGE_SIZE));
      if (result.response?.length > 0 && !selectedMapping) {
        setSelectedMapping(result.response[0]);
      }
    } catch (err) {
      console.error('Failed to fetch program mappings:', err);
      setMappings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMapping]);

  // ── Initial load ──
  useEffect(() => {
    fetchMappings('', typeFilters, statusFilters, 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Search handler with debounce ──
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(0);
      fetchMappings(value, typeFilters, statusFilters, 0);
    }, SEARCH_DEBOUNCE);
  }, [typeFilters, statusFilters, fetchMappings]);

  // ── Filter change handler ──
  const handleFilterChange = useCallback(() => {
    setPage(0);
    fetchMappings(searchQuery, typeFilters, statusFilters, 0);
  }, [searchQuery, typeFilters, statusFilters, fetchMappings]);

  // ── Pagination ──
  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 0 && newPage < totalPages && !loading) {
      setPage(newPage);
      fetchMappings(searchQuery, typeFilters, statusFilters, newPage);
    }
  }, [totalPages, loading, searchQuery, typeFilters, statusFilters, fetchMappings]);

  // ── VLS Program search ──
  const searchVlsPrograms = useCallback(async (query: string) => {
    if (!query.trim()) {
      setVlsPrograms([]);
      return;
    }
    setVlsLoading(true);
    try {
      const request: ProgramSearchRequest = {
        searchString: query,
        filters: ['MV', 'SH', 'SV', 'SP', 'EP'],
      };
      const response: any = await searchPrograms(request, 0, 15);
      const data = Array.isArray(response) ? response : response.response || [];
      setVlsPrograms(data);
    } catch (err) {
      console.error('VLS program search failed:', err);
      setVlsPrograms([]);
    } finally {
      setVlsLoading(false);
    }
  }, []);

  const handleVlsSearchChange = useCallback((value: string) => {
    setVlsSearchQuery(value);
    if (vlsSearchTimerRef.current) clearTimeout(vlsSearchTimerRef.current);
    vlsSearchTimerRef.current = setTimeout(() => searchVlsPrograms(value), SEARCH_DEBOUNCE);
  }, [searchVlsPrograms]);

  // ── Map a VLS program to a mapping request ──
  const handleMapProgram = useCallback(async (vlsProgram: Program, targetMapping: ProgramMapping) => {
    if (targetMapping.status === 'incomplete') {
      setAlert({ type: 'warning', message: 'Cannot map to a program awaiting provider information.' });
      return;
    }

    try {
      const programId = vlsProgram.programId || vlsProgram.id;
      // Fetch versions to get the published one
      let versionId = programId;
      try {
        const versions: any = await getProgramVersions(programId);
        const masterEntity = versions?.response?.masterEntity || [];
        if (masterEntity.length > 0) {
          const published = masterEntity.find((v: any) => v.published);
          versionId = published ? published.id : masterEntity[0].id;
        }
      } catch {
        // If version fetch fails, use the original ID
      }

      // Fetch program details
      const detail: any = await getProgramByVersion(versionId);
      const program = detail?.response || detail;

      if (!program) {
        setAlert({ type: 'warning', message: 'No active version for this program yet.' });
        return;
      }

      // Update the mapping locally
      setMappings(prev => prev.map(m => {
        if (m.id !== targetMapping.id) return m;
        return {
          ...m,
          status: 'mapped' as MappingStatus,
          programId: program.programId || program.id,
          mappedProgram: {
            ...program,
            releaseYear: program.releaseYear || program.yearOfRelease || (program.origAirDate ? parseInt(program.origAirDate.split('-')[0]) : undefined),
            type: program.programType,
          },
        };
      }));
      setAlert({ type: 'success', message: `Mapped "${getTitleByLang(targetMapping.titles, 'en')}" successfully.` });
    } catch (err) {
      console.error('Mapping failed:', err);
      setAlert({ type: 'error', message: 'Failed to map program. Please try again.' });
    }
  }, []);

  // ── Request provider info ──
  const handleRequestProvider = useCallback((mappingId: string) => {
    setConfirmModal({
      title: 'Request Provider Info',
      message: 'Send this program to Gracenote for metadata enrichment?',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          if (!isDemoMode()) {
            await requestProviderInfo(mappingId);
          }
          setMappings(prev => prev.map(m =>
            m.id === mappingId ? { ...m, status: 'incomplete' as MappingStatus } : m
          ));
          setAlert({ type: 'success', message: 'Provider info requested successfully.' });
        } catch (err: any) {
          setAlert({ type: 'error', message: err?.errors?.[0] || 'Failed to request provider info.' });
        }
      },
    });
  }, []);

  // ── Submit checked mappings ──
  const handleSubmitMappings = useCallback(() => {
    const checked = mappings.filter(m => m.checked);
    if (checked.length === 0) {
      setAlert({ type: 'warning', message: 'Select at least one mapped program to submit.' });
      return;
    }
    setConfirmModal({
      title: 'Submit Mappings',
      message: `Publish ${checked.length} mapping${checked.length > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          if (!isDemoMode()) {
            await mapAndPublish(checked);
          }
          setAlert({ type: 'success', message: `${checked.length} mapping(s) published successfully.` });
          // Refresh
          fetchMappings(searchQuery, typeFilters, statusFilters, page);
        } catch (err) {
          setAlert({ type: 'error', message: 'Failed to publish mappings.' });
        }
      },
    });
  }, [mappings, searchQuery, typeFilters, statusFilters, page, fetchMappings]);

  // ── Toggle check for a mapping ──
  const toggleCheck = useCallback((mappingId: string) => {
    setMappings(prev => prev.map(m =>
      m.id === mappingId ? { ...m, checked: !m.checked } : m
    ));
  }, []);

  // ── Drag handlers ──
  const handleDragStart = useCallback((e: React.DragEvent, program: Program) => {
    setDraggedProgram(program);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', program.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, mappingId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetId(mappingId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTargetId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, mapping: ProgramMapping) => {
    e.preventDefault();
    setDropTargetId(null);
    if (draggedProgram) {
      handleMapProgram(draggedProgram, mapping);
      setDraggedProgram(null);
    }
  }, [draggedProgram, handleMapProgram]);

  const handleDragEnd = useCallback(() => {
    setDraggedProgram(null);
    setDropTargetId(null);
  }, []);

  // ── Get display title for a VLS program ──
  const getVlsTitle = (p: Program): string => {
    return p.englishTitle?.value ||
      p.titles?.find(t => t.lang === 'en')?.value ||
      p.titles?.[0]?.value ||
      'Untitled';
  };

  const checkedCount = mappings.filter(m => m.checked).length;

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="flex h-full bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-900)]">
      {/* ═══════════ LEFT PANEL: Mapping Requests ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
        {/* Header Bar */}
        <div className="page-header-bar px-5 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white">
              Program Mapping
            </h1>
            <div className="text-xs text-[var(--color-neutral-500)]">
              {totalElements > 0
                ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalElements)} of ${totalElements}`
                : 'No records'}
            </div>
          </div>

          {/* Search + Filters */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search mapping requests..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>

            {/* Type Filter Chips */}
            <div className="flex items-center gap-1">
              {TYPE_FILTERS.map(({ abbrev, label, icon: Icon }) => (
                <button
                  key={abbrev}
                  onClick={() => {
                    setTypeFilters(prev => ({ ...prev, [abbrev]: !prev[abbrev] }));
                    setTimeout(handleFilterChange, 0);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    typeFilters[abbrev]
                      ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/30 dark:text-[var(--color-primary-300)]'
                      : 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)] dark:bg-[var(--color-neutral-800)] dark:text-[var(--color-neutral-500)]'
                  }`}
                  title={label}
                >
                  <Icon size={12} />
                  {abbrev}
                </button>
              ))}
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-800)] transition-colors"
              >
                <Filter size={13} />
                Status
                <ChevronDown size={12} className={`transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[var(--color-neutral-800)] rounded-lg shadow-xl border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] py-1 z-20 animate-fade-in">
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-700)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statusFilters[value] || false}
                        onChange={() => {
                          setStatusFilters(prev => ({ ...prev, [value]: !prev[value] }));
                          setTimeout(handleFilterChange, 0);
                        }}
                        className="rounded border-[var(--color-neutral-300)] text-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)]"
                      />
                      <span className="text-xs text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mapping List */}
        <div className="flex-1 overflow-auto">
          {loading && mappings.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
            </div>
          ) : mappings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Link2 size={48} className="text-[var(--color-neutral-300)] mb-3" />
              <h3 className="text-lg font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">
                No mapping requests found
              </h3>
              <p className="text-sm text-[var(--color-neutral-400)] max-w-md">
                Try adjusting your filters or search terms. New requests from the Asset Management system will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-neutral-200)] dark:divide-[var(--color-neutral-700)]">
              {mappings.map((mapping) => {
                const statusCfg = getStatusConfig(mapping.status);
                const isSelected = selectedMapping?.id === mapping.id;
                const isDropTarget = dropTargetId === mapping.id;
                const canDrop = mapping.status !== 'incomplete';
                const showProviderButton = mapping.status === 'unmapped' && !mapping.programId && !skipMetadataEnrichment(mapping.providerInfo);
                const showSkipMessage = skipMetadataEnrichment(mapping.providerInfo);

                return (
                  <div
                    key={mapping.id}
                    onClick={() => setSelectedMapping(mapping)}
                    onDragOver={canDrop ? (e) => handleDragOver(e, mapping.id) : undefined}
                    onDragLeave={handleDragLeave}
                    onDrop={canDrop ? (e) => handleDrop(e, mapping) : undefined}
                    className={`flex border-l-4 transition-all cursor-pointer ${statusCfg.bg} ${
                      isSelected
                        ? 'ring-1 ring-inset ring-[var(--color-primary-400)]'
                        : ''
                    } ${
                      isDropTarget
                        ? 'ring-2 ring-inset ring-[var(--color-accent-400)] bg-[var(--color-accent-50)] dark:bg-[var(--color-accent-900)]/10'
                        : ''
                    }`}
                  >
                    {/* Left Half: AMS Request */}
                    <div className="flex-1 px-4 py-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {/* Episode title if applicable */}
                          {(mapping.type === 'EPISODE' || formatProgramType(mapping.type) === 'EP') && mapping.episodeTitles?.length ? (
                            <div className="text-xs text-[var(--color-neutral-500)] truncate mb-0.5">
                              {getTitleByLang(mapping.episodeTitles, 'es') || getTitleByLang(mapping.episodeTitles, 'en')}
                            </div>
                          ) : null}
                          {/* Main title */}
                          <div className="font-medium text-sm text-[var(--color-neutral-800)] dark:text-white truncate">
                            {getTitleByLang(mapping.titles, 'es') || getTitleByLang(mapping.titles, 'en')}
                            {mapping.releaseYear && (
                              <span className="text-[var(--color-neutral-500)] font-normal"> ({mapping.releaseYear})</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${getTypeBadgeStyle(mapping.type)}`}>
                            {formatProgramType(mapping.type)}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-700)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                            {getSystemBadge(mapping)}
                          </span>
                        </div>
                      </div>

                      {/* Metadata row */}
                      <div className="flex items-center gap-2 mt-1">
                        {mapping.seasonNumber && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-700)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                            S{mapping.seasonNumber}
                          </span>
                        )}
                        {mapping.episodeNumber && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-700)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                            E{mapping.episodeNumber}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${statusCfg.color}`}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[var(--color-neutral-500)] truncate mt-1">
                        {getFirstDescription(mapping.descriptions)}
                      </p>

                      {/* IDs */}
                      <div className="text-[10px] text-[var(--color-neutral-400)] font-mono mt-1">
                        {mapping.mapperId && `ID: ${mapping.mapperId}`}
                        {mapping.dmsId && ` | DMS: ${mapping.dmsId}`}
                      </div>
                    </div>

                    {/* Right Half: Mapped Program / Status */}
                    <div className="w-[45%] flex-shrink-0 px-4 py-3 border-l border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white/50 dark:bg-[var(--color-neutral-800)]/30">
                      {mapping.mappedProgram && !mapping.published ? (
                        // Mapped program display
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm text-[var(--color-neutral-800)] dark:text-white truncate">
                                {getTitleByLang(mapping.mappedProgram.titles, 'es') || getTitleByLang(mapping.mappedProgram.titles, 'en')}
                                {mapping.mappedProgram.releaseYear && (
                                  <span className="text-[var(--color-neutral-500)] font-normal"> ({mapping.mappedProgram.releaseYear})</span>
                                )}
                              </div>
                              <p className="text-xs text-[var(--color-neutral-500)] truncate mt-0.5">
                                {getFirstDescription(mapping.mappedProgram.descriptions)}
                              </p>
                              {mapping.programId && (
                                <div className="text-[10px] text-[var(--color-neutral-400)] font-mono mt-1">
                                  Program: {mapping.programId}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); setCompareMapping(mapping); }}
                                className="p-1 rounded hover:bg-[var(--color-neutral-200)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-500)] transition-colors"
                                title="Compare details"
                              >
                                <Eye size={14} />
                              </button>
                              <input
                                type="checkbox"
                                checked={mapping.checked || false}
                                onChange={(e) => { e.stopPropagation(); toggleCheck(mapping.id); }}
                                className="w-4 h-4 rounded border-[var(--color-neutral-300)] text-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)]"
                                title="Select for submission"
                              />
                            </div>
                          </div>
                        </div>
                      ) : mapping.status === 'incomplete' ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Clock size={20} className="mx-auto text-blue-400 mb-1" />
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Awaiting Provider Information</p>
                          </div>
                        </div>
                      ) : mapping.status === 'unmappable' ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center px-2">
                            <AlertTriangle size={20} className="mx-auto text-red-400 mb-1" />
                            <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Unmappable from Gracenote</p>
                            <p className="text-[10px] text-[var(--color-neutral-500)]">{getUnmappableReason(mapping.providerInfo)}</p>
                          </div>
                        </div>
                      ) : showSkipMessage ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-xs font-medium text-[var(--color-neutral-500)]">Gracenote metadata enhancement restricted</p>
                        </div>
                      ) : (
                        // Unmapped — drop zone + provider button
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                          <div className={`w-full h-full min-h-[48px] rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${
                            isDropTarget
                              ? 'border-[var(--color-accent-400)] bg-[var(--color-accent-50)] dark:bg-[var(--color-accent-900)]/10'
                              : 'border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)]'
                          }`}>
                            <span className="text-xs text-[var(--color-neutral-400)]">
                              {isDropTarget ? 'Drop here to map' : 'Drag a program here'}
                            </span>
                          </div>
                          {showProviderButton && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRequestProvider(mapping.id); }}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-900)]/20 rounded transition-colors"
                            >
                              <Send size={12} />
                              Request Provider Info
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: Actions + Pagination */}
        <div className="bg-white dark:bg-[var(--color-neutral-800)] border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {checkedCount > 0 && (
              <span className="text-xs text-[var(--color-neutral-500)]">{checkedCount} selected</span>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 0 || loading}
                className="px-3 py-1.5 text-xs font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs text-[var(--color-neutral-500)]">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages - 1 || loading}
                className="px-3 py-1.5 text-xs font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}

          <button
            onClick={handleSubmitMappings}
            disabled={checkedCount === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight size={14} />
            Save & Publish
          </button>
        </div>
      </div>

      {/* ═══════════ RIGHT PANEL: VLS Program Search ═══════════ */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-white dark:bg-[var(--color-neutral-800)]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
          <h2 className="text-sm font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
            VLS Program Library
          </h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" />
            <input
              type="text"
              value={vlsSearchQuery}
              onChange={(e) => handleVlsSearchChange(e.target.value)}
              placeholder="Search VLS programs..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>
        </div>

        {/* Program List */}
        <div className="flex-1 overflow-auto">
          {vlsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-[var(--color-neutral-400)]" />
            </div>
          ) : vlsPrograms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Film size={32} className="text-[var(--color-neutral-300)] mb-2" />
              <p className="text-xs text-[var(--color-neutral-500)]">
                {vlsSearchQuery
                  ? 'No programs found. Try a different search.'
                  : 'Search for VLS programs to map them.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-neutral-100)] dark:divide-[var(--color-neutral-700)]">
              {vlsPrograms.map((program) => (
                <div
                  key={program.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, program)}
                  onDragEnd={handleDragEnd}
                  className="px-4 py-2.5 hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-700)] cursor-grab active:cursor-grabbing transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical size={14} className="text-[var(--color-neutral-300)] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          program.programType === 'MV' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          program.programType === 'SH' ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/30 dark:text-[var(--color-primary-300)]' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {PROGRAM_TYPE_NAMES[program.programType] || program.programType}
                        </span>
                        {program.published && (
                          <span className="px-1 py-0.5 rounded text-[9px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            PUB
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-sm text-[var(--color-neutral-800)] dark:text-white truncate mt-0.5">
                        {getVlsTitle(program)}
                      </div>
                      <div className="text-[10px] text-[var(--color-neutral-400)] font-mono mt-0.5 truncate">
                        {program.programId || program.id}
                        {program.releaseYear && ` | ${program.releaseYear}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tip */}
        <div className="px-4 py-3 border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-900)]">
          <p className="text-[10px] text-[var(--color-neutral-400)] leading-relaxed">
            Drag a program from this list and drop it onto an unmapped request on the left to create a mapping.
          </p>
        </div>
      </div>

      {/* ═══════════ COMPARE MODAL ═══════════ */}
      {compareMapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setCompareMapping(null)}>
          <div
            className="bg-white dark:bg-[var(--color-neutral-800)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
              <h3 className="text-base font-semibold text-[var(--color-neutral-800)] dark:text-white">
                Program Comparison
              </h3>
              <button
                onClick={() => setCompareMapping(null)}
                className="p-1 rounded hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-500)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-auto max-h-[calc(80vh-120px)] px-6 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-[var(--color-neutral-500)] w-1/4">Field</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-amber-600 w-[37.5%]">
                      VOD Title ({compareMapping.id})
                    </th>
                    <th className="text-left py-2 text-xs font-semibold text-green-600 w-[37.5%]">
                      VLS ({compareMapping.programId || '—'})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-neutral-100)] dark:divide-[var(--color-neutral-700)]">
                  {/* English Title */}
                  <tr>
                    <td className="py-2 pr-4 text-xs text-[var(--color-neutral-500)]">English Title</td>
                    <td className="py-2 pr-4 text-xs text-[var(--color-neutral-800)] dark:text-white">
                      {getTitleByLang(compareMapping.titles, 'en')}
                    </td>
                    <td className="py-2 text-xs text-[var(--color-neutral-800)] dark:text-white">
                      {compareMapping.mappedProgram ? getTitleByLang(compareMapping.mappedProgram.titles, 'en') : '—'}
                    </td>
                  </tr>
                  {/* Spanish Title */}
                  <tr>
                    <td className="py-2 pr-4 text-xs text-[var(--color-neutral-500)]">Spanish Title</td>
                    <td className="py-2 pr-4 text-xs text-[var(--color-neutral-800)] dark:text-white">
                      {getTitleByLang(compareMapping.titles, 'es')}
                    </td>
                    <td className="py-2 text-xs text-[var(--color-neutral-800)] dark:text-white">
                      {compareMapping.mappedProgram ? getTitleByLang(compareMapping.mappedProgram.titles, 'es') : '—'}
                    </td>
                  </tr>
                  {/* Type */}
                  <tr>
                    <td className="py-2 pr-4 text-xs text-[var(--color-neutral-500)]">Program Type</td>
                    <td className="py-2 pr-4 text-xs text-[var(--color-neutral-800)] dark:text-white">{compareMapping.type}</td>
                    <td className="py-2 text-xs text-[var(--color-neutral-800)] dark:text-white">
                      {compareMapping.mappedProgram?.programType || '—'}
                    </td>
                  </tr>
                  {/* Year */}
                  <tr>
                    <td className="py-2 pr-4 text-xs text-[var(--color-neutral-500)]">Year</td>
                    <td className="py-2 pr-4 text-xs text-[var(--color-neutral-800)] dark:text-white">{compareMapping.releaseYear || '—'}</td>
                    <td className="py-2 text-xs text-[var(--color-neutral-800)] dark:text-white">
                      {compareMapping.mappedProgram?.releaseYear || '—'}
                    </td>
                  </tr>
                  {/* Season */}
                  {(compareMapping.seasonNumber || compareMapping.mappedProgram?.seasonNumber) && (
                    <tr>
                      <td className="py-2 pr-4 text-xs text-[var(--color-neutral-500)]">Season</td>
                      <td className="py-2 pr-4 text-xs text-[var(--color-neutral-800)] dark:text-white">{compareMapping.seasonNumber || '—'}</td>
                      <td className="py-2 text-xs text-[var(--color-neutral-800)] dark:text-white">
                        {compareMapping.mappedProgram?.seasonNumber || '—'}
                      </td>
                    </tr>
                  )}
                  {/* Episode */}
                  {(compareMapping.episodeNumber || compareMapping.mappedProgram?.episodeNumber) && (
                    <tr>
                      <td className="py-2 pr-4 text-xs text-[var(--color-neutral-500)]">Episode</td>
                      <td className="py-2 pr-4 text-xs text-[var(--color-neutral-800)] dark:text-white">{compareMapping.episodeNumber || '—'}</td>
                      <td className="py-2 text-xs text-[var(--color-neutral-800)] dark:text-white">
                        {compareMapping.mappedProgram?.episodeNumber || '—'}
                      </td>
                    </tr>
                  )}
                  {/* English Description */}
                  <tr>
                    <td className="py-2 pr-4 text-xs text-[var(--color-neutral-500)]">English Description</td>
                    <td className="py-2 pr-4 text-xs text-[var(--color-neutral-800)] dark:text-white">
                      {getTitleByLang(compareMapping.descriptions, 'en')}
                    </td>
                    <td className="py-2 text-xs text-[var(--color-neutral-800)] dark:text-white">
                      {compareMapping.mappedProgram ? getTitleByLang(compareMapping.mappedProgram.descriptions, 'en') : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
              <button
                onClick={() => setCompareMapping(null)}
                className="px-3 py-1.5 text-sm text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  toggleCheck(compareMapping.id);
                  setCompareMapping(null);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded-lg transition-colors"
              >
                <Check size={14} />
                Confirm Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ CONFIRM MODAL ═══════════ */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmModal(null)}>
          <div
            className="bg-white dark:bg-[var(--color-neutral-800)] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4">
              <h3 className="text-base font-semibold text-[var(--color-neutral-800)] dark:text-white mb-2">
                {confirmModal.title}
              </h3>
              <p className="text-sm text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-3 py-1.5 text-sm text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ ALERT TOAST ═══════════ */}
      {alert && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-fade-in ${
          alert.type === 'success' ? 'bg-green-600 text-white' :
          alert.type === 'error' ? 'bg-red-600 text-white' :
          'bg-amber-500 text-white'
        }`}>
          {alert.type === 'success' ? <Check size={16} /> :
           alert.type === 'error' ? <X size={16} /> :
           <AlertTriangle size={16} />}
          {alert.message}
          <button onClick={() => setAlert(null)} className="ml-2 hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProgramMappingPage;
