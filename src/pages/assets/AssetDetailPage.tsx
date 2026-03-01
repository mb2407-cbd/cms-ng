/**
 * @file AssetDetailPage.tsx
 * @description Full asset detail page with floating modal dialog, hero image header,
 *   tabbed sections for asset info, program metadata, images, and DRM/URL information.
 *   Follows the same design scheme as ProgramDetailPage and ChannelDetailPage.
 * @author VLS Team
 * @date 2026-02-21
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  Clock,
  ExternalLink,
  Film,
  Globe,
  Image as ImageIcon,
  Info,
  Link2,
  List,
  Lock,
  Play,
  Shield,
  Tag,
  Tv,
  X,
} from 'lucide-react';
import { getAssetDetail } from '../../services/asset.service';
import {
  getProgramVersions,
  getProgramByVersion,
  getProgramImages,
} from '../../services/program.service';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { AssetDetail, AssetProgramImage, AssetUrl, AssetUrlInfo } from '../../types/asset.types';
import type { Program, ProgramImage } from '../../types';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

type TabId = 'info' | 'program' | 'images' | 'urls';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'info', label: 'Asset Info', icon: Info },
  { id: 'program', label: 'Program', icon: Film },
  { id: 'images', label: 'Images', icon: ImageIcon },
  { id: 'urls', label: 'URLs / DRM', icon: Link2 },
];

const DRM_LABEL_MAP: Record<string, string> = {
  widevine: 'Widevine',
  playready: 'PlayReady',
  fairplay: 'FairPlay',
};

const MPAA_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR'];
const TV_RATINGS = ['TVY', 'TVY7', 'TVG', 'TVPG', 'TV14', 'TVMA'];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Pretty-format an ISO date or return a dash. */
const fmtDate = (iso?: string | null): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

/** Resolve a program type code into a human label. */
const programTypeLabel = (code?: string): string => {
  if (!code) return '—';
  const map: Record<string, string> = {
    MV: 'Movie', SH: 'Series', EP: 'Episode',
    SP: 'Sport', SE: 'Sport Episode', SV: 'Standalone Show',
  };
  return map[code.toUpperCase()] ?? code;
};

/** Normalise publication state from multiple possible shapes. */
const isPublished = (asset: AssetDetail): boolean => {
  if (typeof asset.published === 'boolean') return asset.published;
  const raw = (asset.pubStatus ?? '').toLowerCase();
  return raw === 'published' || raw === 'true' || raw === '1' || raw === 'yes';
};

/** Build a full image URL from an AssetProgramImage or ProgramImage. */
const resolveImageUrl = (img: AssetProgramImage | ProgramImage | Record<string, unknown>): string | null => {
  const rec = img as Record<string, unknown>;
  if (rec.imageURL) return String(rec.imageURL);
  if (rec.baseUrl && rec.uri) return `${rec.baseUrl}${rec.uri}`;
  if (rec.uri) return String(rec.uri);
  return null;
};

/**
 * Flatten the API's `urls[]` (each with drms[] and cdns[]) into
 * a flat list of labelled DRM+CDN pairs for the UI.
 */
const flattenUrlsToDrmEntries = (urls?: AssetUrl[]): AssetUrlInfo[] => {
  if (!urls?.length) return [];
  const entries: AssetUrlInfo[] = [];
  for (const urlEntry of urls) {
    const drms = urlEntry.drms ?? [];
    const cdns = urlEntry.cdns ?? [];
    if (drms.length === 0 && cdns.length === 0) continue;
    if (drms.length > 0) {
      for (let i = 0; i < drms.length; i++) {
        const drm = drms[i];
        const label = DRM_LABEL_MAP[(drm.drm ?? drm.name ?? '').toLowerCase()] ?? drm.drm ?? drm.name ?? `DRM ${entries.length + 1}`;
        entries.push({ label, drmInfo: drm, cdnInfo: cdns[i] ?? cdns[0] ?? null });
      }
    } else {
      entries.push({ label: `CDN ${entries.length + 1}`, drmInfo: null, cdnInfo: cdns[0] ?? null });
    }
  }
  return entries;
};

/** Find the best hero image URL from program data. */
const findHeroImage = (program?: Program | null, programImages?: ProgramImage[]): string | null => {
  if (program?.pictures) {
    const pic = program.pictures['16:9'] || program.pictures['4:3'] || Object.values(program.pictures)[0];
    if (pic) return pic;
  }
  if (program?.images?.length) {
    const img = program.images.find(i => i.ratio === '16:9') || program.images[0];
    const url = resolveImageUrl(img);
    if (url) return url;
  }
  if (programImages?.length) {
    const img = programImages.find(i => i.ratio === '16:9') || programImages[0];
    const url = resolveImageUrl(img);
    if (url) return url;
  }
  return null;
};

/* ------------------------------------------------------------------ */
/*  Reusable UI primitives (matching Channel/Program detail style)    */
/* ------------------------------------------------------------------ */

/** A labelled read-only field — matches ChannelDetailPage Field style. */
const Field: React.FC<{ label: string; value?: string | number | null; mono?: boolean; className?: string }> = ({
  label, value, mono = false, className = '',
}) => (
  <div className={`min-h-[56px] ${className}`}>
    <dt className="text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1">
      {label}
    </dt>
    <dd className={`text-sm leading-5 text-[var(--color-neutral-800)] dark:text-white break-words ${mono ? 'font-mono text-xs' : ''}`}>
      {value != null && value !== '' ? String(value) : <span className="text-[var(--color-neutral-400)] italic">—</span>}
    </dd>
  </div>
);

/** Section heading — lightweight, no card/background, just a label with optional icon. */
const SectionHeading: React.FC<{ title: string; icon?: React.ElementType }> = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
    {Icon && <Icon size={15} className="text-[var(--color-neutral-500)]" />}
    <h3 className="text-sm font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">{title}</h3>
  </div>
);

/** Status badge (Published / Unpublished). */
const StatusBadge: React.FC<{ published: boolean }> = ({ published }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
    published
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${published ? 'bg-green-500' : 'bg-red-500'}`} />
    {published ? 'Published' : 'Unpublished'}
  </span>
);

/* ------------------------------------------------------------------ */
/*  Tab content: Asset Info                                           */
/* ------------------------------------------------------------------ */

const AssetInfoTab: React.FC<{ asset: AssetDetail }> = ({ asset }) => {
  const providerName = asset.serviceProviderInfo?.serviceProvider?.name ?? '—';
  const categoryName = asset.serviceProviderInfo?.serviceProviderCategory?.name ?? '—';
  const channelsDisplay = asset.channels?.length ? asset.channels.join(', ') : '—';

  return (
    <div className="space-y-8">
      <div>
        <SectionHeading title="Identifiers" icon={Tag} />
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
          <Field label="Asset ID" value={asset.assetId} mono />
          <Field label="DMS ID" value={asset.dmsId} mono />
          <Field label="Program ID" value={asset.programId} mono />
          <Field label="Program Mapper ID" value={asset.programMapperId} mono />
          <Field label="VRIO ID" value={asset.vrioId} mono />
          <Field label="Source ID" value={asset.sourceId} mono />
        </dl>
      </div>

      <div>
        <SectionHeading title="Service Provider" icon={Globe} />
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
          <Field label="Provider" value={providerName} />
          <Field label="Category" value={categoryName} />
          <Field label="Channels" value={channelsDisplay} />
          <Field label="License Type" value={asset.licenseType} />
        </dl>
      </div>

      <div>
        <SectionHeading title="Season & Episode" icon={List} />
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
          <Field label="Display Season" value={asset.displaySeasonNumber} />
          <Field label="Display Episode" value={asset.displayEpisodeNumber} />
        </dl>
      </div>

      <div>
        <SectionHeading title="Availability Window" icon={Calendar} />
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Starts At" value={fmtDate(asset.availabilityStartsAt)} />
          <Field label="Ends At" value={fmtDate(asset.availabilityEndsAt)} />
        </dl>
      </div>

      <div>
        <SectionHeading title="Timestamps" icon={Clock} />
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="First Received" value={fmtDate(asset.createdDate)} />
          <Field label="Last Updated" value={fmtDate(asset.updatedDate)} />
        </dl>
      </div>

      {(asset.duration != null || asset.audios?.length || asset.availsRegions?.length) && (
        <div>
          <SectionHeading title="Media Properties" icon={Play} />
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            {asset.duration != null && <Field label="Duration (min)" value={asset.duration} />}
            {asset.audios?.length ? <Field label="Audio Tracks" value={asset.audios.join(', ')} /> : null}
            {asset.availsRegions?.length ? <Field label="Regions" value={asset.availsRegions.join(', ')} /> : null}
          </dl>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Tab content: Program (fetched separately)                         */
/* ------------------------------------------------------------------ */

const ProgramTab: React.FC<{ program: Program | null; loading: boolean }> = ({ program, loading }) => {
  const { ratingLookup, getGenreName } = useApp();

  // Filter ratings to MPAA and TV only
  const filteredRatings = useMemo(() => {
    return (program?.ratings || []).filter(r => {
      const lookup = ratingLookup.get(r.id);
      if (lookup) {
        return lookup.code === 'MPAA' || lookup.code === 'TVPG';
      }
      const rv = r.rating || '';
      return MPAA_RATINGS.includes(rv) || TV_RATINGS.includes(rv);
    });
  }, [program?.ratings, ratingLookup]);

  const getMpaaRating = (): string => {
    for (const r of filteredRatings) {
      const lookup = ratingLookup.get(r.id);
      if (lookup?.code === 'MPAA') return lookup.rating;
      if (r.rating && MPAA_RATINGS.includes(r.rating)) return r.rating;
    }
    return '';
  };

  const getTvRating = (): string => {
    for (const r of filteredRatings) {
      const lookup = ratingLookup.get(r.id);
      if (lookup?.code === 'TVPG') return lookup.rating;
      if (r.rating && TV_RATINGS.includes(r.rating)) return r.rating;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="sm" message="Loading program data..." />
      </div>
    );
  }
  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--color-neutral-500)]">
        <Film size={40} className="mb-3 text-[var(--color-neutral-300)]" />
        <p className="text-sm">No linked program data available.</p>
      </div>
    );
  }

  const findTitle = (lang: string) =>
    program.titles?.find(t => t.lang === lang)?.value ?? '—';
  const findDesc = (lang: string) =>
    program.descriptions?.find(d => d.lang === lang)?.value ?? '—';

  const genreDisplay = program.genres?.length
    ? program.genres.map(g => getGenreName(g)).join(', ')
    : '—';
  const mpaa = getMpaaRating();
  const tv = getTvRating();

  const tmsId = program.externalRefs?.find(r => r.refName === 'tmsId')?.id ?? '—';

  return (
    <div className="space-y-8">
      <div>
        <SectionHeading title="Titles" icon={Tv} />
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          <Field label="English Title" value={findTitle('en')} />
          <Field label="Spanish Title" value={findTitle('es')} />
          <Field label="Portuguese Title" value={findTitle('pt')} />
          <Field label="Original Title" value={program.titles?.find(t => t.type === 'original')?.value} />
          <Field label="Program Type" value={programTypeLabel(program.programType)} />
          <Field label="TMS ID" value={tmsId} mono />
          <Field label="Release Year" value={program.releaseYear} />
          <Field label="Original Air Date" value={fmtDate(program.origAirDate)} />
        </dl>
      </div>

      {(program.seasonNumber != null || program.episodeNumber != null) && (
        <div>
          <SectionHeading title="Episode Details" icon={List} />
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
            <Field label="Season Number" value={program.seasonNumber} />
            <Field label="Episode Number" value={program.episodeNumber} />
            {program.episodeAltMappings?.[0] && (
              <>
                <Field label="Alt Season" value={program.episodeAltMappings[0].seasonNumber} />
                <Field label="Alt Episode" value={program.episodeAltMappings[0].episodeNumber} />
              </>
            )}
            <Field label="Season Year" value={program.seasonYear} />
          </dl>
        </div>
      )}

      <div>
        <SectionHeading title="Descriptions" icon={Info} />
        <div className="space-y-4">
          {['en', 'es', 'pt'].map(lang => {
            const label = lang === 'en' ? 'English' : lang === 'es' ? 'Spanish' : 'Portuguese';
            const val = findDesc(lang);
            if (val === '—') return null;
            return (
              <div key={lang}>
                <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1">
                  {label} Description
                </label>
                <p className="text-sm text-[var(--color-neutral-800)] dark:text-white whitespace-pre-wrap leading-relaxed">
                  {val}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <SectionHeading title="Genres & Ratings" icon={Tag} />
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          <Field label="Genres" value={genreDisplay} />
          <Field label="Run Time" value={program.runTime ? `${program.runTime} min` : undefined} />
          <Field label="MPAA Rating" value={mpaa || '—'} />
          <Field label="TV Rating" value={tv || '—'} />
        </dl>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Tab content: Images                                               */
/* ------------------------------------------------------------------ */

const ImagesTab: React.FC<{
  assetImages: AssetProgramImage[];
  programImages: ProgramImage[];
  loadingProgram: boolean;
}> = ({ assetImages, programImages, loadingProgram }) => {
  const hasAssetImages = assetImages.length > 0;
  const hasProgramImages = programImages.length > 0;

  if (!hasAssetImages && !hasProgramImages && !loadingProgram) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--color-neutral-500)]">
        <ImageIcon size={40} className="mb-3 text-[var(--color-neutral-300)]" />
        <p className="text-sm">No images available for this asset.</p>
      </div>
    );
  }

  const renderImageCard = (img: Record<string, unknown>, index: number) => {
    const url = resolveImageUrl(img);
    const category = (img.category as string) ?? '—';
    const ratio = (img.ratio as string) ?? '—';
    const source = (img.source as string) ?? '—';
    const pub = img.published as boolean | undefined;
    const expired = img.expiredDate as string | undefined;

    return (
      <div
        key={`img-${index}`}
        className="rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] overflow-hidden"
      >
        <div className="relative w-full h-40 bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-900)] flex items-center justify-center">
          {url ? (
            <img
              src={url}
              alt={`${category} image`}
              className="w-full h-full object-contain"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <ImageIcon size={28} className="text-[var(--color-neutral-300)]" />
          )}
          {pub != null && (
            <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
              pub ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
            }`}>
              {pub ? 'PUB' : 'UNPUB'}
            </span>
          )}
        </div>
        <div className="px-3 py-2 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--color-neutral-500)]">Category</span>
            <span className="font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">{category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-neutral-500)]">Ratio</span>
            <span className="font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">{ratio}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-neutral-500)]">Source</span>
            <span className="font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">{source}</span>
          </div>
          {expired && (
            <div className="flex justify-between">
              <span className="text-[var(--color-neutral-500)]">Expires</span>
              <span className="text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">{fmtDate(expired)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {hasAssetImages && (
        <div>
          <SectionHeading title="Provider Images" icon={ImageIcon} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {assetImages.map((img, i) => renderImageCard(img as unknown as Record<string, unknown>, i))}
          </div>
        </div>
      )}
      {loadingProgram && !hasProgramImages && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="sm" message="Loading program images..." />
        </div>
      )}
      {hasProgramImages && (
        <div>
          <SectionHeading title="Program Images" icon={ImageIcon} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {programImages.map((img, i) => renderImageCard(img as unknown as Record<string, unknown>, i + assetImages.length))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Tab content: URLs / DRM                                           */
/* ------------------------------------------------------------------ */

const UrlsTab: React.FC<{ asset: AssetDetail }> = ({ asset }) => {
  const entries = useMemo(() => flattenUrlsToDrmEntries(asset.urls), [asset.urls]);
  const [activeIdx, setActiveIdx] = useState(0);

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--color-neutral-500)]">
        <Lock size={40} className="mb-3 text-[var(--color-neutral-300)]" />
        <p className="text-sm">No URL / DRM information available for this asset.</p>
      </div>
    );
  }

  const current = entries[activeIdx];

  return (
    <div className="space-y-8">
      {/* DRM sub-tabs */}
      <div className="flex gap-1 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
        {entries.map((entry, i) => (
          <button
            key={`drm-tab-${i}`}
            onClick={() => setActiveIdx(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeIdx === i
                ? 'border-[var(--color-primary-600)] text-[var(--color-primary-600)]'
                : 'border-transparent text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)] dark:hover:text-[var(--color-neutral-300)]'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {/* DRM Info */}
      {current.drmInfo && (
        <div>
          <SectionHeading title="DRM Information" icon={Shield} />
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <Field label="DRM Type" value={current.drmInfo.drm ?? current.drmInfo.name} />
            <Field label="Vendor ID" value={current.drmInfo.vendorId} mono />
            <Field label="Vendor Name" value={current.drmInfo.vendorName} />
            <Field label="DRM ID" value={current.drmInfo.drmId} mono />
            <Field label="Certificate URL" value={current.drmInfo.certificateUrl} mono className="sm:col-span-2 lg:col-span-3" />
            <Field label="License URL" value={current.drmInfo.licenseUrl} mono className="sm:col-span-2 lg:col-span-3" />
          </dl>
        </div>
      )}

      {/* CDN Info */}
      {current.cdnInfo && (
        <div>
          <SectionHeading title="CDN Information" icon={Globe} />
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <Field label="Vendor ID" value={current.cdnInfo.vendorId} mono />
            <Field label="Vendor Name" value={current.cdnInfo.vendorName} />
            <Field label="Country" value={current.cdnInfo.country} />
            <Field label="Channel ID" value={current.cdnInfo.channelId} mono />
            <Field label="Base URL" value={current.cdnInfo.baseUrl} mono className="sm:col-span-2 lg:col-span-3" />
          </dl>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

const AssetDetailPage: React.FC = () => {
  const { assetId, dmsId } = useParams<{ assetId: string; dmsId: string }>();
  const navigate = useNavigate();
  const { hasRight } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);

  const canRead =
    hasRight('asset:read') || hasRight('asset.read') ||
    hasRight('asset:*') || hasRight('*:*');

  /* ──── 1. Fetch asset detail ──── */
  const {
    data: asset,
    isLoading: assetLoading,
    error: assetError,
  } = useQuery<AssetDetail>({
    queryKey: ['asset-detail', assetId, dmsId],
    queryFn: () => getAssetDetail(assetId!, dmsId!),
    enabled: !!assetId && !!dmsId && canRead,
  });

  const programId = asset?.programId;

  /* ──── 2. Fetch program versions → pick latest/published ──── */
  const { data: versionsData } = useQuery({
    queryKey: ['program-versions', programId],
    queryFn: () => getProgramVersions(programId!),
    enabled: !!programId,
  });

  const versionIdToLoad = useMemo(() => {
    const versions = (versionsData as any)?.response?.masterEntity;
    if (!Array.isArray(versions) || !versions.length) return null;
    const published = versions.find((v: any) => v.published === true);
    if (published) return published.id as string;
    const sorted = [...versions].sort((a: any, b: any) => (b.version || 0) - (a.version || 0));
    return sorted[0]?.id as string ?? null;
  }, [versionsData]);

  /* ──── 3. Fetch program detail by version ──── */
  const {
    data: programResponse,
    isLoading: programLoading,
  } = useQuery({
    queryKey: ['program', versionIdToLoad],
    queryFn: () => getProgramByVersion(versionIdToLoad!, 'masterentity'),
    enabled: !!versionIdToLoad,
  });

  const program = (programResponse as unknown as Program) ?? null;

  /* ──── 4. Fetch program images ──── */
  const baseId = programId ? (programId.length > 14 ? programId.substring(0, 14) : programId) : '';

  const { data: progImagesResponse } = useQuery({
    queryKey: ['program-images', baseId],
    queryFn: () => getProgramImages(baseId),
    enabled: !!baseId,
  });

  const progImages: ProgramImage[] = useMemo(() => {
    const raw = progImagesResponse as any;
    return raw?.response || raw || [];
  }, [progImagesResponse]);

  /* ──── Derive hero image ──── */
  useEffect(() => {
    const url = findHeroImage(program, progImages);
    if (url) setHeroImageUrl(url);
  }, [program, progImages]);

  /* Derive published state */
  const published = useMemo(() => (asset ? isPublished(asset) : false), [asset]);

  /* Navigation helpers */
  const handleClose = () => {
    navigate('/assets');
  };

  const handleOpenProgram = () => {
    if (programId) {
      navigate(`/programs/${programId}`, {
        state: {
          from: 'asset',
          returnPath: `/assets/${assetId}/${dmsId}`,
          assetTitle: asset?.title || 'Untitled Asset',
          assetId,
          dmsId,
        },
      });
    }
  };

  /* ──── Access denied ──── */
  if (!canRead) {
    return (
      <div className="fixed inset-0 z-50 flex bg-black/50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 rounded-xl bg-white dark:bg-[var(--color-neutral-900)] max-w-lg shadow-2xl">
            <AlertCircle className="mx-auto mb-3 text-[var(--color-neutral-400)]" size={28} />
            <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white">Access denied</h2>
            <p className="text-sm text-[var(--color-neutral-500)] mt-2">
              You need <code className="font-mono text-xs">asset:read</code> permission to view asset details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ──── Loading ──── */
  if (assetLoading) {
    return (
      <div className="fixed inset-0 z-50 flex bg-black/50">
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="md" message="Loading asset details..." />
        </div>
      </div>
    );
  }

  /* ──── Error ──── */
  if (assetError || !asset) {
    return (
      <div className="fixed inset-0 z-50 flex bg-black/50">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Failed to load asset
          </h2>
          <p className="text-[var(--color-neutral-400)] mb-4">
            {assetError instanceof Error ? assetError.message : 'The asset could not be retrieved.'}
          </p>
          <button onClick={handleClose} className="px-4 py-2 rounded-lg bg-[var(--color-primary-600)] text-white text-sm font-medium hover:bg-[var(--color-primary-700)] transition-colors">
            Back to Assets
          </button>
        </div>
      </div>
    );
  }

  /* ──── Render — Floating modal dialog ──── */
  return (
    <div className="fixed inset-0 z-50 flex bg-black/50">
      <div className="flex-1 flex flex-col bg-white dark:bg-[var(--color-neutral-900)] m-4 rounded-lg shadow-2xl overflow-hidden">
        {/* ──── Header with hero background ──── */}
        <div className="relative">
          {/* Background image — matches ProgramDetailPage opacity */}
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

          {/* Top bar: thumbnail, title, status, actions, close */}
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
                <h1 className="text-xl font-bold text-[var(--color-neutral-800)] dark:text-white truncate">
                  {asset.title || 'Untitled Asset'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge published={published} />
                  {program?.programType && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {programTypeLabel(program.programType)}
                    </span>
                  )}
                  <span className="text-xs font-mono text-[var(--color-neutral-400)]">
                    {asset.assetId} / {asset.dmsId}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {programId && (
                <button
                  onClick={handleOpenProgram}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-900)]/20 transition-colors"
                  title="View linked program"
                >
                  <ExternalLink size={13} />
                  View Program
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

        {/* ──── Tabs ──── */}
        <div className="flex gap-1 px-6 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-[var(--color-primary-600)] text-[var(--color-primary-600)]'
                    : 'border-transparent text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)] dark:hover:text-[var(--color-neutral-300)]'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ──── Tab Content ──── */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'info' && <AssetInfoTab asset={asset} />}
          {activeTab === 'program' && <ProgramTab program={program} loading={programLoading} />}
          {activeTab === 'images' && (
            <ImagesTab
              assetImages={asset.images ?? []}
              programImages={progImages}
              loadingProgram={programLoading}
            />
          )}
          {activeTab === 'urls' && <UrlsTab asset={asset} />}
        </div>
      </div>
    </div>
  );
};

export default AssetDetailPage;
