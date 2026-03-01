/**
 * @file program.types.ts
 * @description TypeScript type definitions for Program entities
 * @author VLS Team
 * @date 2026-02-15
 */

export interface Title {
  lang: string;
  value: string;
  type?: string;
  subType?: string;
  size?: number;
  length?: number;
}

export interface Description {
  lang: string;
  value: string;
  type?: string;
  subType?: string;
  size?: number;
  length?: number;
}

export interface ExternalRef {
  index?: number;
  id: string;
  refName: string;
  system: string;
  lang?: string;
}

export interface ProviderInfo {
  progType?: string;
  subType?: string;
  lang?: string;
  value?: string;
  key?: string;
  system?: string;
}

export interface Rating {
  id: string;
  warning?: string;
  ratingBody?: string;
  area?: string;
  code?: string;
  ratingBodyId?: string;
  rating?: string;
  exempt?: boolean;
  externalRefs?: ExternalRef[];
}

export interface Award {
  index?: number;
  awardId?: string;
  award: string;
  categoryId?: string;
  category: string;
  year: string;
  recipientId?: string;
  recipient: string;
  won: boolean | string;
  name?: string;
  awardRootId?: string;
}

export interface Release {
  index?: number;
  country: string;
  date: string;
  type: string;
  medium?: string;
}

export interface Keyword {
  id?: string;
  key: string;
  src: string;
  value: string;
}

export interface CastAndCrew {
  index?: number;
  personId?: string;
  type: string;
  ord?: string;
  role?: string;
  characterName?: string;
  firstName?: string;
  lastName?: string;
  name?: CelebrityName;
  creditType?: string;
  castName?: string;
}

export interface CelebrityName {
  first?: string;
  last?: string;
  preferred?: string;
}

export interface ProgramImage {
  id: string;
  category: string;
  assetId?: string;
  contentType?: string;
  createdDate?: string;
  downloadState?: string;
  expiredDate?: string;
  externalRefs?: ExternalRef[];
  height?: string | number;
  imageLang?: string;
  imageFile?: File;
  published: boolean;
  ratio: string;
  referenceId?: string[];
  source?: string;
  tier?: string[];
  updatedDate?: string;
  uri: string;
  width?: number;
  resized?: boolean;
  imageURL?: string;
  baseUrl?: string;
}

export interface SportSeason {
  type: string;
  value: string;
}

export interface SportsInfo {
  gameDate?: string;
  gameTime?: string;
  gameTimezone?: string;
  venue?: any;
  venueNames?: { lang: string; value: string }[];
  venueId?: string;
  teams?: any[];
  playoffRound?: string;
  playoffRoundId?: string;
  gameNumber?: string;
  sportSeason?: SportSeason;
  teamId?: string;
  sportType?: string;
  matchId?: string;
  groupName?: string;
  homeTeam?: any;
  awayTeam?: any;
  gameId?: string;
  tournamentId?: string;
}

export interface EpisodeAltMapping {
  channelId: string;
  episodeNumber: number;
  providerId: string;
  region: string;
  regionWide: string;
  seasonNumber: number;
}

export interface ExtraInfo {
  key: string;
  system: string;
  value: string[];
  episodeInfo?: {
    synNum: string;
    season: number;
    number: number;
    numberInSeries: number;
    title: Title;
  };
}

export interface DthInfo {
  useEpisodeTitle?: boolean;
  publishParent?: boolean;
  concatSeriesTitle?: string;
}

export interface Season {
  seasonNumber: number;
  seasonId?: number;
  seasonPremiere?: string;
  seasonFinale?: string;
  seasonYear?: number;
  seasonVrioId?: string;
  showCard?: string;
  titles?: Title[];
  descriptions?: Description[];
  keywords?: Keyword[];
  totalSeasonEpisodes?: number;
  credits?: CastAndCrew[];
}

export interface Program {
  _id?: string;
  id: string;
  programId?: string;  // Base program ID without version suffix
  source: string;
  programType: string;
  subType?: string;
  yearOfRelease?: number;
  releaseYear?: number;
  origAirDate?: string;
  originalAudiolang?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  numInSeries?: number;
  seasonYear?: number;
  titles: Title[];
  seriesTitles?: Title[];
  descriptions: Description[];
  runTime?: number;
  providerInfo?: ProviderInfo[];
  countries?: string[];
  ratings?: Rating[];
  advisories?: string[];
  colorCode?: string;
  versionLabel?: string;
  productionCompanies?: string[];
  seriesPremiere?: string;
  seriesFinale?: string;
  awards?: Award[];
  images?: ProgramImage[];
  releases?: Release[];
  status?: string;
  externalRefs?: ExternalRef[];
  seasons?: Season[];
  seriesId?: string;
  sportsInfo?: SportsInfo;
  episodeTitleAvailable?: boolean;
  isSports?: boolean;
  credits?: CastAndCrew[];
  keywords?: Keyword[];
  seriesVrioId?: string;
  seasonVrioId?: string;
  episodeAltMappings?: EpisodeAltMapping[];
  dmsId?: string;
  published?: boolean;
  labels?: { key: string; value: string }[];
  parentProgramId?: string;
  parentVrioId?: string;
  feedUrls?: string[];
  targetPlatform?: string;
  vrioId?: string;
  contentLock?: boolean;
  genres?: string[];
  genreIds?: string[];
  version?: number;
  extraInfos?: ExtraInfo[];
  dthInfo?: DthInfo;
  market?: string;
  publishVersionChange?: boolean;
  pictures?: Record<string, string>;
  programImages?: Record<string, ProgramImage[]>;
  publishedImages?: ProgramImage[];

  /* Convenience fields for UI display */
  englishTitle?: Title;
  englishShortTitle?: Title;
  englishDescription?: Description;
  englishShortDescription?: Description;
  englishEpisodeTitle?: Title;
  spanishTitle?: Title;
  spanishShortTitle?: Title;
  spanishDescription?: Description;
  spanishShortDescription?: Description;
  spanishEpisodeTitle?: Title;
  portugueseTitle?: Title;
  portugueseShortTitle?: Title;
  portugueseDescription?: Description;
  portugueseShortDescription?: Description;
  portugueseEpisodeTitle?: Title;
  originalTitle?: Title;
  apgCategory?: string;
  ssrCategory?: string;
  graceNoteExRef?: {
    tmsId?: ExternalRef;
    rootId?: ExternalRef;
    connectorId?: ExternalRef;
    seriesId?: ExternalRef;
  };
}

export interface ProgramSearchRequest {
  filters: string[];
  searchString: string;
}

export interface ProgramVersion {
  id: string;
  programId: string;
  version: number;
  provider: string;
  published: boolean;
  contentLock: boolean;
  createdDate?: string;
  updatedDate?: string;
}

/** Program type codes */
export const ProgramTypeCode = {
  MOVIE: 'MV',
  SERIES: 'SH',
  SHOW: 'SV',
  SPORT_SERIES: 'SP',
  EPISODE: 'EP',
  SPORT_EPISODE: 'SE',
} as const;

export type ProgramTypeCode = typeof ProgramTypeCode[keyof typeof ProgramTypeCode];

/** Human-readable program type names */
export const PROGRAM_TYPE_NAMES: Record<string, string> = {
  [ProgramTypeCode.MOVIE]: 'Movie',
  [ProgramTypeCode.SERIES]: 'Series',
  [ProgramTypeCode.SHOW]: 'Show',
  [ProgramTypeCode.SPORT_SERIES]: 'Sport',
  [ProgramTypeCode.EPISODE]: 'Episode',
  [ProgramTypeCode.SPORT_EPISODE]: 'Sport Episode',
};
