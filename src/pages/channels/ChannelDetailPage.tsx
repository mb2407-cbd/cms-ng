import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Shield,
  Save,
  Tv,
  Upload,
  Loader2,
  Wand,
  Trash2,
  X,
  Search,
} from 'lucide-react';
import {
  getChannelDetails,
  getChannelImages,
  getMasterChannelOfSlave,
  requestGuide,
  saveChannelImagesForm,
  saveProviderMappings,
  searchProviders,
  searchProvidersByPlatform,
  toggleChannelProperty,
  updateChannel,
} from '../../services/channel.service';
import { useAuth } from '../../context/AuthContext';
import type { ProviderChannel, ServiceChannel } from '../../types/channel.types';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const unwrapResponse = <T,>(raw: any): T | null => {
  if (!raw) return null;
  return (raw.response || raw.data || raw) as T;
};

const getChannelDisplayName = (channel?: ServiceChannel | null): string => {
  if (!channel) return '';
  if (channel.channelNames && channel.channelNames.length > 0) {
    const enName = channel.channelNames.find((n) => n.lang === 'en' || n.lang === 'EN');
    return (enName || channel.channelNames[0]).value || channel.name || channel.callSign || channel.id;
  }
  return channel.name || channel.callSign || channel.id;
};

const getNameByType = (items: Array<{ value: string; type?: string }> | undefined, type: string): string => {
  if (!items?.length) return '';
  const item = items.find((entry) => (entry.type || '').toLowerCase() === type.toLowerCase());
  return item?.value || '';
};

const getPrgSvcId = (channel?: ServiceChannel | null): string => {
  if (!channel) return '0';
  if (channel.prgSvcId) return channel.prgSvcId;
  const firstDaypart = channel.dayParts?.[0] as any;
  const firstMapping = firstDaypart?.mappings?.[0] as any;
  return firstMapping?.prgSvcId || '0';
};

const formatDateTime = (value?: string): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

const formatDate = (value?: string): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
};

const getProviderPlatformBadgeClass = (platform?: string): string => {
  const value = (platform || '').trim().toUpperCase();
  if (value === 'OTT') return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
  if (value === 'DTH') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  if (value === 'BOTH') return 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/30 dark:text-[var(--color-primary-300)]';
  return 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] dark:bg-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]';
};

const toIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isAllowAllRightsEnabled = (): boolean => {
  if (import.meta.env.VITE_AUTH_ALLOW_ALL_RIGHTS === 'true') return true;
  try {
    const raw = localStorage.getItem('vls_allow_all_rights');
    if (!raw) return false;
    const normalized = raw.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
  } catch {
    return false;
  }
};

const Field: React.FC<{
  label: string;
  value?: string | number | boolean | null;
  mono?: boolean;
  className?: string;
}> = ({ label, value, mono, className }) => (
  <div className={`min-h-[56px] ${className || ''}`}>
    <dt className="text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1">
      {label}
    </dt>
    <dd className={`text-sm leading-5 text-[var(--color-neutral-800)] dark:text-white break-words ${mono ? 'font-mono text-xs' : ''}`}>
      {value === null || value === undefined || value === '' ? (
        <span className="text-[var(--color-neutral-400)] italic">—</span>
      ) : typeof value === 'boolean' ? (
        value ? 'Yes' : 'No'
      ) : (
        String(value)
      )}
    </dd>
  </div>
);

const editableInputClass = 'w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]';
const readOnlyInputClass = 'w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]';

const EditableField: React.FC<{
  label: string;
  value?: string | null;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  type?: 'text' | 'date' | 'textarea';
  mono?: boolean;
  rows?: number;
}> = ({ label, value, onChange, readOnly, type = 'text', mono, rows = 3 }) => (
  <div>
    <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1">
      {label}
    </label>
    {type === 'textarea' ? (
      <textarea
        rows={rows}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className={`${readOnly ? readOnlyInputClass : editableInputClass} resize-y`}
      />
    ) : (
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className={`${readOnly ? readOnlyInputClass : editableInputClass} ${mono ? 'font-mono text-xs' : ''}`}
      />
    )}
  </div>
);

const parseCsv = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const FlagToggle: React.FC<{ label: string; active?: boolean; onToggle: () => void; disabled?: boolean }> = ({
  label,
  active,
  onToggle,
  disabled,
}) => (
  <button
    disabled={disabled}
    onClick={onToggle}
    className={`px-2 py-1 rounded-md text-xs font-semibold border transition-colors ${
      active
        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/40'
        : 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)] border-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-700)] dark:text-[var(--color-neutral-400)] dark:border-[var(--color-neutral-600)]'
    } disabled:opacity-50`}
  >
    {label}
  </button>
);

const ChannelDetailPage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { hasRight, user } = useAuth();

  const routeStateChannel = (location.state as any)?.channel as ServiceChannel | undefined;
  const [editedChannel, setEditedChannel] = useState<ServiceChannel | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [flash, setFlash] = useState<string>('');
  const [errorFlash, setErrorFlash] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string>('');
  const [requestingGuide, setRequestingGuide] = useState(false);
  const [savingDayparts, setSavingDayparts] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'dayparts'>('overview');
  const [providerSearch, setProviderSearch] = useState('');
  const [providerSourceFilter, setProviderSourceFilter] = useState<'ALL' | 'OTT' | 'DTH' | 'Both'>('ALL');
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerChannelsAll, setProviderChannelsAll] = useState<ProviderChannel[]>([]);
  const [providerPage, setProviderPage] = useState(0);
  const [providerPageSize] = useState(20);
  const [showDaypartDialog, setShowDaypartDialog] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<ProviderChannel | null>(null);
  const [draggedProvider, setDraggedProvider] = useState<ProviderChannel | null>(null);
  const [daypartDraft, setDaypartDraft] = useState({
    startDate: toIsoDate(new Date()),
    endDate: toIsoDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    lang: 'en',
  });

  const hasAnyRight = (...rights: string[]): boolean => rights.some((right) => hasRight(right));
  const bypassRights = isAllowAllRightsEnabled();

  const canRead = bypassRights || hasAnyRight('channel:read', 'channel.read', 'channel:*', '*:*');
  const canMap = bypassRights || hasAnyRight('channel:map', 'channel.map', 'channel:write', 'channel.write', 'channel:*', '*:*');
  const canUpdate = bypassRights || hasAnyRight('channel:update', 'channel.update', 'channel:write', 'channel.write', 'channel:*', '*:*');
  const canUpdateImage = bypassRights || hasAnyRight('channel:updateimage', 'channel.updateimage', 'channel:write', 'channel.write', 'channel:*', '*:*');

  const {
    data: channelResponse,
    isLoading,
    error,
    refetch: refetchChannel,
  } = useQuery({
    queryKey: ['channel-detail', channelId],
    queryFn: () => getChannelDetails(channelId!),
    enabled: !!channelId && canRead,
  });

  const fetchedChannel = (unwrapResponse<ServiceChannel>(channelResponse) || routeStateChannel || null) as ServiceChannel | null;

  useEffect(() => {
    if (fetchedChannel && !hasUnsavedChanges) {
      setEditedChannel(fetchedChannel);
    }
  }, [fetchedChannel, hasUnsavedChanges]);

  const channel = editedChannel || fetchedChannel;
  const prgSvcId = getPrgSvcId(channel);

  const {
    data: imageResponse,
    refetch: refetchImage,
  } = useQuery({
    queryKey: ['channel-image', channelId, prgSvcId],
    queryFn: () => getChannelImages(channelId!, prgSvcId),
    enabled: !!channelId && !!channel,
  });

  const channelImagePayload = unwrapResponse<any>(imageResponse);

  const channelImage = useMemo(() => {
    if (!channelImagePayload) return '';
    if (channelImagePayload.imageURL) return channelImagePayload.imageURL;
    if (channelImagePayload.baseUrl && channelImagePayload.uri) return `${channelImagePayload.baseUrl}${channelImagePayload.uri}`;
    return channelImagePayload.uri || '';
  }, [channelImagePayload]);

  const masterSource = channel?.dthInfo?.masterSource || channel?.masterSource;

  const { data: masterChannelResponse } = useQuery({
    queryKey: ['channel-master', masterSource],
    queryFn: () => getMasterChannelOfSlave(masterSource!),
    enabled: !!masterSource,
  });

  const masterChannel = unwrapResponse<ServiceChannel>(masterChannelResponse);

  const dayparts = channel?.dayParts || [];

  const getProviderSources = (): string[] => {
    if (providerSourceFilter === 'ALL') return ['OTT', 'DTH', 'Both'];
    return [providerSourceFilter];
  };

  useEffect(() => {
    if (activeTab !== 'dayparts') return;
    let cancelled = false;
    const loadProviders = async () => {
      setProviderLoading(true);
      try {
        const searchString = providerSearch.trim();
        const source = getProviderSources();
        let response: any;
        try {
          response = await searchProvidersByPlatform(source, searchString, 1, 500);
        } catch {
          response = await searchProviders(source, searchString, 1, 500);
        }
        const payload = response?.response || response?.data || response;
        const listRaw = (payload?.content || payload || []) as any[];
        const list = (Array.isArray(listRaw) ? listRaw : []).map((item: any) => {
          const names = Array.isArray(item?.names) ? item.names : [];
          const shortName = names.find((n: any) => n?.key === 'shortName')?.value;
          const prgSvcId = item?.prgSvcId || item?.channelId || item?.id;
          return {
            ...item,
            name: item?.name || shortName || item?.id,
            prgSvcId,
          } as ProviderChannel;
        }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        if (!cancelled) {
          setProviderChannelsAll(list);
        }
      } catch {
        if (!cancelled) {
          setProviderChannelsAll([]);
        }
      } finally {
        if (!cancelled) setProviderLoading(false);
      }
    };
    void loadProviders();
    return () => { cancelled = true; };
  }, [activeTab, providerSearch, providerSourceFilter]);

  useEffect(() => {
    setProviderPage(0);
  }, [providerSearch, providerSourceFilter]);

  const providerTotal = providerChannelsAll.length;
  const providerTotalPages = Math.max(1, Math.ceil(providerTotal / providerPageSize));
  const providerChannels = providerChannelsAll.slice(
    providerPage * providerPageSize,
    (providerPage + 1) * providerPageSize
  );

  const channelName = getChannelDisplayName(channel);
  const shortDescription = getNameByType(channel?.descriptions as any, 'short') || channel?.shortDescription || '';
  const fullDescription = getNameByType(channel?.descriptions as any, 'full') || channel?.fullDescription || '';
  const regionValue = channel?.regions?.map((r) => r.name || r.regionName || r.abbrev || r.id).join(', ') || '';
  const categoryValue = channel?.categories?.map((c) => c.name).join(', ') || '';
  const serviceProviderValue = channel?.serviceProviderInfo?.serviceProvider?.name || channel?.serviceProviderInfo?.serviceProvider?.providerID || '';
  const serviceProviderCategoriesValue = channel?.serviceProviderInfo?.serviceProviderCategories?.map((c) => c.name || c.providerID).join(', ') || '';

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<ServiceChannel>) => updateChannel(payload),
    onSuccess: async () => {
      await refetchChannel();
      queryClient.invalidateQueries({ queryKey: ['channel-detail', channelId] });
      setHasUnsavedChanges(false);
      setFlash('Channel details saved.');
      setErrorFlash('');
    },
    onError: (err: any) => {
      setErrorFlash(err?.message || 'Unable to save channel details.');
    },
  });

  const updateEditedChannel = (updater: (prev: ServiceChannel) => ServiceChannel) => {
    setEditedChannel((prev) => {
      if (!prev) return prev;
      return updater(prev);
    });
    setHasUnsavedChanges(true);
    setFlash('');
    setErrorFlash('');
  };

  const updateDescriptionByType = (type: 'short' | 'full', value: string) => {
    updateEditedChannel((prev) => {
      const descriptions = [...(prev.descriptions || [])] as Array<{ value: string; type?: string; lang?: string }>;
      const idx = descriptions.findIndex((entry) => (entry.type || '').toLowerCase() === type);
      if (idx >= 0) {
        descriptions[idx] = { ...descriptions[idx], value };
      } else {
        descriptions.push({ type, lang: 'en', value });
      }
      return {
        ...prev,
        descriptions: descriptions as any,
        ...(type === 'short' ? { shortDescription: value } : { fullDescription: value }),
      };
    });
  };

  const handleSave = () => {
    if (!channel || !canUpdate || updateMutation.isPending) return;
    updateMutation.mutate(channel);
  };

  const handleClose = () => {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) return;
    navigate('/channels');
  };

  const handleFlagToggle = async (property: 'status' | 'adult' | 'auto-transmit' | 'bubble' | 'ppv', value: boolean) => {
    if (!channel || !channel.id || !canUpdate) return;
    setErrorFlash('');
    setFlash('');
    setToggleLoading(property);
    try {
      await toggleChannelProperty(channel.id, property, value, user?.id || user?.username || 'admin');
      await refetchChannel();
      setFlash(`${property} updated successfully.`);
    } catch (err: any) {
      setErrorFlash(err?.message || `Unable to update ${property}.`);
    } finally {
      setToggleLoading('');
    }
  };

  const handleRequestGuide = async (days: number) => {
    if (!channel) return;
    const sourceId = channel.sourceId || channel.id;
    if (!sourceId || !prgSvcId) {
      setErrorFlash('Channel sourceId or prgSvcId is missing.');
      return;
    }
    const startDate = toIsoDate(new Date());
    const endDate = toIsoDate(new Date(Date.now() + (days - 1) * 24 * 60 * 60 * 1000));
    setErrorFlash('');
    setFlash('');
    setRequestingGuide(true);
    try {
      await requestGuide(prgSvcId, startDate, endDate, sourceId);
      setFlash(`Guide request sent for ${days} days (${startDate} to ${endDate}).`);
    } catch (err: any) {
      setErrorFlash(err?.message || 'Failed to request guide.');
    } finally {
      setRequestingGuide(false);
    }
  };

  const handleSaveImage = async () => {
    if (!channel || !selectedImageFile || !canUpdateImage) return;
    setErrorFlash('');
    setFlash('');
    setUploadingImage(true);
    try {
      await saveChannelImagesForm({
        channelId: channel.id,
        prgSvcId,
        channelImages: [
          {
            id: channelImagePayload?.id,
            uri: channelImagePayload?.uri,
            ratio: channelImagePayload?.ratio || '4:3',
            width: channelImagePayload?.width || 0,
            height: channelImagePayload?.height || 0,
            category: channelImagePayload?.category || 'Logo',
            published: true,
            imageFile: selectedImageFile,
          },
        ],
      });
      setSelectedImageFile(null);
      await refetchImage();
      setFlash('Channel image updated successfully.');
    } catch (err: any) {
      setErrorFlash(err?.message || 'Failed to update channel image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const persistDayparts = async (nextDayparts: any[], successMessage: string) => {
    if (!channel) return;
    const payload: Partial<ServiceChannel> = {
      ...channel,
      dayParts: nextDayparts,
      dayPartIndex: Math.max(0, nextDayparts.length - 1),
      mappingIndex: nextDayparts.length > 0 ? (((nextDayparts[nextDayparts.length - 1] as any).mappings || []).length - 1) : 0,
      prgSvcId: pendingProvider?.prgSvcId || getPrgSvcId(channel),
    };
    setSavingDayparts(true);
    try {
      await saveProviderMappings(payload);
      await refetchChannel();
      queryClient.invalidateQueries({ queryKey: ['channel-detail', channelId] });
      setFlash(successMessage);
    } catch (err: any) {
      setErrorFlash(err?.message || 'Failed to update dayparts.');
    } finally {
      setSavingDayparts(false);
    }
  };

  const handleDropProvider = (provider: ProviderChannel) => {
    setPendingProvider(provider);
    setDaypartDraft({
      startDate: toIsoDate(new Date()),
      endDate: toIsoDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      lang: provider.lang || 'en',
    });
    setShowDaypartDialog(true);
  };

  const handleConfirmAddDaypart = async () => {
    if (!channel || !pendingProvider || !canMap) return;
    const nextDayparts = [...(channel.dayParts || [])] as any[];
    const start = `${daypartDraft.startDate}T00:00:00.000Z`;
    const end = `${daypartDraft.endDate}T23:59:59.000Z`;
    const providerId = pendingProvider.prgSvcId || (pendingProvider as any).channelId || pendingProvider.id;
    const newDaypart = {
      startDate: start,
      endDate: end,
      mappings: [
        {
          startDate: start,
          endDate: end,
          prgSvcId: providerId,
          lang: daypartDraft.lang || pendingProvider.lang || 'en',
          name: pendingProvider.name,
        },
      ],
    };
    setErrorFlash('');
    setFlash('');
    await persistDayparts([...nextDayparts, newDaypart], `Created daypart and mapped provider ${providerId}.`);
    setShowDaypartDialog(false);
    setPendingProvider(null);
  };

  const handleDeleteDaypart = async (index: number) => {
    if (!channel || !canMap) return;
    const nextDayparts = [...(channel.dayParts || [])];
    nextDayparts.splice(index, 1);
    setErrorFlash('');
    setFlash('');
    await persistDayparts(nextDayparts, 'Daypart deleted.');
  };

  if (!canRead) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8 rounded-xl border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)] max-w-lg">
          <Shield className="mx-auto mb-3 text-[var(--color-neutral-400)]" size={28} />
          <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white">Access denied</h2>
          <p className="text-sm text-[var(--color-neutral-500)] mt-2">
            You need `channel:read` permission to view channel details.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading channel details..." />
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-lg rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 p-6">
          <AlertCircle className="mx-auto mb-3 text-red-600 dark:text-red-400" size={30} />
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">Unable to load channel details</h2>
          <p className="text-sm text-red-700 dark:text-red-400 mt-2">
            Please check that this channel exists and try again.
          </p>
          <button
            onClick={() => navigate('/channels')}
            className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-[var(--color-neutral-900)] border border-red-200 dark:border-red-800 text-sm font-medium text-red-700 dark:text-red-300"
          >
            <ArrowLeft size={14} />
            Back to channels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50">
      <div className="flex-1 flex flex-col bg-white dark:bg-[var(--color-neutral-900)] m-4 rounded-lg shadow-2xl overflow-hidden">
        <div className="relative">
          {channelImage && (
            <div className="absolute inset-0 overflow-hidden rounded-t-lg">
              <img src={channelImage} alt="" className="w-full h-full object-cover opacity-[0.14] dark:opacity-[0.1]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white dark:from-[var(--color-neutral-900)]/50 dark:via-transparent dark:to-[var(--color-neutral-900)]" />
            </div>
          )}
          <div className="relative flex items-center justify-between px-6 py-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {channelImage && (
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] flex-shrink-0 bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-900)]">
                  <img src={channelImage} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <button
                  onClick={handleClose}
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] mb-0.5 transition-colors"
                >
                  <ArrowLeft size={12} />
                  <span>Back to Channels</span>
                </button>
                <div className="flex items-center gap-2">
                  <Tv size={18} className="text-[var(--color-primary-500)]" />
                  <h1 className="text-xl font-bold text-[var(--color-neutral-800)] dark:text-white truncate">{channelName}</h1>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {channel.channelType}
                  </span>
                  {channel.published && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Published
                    </span>
                  )}
                  <span className="text-xs font-mono text-[var(--color-neutral-500)]">{channel.id}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                  <AlertCircle size={16} />
                  Unsaved
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={!canUpdate || !hasUnsavedChanges || updateMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => navigate(`/channels/${channel.id}/schedule`, { state: { channel, channelImage } })}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)]"
              >
                <CalendarDays size={14} />
                View schedule
              </button>
              <button
                onClick={handleClose}
                className="p-2 text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-800)] rounded-lg transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {(flash || errorFlash) && (
          <div className="px-6 pt-2 space-y-2">
            {flash && (
              <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 dark:border-green-800/40 dark:bg-green-900/20 dark:text-green-300 px-3 py-2 text-sm">{flash}</div>
            )}
            {errorFlash && (
              <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-300 px-3 py-2 text-sm">{errorFlash}</div>
            )}
          </div>
        )}

        {activeTab === 'overview' ? (
          <>
            <div className="flex gap-1 px-6 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
              <button
                onClick={() => setActiveTab('overview')}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors border-[var(--color-primary-600)] text-[var(--color-primary-600)]"
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('dayparts')}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors border-transparent text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-800)] dark:hover:text-[var(--color-neutral-200)]"
              >
                Dayparts & Mapping
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto px-6 py-5 space-y-2">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 space-y-6">
              <section className="p-1">
                <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">Channel Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <EditableField
                    label="Channel Name"
                    value={channelName}
                    readOnly={!canUpdate}
                    onChange={(value) =>
                      updateEditedChannel((prev) => {
                        const names = [...(prev.channelNames || [])];
                        const enIdx = names.findIndex((n) => (n.lang || '').toLowerCase() === 'en');
                        if (enIdx >= 0) {
                          names[enIdx] = { ...names[enIdx], value };
                        } else {
                          names.unshift({ lang: 'en', type: 'shortName', value });
                        }
                        return { ...prev, name: value, channelNames: names };
                      })
                    }
                  />
                  <EditableField label="Source ID" value={channel.sourceId || ''} readOnly mono />
                  <EditableField
                    label="Platform"
                    value={channel.channelTarget || ''}
                    readOnly={!canUpdate}
                    onChange={(value) => updateEditedChannel((prev) => ({ ...prev, channelTarget: value }))}
                  />
                  <EditableField
                    label="Type"
                    value={channel.channelType || ''}
                    readOnly={!canUpdate}
                    onChange={(value) => updateEditedChannel((prev) => ({ ...prev, channelType: value }))}
                  />
                  <EditableField
                    label="Language"
                    value={channel.language || ''}
                    readOnly={!canUpdate}
                    onChange={(value) => updateEditedChannel((prev) => ({ ...prev, language: value }))}
                  />
                  <EditableField
                    label="Timezone"
                    value={channel.timeZoneName || channel.timeZone || ''}
                    readOnly={!canUpdate}
                    onChange={(value) => updateEditedChannel((prev) => ({ ...prev, timeZoneName: value, timeZone: value }))}
                  />
                  <EditableField
                    label="Call Sign"
                    value={channel.callSign || ''}
                    readOnly={!canUpdate}
                    onChange={(value) => updateEditedChannel((prev) => ({ ...prev, callSign: value }))}
                  />
                  <EditableField
                    label="Owner / Source"
                    value={channel.channelSrc || ''}
                    readOnly={!canUpdate}
                    onChange={(value) => updateEditedChannel((prev) => ({ ...prev, channelSrc: value }))}
                  />
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">Metadata</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <EditableField
                      label="Description (full)"
                      value={fullDescription}
                      type="textarea"
                      rows={4}
                      readOnly={!canUpdate}
                      onChange={(value) => updateDescriptionByType('full', value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <EditableField
                      label="Description (short)"
                      value={shortDescription}
                      type="textarea"
                      rows={3}
                      readOnly={!canUpdate}
                      onChange={(value) => updateDescriptionByType('short', value)}
                    />
                  </div>
                  <EditableField
                    label="Regions (comma separated)"
                    value={regionValue}
                    readOnly={!canUpdate}
                    onChange={(value) =>
                      updateEditedChannel((prev) => ({
                        ...prev,
                        regions: parseCsv(value).map((name) => ({ id: name, name })),
                      }))
                    }
                  />
                  <EditableField
                    label="Categories (comma separated)"
                    value={categoryValue}
                    readOnly={!canUpdate}
                    onChange={(value) =>
                      updateEditedChannel((prev) => ({
                        ...prev,
                        categories: parseCsv(value).map((name) => ({ id: name, name })),
                      }))
                    }
                  />
                  <EditableField
                    label="Service Provider"
                    value={serviceProviderValue}
                    readOnly={!canUpdate}
                    onChange={(value) =>
                      updateEditedChannel((prev) => ({
                        ...prev,
                        serviceProviderInfo: {
                          ...(prev.serviceProviderInfo || {}),
                          serviceProvider: {
                            ...(prev.serviceProviderInfo?.serviceProvider || {}),
                            name: value,
                            providerID: prev.serviceProviderInfo?.serviceProvider?.providerID || value,
                          },
                        },
                      }))
                    }
                  />
                  <EditableField
                    label="Service Provider Categories (comma separated)"
                    value={serviceProviderCategoriesValue}
                    readOnly={!canUpdate}
                    onChange={(value) =>
                      updateEditedChannel((prev) => ({
                        ...prev,
                        serviceProviderInfo: {
                          ...(prev.serviceProviderInfo || {}),
                          serviceProviderCategories: parseCsv(value).map((name) => ({ name, providerID: name })),
                        },
                      }))
                    }
                  />
                  <EditableField
                    label="License Start"
                    value={channel.licenseStartDate ? channel.licenseStartDate.slice(0, 10) : ''}
                    type="date"
                    readOnly={!canUpdate}
                    onChange={(value) => updateEditedChannel((prev) => ({ ...prev, licenseStartDate: value }))}
                  />
                  <EditableField
                    label="License End"
                    value={channel.licenseEndDate ? channel.licenseEndDate.slice(0, 10) : ''}
                    type="date"
                    readOnly={!canUpdate}
                    onChange={(value) => updateEditedChannel((prev) => ({ ...prev, licenseEndDate: value }))}
                  />
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">DRM / CDN</h2>
                {channel.urls && channel.urls.length > 0 ? (
                  <div className="space-y-2">
                    {channel.urls.map((url, index) => (
                      <div
                        key={`${url.resolution}-${index}`}
                        className="p-3 rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 text-sm">
                            <div>
                              <span className="text-xs text-[var(--color-neutral-500)]">Profile</span>
                              <div className="font-medium text-[var(--color-neutral-800)] dark:text-white">
                                URL #{index + 1}
                              </div>
                              <div className="text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-300)]">
                                {url.resolution || '—'} · {url.contentType || '—'} · {(url.lang || '—').toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-[var(--color-neutral-500)]">DRM</span>
                              {url.drms?.length ? (
                                <div className="space-y-1">
                                  {url.drms.map((drm) => (
                                    <div key={drm.drmId} className="text-[var(--color-neutral-800)] dark:text-white">
                                      <span className="font-medium">{drm.drm || drm.name}</span>
                                      <span className="text-[var(--color-neutral-500)]"> · {drm.vendorName || drm.vendorId}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[var(--color-neutral-500)]">No DRM configured</div>
                              )}
                            </div>
                            <div>
                              <span className="text-xs text-[var(--color-neutral-500)]">CDN</span>
                              {url.cdns?.length ? (
                                <div className="space-y-1">
                                  {url.cdns.map((cdn, idx) => (
                                    <div key={`${cdn.vendorId}-${idx}`} className="text-[var(--color-neutral-800)] dark:text-white">
                                      <span className="font-medium">{cdn.vendorName || cdn.vendorId}</span>
                                      <span className="text-[var(--color-neutral-500)]"> · {cdn.baseUrl}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[var(--color-neutral-500)]">No CDN configured</div>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                              {((url.drms?.length || 0) + (url.cdns?.length || 0))} refs
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-neutral-500)]">No DRM/CDN entries configured.</p>
                )}
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-xl border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)] p-5">
                <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">Channel Image</h2>
                {channelImage ? (
                  <img
                    src={channelImage}
                    alt={`${channelName} logo`}
                    className="w-full rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-black/80"
                  />
                ) : (
                  <div className="h-36 rounded-lg border border-dashed border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] flex items-center justify-center text-sm text-[var(--color-neutral-500)]">
                    No image available
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <label className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedImageFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    Choose Image
                  </label>
                  <button
                    disabled={!selectedImageFile || !canUpdateImage || uploadingImage}
                    onClick={handleSaveImage}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingImage ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    Edit image
                  </button>
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)] p-5">
                <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">Flags</h2>
                <div className="flex flex-wrap gap-2">
                  <FlagToggle
                    label="Published"
                    active={channel.published}
                    disabled={toggleLoading === 'status' || !canUpdate}
                    onToggle={() => handleFlagToggle('status', !channel.published)}
                  />
                  <FlagToggle
                    label="Adult"
                    active={channel.adult}
                    disabled={toggleLoading === 'adult' || !canUpdate}
                    onToggle={() => handleFlagToggle('adult', !channel.adult)}
                  />
                  <FlagToggle
                    label="PPV"
                    active={channel.ppv}
                    disabled={toggleLoading === 'ppv' || !canUpdate}
                    onToggle={() => handleFlagToggle('ppv', !channel.ppv)}
                  />
                  <FlagToggle
                    label="Auto"
                    active={channel.auto}
                    disabled={toggleLoading === 'auto-transmit' || !canUpdate}
                    onToggle={() => handleFlagToggle('auto-transmit', !channel.auto)}
                  />
                  <FlagToggle
                    label="Bubble"
                    active={channel.bubble}
                    disabled={toggleLoading === 'bubble' || !canUpdate}
                    onToggle={() => handleFlagToggle('bubble', !channel.bubble)}
                  />
                  <span className="px-2 py-1 rounded-md text-xs font-semibold bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)] dark:bg-[var(--color-neutral-700)] dark:text-[var(--color-neutral-400)]">
                    Has Schedule: {channel.hasSchedule ? 'Yes' : 'No'}
                  </span>
                  <span className="px-2 py-1 rounded-md text-xs font-semibold bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)] dark:bg-[var(--color-neutral-700)] dark:text-[var(--color-neutral-400)]">
                    Engineering: {channel.dthInfo?.isEngineering ? 'Yes' : 'No'}
                  </span>
                  <span className="px-2 py-1 rounded-md text-xs font-semibold bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)] dark:bg-[var(--color-neutral-700)] dark:text-[var(--color-neutral-400)]">
                    Slave: {channel.dthInfo?.isSlave || !!channel.masterSource ? 'Yes' : 'No'}
                  </span>
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)] p-5">
                <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">Master / DTH</h2>
                <dl className="space-y-3">
                  <Field label="Viewer Number" value={channel.dthInfo?.viewerNumber} />
                  <Field label="Resolution" value={channel.dthInfo?.channelResolution} />
                  <Field label="Master Source" value={masterSource} mono />
                  <Field label="Master Channel Name" value={getChannelDisplayName(masterChannel)} />
                </dl>
              </section>

              <section className="rounded-xl border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)] p-5">
                <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">Audit</h2>
                <dl className="space-y-3">
                  <Field label="Created" value={formatDateTime(channel.createdDate)} />
                  <Field label="Last Updated" value={formatDateTime(channel.updatedDate)} />
                </dl>
              </section>
            </div>
          </div>
            </div>
          </>
        ) : (
          <div className="flex-1 min-h-0 flex">
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex gap-1 px-6 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
                <button
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-3 text-sm font-medium border-b-2 transition-colors border-transparent text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-800)] dark:hover:text-[var(--color-neutral-200)]"
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('dayparts')}
                  className="px-4 py-3 text-sm font-medium border-b-2 transition-colors border-[var(--color-primary-600)] text-[var(--color-primary-600)]"
                >
                  Dayparts & Mapping
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-auto px-6 py-5">
                <section className="text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white">Daypart Configuration</h2>
                <div className="flex items-center gap-2">
                  <button
                    disabled={requestingGuide}
                    onClick={() => handleRequestGuide(14)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] disabled:opacity-50"
                  >
                    {requestingGuide ? <Loader2 size={14} className="animate-spin" /> : <Wand size={14} />}
                    Request Guide (14d)
                  </button>
                  <button
                    disabled={requestingGuide}
                    onClick={() => handleRequestGuide(3)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] disabled:opacity-50"
                  >
                    {requestingGuide ? <Loader2 size={14} className="animate-spin" /> : <Wand size={14} />}
                    Request Guide (3d)
                  </button>
                </div>
              </div>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const raw = e.dataTransfer.getData('application/json');
                  if (raw) {
                    const parsed = JSON.parse(raw) as ProviderChannel;
                    handleDropProvider(parsed);
                    return;
                  }
                  if (draggedProvider) handleDropProvider(draggedProvider);
                }}
                className="rounded-lg border-2 border-dashed border-[var(--color-primary-300)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/10 px-4 py-3 text-sm text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-300)] mb-4"
              >
                Drag a provider channel here to create a new daypart mapping.
              </div>

              {dayparts.length === 0 ? (
                <p className="text-sm text-[var(--color-neutral-500)]">No dayparts configured.</p>
              ) : (
                <div className="space-y-3">
                  {dayparts.map((daypart: any, index: number) => (
                    <div key={`${daypart.startDate}-${index}`} className="rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                          Daypart {index + 1}: {formatDate(daypart.startDate)} - {formatDate(daypart.endDate)}
                        </div>
                        <button
                          disabled={!canMap || savingDayparts}
                          onClick={() => handleDeleteDaypart(index)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-red-200 text-red-600 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-300 disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                          Delete Daypart
                        </button>
                      </div>
                      <div className="overflow-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--color-neutral-500)] border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
                              <th className="py-2 pr-3">Mapping Window</th>
                              <th className="py-2 pr-3">Lang</th>
                              <th className="py-2 pr-3">Provider Channel (prgSvcId)</th>
                              <th className="py-2">Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            {((daypart.mappings || []) as any[]).map((mapping, mappingIdx) => (
                              <tr key={`${index}-${mappingIdx}`} className="border-b border-[var(--color-neutral-100)] dark:border-[var(--color-neutral-800)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                                <td className="py-2 pr-3">{formatDate(mapping.startDate)} - {formatDate(mapping.endDate)}</td>
                                <td className="py-2 pr-3 uppercase">{mapping.lang || '—'}</td>
                                <td className="py-2 pr-3 font-mono text-xs">{mapping.prgSvcId || '—'}</td>
                                <td className="py-2">{mapping.name || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
                </section>
              </div>
            </div>

            <section className="w-72 border-l border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-800)] flex flex-col min-h-0">
              <div className="p-3 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
                <h3 className="text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-3 uppercase tracking-wider">
                  Provider Channels ({providerTotal})
                </h3>
                <div className="flex items-center gap-1 mb-2">
                  {(['ALL', 'OTT', 'DTH', 'Both'] as const).map((src) => (
                    <button
                      key={src}
                      onClick={() => setProviderSourceFilter(src)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold ${
                        providerSourceFilter === src
                          ? 'bg-[var(--color-primary-600)] text-white'
                          : 'bg-white dark:bg-[var(--color-neutral-900)] border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]'
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" />
                  <input
                    type="text"
                    value={providerSearch}
                    onChange={(e) => setProviderSearch(e.target.value)}
                    placeholder="Search provider channels"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
              </div>
              <div className="p-3 pt-2 flex-1 overflow-auto">
                {providerLoading ? (
                  <div className="py-4 text-sm text-[var(--color-neutral-500)] flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <div className="space-y-1">
                    {providerChannels.map((provider) => {
                      const providerPlatform = ((provider.platform || (provider as any).broadcast || '') as string).trim();
                      return (
                      <div
                        key={provider.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedProvider(provider);
                          e.dataTransfer.setData('application/json', JSON.stringify(provider));
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-md border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)] hover:border-[var(--color-primary-300)] transition-colors cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] truncate">
                            {provider.name || provider.id}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${getProviderPlatformBadgeClass(providerPlatform)}`}>
                            {providerPlatform || '—'}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-[var(--color-neutral-500)] flex items-center gap-1.5">
                          <span className="font-mono truncate">{provider.prgSvcId || (provider as any).channelId || provider.id}</span>
                          {provider.lang && <span>| {provider.lang.toUpperCase()}</span>}
                        </div>
                      </div>
                      );
                    })}
                    {providerChannels.length === 0 && (
                      <div className="text-xs text-[var(--color-neutral-500)] text-center py-3">No provider channels</div>
                    )}
                  </div>
                )}
              </div>
              <div className="px-3 py-2 border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] flex items-center justify-between">
                <button
                  disabled={providerPage === 0 || providerLoading}
                  onClick={() => setProviderPage((p) => Math.max(0, p - 1))}
                  className="p-0.5 text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)] dark:hover:text-[var(--color-neutral-300)] disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[10px] text-[var(--color-neutral-500)]">
                  {providerPage + 1}/{providerTotalPages}
                </span>
                <button
                  disabled={providerPage + 1 >= providerTotalPages || providerLoading}
                  onClick={() => setProviderPage((p) => Math.min(providerTotalPages - 1, p + 1))}
                  className="p-0.5 text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)] dark:hover:text-[var(--color-neutral-300)] disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </section>
          </div>
        )}

        {showDaypartDialog && pendingProvider && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)] p-5 text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-[var(--color-neutral-800)] dark:text-white">Create Daypart Mapping</h3>
                <button onClick={() => { setShowDaypartDialog(false); setPendingProvider(null); }} className="p-1 rounded hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-800)]">
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-3">
                Provider: <span className="font-semibold">{pendingProvider.name || pendingProvider.id}</span> ({pendingProvider.prgSvcId || pendingProvider.id})
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Daypart Start Date</label>
                  <input
                    type="date"
                    value={daypartDraft.startDate}
                    onChange={(e) => setDaypartDraft((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-2 py-1 rounded border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-[var(--color-neutral-200)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Daypart End Date</label>
                  <input
                    type="date"
                    value={daypartDraft.endDate}
                    onChange={(e) => setDaypartDraft((p) => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-2 py-1 rounded border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-[var(--color-neutral-200)]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Language</label>
                  <input
                    type="text"
                    value={daypartDraft.lang}
                    onChange={(e) => setDaypartDraft((p) => ({ ...p, lang: e.target.value }))}
                    className="w-full px-2 py-1 rounded border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-[var(--color-neutral-200)]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowDaypartDialog(false); setPendingProvider(null); }}
                  className="px-3 py-1.5 rounded border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] text-sm"
                >
                  Cancel
                </button>
                <button
                  disabled={savingDayparts || !canMap}
                  onClick={handleConfirmAddDaypart}
                  className="px-3 py-1.5 rounded bg-[var(--color-primary-600)] text-white text-sm disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {savingDayparts && <Loader2 size={12} className="animate-spin" />}
                  Create Daypart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelDetailPage;
