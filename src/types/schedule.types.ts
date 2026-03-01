/**
 * @file schedule.types.ts
 * @description TypeScript type definitions for Schedule entities
 * @author VLS Team
 * @date 2026-02-15
 */

import type { Rating, ExternalRef, ProviderInfo, ProgramImage } from './program.types';

export interface ScheduleEvent {
  id?: string;
  programId: string;
  title?: string;
  startDate: string;
  endDate: string;
  duration?: number;
  qualifiers?: string[];
  contentId?: string;
  ratings?: Rating[];
  published?: boolean;
  blackout?: boolean;
  vrioId?: string;
  blackoutRegions?: string;
  createdDate?: string;
  updatedDate?: string;
  tags?: Record<string, any>[];
  subtitleLang?: string[];
  subtitled?: boolean;
  dubbed?: boolean;
  sap?: boolean;
  tvRating?: {
    body: string;
    code: string;
  };
  ratingBody?: string;
  rating?: string;
  variants?: VariantEvent[];
  images?: ProgramImage[];
}

export interface VariantEvent {
  variantId?: string;
  platform?: string;
  [key: string]: any;
}

export interface ScheduleVersion {
  id?: string;
  createdDate?: string;
  updatedDate?: string;
  channelId: string;
  provider?: string;
  published: boolean;
  scheduleId?: string;
  sourceId?: string;
  processingType?: string;
  completed?: boolean;
  scheduleDate: string;
  version: number;
  events: ScheduleEvent[];
  externalRefs?: ExternalRef[];
  providerInfo?: ProviderInfo[];
  targetPlatform?: string;
  contentLock?: boolean;
  imageBaseUrl?: string;
  scheduledPublishedVersion?: number;
  publishParent?: boolean;
}

export interface ScheduleBulkCopy {
  id?: string;
  origChannelId: string;
  origChannelNames?: { value: string; lang: string }[];
  destChannelId: string;
  destChannelNames?: { value: string; lang: string }[];
  startDate: string;
  endDate: string;
  destStartDate: string;
  numOfCopies: number;
  userId?: string;
  published?: boolean;
  enableOverwrite?: boolean;
}
