/**
 * @file AssetsPage.tsx
 * @description Asset Management page with collapsible right-side search/filter panel,
 *   enriched asset rows (image, channels, service category via detail API), and pagination.
 * @author VLS Team
 * @date 2026-02-20
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Film,
  Filter,
  GripVertical,
  Image as ImageIcon,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  getAmountAssetMapped,
  getAssetChannels,
  getAssetDetail,
  getServiceCategories,
  searchAssets,
} from '../../services/asset.service';
import { searchChannels } from '../../services/channel.service';
import { getProgramImages } from '../../services/program.service';
import type {
  AmountAssetMapped,
  AssetDetail,
  AssetFilterOption,
  AssetListItem,
  AssetSearchResponseEnvelope,
} from '../../types/asset.types';
import type { ProgramImage } from '../../types';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 500;

type FilterMode = 'service' | 'channel';
type AssetColumnKey = 'image' | 'title' | 'programId' | 'assetId' | 'channel' | 'serviceCategory' | 'type' | 'status' | 'seasonEpisode';
type ReorderableAssetColumnKey = AssetColumnKey;

const ASSET_COLUMNS_STORAGE_KEY = 'assets:columnOrder:v1';
const DEFAULT_ASSET_COLUMNS: ReorderableAssetColumnKey[] = [
  'image',
  'title',
  'programId',
  'assetId',
  'channel',
  'serviceCategory',
  'type',
  'status',
  'seasonEpisode',
];
const ASSET_COLUMN_META: Record<AssetColumnKey, { label: string; width: string; cellClassName?: string }> = {
  image: { label: '', width: '40px' },
  title: { label: 'Title', width: '2.5fr' },
  programId: { label: 'Program Id', width: '1.5fr', cellClassName: 'text-xs font-mono text-[var(--color-neutral-500)] truncate' },
  assetId: { label: 'Asset Id', width: '1.5fr', cellClassName: 'text-xs font-mono text-[var(--color-neutral-500)] truncate' },
  channel: { label: 'Channel', width: '1.5fr', cellClassName: 'text-xs text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] truncate' },
  serviceCategory: { label: 'Service Category', width: '1.5fr', cellClassName: 'text-xs text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] truncate' },
  type: { label: 'Type', width: '0.8fr' },
  status: { label: 'Status', width: '0.8fr' },
  seasonEpisode: { label: 'S / E', width: '1fr' },
};

const loadStoredAssetColumns = (): ReorderableAssetColumnKey[] => {
  try {
    const raw = localStorage.getItem(ASSET_COLUMNS_STORAGE_KEY);
    if (!raw) return DEFAULT_ASSET_COLUMNS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_ASSET_COLUMNS;
    const valid = parsed.filter((k): k is ReorderableAssetColumnKey =>
      typeof k === 'string' && DEFAULT_ASSET_COLUMNS.includes(k as ReorderableAssetColumnKey)
    );
    if (valid.length !== DEFAULT_ASSET_COLUMNS.length) return DEFAULT_ASSET_COLUMNS;
    if (new Set(valid).size !== DEFAULT_ASSET_COLUMNS.length) return DEFAULT_ASSET_COLUMNS;
    return valid;
  } catch {
    return DEFAULT_ASSET_COLUMNS;
  }
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const formatProgramType = (programId?: string): string => {
  const prefix = (programId || '').slice(0, 2).toUpperCase();
  if (prefix === 'MV') return 'Movie';
  if (prefix === 'SH') return 'Series';
  if (prefix === 'EP') return 'Episode';
  if (prefix === 'SP') return 'Sport';
  if (prefix === 'SE') return 'Sport Episode';
  return prefix || 'N/A';
};

const isPublishedAsset = (asset: AssetListItem): boolean => {
  const values = [
    (asset as unknown as Record<string, unknown>).published,
    (asset as unknown as Record<string, unknown>).isPublished,
    (asset as unknown as Record<string, unknown>).pubStatus,
    (asset as unknown as Record<string, unknown>).status,
    (asset as unknown as Record<string, unknown>).publicationStatus,
    (asset as unknown as Record<string, unknown>).publish,
    (asset as unknown as Record<string, unknown>).pub,
  ];

  for (const raw of values) {
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'number') return raw === 1;
    if (typeof raw === 'string') {
      const value = raw.trim().toLowerCase();
      if (value === 'unpublished' || value === 'unpublish' || value === 'false' || value === '0' || value === 'no') return false;
      if (value === 'published' || value === 'publish' || value === 'true' || value === '1' || value === 'yes') return true;
    }
  }
  return false;
};

const normalizeSearchResponse = (
  raw: AssetSearchResponseEnvelope | null
): { items: AssetListItem[]; total: number; pages: number } => {
  if (!raw) return { items: [], total: 0, pages: 1 };
  const items = raw.response || raw.data || raw.content || [];
  const total = raw.totalElements ?? raw.total ?? items.length;
  const pages = raw.totalPages ?? raw.pages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));
  return { items, total, pages };
};

const extractArrayPayload = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  const asRecord = raw as Record<string, unknown>;
  for (const key of ['response', 'data', 'content', 'items', 'results']) {
    const extracted = extractArrayPayload(asRecord[key]);
    if (extracted.length > 0) return extracted;
  }
  return [];
};

const normalizeFilterOptions = (raw: unknown): AssetFilterOption[] => {
  const list = extractArrayPayload(raw);
  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const r = item as Record<string, unknown>;
      const id = (r.id as string) || (r._id as string) || (r.providerID as string) || (r.providerId as string) || (r.value as string) || '';
      const name = (r.name as string) || (r.label as string) || (r.title as string) || (r.value as string) || id;
      if (!id && !name) return null;
      return { id: id || name, name };
    })
    .filter((item): item is AssetFilterOption => !!item);
};

const isOttVodOrHybridChannel = (channel: AssetFilterOption & Record<string, unknown>): boolean => {
  const platform = [channel.channelTarget, channel.platform, channel.target, channel.channelSrc]
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.toUpperCase());
  const type = [channel.channelType, channel.type, channel.chanType, channel.serviceType]
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.toUpperCase());
  const isOtt = platform.includes('OTT');
  const isVodOrHybrid = type.includes('VOD') || type.includes('HYBRID');
  return isOtt && isVodOrHybrid;
};

/** Extract first usable image URL from ProgramImage array. */
const extractThumbnailUrl = (images: ProgramImage[]): string | null => {
  if (!images?.length) return null;
  const img = images.find(i => i.ratio === '16:9') || images.find(i => i.ratio === '4:3') || images[0];
  const rec = img as unknown as Record<string, unknown>;
  if (rec.imageURL) return String(rec.imageURL);
  if (rec.baseUrl && rec.uri) return `${rec.baseUrl}${rec.uri}`;
  if (rec.uri) return String(rec.uri);
  return null;
};

/* ------------------------------------------------------------------ */
/*  Enrichment types                                                  */
/* ------------------------------------------------------------------ */

interface EnrichedData {
  channels?: string[];
  serviceCategory?: string;
  serviceProvider?: string;
  thumbnailUrl?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

const AssetsPage: React.FC = () => {
  const { hasRight } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const incomingChannelId = (location.state as any)?.channelId as string | undefined;

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>(incomingChannelId ? 'channel' : 'service');
  const [selectedServiceCategoryId, setSelectedServiceCategoryId] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState(incomingChannelId ?? '');
  const [mvEnabled, setMvEnabled] = useState(true);
  const [shEnabled, setShEnabled] = useState(true);
  const [epEnabled, setEpEnabled] = useState(true);
  const [publishedEnabled, setPublishedEnabled] = useState(true);
  const [unpublishedEnabled, setUnpublishedEnabled] = useState(false);

  const [serviceCategories, setServiceCategories] = useState<AssetFilterOption[]>([]);
  const [channels, setChannels] = useState<AssetFilterOption[]>([]);
  const [metrics, setMetrics] = useState<AmountAssetMapped | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [assets, setAssets] = useState<AssetListItem[]>([]);
  const [columnOrder, setColumnOrder] = useState<ReorderableAssetColumnKey[]>(loadStoredAssetColumns);
  const [draggedColumn, setDraggedColumn] = useState<ReorderableAssetColumnKey | null>(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /** Map<compositeId, enriched data> — populated by background detail fetches. */
  const [enrichedMap, setEnrichedMap] = useState<Map<string, EnrichedData>>(new Map());
  const enrichAbortRef = useRef<AbortController | null>(null);

  const canRead = hasRight('asset:read') || hasRight('asset.read') || hasRight('asset:*') || hasRight('*:*');

  /* ──── Debounced search ──── */
  useEffect(() => {
    const timer = setTimeout(() => { setSearchQuery(searchInput.trim()); setPage(1); }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ──── Reset page on filter change ──── */
  useEffect(() => { setPage(1); }, [filterMode, selectedServiceCategoryId, selectedChannelId, mvEnabled, shEnabled, epEnabled, publishedEnabled, unpublishedEnabled]);

  /* ──── Load filter sources ──── */
  useEffect(() => {
    let cancelled = false;
    const loadFilterSources = async () => {
      if (!canRead) return;
      setLoadingFilters(true);
      const [categoryRes, channelRes, mappedRes, ottChannelsRes] = await Promise.allSettled([
        getServiceCategories(), getAssetChannels(), getAmountAssetMapped(),
        searchChannels({ platform: ['OTT'], chanType: ['HYBRID', 'VOD'] }, 0, 1000),
      ]);
      try {
        if (cancelled) return;
        const logFilterSourceFailure = (source: string, result: PromiseSettledResult<unknown>) => {
          if (result.status !== 'rejected') return;
          const reason = result.reason as { message?: string; code?: string; response?: { status?: number; data?: unknown } };
          const code = reason?.code || 'UNKNOWN';
          const status = reason?.response?.status;
          const message = reason?.message || 'No error message';
          console.error(`[AssetsPage] Filter source failed: ${source}`, {
            source,
            code,
            status,
            message,
            response: reason?.response?.data,
          });
          if (code === 'ECONNABORTED') {
            console.error(`[AssetsPage] ${source} likely timed out (client timeout is 60s).`);
          }
        };
        logFilterSourceFailure('service-categories', categoryRes);
        logFilterSourceFailure('asset-channels', channelRes);
        logFilterSourceFailure('asset-mapped', mappedRes);
        logFilterSourceFailure('ott-vod-hybrid-channels', ottChannelsRes);

        const normalizedCategories = normalizeFilterOptions(categoryRes.status === 'fulfilled' ? categoryRes.value : null);
        const baseChannels = normalizeFilterOptions(channelRes.status === 'fulfilled' ? channelRes.value : null);

        const allowedChannels = new Set<string>();
        const ottChannels = extractArrayPayload(ottChannelsRes.status === 'fulfilled' ? ottChannelsRes.value : null);
        for (const raw of ottChannels) {
          if (!raw || typeof raw !== 'object') continue;
          const channel = raw as Record<string, unknown>;
          const id = (channel.id || channel.sourceId || channel.vcId) as string | undefined;
          const name = (channel.name || channel.callSign) as string | undefined;
          if (id) allowedChannels.add(id.trim().toLowerCase());
          if (name) allowedChannels.add(name.trim().toLowerCase());
        }

        const normalizedChannels = baseChannels.filter((ch) => {
          if (allowedChannels.size > 0) {
            const id = ch.id?.trim().toLowerCase();
            const name = ch.name?.trim().toLowerCase();
            return allowedChannels.has(id) || allowedChannels.has(name);
          }
          return isOttVodOrHybridChannel(ch as AssetFilterOption & Record<string, unknown>);
        });
        setServiceCategories(normalizedCategories);
        setChannels(normalizedChannels);
        setMetrics(mappedRes.status === 'fulfilled' ? (mappedRes.value as { response?: AmountAssetMapped }).response || null : null);
        if (categoryRes.status === 'rejected' || channelRes.status === 'rejected' || ottChannelsRes.status === 'rejected') {
          setError('Unable to load one or more filter sources.');
        }
      } finally {
        if (!cancelled) setLoadingFilters(false);
      }
    };
    void loadFilterSources();
    return () => { cancelled = true; };
  }, [canRead]);

  /* ──── Load assets (search) ──── */
  useEffect(() => {
    let cancelled = false;
    const loadAssets = async () => {
      if (!canRead) return;
      if (searchQuery.length === 1) { setAssets([]); setTotalResults(0); setTotalPages(1); setError('Enter at least 2 characters to search.'); return; }
      setLoading(true); setError('');
      try {
        const filters: string[] = [];
        if (mvEnabled) filters.push('MV');
        if (shEnabled) filters.push('SH');
        if (epEnabled) filters.push('EP');
        const additionalFilters: string[] = [];
        if (publishedEnabled) additionalFilters.push('published');
        if (unpublishedEnabled) additionalFilters.push('Unpublished');
        const request = {
          filters, additionalFilters,
          categories: filterMode === 'service' && selectedServiceCategoryId ? [selectedServiceCategoryId] : [],
          channelIds: filterMode === 'channel' && selectedChannelId ? [selectedChannelId] : [],
          searchString: searchQuery,
        };
        const response = await searchAssets(request, page, PAGE_SIZE);
        if (cancelled) return;
        const normalized = normalizeSearchResponse(response);
        setAssets(normalized.items);
        setTotalResults(normalized.total);
        setTotalPages(Math.max(1, normalized.pages));
      } catch (err: unknown) {
        if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load assets.'); setAssets([]); setTotalResults(0); setTotalPages(1); }
      } finally { if (!cancelled) setLoading(false); }
    };
    void loadAssets();
    return () => { cancelled = true; };
  }, [canRead, searchQuery, filterMode, selectedServiceCategoryId, selectedChannelId, mvEnabled, shEnabled, epEnabled, publishedEnabled, unpublishedEnabled, page]);

  /* ──── Enrich visible assets (batch detail + images) ──── */
  const enrichAssets = useCallback(async (items: AssetListItem[]) => {
    if (!items.length) { setEnrichedMap(new Map()); return; }
    // Abort previous enrichment batch
    enrichAbortRef.current?.abort();
    const controller = new AbortController();
    enrichAbortRef.current = controller;

    const newMap = new Map<string, EnrichedData>();

    // Fire parallel detail fetches (best-effort, don't block UI)
    const detailPromises = items.map(async (asset) => {
      const cid = `${asset.assetId}-${asset.dmsId}`;
      try {
        if (controller.signal.aborted) return;
        const detail: AssetDetail = await getAssetDetail(asset.assetId, asset.dmsId);
        const entry: EnrichedData = {
          channels: detail.channels,
          serviceCategory: detail.serviceProviderInfo?.serviceProviderCategory?.name,
          serviceProvider: detail.serviceProviderInfo?.serviceProvider?.name,
        };

        // Try to get a thumbnail from program images
        if (asset.programId) {
          try {
            const baseId = asset.programId.length > 14 ? asset.programId.substring(0, 14) : asset.programId;
            const imgResponse = await getProgramImages(baseId);
            const images: ProgramImage[] = (imgResponse as any)?.response || imgResponse || [];
            entry.thumbnailUrl = extractThumbnailUrl(images);
          } catch { /* ignore image errors */ }
        }

        newMap.set(cid, entry);
      } catch { /* ignore detail errors */ }
    });

    await Promise.allSettled(detailPromises);
    if (!controller.signal.aborted) {
      setEnrichedMap(new Map(newMap));
    }
  }, []);

  useEffect(() => {
    void enrichAssets(assets);
    return () => { enrichAbortRef.current?.abort(); };
  }, [assets, enrichAssets]);

  /* ──── Derived values ──── */
  const tableGridTemplateColumns = useMemo(
    () => columnOrder.map((columnKey) => ASSET_COLUMN_META[columnKey].width).join(' '),
    [columnOrder]
  );

  useEffect(() => {
    localStorage.setItem(ASSET_COLUMNS_STORAGE_KEY, JSON.stringify(columnOrder));
  }, [columnOrder]);

  const handleOpenAssetDetail = (asset: AssetListItem) => {
    navigate(`/assets/${encodeURIComponent(asset.assetId)}/${encodeURIComponent(asset.dmsId)}`);
  };

  const handleColumnDrop = (targetColumn: ReorderableAssetColumnKey) => {
    if (!draggedColumn || draggedColumn === targetColumn) return;
    setColumnOrder((previous) => {
      const next = [...previous];
      const from = next.indexOf(draggedColumn);
      const to = next.indexOf(targetColumn);
      if (from < 0 || to < 0) return previous;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedColumn(null);
  };

  const resetFilters = () => {
    setSearchInput(''); setSearchQuery(''); setFilterMode('service'); setSelectedServiceCategoryId('');
    setSelectedChannelId(''); setMvEnabled(true); setShEnabled(true); setEpEnabled(true);
    setPublishedEnabled(true); setUnpublishedEnabled(false); setPage(1); setError('');
  };

  const channelOptionsForDropdown = useMemo(() => {
    if (channels.length > 0) return channels;
    if (incomingChannelId) return [{ id: incomingChannelId, name: incomingChannelId }];
    return [];
  }, [channels, incomingChannelId]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (!mvEnabled || !shEnabled || !epEnabled) count++;
    if (!publishedEnabled || unpublishedEnabled) count++;
    if (filterMode === 'channel' && selectedChannelId) count++;
    if (filterMode === 'service' && selectedServiceCategoryId) count++;
    return count;
  }, [searchQuery, mvEnabled, shEnabled, epEnabled, publishedEnabled, unpublishedEnabled, filterMode, selectedChannelId, selectedServiceCategoryId]);

  /* ──── Access denied ──── */
  if (!canRead) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8 rounded-xl border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)] max-w-lg">
          <AlertCircle className="mx-auto mb-3 text-[var(--color-neutral-400)]" size={28} />
          <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white">Access denied</h2>
          <p className="text-sm text-[var(--color-neutral-500)] mt-2">You need `asset:read` permission to view assets.</p>
        </div>
      </div>
    );
  }

  /* ──── Render ──── */
  return (
    <div className="flex flex-row-reverse h-full bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-900)]">
      {/* ── Right Sidebar ── */}
      <aside className={`flex-shrink-0 bg-white dark:bg-[var(--color-neutral-800)] border-l border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-72'}`}>
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
            <div className="relative">
              <button className="p-2 rounded-lg hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-600)]" title="Filters">
                <Filter size={20} />
              </button>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-[var(--color-primary-600)] text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full min-h-0">
            <div className="p-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">Asset Filters</h2>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 rounded hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-500)] transition-colors"
                title="Collapse sidebar"
              >
                <ChevronUp size={16} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto space-y-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">Search</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" />
                <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search movies, shows, episodes"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>
            </div>
            {/* Program Type */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">Program Type</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'MV', active: mvEnabled, toggle: () => setMvEnabled((v) => !v) },
                  { label: 'SH', active: shEnabled, toggle: () => setShEnabled((v) => !v) },
                  { label: 'EP', active: epEnabled, toggle: () => setEpEnabled((v) => !v) },
                ].map((item) => (
                  <button key={item.label} onClick={item.toggle} className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${item.active ? 'bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]' : 'bg-white dark:bg-[var(--color-neutral-900)] border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]'}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Publication Status */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">Publication Status</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                  <input type="checkbox" checked={publishedEnabled} onChange={() => setPublishedEnabled((v) => !v)} /> Published
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                  <input type="checkbox" checked={unpublishedEnabled} onChange={() => setUnpublishedEnabled((v) => !v)} /> Unpublished
                </label>
              </div>
            </div>
            {/* Filter Scope */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">Filter Scope</label>
              <select value={filterMode} onChange={(e) => setFilterMode(e.target.value as FilterMode)} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
                <option value="service">Provider Category</option>
                <option value="channel">Channel</option>
              </select>
            </div>
            {/* Category / Channel dropdown */}
            {filterMode === 'service' ? (
              <div>
                <label className="block text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">Provider Category</label>
                <select key="provider-category-select" value={selectedServiceCategoryId} onChange={(e) => setSelectedServiceCategoryId(e.target.value)} disabled={loadingFilters} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] disabled:opacity-60">
                  <option value="">All</option>
                  {serviceCategories.map((o) => <option key={`svc-${o.id}`} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">Channel</label>
                <select key="channel-select" value={selectedChannelId} onChange={(e) => setSelectedChannelId(e.target.value)} disabled={loadingFilters && !incomingChannelId} className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] disabled:opacity-60">
                  <option value="">All</option>
                  {channelOptionsForDropdown.map((o) => <option key={`ch-${o.id}`} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            )}
            <button onClick={resetFilters} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)]">
              <X size={14} /> Reset Filters
            </button>
          </div>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="page-header-bar px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
              Showing <span className="font-semibold">{assets.length}</span> of <span className="font-semibold">{totalResults}</span>
            </p>
            <div className="flex items-center gap-4">
              {metrics && (
                <div className="hidden lg:flex items-center gap-5 text-xs text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                  <div>Mapped Titles: <span className="font-semibold">{metrics.amountMappedTitles}</span>/<span className="font-semibold">{metrics.totalMappedTitles}</span></div>
                  <div>Catalog: BR <span className="font-semibold">{metrics.amountCatalogTitlesSky}</span> / SSLA <span className="font-semibold">{metrics.amountCatalogTitlesSsla}</span> / Total <span className="font-semibold">{metrics.totalCatalogTitles}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center"><LoadingSpinner size="md" message="Loading assets..." /></div>
          ) : error ? (
            <div className="m-6 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-300 px-4 py-3 text-sm">{error}</div>
          ) : assets.length === 0 ? (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <Film size={42} className="mx-auto mb-3 text-[var(--color-neutral-300)]" />
                <h3 className="text-lg font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">No assets found</h3>
                <p className="text-sm text-[var(--color-neutral-500)] mt-1">Try adjusting search text or filters.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-neutral-200)] dark:divide-[var(--color-neutral-700)]">
              {/* Header */}
              <div
                className="gap-3 px-6 py-2 bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-[10px] font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] sticky top-0 z-10 tracking-wider hidden md:grid"
                style={{ gridTemplateColumns: tableGridTemplateColumns }}
              >
                {columnOrder.map((columnKey) => {
                  const isDragged = draggedColumn === columnKey;
                  const label = ASSET_COLUMN_META[columnKey].label;
                  const centered = columnKey === 'type' || columnKey === 'status' || columnKey === 'seasonEpisode';
                  return (
                    <div
                      key={columnKey}
                      draggable
                      onDragStart={() => setDraggedColumn(columnKey)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleColumnDrop(columnKey)}
                      onDragEnd={() => setDraggedColumn(null)}
                      className={`flex items-center gap-1 select-none ${centered ? 'justify-center' : ''} ${isDragged ? 'opacity-60' : ''}`}
                    >
                      <GripVertical size={12} className="text-[var(--color-neutral-400)] cursor-move flex-shrink-0" />
                      {label}
                    </div>
                  );
                })}
              </div>

              {/* Rows */}
              {assets.map((asset) => {
                const compositeId = `${asset.assetId}-${asset.dmsId}`;
                const published = isPublishedAsset(asset);
                const enriched = enrichedMap.get(compositeId);

                // Prefer enriched data, fallback to search response fields
                const channelDisplay = enriched?.channels?.length
                  ? enriched.channels.join(', ')
                  : asset.channels?.length ? asset.channels.join(', ') : '—';
                const categoryDisplay = enriched?.serviceCategory
                  || asset.serviceProviderInfo?.serviceProviderCategory?.name
                  || '—';
                const thumbnailUrl = enriched?.thumbnailUrl ?? null;

                return (
                  <div
                    key={compositeId}
                    onClick={() => handleOpenAssetDetail(asset)}
                    className="w-full grid gap-3 px-6 py-2.5 items-center text-left text-sm transition-colors cursor-pointer hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-800)]"
                    style={{ gridTemplateColumns: tableGridTemplateColumns }}
                  >
                    {columnOrder.map((columnKey) => {
                      if (columnKey === 'image') {
                        return (
                          <div key={columnKey} className="w-10 h-10 rounded overflow-hidden bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] flex items-center justify-center flex-shrink-0">
                            {thumbnailUrl ? (
                              <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; const parent = (e.target as HTMLElement).parentElement; if (parent) parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-neutral-300)]"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'; }} />
                            ) : (
                              <ImageIcon size={16} className="text-[var(--color-neutral-300)]" />
                            )}
                          </div>
                        );
                      }
                      if (columnKey === 'title') {
                        return (
                          <div key={columnKey} className="min-w-0">
                            <div className="font-medium text-[var(--color-neutral-800)] dark:text-white truncate">
                              {asset.title || 'Untitled Asset'}
                            </div>
                          </div>
                        );
                      }
                      if (columnKey === 'programId') return <div key={columnKey} className={ASSET_COLUMN_META.programId.cellClassName}>{asset.programId || '—'}</div>;
                      if (columnKey === 'assetId') return <div key={columnKey} className={ASSET_COLUMN_META.assetId.cellClassName}>{asset.assetId}/{asset.dmsId}</div>;
                      if (columnKey === 'channel') return <div key={columnKey} className={ASSET_COLUMN_META.channel.cellClassName} title={channelDisplay}>{channelDisplay}</div>;
                      if (columnKey === 'serviceCategory') return <div key={columnKey} className={ASSET_COLUMN_META.serviceCategory.cellClassName} title={categoryDisplay}>{categoryDisplay}</div>;
                      if (columnKey === 'type') {
                        return (
                          <div key={columnKey} className="text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)] dark:bg-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                              {formatProgramType(asset.programId)}
                            </span>
                          </div>
                        );
                      }
                      if (columnKey === 'status') {
                        return (
                          <div key={columnKey} className="text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {published ? 'Published' : 'Unpublished'}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div key={columnKey} className="text-center text-xs text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                          {(asset.displaySeasonNumber ?? '—')}/{(asset.displayEpisodeNumber ?? '—')}
                        </div>
                      );
                    })}

                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="px-6 py-3 border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] flex items-center justify-between">
            <div className="text-sm text-[var(--color-neutral-500)]">
              Click a row to open Asset details
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="px-3 py-1.5 text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1">
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-sm text-[var(--color-neutral-500)]">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading} className="px-3 py-1.5 text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssetsPage;
