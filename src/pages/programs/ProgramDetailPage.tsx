/**
 * @file ProgramDetailPage.tsx
 * @description Main program detail/edit page with full API integration
 * @author VLS Team
 * @date 2026-02-17
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Save,
  Lock,
  Unlock,
  Send,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  getProgramByVersion,
  getProgramVersions,
  getProgramImages,
  updateProgram,
  updateContentLock,
} from '../../services/program.service';
import { useAuth } from '../../context/AuthContext';
import type { Program } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Import tab components
import ProgramBasicInfoTab from './tabs/ProgramBasicInfoTab';
import ProgramImagesTab from './tabs/ProgramImagesTab';
import ProgramCastCrewTab from './tabs/ProgramCastCrewTab';
import ProgramMetadataTab from './tabs/ProgramMetadataTab';
import ProgramEpisodesTab from './tabs/ProgramEpisodesTab';

type TabType = 'details' | 'episodes' | 'images' | 'cast' | 'metadata';

const VERSIONS_PER_PAGE = 10;
const GN_VERSIONS_PER_PAGE = 10;

/** Extract base program ID (without version suffix) from a full ID */
const getBaseId = (id: string): string => {
  if (id && id.length > 14 && /^[A-Z]{2}/.test(id)) {
    return id.substring(0, 14);
  }
  return id;
};

/** Extract TMS ID from a Gracenote version's externalRefs or id field */
const getGnTmsId = (version: any): string => {
  // Check externalRefs for tmsId
  if (version.externalRefs) {
    const tmsRef = (Array.isArray(version.externalRefs) ? version.externalRefs : [])
      .find((r: any) => r.refName === 'tmsId');
    if (tmsRef?.id) return tmsRef.id;
  }
  // The version.id itself is often the TMS ID for Gracenote
  return version.tmsId || version.id || '';
};

/** Extract version/update identifier from a Gracenote version */
const getGnVersionLabel = (version: any): string => {
  if (version.version != null) return `v${version.version}`;
  // Try to extract version from ID (last 3 digits)
  const id = version.id || '';
  if (id.length > 14) {
    const suffix = id.substring(14);
    if (suffix) return `v${parseInt(suffix) || suffix}`;
  }
  return '';
};

const ProgramDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { hasRight } = useAuth();

  // Detect where the user came from for generalized back-navigation
  const cameFromSchedule = (location.state as any)?.from === 'schedule';
  const returnPath = (location.state as any)?.returnPath;

  // State
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [editedProgram, setEditedProgram] = useState<Partial<Program> | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [versionPage, setVersionPage] = useState(0);
  const [gnVersionPage, setGnVersionPage] = useState(0);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);

  // Permissions
  const canEdit = hasRight('program.write');
  const canPublish = hasRight('program.publish');
  const canLock = hasRight('program.lock');

  // Base program ID for display (never the versioned one)
  const baseId = id ? getBaseId(id) : '';

  // Step 1: Fetch version list
  const { data: versionsResponse, isLoading: versionsLoading } = useQuery({
    queryKey: ['program-versions', id],
    queryFn: () => getProgramVersions(id!),
    enabled: !!id && id !== 'new',
  });

  const versions = versionsResponse as unknown as any;
  const masterEntityVersions = versions?.response?.masterEntity || [];
  const gracenoteVersions = versions?.response?.gracenote || [];

  // Sort versions: published first, then reverse by version number
  const sortedMasterVersions = useMemo(() => {
    const sorted = [...masterEntityVersions];
    sorted.sort((a: any, b: any) => {
      // Published versions always on top
      if (a.published && !b.published) return -1;
      if (!a.published && b.published) return 1;
      // Then reverse order (newest first)
      return (b.version || 0) - (a.version || 0);
    });
    return sorted;
  }, [masterEntityVersions]);

  // Pagination for master entity versions
  const totalVersionPages = Math.ceil(sortedMasterVersions.length / VERSIONS_PER_PAGE);
  const paginatedVersions = sortedMasterVersions.slice(
    versionPage * VERSIONS_PER_PAGE,
    (versionPage + 1) * VERSIONS_PER_PAGE
  );

  // Pagination for Gracenote versions
  const totalGnPages = Math.ceil(gracenoteVersions.length / GN_VERSIONS_PER_PAGE);
  const paginatedGnVersions = gracenoteVersions.slice(
    gnVersionPage * GN_VERSIONS_PER_PAGE,
    (gnVersionPage + 1) * GN_VERSIONS_PER_PAGE
  );

  // Find the published version (default selection)
  const publishedVersion = masterEntityVersions.find((v: any) => v.published === true);
  const versionIdToLoad = selectedVersionId || publishedVersion?.id;

  // Step 2: Fetch program details
  const {
    data: programResponse,
    isLoading: programLoading,
    error,
  } = useQuery({
    queryKey: ['program', versionIdToLoad],
    queryFn: () => getProgramByVersion(versionIdToLoad!, 'masterentity'),
    enabled: !!versionIdToLoad,
  });

  const program = programResponse as unknown as Program | undefined;
  const isLoading = versionsLoading || programLoading;

  // Determine if this is a series type (show Episodes tab)
  // Check both programType AND ID prefix — the ID always starts with SH for series, SP for sports
  const isSeries = useMemo(() => {
    if (program?.programType === 'SH' || program?.programType === 'SP') return true;
    // Also check ID prefix as fallback
    const pid = program?.id || id || '';
    return pid.startsWith('SH') || pid.startsWith('SP');
  }, [program?.programType, program?.id, id]);

  // Determine if this is an episode (show "Back to Series" link)
  const isEpisode = useMemo(() => {
    if (program?.programType === 'EP' || program?.programType === 'SE') return true;
    const pid = program?.id || id || '';
    return pid.startsWith('EP');
  }, [program?.programType, program?.id, id]);

  const parentSeriesId = program?.seriesId || program?.parentProgramId || '';

  // Fetch hero image for background
  useEffect(() => {
    if (!id) return;
    // Try to get from program pictures first
    if (program?.pictures) {
      const pic = program.pictures['16:9'] || program.pictures['4:3'] || Object.values(program.pictures)[0];
      if (pic) { setHeroImageUrl(pic); return; }
    }
    // Try from program images
    if (program?.images && program.images.length > 0) {
      const img = program.images.find(i => i.ratio === '16:9') || program.images[0];
      const url = img?.imageURL || (img?.baseUrl && img?.uri ? `${img.baseUrl}${img.uri}` : img?.uri);
      if (url) { setHeroImageUrl(url); return; }
    }
    // Fallback: fetch from images API
    getProgramImages(baseId)
      .then((response: any) => {
        const imgs = response?.response || response || [];
        if (Array.isArray(imgs) && imgs.length > 0) {
          const img = imgs.find((i: any) => i.ratio === '16:9') || imgs[0];
          const url = img?.imageURL || (img?.baseUrl && img?.uri ? `${img.baseUrl}${img.uri}` : img?.uri);
          if (url) setHeroImageUrl(url);
        }
      })
      .catch(() => {}); // Silently fail
  }, [id, baseId, program?.pictures, program?.images]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (updatedProgram: Partial<Program>) => updateProgram(id!, updatedProgram),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', id] });
      queryClient.invalidateQueries({ queryKey: ['program-versions'] });
      setHasUnsavedChanges(false);
    },
  });

  const lockMutation = useMutation({
    mutationFn: (locked: boolean) => updateContentLock(id!, { contentLock: locked }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', id] });
    },
  });

  // Reset state when navigating to a different program (e.g., episode -> series)
  useEffect(() => {
    setEditedProgram(null);
    setHasUnsavedChanges(false);
    setSelectedVersionId(null);
    setVersionPage(0);
    setGnVersionPage(0);
    setHeroImageUrl(null);
    setActiveTab('details');
  }, [id]);

  // Initialize edited program when data loads or changes
  useEffect(() => {
    if (program) {
      // Only update if the program ID matches what we're trying to load
      const currentEditId = editedProgram?.id || editedProgram?._id;
      const newProgramId = program.id || program._id;
      if (!currentEditId || currentEditId !== newProgramId) {
        setEditedProgram(program);
      }
    }
  }, [program]);

  const handleFieldChange = (field: string, value: any) => {
    if (!canEdit) return;
    setEditedProgram((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!editedProgram || !canEdit) return;
    updateMutation.mutate(editedProgram);
  };

  const handlePublish = () => {
    if (!canPublish) return;
    updateMutation.mutate({ ...editedProgram, published: true });
  };

  const handleLockToggle = () => {
    if (!canLock || !program) return;
    lockMutation.mutate(!program.contentLock);
  };

  const handleClose = () => {
    const goBack = () => {
      // Use an explicit return path when provided; otherwise go to Programs list.
      if (returnPath) {
        navigate(returnPath);
      } else {
        navigate('/programs');
      }
    };

    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        goBack();
      }
    } else {
      goBack();
    }
  };

  // Build tab list (conditionally include Episodes for series)
  const tabs = useMemo(() => {
    const list: { id: TabType; label: string }[] = [
      { id: 'details', label: 'Details' },
    ];
    if (isSeries) {
      list.push({ id: 'episodes', label: 'Episodes' });
    }
    list.push(
      { id: 'images', label: 'Images' },
      { id: 'cast', label: 'Cast & Crew' },
      { id: 'metadata', label: 'Metadata' },
    );
    return list;
  }, [isSeries]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
          Failed to load program
        </h2>
        <p className="text-[var(--color-neutral-500)] mb-4">
          {(error as Error).message || 'An error occurred'}
        </p>
        <button
          onClick={() => navigate('/programs')}
          className="px-4 py-2 bg-[var(--color-primary-600)] text-white rounded-lg hover:bg-[var(--color-primary-700)]"
        >
          Back to Programs
        </button>
      </div>
    );
  }

  if (!program || !editedProgram) {
    return null;
  }

  const displayTitle =
    program.titles?.find((t) => t.lang === 'en')?.value ||
    program.titles?.[0]?.value ||
    'Untitled Program';

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50">
      <div className="flex-1 flex flex-col bg-white dark:bg-[var(--color-neutral-900)] m-4 rounded-lg shadow-2xl overflow-hidden">
        {/* Header with optional background image */}
        <div className="relative">
          {/* Background image — more pronounced */}
          {heroImageUrl && (
            <div className="absolute inset-0 overflow-hidden rounded-t-lg">
              <img
                src={heroImageUrl}
                alt=""
                className="w-full h-full object-cover opacity-[0.18] dark:opacity-[0.14]"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white dark:from-[var(--color-neutral-900)]/40 dark:via-transparent dark:to-[var(--color-neutral-900)]" />
            </div>
          )}

          <div className="relative flex items-center justify-between px-6 py-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {/* Small thumbnail */}
              {heroImageUrl && (
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] flex-shrink-0 bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)]">
                  <img
                    src={heroImageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="min-w-0">
                {/* Contextual back breadcrumb */}
                {cameFromSchedule ? (
                  <button
                    onClick={handleClose}
                    className="flex items-center gap-1 text-xs text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] mb-0.5 transition-colors"
                  >
                    <ChevronLeft size={12} />
                    <span>Back to Schedule</span>
                  </button>
                ) : isEpisode && parentSeriesId ? (
                  <button
                    onClick={() => navigate(`/programs/${parentSeriesId}`)}
                    className="flex items-center gap-1 text-xs text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] mb-0.5 transition-colors"
                  >
                    <ChevronLeft size={12} />
                    <span>Back to Series</span>
                    <span className="font-mono text-[var(--color-neutral-400)]">({parentSeriesId})</span>
                  </button>
                ) : null}
                <h1 className="text-xl font-bold text-[var(--color-neutral-800)] dark:text-white truncate">
                  {displayTitle}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {program.programType}
                  </span>
                  {program.published && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Published
                    </span>
                  )}
                  {program.contentLock && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Locked
                    </span>
                  )}
                  <span className="text-xs text-[var(--color-neutral-500)]">
                    v{program.version || 1}
                  </span>
                  {/* Show base program ID only (not versioned) */}
                  <span className="text-xs font-mono text-[var(--color-neutral-400)]">
                    {baseId}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle size={16} />
                  Unsaved
                </span>
              )}

              <button
                onClick={handleSave}
                disabled={!canEdit || !hasUnsavedChanges || updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>

              {canPublish && (
                <button
                  onClick={handlePublish}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send size={16} />
                  Publish
                </button>
              )}

              {canLock && (
                <button
                  onClick={handleLockToggle}
                  disabled={lockMutation.isPending}
                  className="p-2 text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-800)] rounded-lg transition-colors"
                  title={program.contentLock ? 'Unlock' : 'Lock'}
                >
                  {program.contentLock ? <Lock size={20} /> : <Unlock size={20} />}
                </button>
              )}

              <button
                onClick={handleClose}
                className="p-2 text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-800)] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 min-h-0">
          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Tabs */}
            <div className="flex gap-1 px-6 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[var(--color-primary-600)] text-[var(--color-primary-600)]'
                      : 'border-transparent text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-800)] dark:hover:text-[var(--color-neutral-200)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-6">
              {activeTab === 'details' && (
                <ProgramBasicInfoTab
                  program={editedProgram}
                  onChange={handleFieldChange}
                  readOnly={!canEdit}
                />
              )}
              {activeTab === 'episodes' && isSeries && (
                <ProgramEpisodesTab program={editedProgram} />
              )}
              {activeTab === 'images' && (
                <ProgramImagesTab
                  program={editedProgram}
                  onChange={handleFieldChange}
                  readOnly={!canEdit}
                />
              )}
              {activeTab === 'cast' && (
                <ProgramCastCrewTab
                  program={editedProgram}
                  onChange={handleFieldChange}
                  readOnly={!canEdit}
                />
              )}
              {activeTab === 'metadata' && (
                <ProgramMetadataTab
                  program={editedProgram}
                  onChange={handleFieldChange}
                  readOnly={!canEdit}
                />
              )}
            </div>
          </div>

          {/* Version History Sidebar — always visible */}
          <div className="w-56 border-l border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-800)] flex flex-col">
            <div className="p-3 flex-1 overflow-auto">
              <h3 className="text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-3 uppercase tracking-wider">
                Versions
              </h3>

              {/* Master Entity Versions */}
              {sortedMasterVersions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-[10px] font-semibold text-[var(--color-neutral-500)] dark:text-[var(--color-neutral-400)] mb-1.5 uppercase">
                    Master Entity ({sortedMasterVersions.length})
                  </h4>
                  <div className="space-y-1">
                    {paginatedVersions.map((version: any) => (
                      <button
                        key={version.id}
                        onClick={() => {
                          setSelectedVersionId(version.id);
                          setEditedProgram(null); // Reset to force reload
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md border transition-colors ${
                          version.id === versionIdToLoad
                            ? 'border-[var(--color-primary-400)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/10'
                            : 'border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)] hover:border-[var(--color-primary-300)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                              v{version.version}
                            </span>
                            {version.published && (
                              <span className="px-1 py-0 text-[9px] font-semibold rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                PUB
                              </span>
                            )}
                            {version.contentLock && (
                              <Lock size={10} className="text-amber-500" />
                            )}
                          </div>
                          <span className="text-[10px] text-[var(--color-neutral-400)]">
                            {version.updatedDate ? new Date(version.updatedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalVersionPages > 1 && (
                    <div className="flex items-center justify-between mt-2 px-1">
                      <button
                        onClick={() => setVersionPage(p => Math.max(0, p - 1))}
                        disabled={versionPage === 0}
                        className="p-0.5 text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-[10px] text-[var(--color-neutral-500)]">
                        {versionPage + 1}/{totalVersionPages}
                      </span>
                      <button
                        onClick={() => setVersionPage(p => Math.min(totalVersionPages - 1, p + 1))}
                        disabled={versionPage >= totalVersionPages - 1}
                        className="p-0.5 text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Gracenote Versions — with pagination and TMS ID */}
              {gracenoteVersions.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-semibold text-[var(--color-neutral-500)] dark:text-[var(--color-neutral-400)] mb-1.5 uppercase">
                    Gracenote / TMS ({gracenoteVersions.length})
                  </h4>
                  <div className="space-y-1">
                    {paginatedGnVersions.map((version: any) => {
                      const tmsId = getGnTmsId(version);
                      const vLabel = getGnVersionLabel(version);
                      return (
                        <div
                          key={version.id}
                          className="px-2.5 py-1.5 rounded-md border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1 py-0 text-[9px] font-semibold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                TMS
                              </span>
                              <span className="text-xs font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] truncate max-w-[100px]" title={tmsId}>
                                {tmsId.length > 16 ? `...${tmsId.slice(-14)}` : tmsId}
                              </span>
                            </div>
                            {vLabel && (
                              <span className="text-[10px] text-[var(--color-neutral-500)]">
                                {vLabel}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--color-neutral-400)] mt-0.5 flex items-center gap-1.5">
                            {version.language && <span>{version.language}</span>}
                            {version.updatedDate && (
                              <span>{new Date(version.updatedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Gracenote Pagination */}
                  {totalGnPages > 1 && (
                    <div className="flex items-center justify-between mt-2 px-1">
                      <button
                        onClick={() => setGnVersionPage(p => Math.max(0, p - 1))}
                        disabled={gnVersionPage === 0}
                        className="p-0.5 text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-[10px] text-[var(--color-neutral-500)]">
                        {gnVersionPage + 1}/{totalGnPages}
                      </span>
                      <button
                        onClick={() => setGnVersionPage(p => Math.min(totalGnPages - 1, p + 1))}
                        disabled={gnVersionPage >= totalGnPages - 1}
                        className="p-0.5 text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {sortedMasterVersions.length === 0 && gracenoteVersions.length === 0 && (
                <div className="text-xs text-[var(--color-neutral-500)] text-center py-4">
                  No version history
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramDetailPage;
