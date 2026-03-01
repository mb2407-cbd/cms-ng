/**
 * @file programMapping.types.ts
 * @description TypeScript type definitions for Program Mapping workflow
 * @author VLS Team
 * @date 2026-02-24
 */
import type { Title, Description, ExternalRef, Rating, CastAndCrew, Program } from './program.types';

export type MappingStatus = 'unmapped' | 'mapped' | 'incomplete' | 'unmappable';

export interface ProgramMappingProviderInfo {
  system?: string;
  key?: string;
  value?: any;
}

export interface ProgramMapping {
  id: string;
  mapperId?: string;
  dmsId?: string;
  programId?: string;
  mappedProgram?: Program | null;
  connectorId?: string;
  type: string;         // MOVIE, EPISODE, SERIES, SHOW, SPORT
  programType?: string; // Alternate type field
  status: MappingStatus;
  titles: Title[];
  descriptions: Description[];
  episodeTitles?: Title[];
  genres: string[];
  ratings: Rating[];
  credits?: CastAndCrew[];
  externalRefs: ExternalRef[];
  providerInfo: ProgramMappingProviderInfo[];
  seasonNumber?: string;
  episodeNumber?: string;
  releaseYear?: string;
  origAirDate?: string;
  runTime?: number;
  checked?: boolean;
  published?: boolean;
  autoPublished?: boolean;
}

export interface ProgramMappingSearchRequest {
  searchString: string;
  types: string[];
  status: string[];
}

export interface ProgramMappingSearchResponse {
  response: ProgramMapping[];
  totalElements: number;
  totalPages?: number;
  currentPage?: number;
  errors?: string[];
}

export interface CreateProgramMappingRequest {
  type: string;
  releaseYear?: string;
  origAirDate?: string;
  seasonNumber?: string;
  episodeNumber?: string;
  titles: { value: string; length: number; lang: string }[];
  descriptions: { value: string; length: number; lang: string }[];
  genres: string[];
  ratings: { id: string; rating: string; org: string; code: string }[];
  credits: { role: string; type: string; personId: string; firstName: string; lastName: string }[];
  providerInfo: ProgramMappingProviderInfo[];
  autoPublished: boolean;
  status: string;
  checked: boolean;
  published: boolean;
  externalRefs: ExternalRef[];
  episodeTitles: Title[];
  connectorId: string;
  programId: string;
  runTime: number | null;
}

/** Type filter options for the mapping search */
export const MAPPING_TYPE_FILTERS = [
  { name: 'Movies', abbrev: 'MV', checked: true },
  { name: 'Series', abbrev: 'SH', checked: true },
  { name: 'Episodes', abbrev: 'EP', checked: true },
  { name: 'Sports', abbrev: 'ES', checked: true },
] as const;

/** Status filter options for the mapping search */
export const MAPPING_STATUS_FILTERS = [
  { name: 'unmapped', label: 'Unmapped', checked: true },
  { name: 'mapped', label: 'Mapped', checked: false },
  { name: 'incomplete', label: 'Incomplete', checked: false },
  { name: 'unmappable', label: 'Unmappable', checked: false },
] as const;
