/**
 * @file asset.types.ts
 * @description TypeScript types for VLS Asset Management.
 * @author VLS Team
 * @date 2026-02-20
 */

/* ------------------------------------------------------------------ */
/*  Service Provider & Channel info                                   */
/* ------------------------------------------------------------------ */

export interface ServiceProviderCategory {
  name?: string;
  providerID?: string;
}

export interface ServiceProvider {
  name?: string;
  id?: string;
  providerID?: string;
}

export interface ServiceProviderInfo {
  serviceProviderCategory?: ServiceProviderCategory;
  serviceProvider?: ServiceProvider;
}

/* ------------------------------------------------------------------ */
/*  DRM / CDN / URL structures                                        */
/*  API shape: urls[] → each entry has drms[] and cdns[] arrays       */
/* ------------------------------------------------------------------ */

export interface AssetDrm {
  drm?: string;        // "widevine" | "playready" | "fairplay"
  name?: string;
  vendorId?: string;
  vendorName?: string;
  drmId?: string;
  certificateUrl?: string;
  licenseUrl?: string;
}

export interface AssetCdn {
  vendorId?: string;
  vendorName?: string;
  country?: string;
  baseUrl?: string;
  channelId?: string;
}

/** A single URL entry as returned by the API. */
export interface AssetUrl {
  drms?: AssetDrm[];
  cdns?: AssetCdn[];
}

/** Flattened DRM+CDN pair for UI display (derived from AssetUrl). */
export interface AssetUrlInfo {
  label: string;
  drmInfo: AssetDrm | null;
  cdnInfo: AssetCdn | null;
}

/* ------------------------------------------------------------------ */
/*  Program info embedded in asset detail                             */
/* ------------------------------------------------------------------ */

export interface AssetProgramTitle {
  lang?: string;
  value?: string;
  type?: string;
}

export interface AssetProgramDescription {
  lang?: string;
  value?: string;
  type?: string;
}

export interface AssetProgramRating {
  id?: string;
  rating?: string;
  ratingBody?: string;
  code?: string;
  warning?: string;
}

export interface AssetProgramImage {
  imageURL?: string;
  baseUrl?: string;
  uri?: string;
  category?: string;
  ratio?: string;
  source?: string;
  published?: boolean;
  expiredDate?: string;
}

/* ------------------------------------------------------------------ */
/*  Full asset detail (returned by GET /assets/asset/:assetId/:dmsId) */
/*  NOTE: Program metadata is NOT embedded — it requires a separate   */
/*  fetch via the programs API.                                       */
/* ------------------------------------------------------------------ */

export interface AssetDetail {
  /* Core identifiers */
  assetId: string;
  dmsId: string;
  programId: string;
  programMapperId?: string;
  vrioId?: string;
  sourceId?: string;

  /* Display fields */
  title?: string;
  published?: boolean;
  pubStatus?: string;

  /* Service provider */
  serviceProviderInfo?: ServiceProviderInfo;

  /* Channels */
  channels?: string[];

  /* Season / Episode */
  displaySeasonNumber?: number;
  displayEpisodeNumber?: number;

  /* Availability window */
  availabilityStartsAt?: string;
  availabilityEndsAt?: string;

  /* Timestamps */
  createdDate?: string;
  updatedDate?: string;

  /* Media properties */
  duration?: number;
  licenseType?: string;
  audios?: string[];
  availsRegions?: string[];
  burnedinSubtitles?: unknown;
  labels?: unknown[];
  advisories?: unknown[];

  /* DRM / CDN URLs — each entry has drms[] and cdns[] arrays */
  urls?: AssetUrl[];

  /* Ratings attached to the asset */
  assetRatings?: AssetProgramRating[];

  /* Images attached directly to the asset */
  images?: AssetProgramImage[];
}

/* ------------------------------------------------------------------ */
/*  List / search types (unchanged)                                   */
/* ------------------------------------------------------------------ */

export interface AssetListItem {
  assetId: string;
  dmsId: string;
  programId: string;
  title?: string;
  published?: boolean;
  displaySeasonNumber?: number;
  displayEpisodeNumber?: number;
  availabilityStartsAt?: string;
  availabilityEndsAt?: string;
  createdDate?: string;
  updatedDate?: string;
  channels?: string[];
  serviceProviderInfo?: ServiceProviderInfo;
}

export interface AssetFilterOption {
  id: string;
  name: string;
}

export interface AssetSearchRequest {
  filters: string[];
  categories: string[];
  channelIds: string[];
  additionalFilters: string[];
  searchString: string;
}

export interface AssetSearchResponseEnvelope {
  response?: AssetListItem[];
  totalElements?: number;
  totalPages?: number;
  data?: AssetListItem[];
  content?: AssetListItem[];
  total?: number;
  pages?: number;
}

export interface AmountAssetMapped {
  amountMappedTitles: number;
  totalMappedTitles: number;
  amountCatalogTitlesSky: number;
  amountCatalogTitlesSsla: number;
  totalCatalogTitles: number;
}
