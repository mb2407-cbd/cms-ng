/**
 * @file SchedulePage.tsx
 * @description Multi-day schedule management page for a channel.
 *
 *   Reached from ChannelsPage via /channels/:channelId/schedule.
 *
 *   Feature set (matches Angular UI + enhancements):
 *     • Timezone selector – API returns events in the requested timezone
 *     • Multi-day columns (3 or 5 days)
 *     • Previous / Next day navigation
 *     • Version selector per day
 *     • Content lock toggle per schedule
 *     • Event list with compact inline layout
 *     • Dual time display (local + GMT when TZ ≠ GMT)
 *     • Gap / overlap / negative-duration validation highlights
 *     • Checkbox selection for bulk qualifier / blackout / remove
 *     • Quick Save, Publish, Remove actions
 *     • Program search panel to add programs to a schedule
 *     • Program detail expand per event with genres, ratings, image
 *
 * @author VLS Team
 * @date 2026-02-18
 */
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  Lock,
  Unlock,
  Save,
  Send,
  Trash2,
  ShieldOff,
  Check,
  Minus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  X,
  Columns3,
  Search,
  Plus,
  ExternalLink,
  Star,
  Film,
} from 'lucide-react';
import {
  getScheduleVersions,
  getScheduleVersionById,
  saveScheduleVersion,
  saveAndPublishSchedule,
  lockSchedule,
  bulkCopySchedules,
} from '../../services/schedule.service';
import { getAllChannels, getChannelDetails, getChannelImages } from '../../services/channel.service';
import { searchProgramsV2 } from '../../services/program.service';
import { getUserInfo } from '../../services/api.service';
import type {
  ScheduleVersion,
  ScheduleEvent,
} from '../../types/schedule.types';
import type { ServiceChannel } from '../../types/channel.types';
import type { ProgramSearchRequest } from '../../types/program.types';
import { useApp } from '../../context/AppContext';
import { getCloudfrontBaseUrl } from '../../config/environment.config';

// ─────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────

const TIMEZONE_OPTIONS: { label: string; value: string }[] = [
  { label: 'GMT (UTC+0)', value: 'GMT' },
  { label: 'EST (UTC−5)', value: 'America/New_York' },
  { label: 'CST (UTC−6)', value: 'America/Chicago' },
  { label: 'MST (UTC−7)', value: 'America/Denver' },
  { label: 'PST (UTC−8)', value: 'America/Los_Angeles' },
  { label: 'BRT (UTC−3)', value: 'America/Sao_Paulo' },
  { label: 'ART (UTC−3)', value: 'America/Argentina/Buenos_Aires' },
  { label: 'CLT (UTC−4)', value: 'America/Santiago' },
  { label: 'COT (UTC−5)', value: 'America/Bogota' },
  { label: 'PET (UTC−5)', value: 'America/Lima' },
  { label: 'VET (UTC−4)', value: 'America/Caracas' },
  { label: 'MXT (UTC−6)', value: 'America/Mexico_City' },
];

const DAYS_OPTIONS = [3, 5, 7];
const SCHEDULE_LAYOUT_DAYS_KEY = 'vls_schedule_layout_days';
// CloudFront URL now resolved dynamically from environment config

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

const fmtDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const parseDate = (s: string): Date => {
  if (s.length === 10) return new Date(s + 'T00:00:00Z');
  return new Date(s);
};

const fmtTimeInTz = (
  iso: string,
  tz: string,
  opts?: { showDate?: boolean }
): string => {
  try {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz === 'GMT' ? 'UTC' : tz,
      hour: '2-digit',
      minute: '2-digit',
      ...(opts?.showDate ? { day: '2-digit', month: 'short' } : {}),
      hour12: false,
    }).formatToParts(d);
    const obj: Record<string, string> = {};
    parts.forEach((p) => (obj[p.type] = p.value));
    if (opts?.showDate) return `${obj.day} ${obj.month} ${obj.hour}:${obj.minute}`;
    return `${obj.hour}:${obj.minute}`;
  } catch {
    return iso.substring(11, 16);
  }
};

const fmtGmt = (iso: string): string => fmtTimeInTz(iso, 'UTC');

const durationMin = (start: string, end: string): number => {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / 60000);
};

const fmtDuration = (mins: number): string => {
  if (mins < 0) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const getEventTitle = (ev: any): string => {
  if (ev.title) return ev.title;
  const pd = ev.programDetails;
  if (pd?.titles && Array.isArray(pd.titles) && pd.titles.length > 0) {
    const en = pd.titles.find((t: any) => t.lang === 'en');
    return en?.value || pd.titles[0].value || ev.programId || 'Untitled';
  }
  if (pd?.parentTitle) return pd.parentTitle;
  return ev.programId || 'Untitled';
};

const getEventProgramType = (ev: any): string | undefined => {
  return ev.programDetails?.programType;
};

const getEventDescription = (ev: any): string | undefined => {
  const descs = ev.programDetails?.descriptions;
  if (!descs || !Array.isArray(descs) || descs.length === 0) return undefined;
  const en = descs.find((d: any) => d.lang === 'en');
  return en?.value || descs[0]?.value;
};

const getEventImageUrl = (ev: any): string | undefined => {
  const images = ev.programDetails?.programImages;
  if (!images || !Array.isArray(images) || images.length === 0) return undefined;
  const img = images[0];
  if (!img?.uri) return undefined;
  const base = ev.imageBaseUrl || getCloudfrontBaseUrl();
  return `${base}/${img.uri}`;
};

const getEventGenreIds = (ev: any): string[] => {
  return ev.programDetails?.genres || [];
};

const resolveGenreNames = (genreIds: string[], genreMap: Map<string, string>): string[] => {
  return genreIds.map((id) => genreMap.get(id) || id);
};

const MPAA_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR'];
const TV_RATINGS = ['TVY', 'TVY7', 'TVG', 'TVPG', 'TV14', 'TVMA'];

const getEventMpaaRating = (ev: any, ratingLookup: Map<string, { code: string; rating: string }>): string | undefined => {
  const ratings = ev.ratings;
  if (!ratings || !Array.isArray(ratings) || ratings.length === 0) return undefined;
  for (const r of ratings) {
    const lookup = ratingLookup.get(r.id);
    if (lookup?.code === 'MPAA') return `MPAA ${lookup.rating}`;
    if (r.ratingBody && r.rating) return `${r.ratingBody} ${r.rating}`;
    if (r.rating && MPAA_RATINGS.includes(r.rating)) return `MPAA ${r.rating}`;
  }
  return undefined;
};

const getEventTvRating = (ev: any, ratingLookup: Map<string, { code: string; rating: string }>): string | undefined => {
  const ratings = ev.ratings;
  if (!ratings || !Array.isArray(ratings) || ratings.length === 0) return undefined;
  for (const r of ratings) {
    const lookup = ratingLookup.get(r.id);
    if (lookup?.code === 'TVPG') return `TV ${lookup.rating}`;
    if (r.rating && TV_RATINGS.includes(r.rating)) return `TV ${r.rating}`;
  }
  return undefined;
};

const getEventRatingsDisplay = (ev: any, ratingLookup: Map<string, { code: string; rating: string }>): string[] => {
  const result: string[] = [];
  const mpaa = getEventMpaaRating(ev, ratingLookup);
  const tv = getEventTvRating(ev, ratingLookup);
  if (mpaa) result.push(mpaa);
  if (tv) result.push(tv);
  if (result.length === 0) {
    const ratings = ev.ratings;
    if (ratings && Array.isArray(ratings)) {
      for (const r of ratings) {
        const lookup = ratingLookup.get(r.id);
        if (lookup?.rating) { result.push(lookup.rating); break; }
        if (r.rating) { result.push(r.rating); break; }
      }
    }
  }
  return result;
};

const getFirstPrgSvcId = (channel?: ServiceChannel): string => {
  if (!channel) return '';
  if (channel.prgSvcId) return channel.prgSvcId;
  const firstDaypart = channel.dayParts?.[0] as any;
  const firstMapping = firstDaypart?.mappings?.[0] as any;
  return firstMapping?.prgSvcId || '';
};

const hasGap = (ev: ScheduleEvent, next?: ScheduleEvent): boolean => {
  if (!next) return false;
  return new Date(ev.endDate).getTime() < new Date(next.startDate).getTime();
};

const hasOverlap = (ev: ScheduleEvent, next?: ScheduleEvent): boolean => {
  if (!next) return false;
  return new Date(ev.endDate).getTime() > new Date(next.startDate).getTime();
};

// ─────────────────────────────────────────────────────────────
//  Types for internal state
// ─────────────────────────────────────────────────────────────

interface VersionStub {
  id?: string;
  version?: number;
  published?: boolean;
  provider?: string;
  status?: string;
  createdDate?: number | string;
  updatedDate?: number | string;
}

/** One day's schedule data — fetched from API with the requested timezone */
interface DaySchedule {
  date: string;           // YYYY-MM-DD (the date passed to the API)
  timezone: string;       // timezone used for the API call
  loading: boolean;
  error?: string;
  versionStubs: VersionStub[];
  activeVersion?: ScheduleVersion;
  selectedVersionId?: string;
  contentLock?: boolean;
  scheduledPublishedVersion?: number;
}

interface BulkCopyChannelOption {
  id: string;
  label: string;
  names?: Array<{ value: string; lang?: string; language?: string }>;
}

interface BulkCopyFormState {
  origChannelId: string;
  destChannelId: string;
  startDate: string;
  endDate: string;
  destStartDate: string;
  numOfCopies: number;
  published: boolean;
  enableOverwrite: boolean;
}

interface EditEventState {
  dayDate: string;
  eventId: string;
  title: string;
  startDate: string;
  endDate: string;
  qualifiers: string;
  blackout: boolean;
  published: boolean;
}

// ─────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────

const SchedulePage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const channel: ServiceChannel | undefined = (location.state as any)?.channel;
  const channelImageFromState: string = (location.state as any)?.channelImage || '';

  // ── Reference data from AppContext (genres / ratings) ──────
  const { genreMap, ratingLookup } = useApp();

  // ── Core state ─────────────────────────────────────────────
  const [timezone, setTimezone] = useState<string>(
    channel?.timeZone || channel?.timeZoneName || 'GMT'
  );
  const [startDate, setStartDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  });
  const [numDays, setNumDays] = useState<number>(() => {
    const raw = localStorage.getItem(SCHEDULE_LAYOUT_DAYS_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return DAYS_OPTIONS.includes(parsed) ? parsed : 3;
  });
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);

  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [selectedEventCache, setSelectedEventCache] = useState<Map<string, ScheduleEvent>>(new Map());
  const [modifiedDays, setModifiedDays] = useState<Set<string>>(new Set());

  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showBulkCopyDialog, setShowBulkCopyDialog] = useState(false);
  const [showMoveInfo, setShowMoveInfo] = useState(false);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'publishing'>('idle');
  const [bulkCopyConfig, setBulkCopyConfig] = useState<BulkCopyFormState | null>(null);
  const [bulkCopyChannels, setBulkCopyChannels] = useState<BulkCopyChannelOption[]>([]);
  const [bulkCopyChannelsLoading, setBulkCopyChannelsLoading] = useState(false);
  const [bulkCopySubmitting, setBulkCopySubmitting] = useState(false);
  const [bulkCopyError, setBulkCopyError] = useState('');
  const [editingEvent, setEditingEvent] = useState<EditEventState | null>(null);
  const [editEventError, setEditEventError] = useState('');

  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [tzDropdownOpen, setTzDropdownOpen] = useState(false);
  const [versionPanelOpen, setVersionPanelOpen] = useState<Record<string, boolean>>({});

  const [programPanelOpen, setProgramPanelOpen] = useState(false);
  const [programSearchQuery, setProgramSearchQuery] = useState('');
  const [programSearchResults, setProgramSearchResults] = useState<any[]>([]);
  const [programSearchLoading, setProgramSearchLoading] = useState(false);
  const [programTargetDay, setProgramTargetDay] = useState<number | null>(null);
  const [channelHeaderImage, setChannelHeaderImage] = useState<string>(channelImageFromState || channel?.imageUrl || channel?.channelImage || '');
  const [daySlideDirection, setDaySlideDirection] = useState<'left' | 'right' | null>(null);
  const programSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const daySlideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadRequestIdRef = useRef(0);
  const daySchedulesRef = useRef<DaySchedule[]>([]);
  const dayScheduleCacheRef = useRef<Map<string, DaySchedule>>(new Map());

  // ── Compute date range ─────────────────────────────────────
  const dateRange = useMemo(() => {
    const dates: string[] = [];
    for (let i = 0; i < numDays; i++) {
      dates.push(fmtDate(addDays(startDate, i)));
    }
    return dates;
  }, [startDate, numDays]);

  const isGmt = timezone === 'GMT' || timezone === 'UTC';
  const scheduleCacheKey = useCallback((date: string, tz: string) => `${channelId || ''}|${tz}|${date}`, [channelId]);

  // ── Parse the versions-listing API response ─────────────────
  const parseVersionsResponse = useCallback((raw: any): { stubs: VersionStub[]; contentLock?: boolean; scheduledPublishedVersion?: number; directVersion?: ScheduleVersion } => {
    let items: any[] = [];
    if (Array.isArray(raw)) { items = raw; }
    else if (raw?.data && Array.isArray(raw.data)) { items = raw.data; }
    else if (raw?.data && typeof raw.data === 'object') { items = [raw.data]; }
    else if (raw && typeof raw === 'object') { items = [raw]; }

    if (items.length === 0) return { stubs: [] };

    const first = items[0];
    if (first?.versions && Array.isArray(first.versions)) {
      const allStubs: VersionStub[] = [];
      let contentLock: boolean | undefined;
      let scheduledPublishedVersion: number | undefined;
      for (const meta of items) {
        contentLock = meta.contentLock ?? contentLock;
        scheduledPublishedVersion = meta.scheduledPublishedVersion ?? scheduledPublishedVersion;
        if (Array.isArray(meta.versions)) allStubs.push(...meta.versions);
      }
      return { stubs: allStubs, contentLock, scheduledPublishedVersion };
    }

    if (first?.events && Array.isArray(first.events)) {
      const sorted = [...items].sort((a: any, b: any) => (b.version || 0) - (a.version || 0));
      const stubs: VersionStub[] = items.map((v: any) => ({
        id: v.id, version: v.version, published: v.published,
        provider: v.provider || v.processingType,
        status: v.published ? 'PUB' : (v.id ? 'SAVED' : 'NEW'),
        updatedDate: v.updatedDate,
      }));
      return { stubs, directVersion: sorted[0], contentLock: sorted[0]?.contentLock };
    }

    const stubs: VersionStub[] = items.map((v: any) => ({
      id: v.id, version: v.version, published: v.published,
      provider: v.provider || v.processingType,
      status: v.published ? 'PUB' : (v.id ? 'SAVED' : 'NEW'),
      updatedDate: v.updatedDate, createdDate: v.createdDate,
    }));
    return { stubs, contentLock: first?.contentLock };
  }, []);

  // ── Load the full version detail (with events) ────────────
  const loadVersionDetail = useCallback(async (versionId: string): Promise<ScheduleVersion | undefined> => {
    try {
      const raw: any = await getScheduleVersionById(versionId);
      let version: ScheduleVersion | undefined;
      if (Array.isArray(raw)) { version = raw.find((v: any) => v.id === versionId) || raw[0]; }
      else if (raw?.data && Array.isArray(raw.data)) { version = raw.data.find((v: any) => v.id === versionId) || raw.data[0]; }
      else if (raw?.data && typeof raw.data === 'object') { version = raw.data; }
      else if (raw && typeof raw === 'object' && !Array.isArray(raw)) { version = raw; }
      return version as ScheduleVersion | undefined;
    } catch (err) {
      console.error('[SchedulePage] Failed to load version detail:', err);
      return undefined;
    }
  }, []);

  // ── Load one day's schedule ────────────────────────────────
  // Passes the selected timezone to the API — the backend returns
  // events already in that timezone's date context.
  const loadDaySchedule = useCallback(
    async (date: string, tz: string): Promise<DaySchedule> => {
      try {
        const raw = await getScheduleVersions(channelId!, date, tz);
        const { stubs, contentLock, scheduledPublishedVersion, directVersion } = parseVersionsResponse(raw);

        if (directVersion) {
          return {
            date, timezone: tz, loading: false, versionStubs: stubs,
            activeVersion: directVersion,
            selectedVersionId: directVersion.id,
            contentLock: directVersion.contentLock ?? contentLock,
            scheduledPublishedVersion,
          };
        }

        let selectedId: string | undefined;
        if (scheduledPublishedVersion != null) {
          selectedId = stubs.find((s) => s.version === scheduledPublishedVersion)?.id;
        }
        if (!selectedId) selectedId = stubs.find((s) => s.published)?.id;
        if (!selectedId && stubs.length > 0) {
          selectedId = [...stubs].sort((a, b) => (b.version || 0) - (a.version || 0))[0].id;
        }

        let activeVersion: ScheduleVersion | undefined;
        if (selectedId) activeVersion = await loadVersionDetail(selectedId);

        return {
          date, timezone: tz, loading: false, versionStubs: stubs,
          activeVersion, selectedVersionId: selectedId,
          contentLock: activeVersion?.contentLock ?? contentLock,
          scheduledPublishedVersion,
        };
      } catch (err: any) {
        return {
          date, timezone: tz, loading: false, error: err?.message || 'Failed to load',
          versionStubs: [],
        };
      }
    },
    [channelId, parseVersionsResponse, loadVersionDetail]
  );

  // ── Load visible day range (cached) ────────────────────────
  const loadAllDays = useCallback(async (forceReload = false) => {
    const requestId = ++loadRequestIdRef.current;
    const prevByDate = new Map(
      daySchedulesRef.current
        .filter((day) => day.timezone === timezone)
        .map((day) => [day.date, day])
    );
    const nextDays = dateRange.map((date) => {
      if (!forceReload) {
        const prevDay = prevByDate.get(date);
        if (prevDay) return prevDay;
        const cached = dayScheduleCacheRef.current.get(scheduleCacheKey(date, timezone));
        if (cached) return cached;
      }
      return { date, timezone, loading: true, versionStubs: [] as VersionStub[] };
    });

    setDaySchedules(nextDays);
    setModifiedDays(new Set());

    const missingDates = nextDays.filter((day) => day.loading).map((day) => day.date);
    if (missingDates.length === 0) return;

    const results = await Promise.all(
      missingDates.map((date) => loadDaySchedule(date, timezone))
    );

    if (requestId !== loadRequestIdRef.current) return;
    results.forEach((day) => {
      dayScheduleCacheRef.current.set(scheduleCacheKey(day.date, timezone), day);
    });
    const resultByDate = new Map(results.map((day) => [day.date, day]));
    setDaySchedules((prev) => prev.map((day) => resultByDate.get(day.date) || day));
  }, [dateRange, timezone, loadDaySchedule, scheduleCacheKey]);

  useEffect(() => {
    if (!channelId) return;
    void loadAllDays(false);
  }, [channelId, timezone, dateRange, loadAllDays]);

  useEffect(() => {
    daySchedulesRef.current = daySchedules;
    daySchedules.forEach((day) => {
      if (day.loading) return;
      dayScheduleCacheRef.current.set(scheduleCacheKey(day.date, day.timezone || timezone), day);
    });
  }, [daySchedules, scheduleCacheKey, timezone]);

  useEffect(() => {
    dayScheduleCacheRef.current.clear();
    daySchedulesRef.current = [];
  }, [channelId, timezone]);

  useEffect(() => {
    localStorage.setItem(SCHEDULE_LAYOUT_DAYS_KEY, String(numDays));
  }, [numDays]);

  // ── Version selection ──────────────────────────────────────
  const handleSelectVersion = useCallback(
    async (dayIdx: number, _gmtDate: string, versionId: string) => {
      setDaySchedules((prev) => {
        const next = [...prev];
        next[dayIdx] = { ...next[dayIdx], selectedVersionId: versionId, loading: true };
        return next;
      });

      const detail = await loadVersionDetail(versionId);

      setDaySchedules((prev) => {
        const next = [...prev];
        next[dayIdx] = {
          ...next[dayIdx],
          selectedVersionId: versionId,
          activeVersion: detail,
          contentLock: detail?.contentLock,
          loading: false,
        };
        return next;
      });
    },
    [loadVersionDetail]
  );

  // ── Content lock toggle ─────────────────────────────────────
  const handleToggleLock = useCallback(
    async (dayIdx: number, _gmtDate: string) => {
      const day = daySchedules[dayIdx];
      if (!day?.activeVersion?.scheduleId) return;
      try {
        await lockSchedule(day.activeVersion.scheduleId);
        setDaySchedules((prev) => {
          const next = [...prev];
          next[dayIdx] = { ...next[dayIdx], contentLock: !next[dayIdx].contentLock };
          return next;
        });
      } catch (err) {
        console.error('Failed to toggle lock', err);
      }
    },
    [daySchedules]
  );

  // ── Navigation ──────────────────────────────────────────────
  const triggerDaySlide = useCallback((direction: 'left' | 'right') => {
    setDaySlideDirection(direction);
    if (daySlideTimerRef.current) clearTimeout(daySlideTimerRef.current);
    daySlideTimerRef.current = setTimeout(() => setDaySlideDirection(null), 220);
  }, []);

  useEffect(() => () => {
    if (daySlideTimerRef.current) clearTimeout(daySlideTimerRef.current);
  }, []);

  const goBack = () => navigate('/channels');
  const goPrev = () => setStartDate((d) => addDays(d, -numDays));
  const goNext = () => setStartDate((d) => addDays(d, numDays));
  const goPrevDay = () => {
    triggerDaySlide('right');
    setStartDate((d) => addDays(d, -1));
  };
  const goNextDay = () => {
    triggerDaySlide('left');
    setStartDate((d) => addDays(d, 1));
  };
  const goToToday = () => {
    const now = new Date();
    setStartDate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
  };

  // ── Event selection helpers ─────────────────────────────────
  const toggleEventSelect = (evId: string, event?: ScheduleEvent) => {
    setSelectedEvents((prev) => {
      const s = new Set(prev);
      const willSelect = !s.has(evId);
      if (willSelect) s.add(evId);
      else s.delete(evId);
      setSelectedEventCache((prevCache) => {
        const next = new Map(prevCache);
        if (willSelect) {
          if (event) next.set(evId, event);
        } else {
          next.delete(evId);
        }
        return next;
      });
      return s;
    });
  };

  const toggleAllEventsForDay = (dayIdx: number) => {
    const day = daySchedules[dayIdx];
    const events = day.activeVersion?.events || [];
    const eventEntries = events.map((ev) => ({ id: ev.id || ev.programId + ev.startDate, ev }));
    const evIds = eventEntries.map(({ id }) => id);
    const allSelected = evIds.length > 0 && evIds.every((id) => selectedEvents.has(id));
    setSelectedEvents((prev) => {
      const s = new Set(prev);
      evIds.forEach((id) => (allSelected ? s.delete(id) : s.add(id)));
      setSelectedEventCache((prevCache) => {
        const next = new Map(prevCache);
        if (allSelected) {
          evIds.forEach((id) => next.delete(id));
        } else {
          eventEntries.forEach(({ id, ev }) => next.set(id, ev));
        }
        return next;
      });
      return s;
    });
  };

  const toggleEventExpand = (evKey: string) => {
    setExpandedEvents((prev) => {
      const s = new Set(prev);
      if (s.has(evKey)) s.delete(evKey); else s.add(evKey);
      return s;
    });
  };

  const openEditEvent = useCallback((dayDate: string, eventId: string) => {
    const day = daySchedules.find((d) => d.date === dayDate);
    const event = day?.activeVersion?.events.find((ev) => (ev.id || ev.programId + ev.startDate) === eventId);
    if (!event) return;
    setEditEventError('');
    setEditingEvent({
      dayDate,
      eventId,
      title: event.title || getEventTitle(event),
      startDate: event.startDate,
      endDate: event.endDate,
      qualifiers: (event.qualifiers || []).join(', '),
      blackout: !!event.blackout,
      published: !!event.published,
    });
  }, [daySchedules]);

  const saveEditedEvent = useCallback(() => {
    if (!editingEvent) return;
    const startMs = new Date(editingEvent.startDate).getTime();
    const endMs = new Date(editingEvent.endDate).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      setEditEventError('Start and End must be valid ISO datetime values.');
      return;
    }
    if (startMs >= endMs) {
      setEditEventError('End must be after Start.');
      return;
    }

    setDaySchedules((prev) => prev.map((day) => {
      if (day.date !== editingEvent.dayDate || !day.activeVersion) return day;
      const events = day.activeVersion.events.map((ev) => {
        const evId = ev.id || ev.programId + ev.startDate;
        if (evId !== editingEvent.eventId) return ev;
        return {
          ...ev,
          title: editingEvent.title,
          startDate: editingEvent.startDate,
          endDate: editingEvent.endDate,
          qualifiers: editingEvent.qualifiers
            .split(',')
            .map((q) => q.trim())
            .filter(Boolean),
          blackout: editingEvent.blackout,
          published: editingEvent.published,
        };
      });
      return { ...day, activeVersion: { ...day.activeVersion, events } };
    }));
    setModifiedDays((m) => new Set(m).add(editingEvent.dayDate));
    setEditingEvent(null);
    setEditEventError('');
  }, [editingEvent]);

  // ── Save / Publish handlers ─────────────────────────────────
  const handleSave = useCallback(async () => {
    setSavingState('saving');
    setShowSaveConfirm(false);
    try {
      for (const day of daySchedules) {
        if (!day.activeVersion || !modifiedDays.has(day.date)) continue;
        await saveScheduleVersion(day.activeVersion);
      }
      await loadAllDays(true);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSavingState('idle');
    }
  }, [daySchedules, modifiedDays, loadAllDays]);

  const handlePublish = useCallback(async () => {
    setSavingState('publishing');
    setShowPublishConfirm(false);
    try {
      for (const day of daySchedules) {
        if (!day.activeVersion) continue;
        await saveAndPublishSchedule(day.activeVersion);
      }
      await loadAllDays(true);
    } catch (err) {
      console.error('Publish failed', err);
    } finally {
      setSavingState('idle');
    }
  }, [daySchedules, loadAllDays]);

  // ── Remove selected events ──────────────────────────────────
  const handleRemoveSelected = useCallback(() => {
    setShowRemoveConfirm(false);
    setDaySchedules((prev) =>
      prev.map((day) => {
        if (!day.activeVersion) return day;
        const filtered = day.activeVersion.events.filter((ev) => {
          const evId = ev.id || ev.programId + ev.startDate;
          return !selectedEvents.has(evId);
        });
        if (filtered.length === day.activeVersion.events.length) return day;
        setModifiedDays((m) => new Set(m).add(day.date));
        return { ...day, activeVersion: { ...day.activeVersion, events: filtered } };
      })
    );
    setSelectedEvents(new Set());
    setSelectedEventCache(new Map());
  }, [selectedEvents]);

  const loadBulkCopyChannels = useCallback(async () => {
    setBulkCopyChannelsLoading(true);
    try {
      const raw: any = await getAllChannels();
      const items: any[] = Array.isArray(raw) ? raw : (raw?.response || raw?.data || []);
      const options: BulkCopyChannelOption[] = items
        .map((item: any) => {
          const names = Array.isArray(item.channelNames) ? item.channelNames : [];
          const shortName = names.find((n: any) => String(n.type || '').toLowerCase() === 'short')?.value
            || names[0]?.value
            || item.name
            || item.sourceId
            || item.id;
          return {
            id: item.id,
            label: item.sourceId ? `${item.sourceId} - ${shortName}` : shortName,
            names,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
      setBulkCopyChannels(options);
    } catch {
      setBulkCopyChannels([]);
    } finally {
      setBulkCopyChannelsLoading(false);
    }
  }, []);

  const openBulkCopyDialog = useCallback(async () => {
    if (selectedEvents.size === 0) return;

    const selectedById = new Map<string, ScheduleEvent>();
    selectedEvents.forEach((eventId) => {
      const cached = selectedEventCache.get(eventId);
      if (cached) selectedById.set(eventId, cached);
    });

    daySchedules.forEach((day) => {
      (day.activeVersion?.events || []).forEach((ev) => {
        const evId = ev.id || ev.programId + ev.startDate;
        if (selectedEvents.has(evId)) selectedById.set(evId, ev);
      });
    });
    const selected = Array.from(selectedById.values());
    if (selected.length === 0) return;

    let minStart = selected[0].startDate;
    let maxEnd = selected[0].endDate;
    selected.forEach((ev) => {
      if (new Date(ev.startDate).getTime() < new Date(minStart).getTime()) minStart = ev.startDate;
      if (new Date(ev.endDate).getTime() > new Date(maxEnd).getTime()) maxEnd = ev.endDate;
    });

    const defaultStartDate = localDateOf(minStart, timezone);
    const defaultEndDate = localDateOf(maxEnd, timezone);
    const defaultOrigChannelId = channel?.id || channelId || '';

    setBulkCopyError('');
    setBulkCopyConfig({
      origChannelId: defaultOrigChannelId,
      destChannelId: '',
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      destStartDate: defaultStartDate,
      numOfCopies: 1,
      published: true,
      enableOverwrite: false,
    });
    setShowBulkCopyDialog(true);

    if (bulkCopyChannels.length === 0 && !bulkCopyChannelsLoading) {
      await loadBulkCopyChannels();
    }
  }, [selectedEvents, selectedEventCache, daySchedules, timezone, channel, channelId, bulkCopyChannels.length, bulkCopyChannelsLoading, loadBulkCopyChannels]);

  useEffect(() => {
    if (selectedEvents.size === 0) return;
    setSelectedEventCache((prevCache) => {
      let changed = false;
      const next = new Map(prevCache);
      daySchedules.forEach((day) => {
        (day.activeVersion?.events || []).forEach((ev) => {
          const evId = ev.id || ev.programId + ev.startDate;
          if (!selectedEvents.has(evId)) return;
          if (next.get(evId) === ev) return;
          next.set(evId, ev);
          changed = true;
        });
      });
      return changed ? next : prevCache;
    });
  }, [daySchedules, selectedEvents]);

  const updateBulkCopyField = useCallback((key: keyof BulkCopyFormState, value: string | number | boolean) => {
    setBulkCopyConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
  }, []);

  const submitBulkCopy = useCallback(async () => {
    if (!bulkCopyConfig) return;
    if (!bulkCopyConfig.origChannelId || !bulkCopyConfig.destChannelId) {
      setBulkCopyError('Original and destination channels are required.');
      return;
    }
    if (!bulkCopyConfig.startDate || !bulkCopyConfig.endDate || !bulkCopyConfig.destStartDate) {
      setBulkCopyError('Start, end and destination start dates are required.');
      return;
    }
    if (bulkCopyConfig.startDate > bulkCopyConfig.endDate) {
      setBulkCopyError('Start date must be before end date.');
      return;
    }
    if (bulkCopyConfig.numOfCopies < 1 || bulkCopyConfig.numOfCopies > 30) {
      setBulkCopyError('Number of copies must be between 1 and 30.');
      return;
    }

    setBulkCopySubmitting(true);
    setBulkCopyError('');
    try {
      const source = bulkCopyChannels.find((c) => c.id === bulkCopyConfig.origChannelId);
      const destination = bulkCopyChannels.find((c) => c.id === bulkCopyConfig.destChannelId);
      const user = getUserInfo?.() || {};
      const normalizeNames = (names?: Array<{ value: string; lang?: string; language?: string }>) =>
        names?.map((name) => ({
          value: name.value,
          lang: name.lang || name.language || 'en',
        }));

      await bulkCopySchedules({
        origChannelId: bulkCopyConfig.origChannelId,
        origChannelNames: normalizeNames(source?.names),
        destChannelId: bulkCopyConfig.destChannelId,
        destChannelNames: normalizeNames(destination?.names),
        startDate: new Date(`${bulkCopyConfig.startDate}T00:00:00.000Z`).toISOString(),
        endDate: new Date(`${bulkCopyConfig.endDate}T00:00:00.000Z`).toISOString(),
        destStartDate: new Date(`${bulkCopyConfig.destStartDate}T00:00:00.000Z`).toISOString(),
        numOfCopies: bulkCopyConfig.numOfCopies,
        published: bulkCopyConfig.published,
        enableOverwrite: bulkCopyConfig.enableOverwrite,
        userId: user?.id || user?.userId,
      }, timezone);

      setShowBulkCopyDialog(false);
    } catch (err: any) {
      const message = err?.response?.data?.errors?.[0] || err?.message || 'Bulk copy request failed.';
      setBulkCopyError(message);
    } finally {
      setBulkCopySubmitting(false);
    }
  }, [bulkCopyConfig, bulkCopyChannels, timezone]);

  // ── Program search ───────────────────────────────────────────
  const handleProgramSearch = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) { setProgramSearchResults([]); return; }
      setProgramSearchLoading(true);
      try {
        const request: ProgramSearchRequest = { searchString: query, filters: [] };
        const raw: any = await searchProgramsV2(request, 0, 20);
        const programs = raw?.response || raw?.data || raw?.content || (Array.isArray(raw) ? raw : []);
        setProgramSearchResults(programs);
      } catch (err) {
        setProgramSearchResults([]);
      } finally {
        setProgramSearchLoading(false);
      }
    }, []
  );

  const handleProgramSearchInput = useCallback(
    (value: string) => {
      setProgramSearchQuery(value);
      if (programSearchTimerRef.current) clearTimeout(programSearchTimerRef.current);
      programSearchTimerRef.current = setTimeout(() => handleProgramSearch(value), 400);
    }, [handleProgramSearch]
  );

  const openProgramPanel = useCallback((dayIdx: number) => {
    setProgramTargetDay(dayIdx);
    setProgramPanelOpen(true);
  }, []);

  const handleAddProgramToSchedule = useCallback(
    (program: any) => {
      if (programTargetDay == null) return;
      setDaySchedules((prev) => {
        const next = [...prev];
        const day = { ...next[programTargetDay] };
        if (!day.activeVersion) return prev;

        const events = [...day.activeVersion.events];
        const lastEvent = events[events.length - 1];
        const newStart = lastEvent ? lastEvent.endDate : `${day.date}T00:00:00.000Z`;
        const durationSec = program.runtime || program.duration || 3600;
        const newEnd = new Date(new Date(newStart).getTime() + durationSec * 1000).toISOString();

        const programId = program.programId || program.id || program._id;
        const title = program.titles?.[0]?.value || program.title || programId;

        const newEvent: ScheduleEvent = {
          programId, title, startDate: newStart, endDate: newEnd,
          duration: durationSec, qualifiers: [], ratings: program.ratings || [],
          published: false, blackout: false,
        };

        events.push(newEvent);
        day.activeVersion = { ...day.activeVersion, events };
        next[programTargetDay] = day;
        setModifiedDays((m) => new Set(m).add(day.date));
        return next;
      });
      setProgramPanelOpen(false);
      setProgramSearchQuery('');
      setProgramSearchResults([]);
    }, [programTargetDay]
  );

  // ── Derived ─────────────────────────────────────────────────
  const channelName = useMemo(() => {
    if (channel?.channelNames && channel.channelNames.length > 0) {
      const en = channel.channelNames.find(
        (n) => n.lang === 'en' || n.lang === 'EN' || n.language === 'en'
      );
      return (en || channel.channelNames[0]).value || channel.name || channel.callSign || channelId || 'Channel';
    }
    return channel?.name || channel?.callSign || channelId || 'Channel';
  }, [channel, channelId]);

  const hasSelectedEvents = selectedEvents.size > 0;
  const anyModified = modifiedDays.size > 0;

  const dateLabelShort = (dateStr: string) => {
    const d = parseDate(dateStr);
    const today = new Date();
    const todayStr = fmtDate(today);
    if (dateStr === todayStr) return 'Today';
    const tomorrow = addDays(today, 1);
    if (dateStr === fmtDate(tomorrow)) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  };

  useEffect(() => {
    let cancelled = false;
    const existing = channelImageFromState || channel?.imageUrl || channel?.channelImage || '';
    if (existing) setChannelHeaderImage(existing);

    const loadHeaderImage = async () => {
      if (!channelId) return;
      try {
        const effectiveChannel = channel;
        const prgSvcId = getFirstPrgSvcId(effectiveChannel);
        if (prgSvcId && effectiveChannel?.id) {
          const imageResponse: any = await getChannelImages(effectiveChannel.id, prgSvcId);
          const payload = imageResponse?.response || imageResponse?.data || imageResponse;
          const imageUrl = payload?.imageURL || (payload?.baseUrl && payload?.uri ? `${payload.baseUrl}${payload.uri}` : payload?.uri) || '';
          if (!cancelled && imageUrl) {
            setChannelHeaderImage(imageUrl);
            return;
          }
        }

        const detailsResponse: any = await getChannelDetails(channelId);
        const details = detailsResponse?.response || detailsResponse?.data || detailsResponse;
        const detailsImage = details?.imageUrl || details?.channelImage || '';
        if (!cancelled && detailsImage) setChannelHeaderImage(detailsImage);
      } catch {
        // Ignore image errors; keep fallback
      }
    };

    void loadHeaderImage();
    return () => { cancelled = true; };
  }, [channelId, channel, channelImageFromState]);

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-900)]">
      {/* ═══════════ TOP BAR ═══════════ */}
      <div className="relative flex-shrink-0 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-800)] overflow-hidden">
        {channelHeaderImage && (
          <div className="absolute inset-0 pointer-events-none">
            <img
              src={channelHeaderImage}
              alt=""
              className="w-full h-full object-cover opacity-[0.12] dark:opacity-[0.09]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/35 to-white/60 dark:from-[var(--color-neutral-800)]/55 dark:via-[var(--color-neutral-800)]/45 dark:to-[var(--color-neutral-800)]/65" />
          </div>
        )}
        {/* Row 1: Back + Channel name + Timezone */}
        <div className="relative z-10 flex items-center gap-3 px-4 py-2">
          <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]" title="Back to Channels">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <CalendarDays size={18} className="text-[var(--color-primary-600)] flex-shrink-0" />
            <h1 className="text-base font-semibold text-[var(--color-neutral-800)] dark:text-[var(--color-neutral-100)] truncate">{channelName}</h1>
            {channel?.channelType && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-700)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">{channel.channelType}</span>
            )}
            {channel?.channelTarget && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)] text-[var(--color-primary-700)] dark:text-[var(--color-primary-300)]">{channel.channelTarget.toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1" />
          {/* Timezone picker */}
          <div className="relative">
            <button onClick={() => setTzDropdownOpen(!tzDropdownOpen)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-700)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-600)]">
              <Clock size={14} />
              <span className="font-medium">{TIMEZONE_OPTIONS.find((o) => o.value === timezone)?.label || timezone}</span>
              <ChevronDown size={12} />
            </button>
            {tzDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setTzDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white dark:bg-[var(--color-neutral-800)] border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-600)] rounded-lg shadow-xl max-h-64 overflow-y-auto">
                  {TIMEZONE_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => { setTimezone(opt.value); setTzDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-900)] ${timezone === opt.value ? 'bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)] text-[var(--color-primary-700)] dark:text-[var(--color-primary-300)] font-medium' : 'text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Row 2: Date navigation + day count + action buttons */}
        <div className="relative z-10 flex items-center gap-2 px-4 py-1.5 border-t border-[var(--color-neutral-100)] dark:border-[var(--color-neutral-700)]">
          <button onClick={goPrev} className="p-1 rounded hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-500)]" title={`Previous ${numDays} days`}>
            <ChevronsLeft size={16} />
          </button>
          <button onClick={goPrevDay} className="p-1 rounded hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-500)]" title="Previous day">
            <ChevronLeft size={16} />
          </button>
          <button onClick={goToToday} className="px-2 py-0.5 text-[11px] font-medium rounded border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-600)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)]">Today</button>
          <button onClick={goNextDay} className="p-1 rounded hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-500)]" title="Next day">
            <ChevronRight size={16} />
          </button>
          <button onClick={goNext} className="p-1 rounded hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-500)]" title={`Next ${numDays} days`}>
            <ChevronsRight size={16} />
          </button>
          <span className="text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-neutral-400)] ml-1">
            {fmtDate(startDate)} — {fmtDate(addDays(startDate, numDays - 1))}
            {!isGmt && <span className="ml-1 text-[var(--color-primary-500)]">({TIMEZONE_OPTIONS.find((o) => o.value === timezone)?.label?.split(' ')[0] || 'local'})</span>}
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <Columns3 size={14} className="text-[var(--color-neutral-400)]" />
            {DAYS_OPTIONS.map((d) => (
              <button key={d} onClick={() => setNumDays(d)} className={`px-2 py-0.5 text-[11px] rounded ${numDays === d ? 'bg-[var(--color-primary-600)] text-white' : 'text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)]'}`}>{d}d</button>
            ))}
          </div>
          <div className="w-px h-5 bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-600)] mx-1" />
          {hasSelectedEvents ? (
            <>
              <span className="text-[11px] text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] font-medium">{selectedEvents.size} selected</span>
              <button onClick={openBulkCopyDialog} disabled={savingState !== 'idle'} className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/30 text-[var(--color-primary-700)] dark:text-[var(--color-primary-300)] hover:bg-[var(--color-primary-100)] dark:hover:bg-[var(--color-primary-900)]/50 disabled:opacity-50">
                Bulk Copy
              </button>
              <button onClick={() => setShowMoveInfo(true)} className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-600)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-700)]">
                Move
              </button>
              <button onClick={() => setShowRemoveConfirm(true)} disabled={savingState !== 'idle'} className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50"><Trash2 size={12} /> Remove</button>
            </>
          ) : (
            <>
              <button onClick={() => setShowSaveConfirm(true)} disabled={savingState !== 'idle' || !anyModified} className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-600)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-700)] disabled:opacity-40">
                {savingState === 'saving' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Quick Save
              </button>
              <button onClick={() => setShowPublishConfirm(true)} disabled={savingState !== 'idle'} className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] disabled:opacity-40">
                {savingState === 'publishing' ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Publish
              </button>
            </>
          )}
        </div>
      </div>

      {/* ═══════════ MULTI-DAY GRID ═══════════ */}
      <div className="flex-1 overflow-hidden">
        <div className={`h-full overflow-y-auto overflow-x-hidden ${daySlideDirection === 'left' ? 'schedule-day-slide-left' : daySlideDirection === 'right' ? 'schedule-day-slide-right' : ''}`}>
          {/* Day headers row (sticky in same scroll container as lanes for exact border alignment) */}
          <div className="sticky top-0 z-20 flex">
            {/* Spacer for hour gutter */}
            <div className="flex-shrink-0 w-14 border-r border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-900)]" />
            {/* Day column headers */}
            {daySchedules.map((day, dayIdx) => (
              <DayColumnHeader
                key={day.date}
              day={day}
              dayIdx={dayIdx}
              isGmt={isGmt}
              selectedEvents={selectedEvents}
              versionPanelOpen={!!versionPanelOpen[day.date]}
              dateLabelShort={dateLabelShort}
              onSelectVersion={handleSelectVersion}
              onToggleLock={handleToggleLock}
              onToggleAllEvents={() => toggleAllEventsForDay(dayIdx)}
              onToggleVersionPanel={() => setVersionPanelOpen((p) => ({ ...p, [day.date]: !p[day.date] }))}
              onOpenProgramPanel={openProgramPanel}
            />
          ))}
          </div>
          <div className="flex" style={{ height: TIMELINE_HEIGHT }}>
            {/* Hour gutter with sub-interval markers */}
            <div className="flex-shrink-0 w-14 border-r border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] relative">
              {HOURS.map((h) => (
                <React.Fragment key={h}>
                  {/* Hour label + tick */}
                  <div className="absolute left-0 right-0 flex items-start justify-end pr-1" style={{ top: h * 60 * PX_PER_MIN }}>
                    <div className="flex items-center gap-0.5">
                      <span className={`text-[10px] font-mono text-[var(--color-neutral-500)] dark:text-[var(--color-neutral-400)] leading-none font-semibold ${h === 0 ? '' : '-translate-y-1/2'}`}>
                        {String(h).padStart(2, '0')}:00
                      </span>
                      <div className={`w-1.5 border-t border-[var(--color-neutral-400)] dark:border-[var(--color-neutral-500)] ${h === 0 ? '' : '-translate-y-1/2'}`} />
                    </div>
                  </div>
                  {/* 30-min marker */}
                  <div className="absolute right-0 flex items-center" style={{ top: (h * 60 + 30) * PX_PER_MIN }}>
                    <span className="text-[8px] font-mono text-[var(--color-neutral-400)] dark:text-[var(--color-neutral-500)] leading-none -translate-y-1/2 pr-0.5">:30</span>
                    <div className="w-2 border-t border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] -translate-y-1/2" />
                  </div>
                  {/* 15-min and 45-min markers */}
                  {[15, 45].map((m) => (
                    <div key={m} className="absolute right-0 flex items-center" style={{ top: (h * 60 + m) * PX_PER_MIN }}>
                      <div className="w-1.5 border-t border-[var(--color-neutral-250,var(--color-neutral-200))] dark:border-[var(--color-neutral-700)] -translate-y-1/2" />
                    </div>
                  ))}
                  {/* 5-min tick marks (excluding 0, 15, 30, 45) */}
                  {[5, 10, 20, 25, 35, 40, 50, 55].map((m) => (
                    <div key={m} className="absolute right-0 flex items-center" style={{ top: (h * 60 + m) * PX_PER_MIN }}>
                      <div className="w-1 border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]/60 -translate-y-1/2" />
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
            {/* Day timeline columns */}
            {daySchedules.map((day, dayIdx) => (
              <DayTimelineColumn
                key={day.date}
                day={day}
                dayIdx={dayIdx}
                timezone={timezone}
                isGmt={isGmt}
                selectedEvents={selectedEvents}
                expandedEvents={expandedEvents}
                genreMap={genreMap}
                ratingLookup={ratingLookup}
                onToggleEvent={toggleEventSelect}
                onToggleExpand={toggleEventExpand}
                onEditEvent={openEditEvent}
                onNavigateToProgram={(progId) => navigate(`/programs/${progId}`, { state: { from: 'schedule', returnPath: location.pathname } })}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ CONFIRM MODALS ═══════════ */}
      {showSaveConfirm && <ConfirmModal title="Save Schedules" message={`Save changes for ${modifiedDays.size} schedule(s)?`} confirmLabel="Save" onConfirm={handleSave} onCancel={() => setShowSaveConfirm(false)} />}
      {showPublishConfirm && <ConfirmModal title="Publish Schedules" message="Publish all displayed schedule versions? This will make them live." confirmLabel="Publish" variant="primary" onConfirm={handlePublish} onCancel={() => setShowPublishConfirm(false)} />}
      {showRemoveConfirm && <ConfirmModal title="Remove Events" message={`Remove ${selectedEvents.size} selected event(s)?`} confirmLabel="Remove" variant="danger" onConfirm={handleRemoveSelected} onCancel={() => setShowRemoveConfirm(false)} />}
      {showMoveInfo && <ConfirmModal title="Move Schedules" message="Move is planned but not implemented yet. Bulk Copy is available now." confirmLabel="OK" onConfirm={() => setShowMoveInfo(false)} onCancel={() => setShowMoveInfo(false)} />}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          error={editEventError}
          onChange={(changes) => setEditingEvent((prev) => (prev ? { ...prev, ...changes } : prev))}
          onCancel={() => {
            setEditingEvent(null);
            setEditEventError('');
          }}
          onSave={saveEditedEvent}
        />
      )}
      {showBulkCopyDialog && bulkCopyConfig && (
        <BulkCopyModal
          config={bulkCopyConfig}
          timezone={timezone}
          channels={bulkCopyChannels}
          loadingChannels={bulkCopyChannelsLoading}
          submitting={bulkCopySubmitting}
          error={bulkCopyError}
          onChange={updateBulkCopyField}
          onClose={() => {
            if (!bulkCopySubmitting) {
              setShowBulkCopyDialog(false);
              setBulkCopyError('');
            }
          }}
          onSubmit={submitBulkCopy}
        />
      )}

      {/* ═══════════ PROGRAM SEARCH PANEL ═══════════ */}
      {programPanelOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setProgramPanelOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-[380px] bg-white dark:bg-[var(--color-neutral-800)] shadow-2xl flex flex-col border-l border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
              <Search size={16} className="text-[var(--color-primary-600)]" />
              <h3 className="text-sm font-semibold text-[var(--color-neutral-800)] dark:text-[var(--color-neutral-100)] flex-1">Add Program to Schedule</h3>
              {programTargetDay != null && daySchedules[programTargetDay] && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)] text-[var(--color-primary-600)]">{daySchedules[programTargetDay].date}</span>
              )}
              <button onClick={() => setProgramPanelOpen(false)} className="p-1 rounded hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-500)]"><X size={16} /></button>
            </div>
            <div className="px-4 py-2 border-b border-[var(--color-neutral-100)] dark:border-[var(--color-neutral-700)]">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" />
                <input type="text" value={programSearchQuery} onChange={(e) => handleProgramSearchInput(e.target.value)} placeholder="Search by title or program ID…"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-[var(--color-neutral-200)] placeholder-[var(--color-neutral-400)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                  autoFocus />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {programSearchLoading ? (
                <div className="flex items-center justify-center h-24"><Loader2 size={18} className="animate-spin text-[var(--color-primary-500)]" /></div>
              ) : programSearchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-center px-4">
                  <span className="text-xs text-[var(--color-neutral-400)]">{programSearchQuery.length >= 2 ? 'No programs found' : 'Type at least 2 characters to search'}</span>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-neutral-100)] dark:divide-[var(--color-neutral-800)]">
                  {programSearchResults.map((prog: any, idx: number) => {
                    const progId = prog.programId || prog.id || prog._id;
                    const progTitle = prog.titles?.[0]?.value || prog.title || progId;
                    return (
                      <div key={progId || idx} className="px-4 py-2.5 hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-700)]/50">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-[var(--color-neutral-800)] dark:text-[var(--color-neutral-200)] truncate">{progTitle}</span>
                              {prog.programType && <span className="flex-shrink-0 text-[8px] px-1 py-px rounded bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-700)] text-[var(--color-neutral-500)]">{prog.programType}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-[var(--color-neutral-400)]">{progId}</span>
                              {prog.releaseYear && <span className="text-[10px] text-[var(--color-neutral-400)]">{prog.releaseYear}</span>}
                            </div>
                          </div>
                          <button onClick={() => handleAddProgramToSchedule(prog)} className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] transition-colors"><Plus size={10} /> Add</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Timeline constants
// ─────────────────────────────────────────────────────────────

/** Pixels per minute — controls how tall the 24-hour timeline is */
const PX_PER_MIN = 2.5;
/** Total height of the 24h timeline area */
const TIMELINE_HEIGHT = 24 * 60 * PX_PER_MIN; // 3600px
/** Minimum height for any event cell so text remains visible */
const MIN_EVENT_PX = 28;
/** Array of 24 hours for rendering grid lines and labels */
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * Given an ISO timestamp and a timezone, return minutes-from-midnight
 * for that local day.  e.g. 02:30 → 150
 */
const minutesFromMidnight = (iso: string, tz: string): number => {
  try {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz === 'GMT' ? 'UTC' : tz,
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(d);
    const obj: Record<string, string> = {};
    parts.forEach((p) => (obj[p.type] = p.value));
    return parseInt(obj.hour, 10) * 60 + parseInt(obj.minute, 10);
  } catch {
    return 0;
  }
};

/**
 * Return the YYYY-MM-DD local date string for an ISO timestamp in a given tz.
 */
const localDateOf = (iso: string, tz: string): string => {
  try {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz === 'GMT' ? 'UTC' : tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(d);
    const obj: Record<string, string> = {};
    parts.forEach((p) => (obj[p.type] = p.value));
    return `${obj.year}-${obj.month}-${obj.day}`;
  } catch {
    return iso.substring(0, 10);
  }
};

// ─────────────────────────────────────────────────────────────
//  DayColumnHeader — fixed header for each day column
// ─────────────────────────────────────────────────────────────

interface DayColumnHeaderProps {
  day: DaySchedule;
  dayIdx: number;
  isGmt: boolean;
  selectedEvents: Set<string>;
  versionPanelOpen: boolean;
  dateLabelShort: (d: string) => string;
  onSelectVersion: (dayIdx: number, gmtDate: string, versionId: string) => void;
  onToggleLock: (dayIdx: number, gmtDate: string) => void;
  onToggleAllEvents: () => void;
  onToggleVersionPanel: () => void;
  onOpenProgramPanel: (dayIdx: number) => void;
}

const DayColumnHeader: React.FC<DayColumnHeaderProps> = ({
  day, dayIdx, isGmt: _isGmt, selectedEvents, versionPanelOpen, dateLabelShort,
  onSelectVersion, onToggleLock, onToggleAllEvents, onToggleVersionPanel, onOpenProgramPanel,
}) => {
  const events = day.activeVersion?.events || [];
  const evIds = events.map((ev) => ev.id || ev.programId + ev.startDate);
  const allSelected = evIds.length > 0 && evIds.every((id) => selectedEvents.has(id));
  const someSelected = evIds.some((id) => selectedEvents.has(id));
  const totalEvents = events.length;
  const isToday = day.date === fmtDate(new Date());

  const validationSummary = useMemo(() => {
    let gaps = 0, overlaps = 0, negativeDurations = 0;
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (durationMin(ev.startDate, ev.endDate) < 0) negativeDurations++;
      if (i < events.length - 1) {
        const next = events[i + 1];
        if (hasGap(ev, next)) gaps++;
        if (hasOverlap(ev, next)) overlaps++;
      }
    }
    return { gaps, overlaps, negativeDurations, hasIssues: gaps + overlaps + negativeDurations > 0 };
  }, [events]);

  const vLabel = day.activeVersion ? `v${day.activeVersion.version}${day.activeVersion.published ? ' PUB' : ''}` : 'No ver';

  return (
    <div className="flex flex-col border-r border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] flex-1 min-w-0">
      <div className={`px-3 py-2 border-b ${isToday ? 'bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)] border-[var(--color-primary-200)] dark:border-[var(--color-primary-700)]' : 'bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-800)] border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]'}`}>
        <div className="flex items-center gap-1.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold ${isToday ? 'text-[var(--color-primary-700)] dark:text-[var(--color-primary-300)]' : 'text-[var(--color-neutral-800)] dark:text-[var(--color-neutral-200)]'}`}>{dateLabelShort(day.date)}</span>
              <span className="text-[10px] text-[var(--color-neutral-400)]">{day.date}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-1">
          <button onClick={onToggleVersionPanel}
            className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-600)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] truncate max-w-[120px]">
            {vLabel}<ChevronDown size={10} />
          </button>
          <button onClick={() => onToggleLock(dayIdx, day.date)}
            className={`p-0.5 rounded ${day.contentLock ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]'}`}
            title={day.contentLock ? 'Content locked' : 'Content unlocked'}>
            {day.contentLock ? <Lock size={11} /> : <Unlock size={11} />}
          </button>
          <span className="text-[10px] text-[var(--color-neutral-400)] ml-auto">{totalEvents > 0 ? `${totalEvents} evts` : ''}</span>
          {validationSummary.gaps > 0 && (
            <span className="text-[9px] px-1 py-px rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-medium">{validationSummary.gaps}G</span>
          )}
          {validationSummary.overlaps > 0 && (
            <span className="text-[9px] px-1 py-px rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-medium">{validationSummary.overlaps}O</span>
          )}
          <button onClick={() => onOpenProgramPanel(dayIdx)} className="p-0.5 rounded text-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-900)]" title="Add program"><Plus size={13} /></button>
        </div>

        {versionPanelOpen && (
          <div className="mt-1.5 bg-white dark:bg-[var(--color-neutral-900)] border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-600)] rounded-lg shadow-sm max-h-44 overflow-y-auto z-10 relative">
            {day.versionStubs.length === 0 ? (
              <div className="px-2 py-1 text-[10px] text-[var(--color-neutral-400)]">No versions</div>
            ) : (
              [...day.versionStubs].sort((a, b) => (b.version || 0) - (a.version || 0)).map((v) => (
                <button key={v.id || `v${v.version}`} onClick={() => v.id && onSelectVersion(dayIdx, day.date, v.id)}
                  className={`w-full flex items-center gap-1.5 px-2 py-1 text-[10px] hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-800)] ${v.id === day.selectedVersionId ? 'bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/30 font-medium' : ''}`}>
                  <span>v{v.version}</span>
                  {v.published && <span className="px-1 py-px rounded text-[9px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">PUB</span>}
                  {v.provider && <span className="px-1 py-px rounded text-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{v.provider}</span>}
                </button>
              ))
            )}
          </div>
        )}

        {totalEvents > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <button onClick={onToggleAllEvents} className={`w-4 h-4 rounded border flex items-center justify-center ${allSelected ? 'bg-[var(--color-primary-600)] border-[var(--color-primary-600)] text-white' : someSelected ? 'bg-[var(--color-primary-100)] border-[var(--color-primary-400)]' : 'border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)]'}`}>
              {allSelected ? <Check size={10} /> : someSelected ? <Minus size={10} /> : null}
            </button>
            <span className="text-[10px] text-[var(--color-neutral-500)]">Select all</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  DayTimelineColumn — scrollable timeline events for one day
// ─────────────────────────────────────────────────────────────

interface DayTimelineColumnProps {
  day: DaySchedule;
  dayIdx: number;
  timezone: string;
  isGmt: boolean;
  selectedEvents: Set<string>;
  expandedEvents: Set<string>;
  genreMap: Map<string, string>;
  ratingLookup: Map<string, { code: string; rating: string }>;
  onToggleEvent: (evId: string, event?: ScheduleEvent) => void;
  onToggleExpand: (evKey: string) => void;
  onEditEvent: (dayDate: string, evId: string) => void;
  onNavigateToProgram: (programId: string) => void;
}

const DayTimelineColumn: React.FC<DayTimelineColumnProps> = ({
  day, dayIdx: _dayIdx, timezone, isGmt, selectedEvents, expandedEvents,
  genreMap, ratingLookup, onToggleEvent, onToggleExpand, onEditEvent, onNavigateToProgram,
}) => {
  const events = day.activeVersion?.events || [];

  if (day.loading) {
    return (
      <div className="border-r border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] flex-1 min-w-0 flex items-start justify-center pt-12">
        <div className="flex flex-col items-center gap-1">
          <Loader2 size={20} className="animate-spin text-[var(--color-primary-500)]" />
          <span className="text-[11px] text-[var(--color-neutral-400)]">Loading…</span>
        </div>
      </div>
    );
  }

  if (day.error) {
    return (
      <div className="border-r border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] flex-1 min-w-0 flex items-start justify-center pt-12">
        <div className="flex flex-col items-center text-center px-3">
          <AlertTriangle size={20} className="text-amber-500 mb-1" />
          <span className="text-xs text-[var(--color-neutral-500)]">{day.error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-r border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] flex-1 min-w-0 relative" style={{ height: TIMELINE_HEIGHT }}>
      {/* Hour grid lines */}
      {HOURS.map((h) => (
        <div
          key={`grid-${h}`}
          className="absolute left-0 right-0 border-t border-[var(--color-neutral-100)] dark:border-[var(--color-neutral-800)]"
          style={{ top: h * 60 * PX_PER_MIN }}
        />
      ))}

      {/* "From previous day" banner — events whose start date is before this column's date */}
      {(() => {
        const fromPrev = events.filter((ev) => localDateOf(ev.startDate, timezone) < day.date);
        if (fromPrev.length === 0) return null;
        return (
          <div className="absolute top-0 left-1.5 right-1.5 z-10 flex items-center gap-1 px-2 py-1 bg-[var(--color-rollover-bg)] border border-[var(--color-rollover-border)] border-t-[3px] border-t-[var(--color-rollover-border-strong)] rounded-b text-[9px] text-[var(--color-rollover-text)] font-medium shadow-sm">
            <ChevronUp size={10} className="flex-shrink-0" />
            <span>{fromPrev.length === 1 ? '1 event' : `${fromPrev.length} events`} from previous day</span>
            <span className="text-[var(--color-rollover-text-muted)] font-mono ml-auto">
              {fromPrev.map((ev) => getEventTitle(ev)).join(', ').substring(0, 30)}{fromPrev.map((ev) => getEventTitle(ev)).join(', ').length > 30 ? '…' : ''}
            </span>
          </div>
        );
      })()}

      {events.length === 0 ? (
        <div className="absolute inset-0 flex items-start justify-center pt-12">
          <div className="flex flex-col items-center">
            <CalendarDays size={20} className="text-[var(--color-neutral-300)] mb-1" />
            <span className="text-xs text-[var(--color-neutral-400)]">No events</span>
          </div>
        </div>
      ) : (
        events.map((ev, evIdx) => {
          const evId = ev.id || ev.programId + ev.startDate;
          const isSelected = selectedEvents.has(evId);
          const isExpandedEv = expandedEvents.has(evId);
          const nextEv = events[evIdx + 1];
          const gap = hasGap(ev, nextEv);
          const overlap = hasOverlap(ev, nextEv);
          const dur = durationMin(ev.startDate, ev.endDate);
          const negativeDur = dur < 0;

          // Detect day-boundary spills
          const startLocalDate = localDateOf(ev.startDate, timezone);
          const endLocalDate = localDateOf(ev.endDate, timezone);
          const spillsFromPrev = startLocalDate < day.date;  // started before this day
          const spillsToNext = endLocalDate > day.date;       // ends after this day

          // Position: if from previous day, start at 00:00; otherwise use real start
          const startMin = spillsFromPrev ? 0 : minutesFromMidnight(ev.startDate, timezone);
          // End: if spills to next day, clamp to 24:00 (1440); otherwise use real end
          const endMin = spillsToNext ? 1440 : minutesFromMidnight(ev.endDate, timezone);
          const durationMinutes = endMin > startMin ? endMin - startMin : Math.max(dur, 1);
          const topPx = startMin * PX_PER_MIN;
          const heightPx = Math.max(durationMinutes * PX_PER_MIN, MIN_EVENT_PX);
          const bubbleHeightPx = Math.max(heightPx - (spillsFromPrev ? 1 : 2), MIN_EVENT_PX);
          const bubbleTopPx = topPx + (spillsFromPrev ? 0 : 1);

          // Alternate tint for consecutive events
          const isOdd = evIdx % 2 === 1;
          let cellBg = isOdd
            ? 'bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-800)]'
            : 'bg-white dark:bg-[var(--color-neutral-850,var(--color-neutral-800))]';
          let leftBorderColor = 'border-l-[var(--color-primary-400)] dark:border-l-[var(--color-primary-600)]';
          let borderRingColor = 'border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]';
          if (spillsFromPrev || spillsToNext) {
            // Day-boundary events get a violet accent
            cellBg = isOdd
              ? 'bg-[var(--color-rollover-bg-soft)]'
              : 'bg-[var(--color-rollover-bg-softer)]';
            leftBorderColor = 'border-l-[var(--color-rollover-border-strong)]';
            borderRingColor = 'border-[var(--color-rollover-border)]';
          }
          if (isSelected) {
            cellBg = 'bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/30';
            leftBorderColor = 'border-l-[var(--color-primary-500)]';
            borderRingColor = 'border-[var(--color-primary-300)] dark:border-[var(--color-primary-700)]';
          } else if (negativeDur) {
            cellBg = 'bg-red-50 dark:bg-red-900/20';
            leftBorderColor = 'border-l-red-500';
            borderRingColor = 'border-red-200 dark:border-red-800';
          } else if (overlap) {
            cellBg = 'bg-red-50/60 dark:bg-red-900/10';
            leftBorderColor = 'border-l-red-400';
            borderRingColor = 'border-red-200 dark:border-red-800';
          } else if (gap) {
            cellBg = 'bg-amber-50/60 dark:bg-amber-900/10';
            leftBorderColor = 'border-l-amber-400';
            borderRingColor = 'border-amber-200 dark:border-amber-800';
          }

          // Rounded corners: remove top rounding if from prev, remove bottom rounding if spills to next
          const roundedClass = spillsFromPrev && spillsToNext ? '' : spillsFromPrev ? 'rounded-b' : spillsToNext ? 'rounded-t' : 'rounded';

          return (
            <React.Fragment key={evId}>
              <div
                className={`absolute left-1.5 right-1.5 ${cellBg} border ${borderRingColor} border-l-[3px] ${leftBorderColor} ${roundedClass} shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:brightness-[0.97] transition-all`}
                style={{ top: bubbleTopPx, height: bubbleHeightPx, minHeight: MIN_EVENT_PX, zIndex: 1 }}
                onClick={() => onToggleEvent(evId, ev)}
                onDoubleClick={() => onEditEvent(day.date, evId)}
              >
                <div className="px-1.5 py-0.5 h-full flex flex-col">
                  {/* "From previous day" inline badge */}
                  {spillsFromPrev && (
                    <div className="flex items-center gap-1 mb-0.5">
                      <ChevronUp size={9} className="text-[var(--color-rollover-text-muted)] flex-shrink-0" />
                      <span className="text-[8px] font-medium text-[var(--color-rollover-text)]">From prev day · started {fmtTimeInTz(ev.startDate, timezone, { showDate: true })}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 min-w-0">
                    <button onClick={(e) => { e.stopPropagation(); onToggleEvent(evId, ev); }}
                      className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${isSelected ? 'bg-[var(--color-primary-600)] border-[var(--color-primary-600)] text-white' : 'border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)]'}`}>
                      {isSelected && <Check size={8} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleExpand(evId); }}
                      className="w-3.5 h-3.5 rounded border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] flex-shrink-0 flex items-center justify-center text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)]"
                      title="Program info"
                    >
                      {isExpandedEv ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                    </button>
                    <span className="flex-shrink-0 text-[10px] font-mono font-semibold text-[var(--color-primary-700)] dark:text-[var(--color-primary-400)]">
                      {fmtTimeInTz(ev.startDate, timezone)}–{fmtTimeInTz(ev.endDate, timezone)}
                    </span>
                    <span className="text-[9px] text-[var(--color-neutral-400)] flex-shrink-0">{fmtDuration(dur)}</span>
                    {ev.blackout && <ShieldOff size={10} className="flex-shrink-0 text-red-500" />}
                    {negativeDur && <span className="text-[8px] px-1 py-px rounded bg-red-100 dark:bg-red-900/40 text-red-600 font-medium flex-shrink-0">NEG</span>}
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[11px] font-medium text-[var(--color-neutral-800)] dark:text-[var(--color-neutral-200)] truncate" title={getEventTitle(ev)}>{getEventTitle(ev)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand(evId);
                      }}
                      className="text-[9px] font-mono text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] underline truncate"
                      title="Program info"
                    >
                      {ev.programId}
                    </button>
                    {getEventProgramType(ev) && <span className="flex-shrink-0 text-[8px] px-1 py-px rounded bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)] text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]">{getEventProgramType(ev)}</span>}
                  </div>
                  {!isGmt && heightPx > 50 && (
                    <div className="text-[9px] text-[var(--color-neutral-400)] font-mono">GMT {fmtGmt(ev.startDate)}–{fmtGmt(ev.endDate)}</div>
                  )}
                  {heightPx > 70 && ev.qualifiers && ev.qualifiers.length > 0 && (
                    <div className="flex items-center gap-0.5 flex-wrap mt-0.5">
                      {ev.qualifiers.slice(0, 3).map((q, qi) => (
                        <span key={qi} className="text-[8px] px-1 py-px rounded bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-700)] text-[var(--color-neutral-500)]">{q}</span>
                      ))}
                      {ev.qualifiers.length > 3 && <span className="text-[8px] text-[var(--color-neutral-400)]">+{ev.qualifiers.length - 3}</span>}
                    </div>
                  )}
                  {/* "Continues to next day" inline badge at bottom */}
                  {spillsToNext && !isExpandedEv && (
                    <div className="mt-auto flex items-center gap-1 pt-0.5">
                      <span className="text-[8px] font-medium text-[var(--color-rollover-text)]">Continues to next day · ends {fmtTimeInTz(ev.endDate, timezone, { showDate: true })}</span>
                      <ChevronDown size={9} className="text-[var(--color-rollover-text-muted)] flex-shrink-0" />
                    </div>
                  )}
                </div>
              </div>

              {isExpandedEv && (
                <div
                  className="absolute left-2 right-2 p-2 bg-white/95 dark:bg-[var(--color-neutral-900)]/95 backdrop-blur-sm rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] text-[10px] space-y-1 shadow-2xl ring-1 ring-black/5 dark:ring-white/5"
                  style={{ top: bubbleTopPx + 20, zIndex: 25 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex gap-2">
                    {getEventImageUrl(ev) ? (
                      <img src={getEventImageUrl(ev)} alt={getEventTitle(ev)} className="w-14 h-10 object-cover rounded flex-shrink-0 bg-[var(--color-neutral-200)]" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-14 h-10 rounded flex-shrink-0 bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-700)] flex items-center justify-center"><Film size={12} className="text-[var(--color-neutral-400)]" /></div>
                    )}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(evId);
                          }}
                          className="font-mono text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] text-[9px] underline"
                          title="Program info"
                        >
                          {ev.programId}
                        </button>
                      </div>
                      {(ev as any).programDetails?.releaseYear && (
                        <div className="text-[var(--color-neutral-500)] text-[9px]">Year: {(ev as any).programDetails.releaseYear}</div>
                      )}
                    </div>
                  </div>
                  {getEventDescription(ev) && (
                    <p className="text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-300)] leading-relaxed text-[9px]">
                      {getEventDescription(ev)!.length > 150 ? getEventDescription(ev)!.substring(0, 150) + '…' : getEventDescription(ev)}
                    </p>
                  )}
                  {getEventRatingsDisplay(ev, ratingLookup).length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Star size={9} className="text-amber-500 flex-shrink-0" />
                      {getEventRatingsDisplay(ev, ratingLookup).map((r: string, ri: number) => (
                        <span key={ri} className="px-1 py-px rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[9px] font-medium">{r}</span>
                      ))}
                    </div>
                  )}
                  {getEventGenreIds(ev).length > 0 && (
                    <div className="flex items-center gap-0.5 flex-wrap">
                      <span className="text-[var(--color-neutral-400)] text-[9px]">Genres:</span>
                      {resolveGenreNames(getEventGenreIds(ev), genreMap).map((g: string, gi: number) => (
                        <span key={gi} className="px-1 py-px rounded bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-700)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-300)] text-[8px]">{g}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[var(--color-neutral-500)] text-[9px]">
                    <span>{fmtTimeInTz(ev.startDate, timezone)} – {fmtTimeInTz(ev.endDate, timezone)}</span>
                    <span>{fmtDuration(dur)} ({ev.duration ? Math.round(ev.duration / 60) : dur} min)</span>
                  </div>
                  <button onClick={() => onNavigateToProgram(ev.programId)} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)] text-[var(--color-primary-700)] dark:text-[var(--color-primary-300)] hover:bg-[var(--color-primary-100)] transition-colors">
                    <ExternalLink size={9} /> View Program
                  </button>
                  {(spillsFromPrev || spillsToNext) && (
                    <div className="flex items-center gap-1 pt-0.5 border-t border-[var(--color-rollover-border)] mt-1">
                      {spillsFromPrev && (
                        <span className="flex items-center gap-0.5 text-[9px] text-[var(--color-rollover-text)] font-medium">
                          <ChevronUp size={9} /> From prev day · started {fmtTimeInTz(ev.startDate, timezone, { showDate: true })}
                        </span>
                      )}
                      {spillsToNext && (
                        <span className="flex items-center gap-0.5 text-[9px] text-[var(--color-rollover-text)] font-medium">
                          Continues next day · ends {fmtTimeInTz(ev.endDate, timezone, { showDate: true })} <ChevronDown size={9} />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Gap indicator */}
              {gap && (() => {
                const gapStartMin = minutesFromMidnight(ev.endDate, timezone);
                const gapEndMin = minutesFromMidnight(nextEv!.startDate, timezone);
                const gapTop = gapStartMin * PX_PER_MIN;
                const gapH = Math.max((gapEndMin - gapStartMin) * PX_PER_MIN, 14);
                return (
                  <div className="absolute left-1.5 right-1.5 bg-amber-50/80 dark:bg-amber-900/20 border border-dashed border-amber-300 dark:border-amber-700 rounded flex items-center justify-center"
                    style={{ top: gapTop, height: gapH, zIndex: 0 }}>
                    {gapH >= 14 && <span className="text-[8px] text-amber-600 dark:text-amber-400 font-medium px-1">Gap {fmtDuration(durationMin(ev.endDate, nextEv!.startDate))}</span>}
                  </div>
                );
              })()}
            </React.Fragment>
          );
        })
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  EventEditModal
// ─────────────────────────────────────────────────────────────

interface EditEventModalProps {
  event: EditEventState;
  error?: string;
  onChange: (changes: Partial<EditEventState>) => void;
  onCancel: () => void;
  onSave: () => void;
}

const EditEventModal: React.FC<EditEventModalProps> = ({ event, error, onChange, onCancel, onSave }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
    <div className="bg-white dark:bg-[var(--color-neutral-800)] rounded-xl shadow-2xl w-full max-w-xl">
      <div className="px-5 py-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
        <h3 className="text-sm font-semibold text-[var(--color-neutral-800)] dark:text-[var(--color-neutral-100)]">Edit Schedule Event</h3>
      </div>
      <div className="px-5 py-4 space-y-3">
        {error && <div className="text-[11px] rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</div>}
        <label className="block text-[11px] text-[var(--color-neutral-600)]">
          Title
          <input className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] px-2 py-1.5 text-xs bg-white dark:bg-[var(--color-neutral-900)]" value={event.title} onChange={(e) => onChange({ title: e.target.value })} />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block text-[11px] text-[var(--color-neutral-600)]">
            Start (ISO datetime)
            <input className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] px-2 py-1.5 text-xs bg-white dark:bg-[var(--color-neutral-900)]" value={event.startDate} onChange={(e) => onChange({ startDate: e.target.value })} />
          </label>
          <label className="block text-[11px] text-[var(--color-neutral-600)]">
            End (ISO datetime)
            <input className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] px-2 py-1.5 text-xs bg-white dark:bg-[var(--color-neutral-900)]" value={event.endDate} onChange={(e) => onChange({ endDate: e.target.value })} />
          </label>
        </div>
        <label className="block text-[11px] text-[var(--color-neutral-600)]">
          Qualifiers (comma separated)
          <input className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] px-2 py-1.5 text-xs bg-white dark:bg-[var(--color-neutral-900)]" value={event.qualifiers} onChange={(e) => onChange({ qualifiers: e.target.value })} />
        </label>
        <div className="flex items-center gap-4 text-xs text-[var(--color-neutral-600)]">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={event.blackout} onChange={(e) => onChange({ blackout: e.target.checked })} />
            Blackout
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={event.published} onChange={(e) => onChange({ published: e.target.checked })} />
            Published
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-600)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Cancel</button>
        <button onClick={onSave} className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)]">Save Event</button>
      </div>
    </div>
  </div>
);

//  BulkCopyModal
// ─────────────────────────────────────────────────────────────

interface BulkCopyModalProps {
  config: BulkCopyFormState;
  timezone: string;
  channels: BulkCopyChannelOption[];
  loadingChannels: boolean;
  submitting: boolean;
  error?: string;
  onChange: (key: keyof BulkCopyFormState, value: string | number | boolean) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const BulkCopyModal: React.FC<BulkCopyModalProps> = ({
  config,
  timezone,
  channels,
  loadingChannels,
  submitting,
  error,
  onChange,
  onClose,
  onSubmit,
}) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-[var(--color-neutral-800)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
          <h3 className="text-sm font-semibold text-[var(--color-neutral-800)] dark:text-[var(--color-neutral-100)]">Bulk Copy Schedules</h3>
          <p className="mt-1 text-[11px] text-[var(--color-neutral-500)]">Timezone: {timezone}</p>
        </div>

        <div className="px-5 py-4 overflow-y-auto max-h-[60vh] space-y-3">
          {error && (
            <div className="text-[11px] rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-[11px] text-[var(--color-neutral-600)]">
              Original Channel
              <select
                className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] px-2 py-1.5 text-xs bg-[var(--color-neutral-100)]"
                value={config.origChannelId}
                onChange={(e) => onChange('origChannelId', e.target.value)}
                disabled
              >
                <option value="">Select channel</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.label}</option>
                ))}
              </select>
            </label>

            <label className="text-[11px] text-[var(--color-neutral-600)]">
              Destination Channel
              <select
                className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] px-2 py-1.5 text-xs bg-white dark:bg-[var(--color-neutral-900)]"
                value={config.destChannelId}
                onChange={(e) => onChange('destChannelId', e.target.value)}
                disabled={loadingChannels || submitting}
              >
                <option value="">{loadingChannels ? 'Loading channels...' : 'Select channel'}</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-[11px] text-[var(--color-neutral-600)]">
              Start Date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] px-2 py-1.5 text-xs bg-white dark:bg-[var(--color-neutral-900)]"
                value={config.startDate}
                onChange={(e) => onChange('startDate', e.target.value)}
                disabled={submitting}
              />
            </label>
            <label className="text-[11px] text-[var(--color-neutral-600)]">
              End Date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] px-2 py-1.5 text-xs bg-white dark:bg-[var(--color-neutral-900)]"
                value={config.endDate}
                onChange={(e) => onChange('endDate', e.target.value)}
                disabled={submitting}
              />
            </label>
            <label className="text-[11px] text-[var(--color-neutral-600)]">
              Destination Start Date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] px-2 py-1.5 text-xs bg-white dark:bg-[var(--color-neutral-900)]"
                value={config.destStartDate}
                onChange={(e) => onChange('destStartDate', e.target.value)}
                disabled={submitting}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-[11px] text-[var(--color-neutral-600)]">
              Number of Copies
              <input
                type="number"
                min={1}
                max={30}
                className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] px-2 py-1.5 text-xs bg-white dark:bg-[var(--color-neutral-900)]"
                value={config.numOfCopies}
                onChange={(e) => onChange('numOfCopies', Number(e.target.value || 1))}
                disabled={submitting}
              />
            </label>
            <label className="text-[11px] text-[var(--color-neutral-600)]">
              Published
              <select
                className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] px-2 py-1.5 text-xs bg-white dark:bg-[var(--color-neutral-900)]"
                value={String(config.published)}
                onChange={(e) => onChange('published', e.target.value === 'true')}
                disabled={submitting}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <label className="text-[11px] text-[var(--color-neutral-600)] flex items-end">
              <span className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={config.enableOverwrite}
                  onChange={(e) => onChange('enableOverwrite', e.target.checked)}
                  disabled={submitting}
                />
                Overwrite Existing Schedules
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-600)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-700)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Bulk Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  ConfirmModal
// ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  variant?: 'default' | 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, confirmLabel, variant = 'default', onConfirm, onCancel }) => {
  const btnClass = variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : variant === 'primary' ? 'bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white' : 'bg-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-800)] text-white';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[var(--color-neutral-800)] rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="px-5 py-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
          <h3 className="text-sm font-semibold text-[var(--color-neutral-800)] dark:text-[var(--color-neutral-100)]">{title}</h3>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">{message}</p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-600)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-700)]">Cancel</button>
          <button onClick={onConfirm} className={`px-3 py-1.5 text-xs rounded-lg ${btnClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
