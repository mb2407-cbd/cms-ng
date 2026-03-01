/**
 * @file channel.types.ts
 * @description TypeScript type definitions for Channel entities
 * @author VLS Team
 * @date 2026-02-15
 */

import type { Description } from './program.types';

export interface ValueLang {
  value: string;
  lang?: string;
  type?: string;
  language?: string;
}

export interface Drm {
  drmId: string;
  name: string;
  drm: string;
  vendorId: string;
  vendorName: string;
  certificateUrl?: string;
  licenseUrl?: string;
}

export interface Cdn {
  vendorId: string;
  vendorName: string;
  baseUrl: string;
  cdnChannelId?: string;
  cdnCountry?: string;
}

export interface ChannelUrl {
  resolution: string;
  contentType: string;
  lang: string;
  drms?: Drm[];
  cdns?: Cdn[];
  drmsName?: string;
}

export interface DthInfo {
  viewerNumber?: string;
  channelResolution?: string;
  masterSource?: string;
  isSlave?: boolean;
  isEngineering?: boolean;
}

export interface Daypart {
  index?: number;
  id?: string;
  startDate: string;
  endDate: string;
  mappings?: DaypartMapping[];
}

export interface DaypartMapping {
  index?: number;
  startDate: string;
  endDate: string;
  prgSvcId?: string;
  lang?: string;
}

export interface ChannelCategory {
  id: string;
  name: string;
  labelId?: string;
  type?: string;
}

export interface ChannelRegion {
  id: string;
  name: string;
  abbrev?: string;
  regionName?: string;
  regionId?: string;
}

export interface ServiceChannel {
  id: string;
  sourceId?: string;
  name?: string;
  callSign?: string;
  channelTarget: string;
  channelSrc?: string;
  channelType: string;
  language?: string;
  auto?: boolean;
  adult?: boolean;
  status?: boolean;
  bubble?: boolean;
  vcId?: string;
  masterSource?: string;
  region?: string;
  assignedTo?: string[];
  categories?: ChannelCategory[];
  category?: string;
  regions?: ChannelRegion[];
  checked?: boolean;
  owner?: string;
  serviceId?: string;
  licenseStartDate?: string;
  licenseEndDate?: string;
  channelNames?: ValueLang[];
  createdDate: string;
  updatedDate: string;
  dayParts?: Daypart[];
  descriptions?: Description[];
  processingType?: string;
  published: boolean;
  urls?: ChannelUrl[];
  shortDescription?: string;
  fullDescription?: string;
  prgSvcId?: string;
  dayPartIndex?: number;
  mappingIndex?: number;
  channelImage?: string;
  dthInfo?: DthInfo;
  hasSchedule?: boolean;
  oldDayPart?: Daypart[];
  masterChannelName?: string;
  timeZone?: string;
  timeZoneName?: string;
  ppv?: boolean;
  imageUrl?: string;
  serviceProviderInfo?: {
    serviceProvider?: {
      id?: string;
      providerID?: string;
      name?: string;
    };
    serviceProviderCategories?: Array<{
      id?: string;
      providerID?: string;
      name?: string;
      concurrence?: string;
    }>;
    serviceProviderCategory?: {
      id?: string;
      providerID?: string;
      name?: string;
      concurrence?: string;
    };
  };
}

export interface ChannelSearchRequest {
  platform?: string[];
  chanType?: string[];
  source?: string[];
  isAssigned?: boolean;
  isBubble?: boolean;
  processingType?: string;
  channelResolution?: string[];
  searchString?: string;
  excludeSlaveChannel?: string;
  published?: boolean;
}

export interface ProviderChannel {
  id: string;
  name: string;
  platform: string;
  lang: string;
  prgSvcId: string;
  channelType?: string;
  timezone?: string;
  isMapped?: boolean;
  sid?: string;
  edLangs?: string[];
  bcastLangs?: string[];
  sourceId?: string;
}
