/**
 * @file app.constants.ts
 * @description Application-wide constants for VLS UI
 * @author VLS Team
 * @date 2026-02-15
 */

/** Maximum character limits for program fields */
export const MAX_TITLE_SIZE = 120;
export const MAX_EPISODE_TITLE_SIZE = 150;
export const MAX_SHORT_TITLE_SIZE = 100;
export const MAX_DESCRIPTION_SIZE = 500;
export const MAX_SHORT_DESCRIPTION_SIZE = 250;

/**
 * Program type codes (as returned by API)
 * Note: ID prefixes are different from program types
 * - MOVIE IDs start with MV
 * - SERIES/SHOW/SPORT IDs start with SH
 * - EPISODE IDs start with EP
 */
export const PROGRAM_TYPES = {
  MOVIE: 'MOVIE',
  SERIES: 'SERIES',
  SHOW: 'SHOW',
  SPORT: 'SPORT',
  EPISODE: 'EPISODE',
  // Legacy codes for backward compatibility
  MV: 'MV',
  SH: 'SH',
  SV: 'SV',
  SP: 'SP',
  EP: 'EP',
  SE: 'SE',
} as const;

/** Program type display names */
export const PROGRAM_TYPE_NAMES: Record<string, string> = {
  MOVIE: 'Movie',
  SERIES: 'Series',
  SHOW: 'Show',
  SPORT: 'Sport',
  EPISODE: 'Episode',
  // Legacy mappings
  MV: 'Movie',
  SH: 'Series',
  SV: 'Show',
  SP: 'Sport',
  EP: 'Episode',
  SE: 'Sport Episode',
};

/**
 * Program types that can have child episodes
 * SERIES and SPORT can have parent-child relationships with EPISODE
 */
export const PROGRAM_TYPES_WITH_EPISODES = ['SERIES', 'SPORT', 'SH', 'SP'] as const;

/**
 * Check if a program type can have episodes
 */
export const canHaveEpisodes = (programType: string): boolean => {
  return PROGRAM_TYPES_WITH_EPISODES.includes(programType as any);
};

/** Platform identifiers */
export const PLATFORMS = {
  OTT: 'ott',
  DTH: 'dth',
  BOTH: 'both',
} as const;

/** Language constants */
export const LANGUAGES = {
  EN: 'en',
  ES: 'es',
  PT: 'pt',
  PT_BR: 'pt-BR',
  ENGLISH: 'English',
  SPANISH: 'Spanish',
  PORTUGUESE: 'Portuguese',
} as const;

/** Image aspect ratios */
export const IMAGE_RATIOS = {
  WIDE: '16:9',
  PORTRAIT: '2:3',
} as const;

/** Image dimension constraints */
export const IMAGE_DIMENSIONS = {
  WIDE_WIDTH: 255,
  WIDE_HEIGHT: 143,
  PORTRAIT_WIDTH: 200,
  PORTRAIT_HEIGHT: 300,
  PORTRAIT_DISPLAY_WIDTH: 240,
  PORTRAIT_DISPLAY_HEIGHT: 360,
} as const;

/** Markets and their configurations */
export const MARKETS = {
  SSLA: 'ssla',
  SKY: 'sky',
} as const;

export const MARKET_CONFIG = {
  ssla: {
    name: 'SSLA',
    languages: ['en', 'es'],
    ratingSystem: 'MPAA',
    requiresRating: false,
  },
  sky: {
    name: 'Sky',
    languages: ['pt-BR'],
    ratingSystem: 'DJCTQ',
    requiresRating: true, // Strict requirement except for News/Sports
  },
} as const;

/** Rating systems */
export const RATING_SYSTEMS = {
  MPAA: 'MPAA',
  TVPG: 'TVPG',
  DJCTQ: 'DJCTQ',
} as const;

/** Rating lists per system */
export const MPAA_RATING_LIST = ['PG-13', 'TV14', 'R', 'N-17'];
export const PARENTAL_RATING_LIST = ['G', 'TVG', 'TVPG', 'TVMA'];
export const BR_RATING_LIST = ['L', '10', '12', '14', '16', '18'];

/** Provider identifiers */
export const PROVIDERS = {
  GRACENOTE: 'gracenote',
  BLIM: 'blim',
  MASTERENTITY: 'masterentity',
  GN: 'GN',
  VLS: 'VLS',
  DMS: 'DMS',
} as const;

/** Date/time formats */
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/** Program field validation mapping */
export const PROGRAM_VALIDATION_MAPPING: Record<string, { name: string; maximum?: number }> = {
  originalAudiolang: { name: 'Original Audio' },
  originalTitle: { name: 'Original Title', maximum: MAX_TITLE_SIZE },
  spanishEpisodeTitle: { name: 'Spanish Episode Title', maximum: MAX_EPISODE_TITLE_SIZE },
  englishEpisodeTitle: { name: 'English Episode Title', maximum: MAX_EPISODE_TITLE_SIZE },
  portugueseEpisodeTitle: { name: 'Portuguese Episode Title', maximum: MAX_EPISODE_TITLE_SIZE },
  spanishTitle: { name: 'Spanish Title', maximum: MAX_TITLE_SIZE },
  englishTitle: { name: 'English Title', maximum: MAX_TITLE_SIZE },
  portugueseTitle: { name: 'Portuguese Title', maximum: MAX_TITLE_SIZE },
  spanishShortTitle: { name: 'Spanish Short Title', maximum: MAX_SHORT_TITLE_SIZE },
  englishShortTitle: { name: 'English Short Title', maximum: MAX_SHORT_TITLE_SIZE },
  portugueseShortTitle: { name: 'Portuguese Short Title', maximum: MAX_SHORT_TITLE_SIZE },
  spanishDescription: { name: 'Spanish Description', maximum: MAX_DESCRIPTION_SIZE },
  englishDescription: { name: 'English Description', maximum: MAX_DESCRIPTION_SIZE },
  portugueseDescription: { name: 'Portuguese Description', maximum: MAX_DESCRIPTION_SIZE },
  spanishShortDescription: { name: 'Spanish Short Description', maximum: MAX_SHORT_DESCRIPTION_SIZE },
  englishShortDescription: { name: 'English Short Description', maximum: MAX_SHORT_DESCRIPTION_SIZE },
  portugueseShortDescription: { name: 'Portuguese Short Description', maximum: MAX_SHORT_DESCRIPTION_SIZE },
  origAirDate: { name: 'Original Air Date' },
  releaseYear: { name: 'Release Year' },
  gameDate: { name: 'Game Date' },
  gameTime: { name: 'Game Time' },
};

/** Player/Person constants */
export const PERSON_GENDERS = ['Male', 'Female'];
export const PERSON_TYPES = ['Person', 'Animal', 'Group'];
export const PLAYER_TYPES = ['player', 'referee', 'coach', 'staff', 'assistant coach'];
export const PLAYER_STATUS = ['active', 'retired', 'died'];
export const PLAYER_POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker', 'Coach'];

/** Fallback/default values */
export const NO_IMAGE_URL = '/assets/images/noImage.jpg';
export const DEFAULT_PAGE_SIZE = 20;
export const SEARCH_DEBOUNCE_MS = 500;
