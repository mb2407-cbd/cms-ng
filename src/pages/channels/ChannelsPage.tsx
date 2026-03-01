/**
 * @file ChannelsPage.tsx
 * @description Channels listing page — entry point to schedule management.
 *   Each channel row has a single action icon (⋮) that opens a sub-menu with:
 *     • View Schedule → navigates to /channels/:id/schedule
 *     • Channel Details → navigates to /channels/:id
 *     • Link Slave to Master → modal dialog
 *   Quick preview is still available via row double-click.
 * @author VLS Team
 * @date 2026-02-17
 */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MoreVertical,
  CalendarDays,
  Link2,
  Tv2,
  X,
  Check,
  AlertCircle,
  Loader2,
  Radio,
  Globe,
  Lock,
  GripVertical,
} from 'lucide-react';
import {
  searchChannels,
  getAllChannels,
  getMasterChannels,
  updateChannel,
  getChannelImages,
} from '../../services/channel.service';
import type { ServiceChannel, ChannelSearchRequest } from '../../types/channel.types';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// ────────────────────────────────────────────────────────────
//  Filter options
// ────────────────────────────────────────────────────────────

const PLATFORM_OPTIONS = [
  { label: 'All Platforms', value: '' },
  { label: 'OTT', value: 'ott' },
  { label: 'DTH', value: 'dth' },
];

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Published', value: 'published' },
  { label: 'Unpublished', value: 'unpublished' },
];

const TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'HD', value: 'HD' },
  { label: 'SD', value: 'SD' },
  { label: 'Radio', value: 'Radio' },
  { label: '4K', value: '4K' },
];

// ────────────────────────────────────────────────────────────
//  Module-level cache (survives navigation to schedule & back)
// ────────────────────────────────────────────────────────────

let cachedState: {
  query: string;
  platformFilter: string;
  statusFilter: string;
  typeFilter: string;
  channels: ServiceChannel[];
  page: number;
  totalPages: number;
  totalResults: number;
} | null = null;

const PAGE_SIZE = 20;
const CHANNEL_COLUMNS_STORAGE_KEY = 'vls_channels_columns';

type ChannelColumnKey = 'name' | 'id' | 'platform' | 'type' | 'lang' | 'relationship' | 'actions';
type ReorderableChannelColumnKey = Exclude<ChannelColumnKey, 'actions'>;

const DEFAULT_CHANNEL_COLUMNS: ReorderableChannelColumnKey[] = [
  'name',
  'id',
  'platform',
  'type',
  'lang',
  'relationship',
];

const CHANNEL_COLUMN_META: Record<ChannelColumnKey, { label: string; headerClass: string; cellClass: string }> = {
  name: { label: 'Channel Name / Call Sign', headerClass: 'col-span-4 text-left', cellClass: 'col-span-4 min-w-0' },
  id: { label: 'Id', headerClass: 'col-span-2 text-left', cellClass: 'col-span-2 text-xs font-mono text-[var(--color-neutral-500)] truncate' },
  platform: { label: 'Platform', headerClass: 'col-span-1 text-center', cellClass: 'col-span-1 text-center' },
  type: { label: 'Type', headerClass: 'col-span-1 text-center', cellClass: 'col-span-1 text-center' },
  lang: { label: 'Lang', headerClass: 'col-span-1 text-center', cellClass: 'col-span-1 text-center' },
  relationship: { label: 'Master / Slave', headerClass: 'col-span-2 text-left', cellClass: 'col-span-2 flex flex-wrap gap-1' },
  actions: { label: '', headerClass: 'col-span-1 text-center', cellClass: 'col-span-1 flex justify-center' },
};

const loadStoredChannelColumns = (): ReorderableChannelColumnKey[] => {
  try {
    const raw = localStorage.getItem(CHANNEL_COLUMNS_STORAGE_KEY);
    if (!raw) return DEFAULT_CHANNEL_COLUMNS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_CHANNEL_COLUMNS;
    const valid = parsed.filter((k): k is ReorderableChannelColumnKey =>
      DEFAULT_CHANNEL_COLUMNS.includes(k as ReorderableChannelColumnKey)
    );
    if (valid.length !== DEFAULT_CHANNEL_COLUMNS.length) return DEFAULT_CHANNEL_COLUMNS;
    return valid;
  } catch {
    return DEFAULT_CHANNEL_COLUMNS;
  }
};

// ────────────────────────────────────────────────────────────
//  Helpers
// ────────────────────────────────────────────────────────────

const getPlatformColor = (platform: string): string => {
  const p = (platform || '').toLowerCase();
  if (p === 'ott') return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
  if (p === 'dth') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
};

const getTypeColor = (type: string): string => {
  const t = (type || '').toUpperCase();
  if (t === 'LINEAR') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (t === 'HYBRID') return 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/30 dark:text-[var(--color-primary-300)]';
  if (t === 'VOD') return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
  if (t === 'HD') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (t === 'SD') return 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400';
  if (t === '4K') return 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/20 dark:text-[var(--color-primary-300)]';
  if (t === 'RADIO') return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
  return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300';
};

const getChannelDisplayName = (ch: ServiceChannel): string => {
  if (ch.channelNames && ch.channelNames.length > 0) {
    const en = ch.channelNames.find(n => n.lang === 'en' || n.lang === 'EN');
    return (en || ch.channelNames[0]).value || ch.name || ch.callSign || ch.id;
  }
  return ch.name || ch.callSign || ch.id;
};

const getFirstPrgSvcId = (ch: ServiceChannel): string => {
  if (ch.prgSvcId) return ch.prgSvcId;
  const firstDaypart = ch.dayParts?.[0] as any;
  const firstMapping = firstDaypart?.mappings?.[0] as any;
  return firstMapping?.prgSvcId || '0';
};

const getMasterSource = (ch: ServiceChannel): string | undefined =>
  ch.dthInfo?.masterSource || ch.masterSource;

const getChannelPlatform = (ch: ServiceChannel): string =>
  (ch.channelTarget || '').trim().toLowerCase();

const getChannelType = (ch: ServiceChannel): string =>
  (ch.channelType || '').trim().toUpperCase();

const canViewSchedule = (ch: ServiceChannel): boolean => {
  const platform = getChannelPlatform(ch);
  const type = getChannelType(ch);
  if (platform === 'dth') return true;
  if (platform === 'ott') return type === 'LINEAR' || type === 'HYBRID';
  return false;
};

const canViewAssets = (ch: ServiceChannel): boolean => {
  const platform = getChannelPlatform(ch);
  const type = getChannelType(ch);
  return platform === 'ott' && (type === 'VOD' || type === 'HYBRID');
};

/**
 * Normalise any API response shape into a flat ServiceChannel[].
 * The API may return:
 *   • An array directly
 *   • { response: [...] }
 *   • { response: [...], totalElements, totalPages }
 *   • { content: [...] }
 */
const normaliseChannelResponse = (raw: any): {
  data: ServiceChannel[];
  total: number;
  pages: number;
} => {
  if (Array.isArray(raw)) {
    return { data: raw, total: raw.length, pages: Math.ceil(raw.length / PAGE_SIZE) || 1 };
  }
  const data: ServiceChannel[] =
    raw?.response || raw?.content || raw?.data || raw?.channels || [];
  const total: number = raw?.totalElements || raw?.total || data.length;
  const pages: number = raw?.totalPages || Math.ceil(total / PAGE_SIZE) || 1;
  return { data: Array.isArray(data) ? data : [], total, pages };
};

// ────────────────────────────────────────────────────────────
//  Channel Detail Panel (slide-over)
// ────────────────────────────────────────────────────────────

interface DetailPanelProps {
  channel: ServiceChannel;
  onClose: () => void;
  onLinkToMaster: () => void;
  onGoToSchedule: () => void;
  onViewAssets: () => void;
}

const ChannelDetailPanel: React.FC<DetailPanelProps> = ({
  channel,
  onClose,
  onLinkToMaster,
  onGoToSchedule,
  onViewAssets,
}) => {
  const displayName = getChannelDisplayName(channel);
  const showSchedule = canViewSchedule(channel);
  const showAssets = canViewAssets(channel);

  const Field: React.FC<{ label: string; value?: string | number | boolean | null; mono?: boolean }> = ({
    label, value, mono,
  }) => (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-neutral-500)] dark:text-[var(--color-neutral-400)] mb-0.5">
        {label}
      </dt>
      <dd className={`text-sm text-[var(--color-neutral-800)] dark:text-white ${mono ? 'font-mono text-xs' : ''}`}>
        {value === null || value === undefined || value === '' ? (
          <span className="text-[var(--color-neutral-400)] italic">—</span>
        ) : typeof value === 'boolean' ? (
          value ? (
            <span className="text-green-600 dark:text-green-400 font-medium">Yes</span>
          ) : (
            <span className="text-[var(--color-neutral-400)]">No</span>
          )
        ) : (
          String(value)
        )}
      </dd>
    </div>
  );

  const Badge: React.FC<{ label: string; active?: boolean; color?: string }> = ({
    label, active, color,
  }) => (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
      active
        ? (color || 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400')
        : 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-400)] dark:bg-[var(--color-neutral-700)] dark:text-[var(--color-neutral-500)] line-through opacity-60'
    }`}>
      {label}
    </span>
  );

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] z-40 flex flex-col bg-white dark:bg-[var(--color-neutral-900)] shadow-2xl border-l border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Tv2 size={16} className="text-[var(--color-primary-500)] flex-shrink-0" />
            <h2 className="text-base font-bold text-[var(--color-neutral-800)] dark:text-white truncate">
              {displayName}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {channel.channelTarget && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPlatformColor(channel.channelTarget)}`}>
                {channel.channelTarget}
              </span>
            )}
            {channel.channelType && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getTypeColor(channel.channelType)}`}>
                {channel.channelType}
              </span>
            )}
            {channel.published && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Published
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-800)] text-[var(--color-neutral-500)] ml-2 flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      {/* Action bar */}
      <div className="flex gap-2 px-5 py-3 border-b border-[var(--color-neutral-100)] dark:border-[var(--color-neutral-800)] bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-800)]/50">
        {showSchedule && (
          <button
            onClick={onGoToSchedule}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded-lg transition-colors"
          >
            <CalendarDays size={13} />
            View Schedule
          </button>
        )}
        {showAssets && (
          <button
            onClick={onViewAssets}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] bg-white dark:bg-[var(--color-neutral-900)] border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] hover:border-[var(--color-primary-400)] rounded-lg transition-colors"
          >
            <Tv2 size={13} />
            View Assets
          </button>
        )}
        <button
          onClick={onLinkToMaster}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] bg-white dark:bg-[var(--color-neutral-900)] border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] hover:border-[var(--color-primary-400)] rounded-lg transition-colors"
        >
          <Link2 size={13} />
          Link to Master
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-5 py-4">
        {/* Identity */}
        <section className="mb-6">
          <h3 className="text-xs font-bold text-[var(--color-neutral-500)] uppercase tracking-wider mb-3 pb-1 border-b border-[var(--color-neutral-100)] dark:border-[var(--color-neutral-800)]">
            Identity
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label="Channel ID" value={channel.id} mono />
            <Field label="Source ID" value={channel.sourceId} mono />
            <Field label="Call Sign" value={channel.callSign} />
            <Field label="Prog Service ID" value={channel.prgSvcId} mono />
            <Field label="Language" value={channel.language?.toUpperCase()} />
            <Field label="Timezone" value={channel.timeZoneName || channel.timeZone} />
          </dl>
        </section>

        {/* Flags */}
        <section className="mb-6">
          <h3 className="text-xs font-bold text-[var(--color-neutral-500)] uppercase tracking-wider mb-3 pb-1 border-b border-[var(--color-neutral-100)] dark:border-[var(--color-neutral-800)]">
            Flags
          </h3>
          <div className="flex flex-wrap gap-2">
            <Badge label="Published" active={channel.published} />
            <Badge label="Auto" active={channel.auto} color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" />
            <Badge label="Adult" active={channel.adult} color="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" />
            <Badge label="Bubble" active={channel.bubble} color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" />
            <Badge label="PPV" active={channel.ppv} color="bg-[var(--color-primary-100)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/30 dark:text-[var(--color-primary-300)]" />
            <Badge label="Has Schedule" active={channel.hasSchedule} color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" />
          </div>
        </section>

        {/* DTH Info */}
        {channel.dthInfo && (
          <section className="mb-6">
            <h3 className="text-xs font-bold text-[var(--color-neutral-500)] uppercase tracking-wider mb-3 pb-1 border-b border-[var(--color-neutral-100)] dark:border-[var(--color-neutral-800)]">
              DTH Info
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Viewer Number" value={channel.dthInfo.viewerNumber} />
              <Field label="Resolution" value={channel.dthInfo.channelResolution} />
              <Field label="Is Slave" value={channel.dthInfo.isSlave} />
              <Field label="Is Engineering" value={channel.dthInfo.isEngineering} />
              {channel.dthInfo.masterSource && (
                <div className="col-span-2">
                  <Field label="Master Source" value={channel.dthInfo.masterSource} mono />
                </div>
              )}
            </dl>
          </section>
        )}

        {/* Master Source */}
        {channel.masterSource && !channel.dthInfo?.masterSource && (
          <section className="mb-6">
            <h3 className="text-xs font-bold text-[var(--color-neutral-500)] uppercase tracking-wider mb-3 pb-1 border-b border-[var(--color-neutral-100)] dark:border-[var(--color-neutral-800)]">
              Master Channel
            </h3>
            <dl>
              <Field label="Master Source ID" value={channel.masterSource} mono />
              {channel.masterChannelName && (
                <Field label="Master Channel Name" value={channel.masterChannelName} />
              )}
            </dl>
          </section>
        )}

        {/* Regions */}
        {channel.regions && channel.regions.length > 0 && (
          <section className="mb-6">
            <h3 className="text-xs font-bold text-[var(--color-neutral-500)] uppercase tracking-wider mb-3 pb-1 border-b border-[var(--color-neutral-100)] dark:border-[var(--color-neutral-800)]">
              Regions
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {channel.regions.map(r => (
                <span key={r.id} className="px-2 py-0.5 rounded bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-xs text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                  {r.name || r.regionName || r.abbrev || r.id}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        {channel.categories && channel.categories.length > 0 && (
          <section className="mb-6">
            <h3 className="text-xs font-bold text-[var(--color-neutral-500)] uppercase tracking-wider mb-3 pb-1 border-b border-[var(--color-neutral-100)] dark:border-[var(--color-neutral-800)]">
              Categories
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {channel.categories.map(c => (
                <span key={c.id} className="px-2 py-0.5 rounded bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-xs text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                  {c.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* License Dates */}
        {(channel.licenseStartDate || channel.licenseEndDate) && (
          <section className="mb-6">
            <h3 className="text-xs font-bold text-[var(--color-neutral-500)] uppercase tracking-wider mb-3 pb-1 border-b border-[var(--color-neutral-100)] dark:border-[var(--color-neutral-800)]">
              License
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Start Date" value={channel.licenseStartDate} />
              <Field label="End Date" value={channel.licenseEndDate} />
            </dl>
          </section>
        )}

        {/* Timestamps */}
        <section>
          <h3 className="text-xs font-bold text-[var(--color-neutral-500)] uppercase tracking-wider mb-3 pb-1 border-b border-[var(--color-neutral-100)] dark:border-[var(--color-neutral-800)]">
            Timestamps
          </h3>
          <dl className="grid grid-cols-1 gap-y-3">
            <Field label="Created" value={channel.createdDate ? new Date(channel.createdDate).toLocaleString() : undefined} />
            <Field label="Last Updated" value={channel.updatedDate ? new Date(channel.updatedDate).toLocaleString() : undefined} />
          </dl>
        </section>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  Link Slave to Master Modal
// ────────────────────────────────────────────────────────────

interface LinkMasterModalProps {
  channel: ServiceChannel;
  onClose: () => void;
  onSuccess: (updatedChannel: ServiceChannel) => void;
}

const LinkMasterModal: React.FC<LinkMasterModalProps> = ({ channel, onClose, onSuccess }) => {
  const [masterChannelsList, setMasterChannelsList] = useState<ServiceChannel[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(true);
  const [masterSearch, setMasterSearch] = useState('');
  const [selectedMasterId, setSelectedMasterId] = useState(channel.masterSource || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMasterChannels()
      .then((response: any) => {
        const { data } = normaliseChannelResponse(response);
        setMasterChannelsList(data);
      })
      .catch(() => setMasterChannelsList([]))
      .finally(() => setLoadingMasters(false));
  }, []);

  const filteredMasters = masterChannelsList.filter(m => {
    const name = getChannelDisplayName(m).toLowerCase();
    const q = masterSearch.toLowerCase();
    return name.includes(q) || (m.callSign || '').toLowerCase().includes(q) || m.id.includes(q);
  });

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = { ...channel, masterSource: selectedMasterId || undefined };
      const response: any = await updateChannel(updated);
      const result = response?.response || response || updated;
      onSuccess(result as ServiceChannel);
    } catch (err: any) {
      setError(err?.message || 'Failed to link channel. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentChannelName = getChannelDisplayName(channel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[var(--color-neutral-900)] rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
          <div>
            <h2 className="text-base font-bold text-[var(--color-neutral-800)] dark:text-white flex items-center gap-2">
              <Link2 size={16} className="text-[var(--color-primary-500)]" />
              Link Slave to Master
            </h2>
            <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">
              Linking: <span className="font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">{currentChannelName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-800)] text-[var(--color-neutral-500)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current link info */}
        {channel.masterSource && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <AlertCircle size={13} />
            Currently linked to: <span className="font-mono font-semibold">{channel.masterSource}</span>
          </div>
        )}

        {/* Search */}
        <div className="px-5 pt-4 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" />
            <input
              type="text"
              value={masterSearch}
              onChange={e => setMasterSearch(e.target.value)}
              placeholder="Search master channels..."
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-800)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              autoFocus
            />
          </div>
        </div>

        {/* Master channel list */}
        <div className="flex-1 overflow-auto px-5 pb-3">
          {loadingMasters ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[var(--color-primary-500)]" />
            </div>
          ) : filteredMasters.length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--color-neutral-400)]">
              {masterSearch ? 'No master channels match your search.' : 'No master channels available.'}
            </div>
          ) : (
            <div className="space-y-1">
              {/* Unlink option */}
              <button
                onClick={() => setSelectedMasterId('')}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors flex items-center gap-3 ${
                  selectedMasterId === ''
                    ? 'border-[var(--color-primary-400)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/10'
                    : 'border-transparent hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-800)]'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  selectedMasterId === ''
                    ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]'
                    : 'border-[var(--color-neutral-300)]'
                }`}>
                  {selectedMasterId === '' && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-sm text-[var(--color-neutral-500)] italic">— Remove link (no master)</span>
              </button>

              {filteredMasters.map(master => {
                const name = getChannelDisplayName(master);
                const isSelected = selectedMasterId === master.id || selectedMasterId === master.sourceId;
                return (
                  <button
                    key={master.id}
                    onClick={() => setSelectedMasterId(master.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors flex items-center gap-3 ${
                      isSelected
                        ? 'border-[var(--color-primary-400)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/10'
                        : 'border-transparent hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-800)]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      isSelected
                        ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]'
                        : 'border-[var(--color-neutral-300)]'
                    }`}>
                      {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-[var(--color-neutral-800)] dark:text-white truncate">
                        {name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {master.callSign && (
                          <span className="text-[10px] text-[var(--color-neutral-500)] font-mono">{master.callSign}</span>
                        )}
                        {master.channelTarget && (
                          <span className={`px-1.5 py-0 rounded text-[9px] font-bold uppercase ${getPlatformColor(master.channelTarget)}`}>
                            {master.channelTarget}
                          </span>
                        )}
                        {master.channelType && (
                          <span className={`px-1.5 py-0 rounded text-[9px] font-bold ${getTypeColor(master.channelType)}`}>
                            {master.channelType}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--color-neutral-400)] flex-shrink-0">{master.id}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mb-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle size={13} />
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-800)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || loadingMasters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            {saving ? 'Saving…' : selectedMasterId ? 'Link Master' : 'Remove Link'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  Row Action Menu — single ⋮ icon → dropdown
// ────────────────────────────────────────────────────────────

interface ActionMenuProps {
  channel: ServiceChannel;
  onGoToSchedule: () => void;
  onViewAssets: () => void;
  onLinkToMaster: () => void;
  onClose: () => void;
}

const RowActionMenu: React.FC<ActionMenuProps> = ({
  channel,
  onGoToSchedule,
  onViewAssets,
  onLinkToMaster,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const showSchedule = canViewSchedule(channel);
  const showAssets = canViewAssets(channel);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const MenuItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    description?: string;
    onClick: () => void;
    accent?: boolean;
  }> = ({ icon, label, description, onClick, accent }) => (
    <button
      onClick={() => { onClick(); onClose(); }}
      className={`w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-800)] transition-colors ${
        accent ? 'text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]' : 'text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]'
      }`}
    >
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-[11px] text-[var(--color-neutral-400)] mt-0.5">{description}</div>
        )}
      </div>
    </button>
  );

  return (
    <div
      ref={menuRef}
      className="absolute right-6 top-full mt-1 w-60 bg-white dark:bg-[var(--color-neutral-900)] rounded-xl shadow-xl border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] z-30 overflow-hidden"
    >
      <div className="divide-y divide-[var(--color-neutral-100)] dark:divide-[var(--color-neutral-800)]">
        {showSchedule && (
          <MenuItem
            icon={<CalendarDays size={15} />}
            label="View Schedule"
            description="Open the schedule grid for this channel"
            onClick={onGoToSchedule}
            accent
          />
        )}
        {showAssets && (
          <MenuItem
            icon={<Tv2 size={15} />}
            label="View Assets"
            description="View assets for this channel"
            onClick={onViewAssets}
          />
        )}
        <MenuItem
          icon={<Link2 size={15} />}
          label="Link Slave to Master"
          description={
            channel.masterSource
              ? `Currently linked to ${channel.masterSource}`
              : 'Associate with a master channel'
          }
          onClick={onLinkToMaster}
        />
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  Main Page
// ────────────────────────────────────────────────────────────

const ChannelsPage: React.FC = () => {
  const navigate = useNavigate();

  // Restore cache if available
  const [searchQuery, setSearchQuery] = useState(cachedState?.query ?? '');
  const [platformFilter, setPlatformFilter] = useState(cachedState?.platformFilter ?? '');
  const [statusFilter, setStatusFilter] = useState(cachedState?.statusFilter ?? '');
  const [typeFilter, setTypeFilter] = useState(cachedState?.typeFilter ?? '');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [channels, setChannels] = useState<ServiceChannel[]>(cachedState?.channels ?? []);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(cachedState?.page ?? 0);
  const [totalPages, setTotalPages] = useState(cachedState?.totalPages ?? 0);
  const [totalResults, setTotalResults] = useState(cachedState?.totalResults ?? 0);

  // Action state
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [detailChannel, setDetailChannel] = useState<ServiceChannel | null>(null);
  const [linkChannel, setLinkChannel] = useState<ServiceChannel | null>(null);
  const [expandedMasters, setExpandedMasters] = useState<Record<string, boolean>>({});
  const [channelLogos, setChannelLogos] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<'name' | 'id' | 'platform' | 'type' | 'lang' | 'relationship'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnOrder, setColumnOrder] = useState<ReorderableChannelColumnKey[]>(loadStoredChannelColumns);
  const [draggedColumn, setDraggedColumn] = useState<ReorderableChannelColumnKey | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(!!cachedState);

  // ── Data fetching ───────────────────────────────────────

  /**
   * Fetch channels from the API.
   *
   * Strategy:
   *   • No search / no filters → getAllChannels() (simple GET, guaranteed to work)
   *   • With search or filters → searchChannels() (POST with criteria)
   *
   * Both responses are normalised through normaliseChannelResponse().
   */
  const executeSearch = useCallback(async (
    query: string,
    platform: string,
    status: string,
    type: string,
    pageNum: number,
  ) => {
    setLoading(true);
    try {
      let raw: any;
      const hasFilters = query || platform || status || type;

      if (!hasFilters) {
        // No criteria → use the simple GET endpoint
        console.log('[ChannelsPage] fetching all channels via GET /channels/servicechannel');
        raw = await getAllChannels();
      } else {
        // Build search request
        const request: ChannelSearchRequest = {};
        if (query) request.searchString = query;
        if (platform) request.platform = [platform];
        if (status === 'published') request.published = true;
        if (status === 'unpublished') request.published = false;
        if (type) request.chanType = [type];

        console.log('[ChannelsPage] searching channels via POST:', request);
        raw = await searchChannels(request, pageNum, PAGE_SIZE);
      }

      const { data, total, pages } = normaliseChannelResponse(raw);

      // Client-side pagination when using the flat GET endpoint
      let pageData = data;
      let pTotal = total;
      let pPages = pages;
      if (!hasFilters && data.length > PAGE_SIZE) {
        pTotal = data.length;
        pPages = Math.ceil(data.length / PAGE_SIZE);
        pageData = data.slice(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE);
      }

      console.log(`[ChannelsPage] loaded ${pageData.length} channels (total: ${pTotal})`);

      setChannels(pageData);
      setTotalResults(pTotal);
      setTotalPages(pPages);

      cachedState = {
        query, platformFilter: platform, statusFilter: status, typeFilter: type,
        channels: pageData, page: pageNum, totalPages: pPages, totalResults: pTotal,
      };
    } catch (err) {
      console.error('[ChannelsPage] fetch failed:', err);
      setChannels([]);
      setTotalResults(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(0);
      executeSearch(value, platformFilter, statusFilter, typeFilter, 0);
    }, 500);
  }, [platformFilter, statusFilter, typeFilter, executeSearch]);

  // Re-search when filters change
  useEffect(() => {
    setPage(0);
    executeSearch(searchQuery, platformFilter, statusFilter, typeFilter, 0);
  }, [platformFilter, statusFilter, typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load (skip if cache exists)
  useEffect(() => {
    if (!initialLoadDone.current) {
      executeSearch('', '', '', '', 0);
      initialLoadDone.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 0 && newPage < totalPages && !loading) {
      setPage(newPage);
      executeSearch(searchQuery, platformFilter, statusFilter, typeFilter, newPage);
    }
  }, [totalPages, loading, searchQuery, platformFilter, statusFilter, typeFilter, executeSearch]);

  // ── Actions ─────────────────────────────────────────────

  const handleGoToSchedule = (ch: ServiceChannel) => {
    const scheduleImage = channelLogos[ch.id] || ch.imageUrl || ch.channelImage || '';
    navigate(`/channels/${ch.id}/schedule`, {
      state: { channel: ch, channelImage: scheduleImage },
    });
  };

  const handleViewAssets = (ch: ServiceChannel) => {
    navigate('/assets', { state: { channelId: ch.id } });
  };

  const handleViewDetails = (ch: ServiceChannel) => {
    navigate(`/channels/${ch.id}`, {
      state: { channel: ch },
    });
    setActionMenuId(null);
  };

  const handleOpenLinkModal = (ch: ServiceChannel) => {
    setLinkChannel(ch);
    setActionMenuId(null);
  };

  const handleLinkSuccess = (updatedChannel: ServiceChannel) => {
    setChannels(prev => prev.map(c => c.id === updatedChannel.id ? updatedChannel : c));
    setLinkChannel(null);
    if (detailChannel?.id === updatedChannel.id) {
      setDetailChannel(updatedChannel);
    }
  };

  const hasActiveFilters = platformFilter || statusFilter || typeFilter;

  useEffect(() => {
    const channelsNeedingLogo = channels.filter((ch) => !channelLogos[ch.id]);
    if (!channelsNeedingLogo.length) return;
    const load = async () => {
      const results = await Promise.all(channelsNeedingLogo.map(async (ch) => {
        try {
          const imageResponse: any = await getChannelImages(ch.id, getFirstPrgSvcId(ch));
          const imagePayload = imageResponse?.response || imageResponse;
          const url = imagePayload?.imageURL || (imagePayload?.baseUrl && imagePayload?.uri ? `${imagePayload.baseUrl}${imagePayload.uri}` : imagePayload?.uri);
          return { id: ch.id, url: url || '' };
        } catch {
          return { id: ch.id, url: '' };
        }
      }));
      setChannelLogos((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          if (r.url) next[r.id] = r.url;
        });
        return next;
      });
    };
    void load();
  }, [channels, channelLogos]);

  const sortedChannels = useMemo(() => {
    const arr = [...channels];
    const compare = (a: ServiceChannel, b: ServiceChannel): number => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      const relation = (ch: ServiceChannel): string => {
        if (getMasterSource(ch)) return 'slave';
        const hasSlave = channels.some((c) => getMasterSource(c) === (ch.sourceId || ch.id));
        return hasSlave ? 'master' : 'normal';
      };
      const nameA = getChannelDisplayName(a).toLowerCase();
      const nameB = getChannelDisplayName(b).toLowerCase();
      const valA = sortKey === 'name' ? nameA
        : sortKey === 'id' ? (a.sourceId || a.id || '').toLowerCase()
          : sortKey === 'platform' ? (a.channelTarget || '').toLowerCase()
            : sortKey === 'type' ? (a.channelType || '').toLowerCase()
              : sortKey === 'lang' ? (a.language || '').toLowerCase()
                : relation(a);
      const valB = sortKey === 'name' ? nameB
        : sortKey === 'id' ? (b.sourceId || b.id || '').toLowerCase()
          : sortKey === 'platform' ? (b.channelTarget || '').toLowerCase()
            : sortKey === 'type' ? (b.channelType || '').toLowerCase()
              : sortKey === 'lang' ? (b.language || '').toLowerCase()
                : relation(b);
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    };
    arr.sort(compare);
    return arr;
  }, [channels, sortDirection, sortKey]);

  useEffect(() => {
    localStorage.setItem(CHANNEL_COLUMNS_STORAGE_KEY, JSON.stringify(columnOrder));
  }, [columnOrder]);

  const masterToSlaves = useMemo(() => {
    const map = new Map<string, ServiceChannel[]>();
    sortedChannels.forEach((channel) => {
      const masterSource = getMasterSource(channel);
      if (!masterSource) return;
      if (!map.has(masterSource)) map.set(masterSource, []);
      map.get(masterSource)!.push(channel);
    });
    return map;
  }, [sortedChannels]);

  const visibleRows = useMemo(() => {
    const ids = new Set(sortedChannels.map((c) => c.sourceId || c.id));
    const roots = sortedChannels.filter((channel) => {
      const masterSource = getMasterSource(channel);
      if (!masterSource) return true;
      return !ids.has(masterSource);
    });
    const rows: Array<{ channel: ServiceChannel; indent: number; relation: 'normal' | 'master' | 'slave'; parentId?: string }> = [];
    roots.forEach((root) => {
      const rootId = root.sourceId || root.id;
      const slaves = masterToSlaves.get(rootId) || [];
      const relation = slaves.length > 0 ? 'master' : (getMasterSource(root) ? 'slave' : 'normal');
      rows.push({ channel: root, indent: 0, relation });
      if (slaves.length > 0 && expandedMasters[root.id]) {
        slaves.forEach((slave) => rows.push({ channel: slave, indent: 1, relation: 'slave', parentId: root.id }));
      }
    });
    return rows;
  }, [expandedMasters, masterToSlaves, sortedChannels]);

  const handleSort = (key: 'name' | 'id' | 'platform' | 'type' | 'lang' | 'relationship') => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const handleColumnDrop = useCallback((target: ReorderableChannelColumnKey) => {
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

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="flex flex-row-reverse h-full bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-900)]">

      {/* ── Left Sidebar ── */}
      <div className={`flex-shrink-0 bg-white dark:bg-[var(--color-neutral-800)] border-l border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-72'}`}>
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
            {/* Sidebar header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
              <div className="flex items-center gap-2">
                <Tv2 size={16} className="text-[var(--color-primary-500)]" />
                <h2 className="text-sm font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                  Channel Filters
                </h2>
              </div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 rounded hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-500)]"
              >
                <ChevronUp size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search by name, call sign…"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="p-4 space-y-4 flex-1 overflow-auto">
              {/* Platform */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">
                  Platform
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PLATFORM_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPlatformFilter(opt.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        platformFilter === opt.value
                          ? 'bg-[var(--color-primary-600)] text-white'
                          : 'bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-700)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-200)] dark:hover:bg-[var(--color-neutral-600)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Channel Type */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">
                  Channel Type
                </label>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  {TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => { setPlatformFilter(''); setStatusFilter(''); setTypeFilter(''); }}
                  className="w-full text-xs text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] font-semibold"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Content header */}
        <div className="page-header-bar flex items-center justify-between px-6 py-3">
          <div className="text-sm text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
            {loading && channels.length === 0
              ? 'Loading…'
              : totalResults > 0
              ? `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalResults)} of ${totalResults} channel${totalResults !== 1 ? 's' : ''}`
              : 'No channels'}
          </div>
          <div className="flex items-center gap-2">
            {loading && channels.length > 0 && (
              <Loader2 size={16} className="animate-spin text-[var(--color-neutral-400)]" />
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto">
          {loading && channels.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
            </div>
          ) : channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Radio size={48} className="text-[var(--color-neutral-300)] mb-3" />
              <h3 className="text-lg font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">
                {searchQuery || hasActiveFilters ? 'No channels found' : 'No channels available'}
              </h3>
              <p className="text-sm text-[var(--color-neutral-400)] max-w-md">
                {searchQuery || hasActiveFilters
                  ? 'Try adjusting your search or removing filters.'
                  : 'No channels have been configured in the system.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-neutral-200)] dark:divide-[var(--color-neutral-700)]">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-2 bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-[10px] font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] sticky top-0 z-10 tracking-wider">
                {columnOrder.map((columnKey) => {
                  const meta = CHANNEL_COLUMN_META[columnKey];
                  const isDragged = draggedColumn === columnKey;
                  return (
                    <div
                      key={columnKey}
                      draggable
                      onDragStart={() => setDraggedColumn(columnKey)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleColumnDrop(columnKey)}
                      onDragEnd={() => setDraggedColumn(null)}
                      className={`${meta.headerClass} flex items-center gap-1 ${isDragged ? 'opacity-60' : ''}`}
                    >
                      <GripVertical size={12} className="text-[var(--color-neutral-400)] cursor-move flex-shrink-0" />
                      <button onClick={() => handleSort(columnKey)} className="text-inherit">
                        {meta.label}
                      </button>
                    </div>
                  );
                })}
                <div className={CHANNEL_COLUMN_META.actions.headerClass}>{CHANNEL_COLUMN_META.actions.label}</div>
              </div>

              {visibleRows.map(({ channel, indent, relation }) => {
                const displayName = getChannelDisplayName(channel);
                const isSlave = channel.dthInfo?.isSlave || !!channel.masterSource;
                const isActionOpen = actionMenuId === channel.id;
                const masterKey = channel.sourceId || channel.id;
                const slavesForMaster = masterToSlaves.get(masterKey) || [];
                const isMasterRow = relation === 'master';
                const rowLogo = channelLogos[channel.id] || channel.imageUrl || channel.channelImage || '';

                return (
                  <div key={channel.id} className="relative">
                    <div
                      onClick={() => handleViewDetails(channel)}
                      className={`grid grid-cols-12 gap-4 px-6 py-3 items-center text-sm transition-colors ${
                        isActionOpen
                          ? 'bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/10'
                          : 'hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-800)]'
                      }`}
                    >
                      {columnOrder.map((columnKey) => {
                        const meta = CHANNEL_COLUMN_META[columnKey];
                        if (columnKey === 'name') {
                          return (
                            <div key={columnKey} className={meta.cellClass}>
                              <div className="flex items-center gap-2">
                                {indent > 0 && <span className="ml-4" />}
                                {isMasterRow && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedMasters((prev) => ({ ...prev, [channel.id]: !prev[channel.id] }));
                                    }}
                                    className="p-0.5 rounded hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)]"
                                    title={expandedMasters[channel.id] ? 'Collapse slaves' : 'Expand slaves'}
                                  >
                                    {expandedMasters[channel.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                  </button>
                                )}
                                {!isMasterRow && indent === 0 && <span className="w-[13px]" />}
                                {rowLogo ? (
                                  <img
                                    src={rowLogo}
                                    alt={`${displayName} logo`}
                                    className="w-8 h-8 rounded border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] object-cover bg-black/70"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded border border-dashed border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-700)] bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-800)]" />
                                )}
                                {isSlave && (
                                  <span title="Slave channel (linked to master)">
                                    <Link2 size={12} className="text-[var(--color-neutral-400)] flex-shrink-0" />
                                  </span>
                                )}
                                {(channel as any).contentLock && (
                                  <Lock size={12} className="text-amber-500 flex-shrink-0" />
                                )}
                                <span className="font-medium text-[var(--color-neutral-800)] dark:text-white truncate">
                                  {displayName}
                                </span>
                              </div>
                              {channel.callSign && channel.callSign !== displayName && (
                                <div className="text-xs text-[var(--color-neutral-400)] font-mono mt-0.5 truncate">
                                  {channel.callSign}
                                </div>
                              )}
                            </div>
                          );
                        }
                        if (columnKey === 'id') {
                          return <div key={columnKey} className={meta.cellClass}>{channel.sourceId || channel.id}</div>;
                        }
                        if (columnKey === 'platform') {
                          return (
                            <div key={columnKey} className={meta.cellClass}>
                              {channel.channelTarget && (
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPlatformColor(channel.channelTarget)}`}>
                                  {channel.channelTarget}
                                </span>
                              )}
                            </div>
                          );
                        }
                        if (columnKey === 'type') {
                          return (
                            <div key={columnKey} className={meta.cellClass}>
                              {channel.channelType && (
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getTypeColor(channel.channelType)}`}>
                                  {channel.channelType}
                                </span>
                              )}
                            </div>
                          );
                        }
                        if (columnKey === 'lang') {
                          return (
                            <div key={columnKey} className={meta.cellClass}>
                              {channel.language && (
                                <span className="flex items-center justify-center gap-1 text-xs text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                                  <Globe size={11} />
                                  {channel.language.toUpperCase()}
                                </span>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div key={columnKey} className={meta.cellClass}>
                            {relation === 'master' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-primary-100)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/30 dark:text-[var(--color-primary-300)]">
                                Master ({slavesForMaster.length})
                              </span>
                            )}
                            {relation === 'slave' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                Slave
                              </span>
                            )}
                            {relation === 'normal' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] dark:bg-[var(--color-neutral-700)] dark:text-[var(--color-neutral-400)]">
                                Normal
                              </span>
                            )}
                          </div>
                        );
                      })}
                      <div className={CHANNEL_COLUMN_META.actions.cellClass}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuId(isActionOpen ? null : channel.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isActionOpen
                              ? 'bg-[var(--color-primary-100)] dark:bg-[var(--color-primary-900)]/20 text-[var(--color-primary-600)]'
                              : 'text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] hover:text-[var(--color-neutral-700)] dark:hover:text-[var(--color-neutral-300)]'
                          }`}
                          title="Channel actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Dropdown action menu */}
                    {isActionOpen && (
                      <RowActionMenu
                        channel={channel}
                        onGoToSchedule={() => handleGoToSchedule(channel)}
                        onViewAssets={() => handleViewAssets(channel)}
                        onLinkToMaster={() => handleOpenLinkModal(channel)}
                        onClose={() => setActionMenuId(null)}
                      />
                    )}
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 0 || loading}
                    className="px-4 py-2 text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-[var(--color-neutral-500)]">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages - 1 || loading}
                    className="px-4 py-2 text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Panel overlay (slide-over) ── */}
      {detailChannel && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20"
            onClick={() => setDetailChannel(null)}
          />
          <ChannelDetailPanel
            channel={detailChannel}
            onClose={() => setDetailChannel(null)}
            onGoToSchedule={() => { handleGoToSchedule(detailChannel); setDetailChannel(null); }}
            onViewAssets={() => { handleViewAssets(detailChannel); setDetailChannel(null); }}
            onLinkToMaster={() => { setLinkChannel(detailChannel); setDetailChannel(null); }}
          />
        </>
      )}

      {/* ── Link to Master Modal ── */}
      {linkChannel && (
        <LinkMasterModal
          channel={linkChannel}
          onClose={() => setLinkChannel(null)}
          onSuccess={handleLinkSuccess}
        />
      )}
    </div>
  );
};

export default ChannelsPage;
