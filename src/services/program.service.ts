/**
 * @file program.service.ts
 * @description Service for Program CRUD operations and metadata management
 * @author VLS Team
 * @date 2026-02-15
 */
import { get, post, put, uploadFile } from './api.service';
import { getCloudfrontBaseUrl } from '../config/environment.config';
import type {
  Program,
  ProgramSearchRequest,
  ProgramVersion,
  ProgramImage,
  ApiResponse,
} from '../types';

const BASE_PATH = '/programs';
const V2_BASE_PATH = '/v2/programs';

// Demo mode detection helper
const isDemoMode = (): boolean => {
  return localStorage.getItem('vls_auth_token')?.startsWith('demo-token-') || false;
};

/**
 * Transform API detail response to internal UI schema.
 * Detail endpoint returns: { response: { id, titles: [], descriptions: [], ... } }
 *
 * Program Types:
 * - MOVIE (MV*): Standalone movie
 * - SERIES (SH*): Series with episodes as children
 * - SHOW (SH*): Standalone show, no children
 * - SPORT (SH*): Sports program with episodes as children
 * - EPISODE (EP*): Child of SERIES or SPORT
 */
const transformApiProgramDetail = (apiResponse: any): Program => {
  const data = apiResponse.response || apiResponse;
  const programId = data.id || data.programId;

  return {
    id: programId,
    _id: programId,
    programType: data.programType,
    programId: data.programId,
    vrioId: data.vrioId,

    // Arrays are already flat in the response
    titles: Array.isArray(data.titles) ? data.titles : [],
    descriptions: Array.isArray(data.descriptions) ? data.descriptions : [],
    genres: Array.isArray(data.genres) ? data.genres : [],
    externalRefs: Array.isArray(data.externalRefs) ? data.externalRefs : [],
    countries: Array.isArray(data.countries) ? data.countries : [],
    ratings: Array.isArray(data.ratings) ? data.ratings : [],
    credits: Array.isArray(data.credits) ? data.credits : [],
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    releases: Array.isArray(data.releases) ? data.releases : [],
    providerInfo: Array.isArray(data.providerInfo) ? data.providerInfo : [],
    extraInfos: Array.isArray(data.extraInfos) ? data.extraInfos : [],
    awards: Array.isArray(data.awards) ? data.awards : [],
    advisories: Array.isArray(data.advisories) ? data.advisories : [],
    productionCompanies: Array.isArray(data.productionCompanies) ? data.productionCompanies : [],

    // Images – can come as array or nested object
    images: Array.isArray(data.images) ? data.images : [],
    programImages: data.programImages || undefined,
    publishedImages: Array.isArray(data.publishedImages) ? data.publishedImages : [],

    // Series / Season / Episode fields
    seasons: Array.isArray(data.seasons) ? data.seasons : [],
    seriesId: data.seriesId,
    seriesTitles: Array.isArray(data.seriesTitles) ? data.seriesTitles : undefined,
    parentProgramId: data.parentProgramId,
    parentVrioId: data.parentVrioId,
    seriesVrioId: data.seriesVrioId,
    seasonVrioId: data.seasonVrioId,
    seriesPremiere: data.seriesPremiere,
    seriesFinale: data.seriesFinale,
    seasonNumber: data.seasonNumber,
    episodeNumber: data.episodeNumber,
    numInSeries: data.numInSeries,
    seasonYear: data.seasonYear,
    episodeAltMappings: Array.isArray(data.episodeAltMappings) ? data.episodeAltMappings : [],
    episodeTitleAvailable: data.episodeTitleAvailable,
    dthInfo: data.dthInfo,

    // Sports
    sportsInfo: data.sportsInfo,
    isSports: data.isSports,

    // Metadata
    releaseYear: data.origAirDate ? parseInt(data.origAirDate.split('-')[0]) : (data.releaseYear || data.yearOfRelease),
    yearOfRelease: data.yearOfRelease,
    origAirDate: data.origAirDate,
    originalAudiolang: data.originalAudiolang,
    colorCode: data.colorCode || 'Color',
    market: data.market,
    runTime: data.runTime,
    subType: data.subType,
    dmsId: data.dmsId,
    feedUrls: data.feedUrls,
    targetPlatform: data.targetPlatform,
    labels: data.labels,
    pictures: data.pictures,

    // Status flags
    contentLock: data.contentLock === true || data.contentLock === 'true',
    published: data.publish === true || data.publish === 'true',
    publishVersionChange: data.publishVersionChange === true,

    // Version info
    version: parseInt(data.version) || 1,
    createdDate: data.createdDate,
    updatedDate: data.updatedDate,

    source: 'api',
  } as Program;
};

/**
 * Transform API search response program to internal UI schema.
 * Search endpoint returns flatter structure with different field names.
 * Note: Use 'id' field which includes version (e.g., SH010064900000001)
 *       not 'programId' which is base ID only (e.g., SH010064900000)
 */
const transformApiProgram = (apiProgram: any, imageData?: any): Program => {
  // Use full ID with version first, fall back to programId if not available
  const programId = apiProgram.id || apiProgram.programId;

  // Build pictures object from image data
  const pictures: Record<string, string> = {};
  if (imageData && imageData.length > 0) {
    // Get the first image or 16:9 aspect ratio image
    // API returns: { uri: "programs/.../IMG-xxx.jpeg", ratio: "16:9", baseUrl: "https://..." }
    const image = imageData.find((img: any) => img.ratio === '16:9') || imageData[0];
    if (image && image.uri) {
      // Use baseUrl from API response or fallback to CloudFront constant
      const baseUrl = image.baseUrl || getCloudfrontBaseUrl();
      pictures['16:9'] = baseUrl + image.uri;
    }
  }

  return {
    id: programId,
    _id: programId,
    programType: apiProgram.type || apiProgram.programType,

    // Store base programId (without version) for navigation
    programId: apiProgram.programId || programId,

    // Transform name (string) to titles (array)
    titles: apiProgram.name ? [
      { lang: 'en', value: apiProgram.name, type: 'main', length: apiProgram.name.length }
    ] : [],

    // Transform description (string) to descriptions (array)
    descriptions: apiProgram.description ? [
      { lang: 'en', value: apiProgram.description, type: 'short', length: apiProgram.description.length }
    ] : [],

    // Map other fields
    releaseYear: apiProgram.releaseYear || parseInt(apiProgram.origAirYear) || undefined,
    seriesId: apiProgram.seriesTitle || undefined,
    episode: apiProgram.episode || undefined,
    season: apiProgram.season || undefined,

    // Fields that may not be in API response
    source: apiProgram.source || 'api',
    colorCode: apiProgram.colorCode || 'BW',
    contentLock: apiProgram.contentLock || false,
    published: apiProgram.published !== undefined ? apiProgram.published : true,
    version: apiProgram.version || 1,
    vrioId: apiProgram.vrioId || programId,
    targetPlatform: apiProgram.targetPlatform || 'OTT',
    genres: apiProgram.genres || [],
    pictures,
  } as Program;
};

// Mock program data for demo mode (matching real MongoDB schema)
const MOCK_PROGRAMS: Partial<Program>[] = [
  {
    id: 'PGM001',
    _id: 'PGM001',
    programType: 'MV',
    colorCode: 'BW',
    titles: [
      { lang: 'en', value: 'The Dark Knight', type: 'main', length: 15 },
      { lang: 'es', value: 'El Caballero Oscuro', type: 'main', length: 20 },
      { lang: 'pt', value: 'O Cavaleiro das Trevas', type: 'main', length: 23 },
    ],
    descriptions: [
      { lang: 'en', value: 'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological tests.', type: 'short', length: 120 },
      { lang: 'es', value: 'Cuando la amenaza conocida como el Joker causa estragos en Gotham, Batman debe aceptar una de las mayores pruebas psicológicas.', type: 'short', length: 128 },
    ],
    releaseYear: 2008,
    contentLock: false,
    published: true,
    version: 3,
    vrioId: 'VRIO001',
    targetPlatform: 'OTT',
    genres: ['Action', 'Crime', 'Drama', 'Thriller'],
    externalRefs: [
      { id: 'TMS0000001', system: 'TMS', refName: 'tmsId' },
      { id: 'GN0000001', system: 'Gracenote', refName: 'gracenoteId' },
    ],
    pictures: {
      '16:9': 'https://via.placeholder.com/800x450/1e293b/cbd5e1?text=The+Dark+Knight',
    },
  },
  {
    id: 'PGM002',
    _id: 'PGM002',
    programType: 'SE',
    colorCode: 'BW',
    titles: [
      { lang: 'en', value: 'Breaking Bad', type: 'main', length: 12 },
      { lang: 'es', value: 'Breaking Bad', type: 'main', length: 12 },
    ],
    descriptions: [
      { lang: 'en', value: 'A chemistry teacher diagnosed with cancer teams up with a former student to manufacture meth.', type: 'short', length: 93 },
    ],
    releaseYear: 2008,
    contentLock: false,
    published: true,
    version: 5,
    vrioId: 'VRIO002',
    seriesId: 'SER002',
    targetPlatform: 'BOTH',
    genres: ['Crime', 'Drama', 'Thriller'],
    externalRefs: [
      { id: 'TMS0000002', system: 'TMS', refName: 'tmsId' },
    ],
    pictures: {
      '16:9': 'https://via.placeholder.com/800x450/0f172a/94a3b8?text=Breaking+Bad',
    },
  },
  {
    id: 'PGM003',
    _id: 'PGM003',
    programType: 'MV',
    colorCode: 'BW',
    titles: [
      { lang: 'en', value: 'Inception', type: 'main', length: 9 },
      { lang: 'es', value: 'El Origen', type: 'main', length: 9 },
      { lang: 'pt', value: 'A Origem', type: 'main', length: 8 },
    ],
    descriptions: [
      { lang: 'en', value: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.', type: 'short', length: 116 },
    ],
    releaseYear: 2010,
    contentLock: true,
    published: false,
    version: 2,
    vrioId: 'VRIO003',
    targetPlatform: 'OTT',
    genres: ['Action', 'Sci-Fi', 'Thriller'],
    externalRefs: [
      { id: 'TMS0000003', system: 'TMS', refName: 'tmsId' },
    ],
    pictures: {
      '16:9': 'https://via.placeholder.com/800x450/334155/e2e8f0?text=Inception',
    },
  },
  {
    id: 'PGM004',
    _id: 'PGM004',
    programType: 'SH',
    colorCode: 'BW',
    titles: [
      { lang: 'en', value: 'The Office', type: 'main', length: 10 },
      { lang: 'es', value: 'La Oficina', type: 'main', length: 11 },
    ],
    descriptions: [
      { lang: 'en', value: 'A mockumentary on a group of typical office workers where the workday consists of ego clashes and inappropriate behavior.', type: 'short', length: 123 },
    ],
    releaseYear: 2005,
    contentLock: false,
    published: true,
    version: 8,
    vrioId: 'VRIO004',
    targetPlatform: 'DTH',
    genres: ['Comedy'],
    externalRefs: [
      { id: 'TMS0000004', system: 'TMS', refName: 'tmsId' },
    ],
    pictures: {
      '16:9': 'https://via.placeholder.com/800x450/475569/cbd5e1?text=The+Office',
    },
  },
  {
    id: 'PGM005',
    _id: 'PGM005',
    programType: 'MV',
    colorCode: 'BW',
    titles: [
      { lang: 'en', value: 'Interstellar', type: 'main', length: 12 },
      { lang: 'es', value: 'Interestelar', type: 'main', length: 13 },
      { lang: 'pt', value: 'Interestelar', type: 'main', length: 13 },
    ],
    descriptions: [
      { lang: 'en', value: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.', type: 'short', length: 99 },
    ],
    releaseYear: 2014,
    contentLock: false,
    published: true,
    version: 1,
    vrioId: 'VRIO005',
    targetPlatform: 'OTT',
    genres: ['Adventure', 'Drama', 'Sci-Fi'],
    externalRefs: [
      { id: 'TMS0000005', system: 'TMS', refName: 'tmsId' },
    ],
    pictures: {
      '16:9': 'https://via.placeholder.com/800x450/1e3a5f/93c5fd?text=Interstellar',
    },
  },
  {
    id: 'PGM006',
    _id: 'PGM006',
    programType: 'SE',
    colorCode: 'BW',
    titles: [
      { lang: 'en', value: 'Stranger Things', type: 'main', length: 15 },
    ],
    descriptions: [
      { lang: 'en', value: 'When a young boy disappears, his mother, a police chief, and his friends must confront terrifying supernatural forces.', type: 'short', length: 118 },
    ],
    releaseYear: 2016,
    contentLock: false,
    published: true,
    version: 4,
    vrioId: 'VRIO006',
    seriesId: 'SER006',
    targetPlatform: 'OTT',
    genres: ['Drama', 'Fantasy', 'Horror'],
    externalRefs: [
      { id: 'TMS0000006', system: 'TMS', refName: 'tmsId' },
    ],
    pictures: {
      '16:9': 'https://via.placeholder.com/800x450/7c2d12/fca5a5?text=Stranger+Things',
    },
  },
  {
    id: 'PGM007',
    _id: 'PGM007',
    programType: 'MV',
    colorCode: 'BW',
    titles: [
      { lang: 'en', value: 'The Matrix', type: 'main', length: 10 },
      { lang: 'es', value: 'Matrix', type: 'main', length: 6 },
      { lang: 'pt', value: 'Matrix', type: 'main', length: 6 },
    ],
    descriptions: [
      { lang: 'en', value: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.', type: 'short', length: 134 },
    ],
    releaseYear: 1999,
    contentLock: false,
    published: true,
    version: 6,
    vrioId: 'VRIO007',
    targetPlatform: 'BOTH',
    genres: ['Action', 'Sci-Fi'],
    externalRefs: [
      { id: 'TMS0000007', system: 'TMS', refName: 'tmsId' },
    ],
    pictures: {
      '16:9': 'https://via.placeholder.com/800x450/064e3b/6ee7b7?text=The+Matrix',
    },
  },
  {
    id: 'PGM008',
    _id: 'PGM008',
    programType: 'SE',
    colorCode: 'BW',
    titles: [
      { lang: 'en', value: 'Game of Thrones', type: 'main', length: 15 },
      { lang: 'es', value: 'Juego de Tronos', type: 'main', length: 15 },
    ],
    descriptions: [
      { lang: 'en', value: 'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns.', type: 'short', length: 97 },
    ],
    releaseYear: 2011,
    contentLock: true,
    published: false,
    version: 2,
    vrioId: 'VRIO008',
    seriesId: 'SER008',
    targetPlatform: 'OTT',
    genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
    externalRefs: [
      { id: 'TMS0000008', system: 'TMS', refName: 'tmsId' },
    ],
    pictures: {
      '16:9': 'https://via.placeholder.com/800x450/7c2d12/fbbf24?text=Game+of+Thrones',
    },
  },
];

/**
 * Search programs with filters and pagination.
 */
export const searchPrograms = async (
  searchRequest: ProgramSearchRequest,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<Program[]>> => {
  // Demo mode: return mock data
  if (isDemoMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let results: Partial<Program>[] = [...MOCK_PROGRAMS];

        // Filter by search string
        if (searchRequest.searchString) {
          const query = searchRequest.searchString.toLowerCase();
          results = results.filter(p => {
            // Search in titles array
            const titleMatch = p.titles?.some(t =>
              t.value?.toLowerCase().includes(query)
            );
            // Search in IDs
            const idMatch = p.id?.toLowerCase().includes(query) ||
                           p.vrioId?.toLowerCase().includes(query);
            return titleMatch || idMatch;
          });
        }

        // Filter by type
        if (searchRequest.filters && searchRequest.filters.length > 0) {
          results = results.filter(p =>
            searchRequest.filters!.some(f =>
              p.programType === f || p.targetPlatform === f
            )
          );
        }

        // Pagination
        const start = page * size;
        const paginatedResults = results.slice(start, start + size);

        resolve(paginatedResults as any);
      }, 300); // Simulate network delay
    });
  }

  // Real API mode: call backend V2 endpoint and extract programs from ResponseDTO
  // Note: API uses 1-indexed pagination, so add 1 to page number
  const response: any = await post(`${V2_BASE_PATH}/search`, searchRequest, {
    params: { page: page + 1, size },
  });

  // API returns ResponseDTO { response: Program[], errors, totalElements, totalPages, currentPage }
  // Extract programs and fetch images for each
  const apiPrograms = response.response || [];

  // Fetch images for all programs in parallel
  const programsWithImages = await Promise.all(
    apiPrograms.map(async (apiProgram: any) => {
      try {
        const programId = apiProgram.programId || apiProgram.id;
        console.log(`[Program Transform] Raw API program:`, {
          id: apiProgram.id,
          programId: apiProgram.programId,
          version: apiProgram.version,
          fullObject: apiProgram
        });
        console.log(`[Image Fetch] Fetching images for program: ${programId}`);

        const imagesResponse: any = await get(`${BASE_PATH}/images/${programId}`);
        console.log(`[Image Fetch] Response for ${programId}:`, imagesResponse);

        const imageData = imagesResponse.response || imagesResponse || [];
        console.log(`[Image Fetch] Image data for ${programId}:`, imageData);

        return transformApiProgram(apiProgram, imageData);
      } catch (imgError) {
        // If image fetch fails, return program without images
        const fallbackId = apiProgram.programId || apiProgram.id;
        console.error(`[Image Fetch] Failed to fetch images for ${fallbackId}:`, imgError);
        return transformApiProgram(apiProgram);
      }
    })
  );

  // Return full response with pagination metadata
  return {
    response: programsWithImages,
    totalElements: response.totalElements,
    totalPages: response.totalPages,
    currentPage: response.currentPage,
    errors: response.errors,
  } as any;
};

/**
 * Search programs using V2 endpoint with enhanced filtering.
 */
export const searchProgramsV2 = async (
  searchRequest: ProgramSearchRequest,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<Program[]>> => {
  return post(`${V2_BASE_PATH}/search`, searchRequest, {
    params: { page, size },
  });
};

/**
 * Get all versions for a given program ID.
 */
export const getProgramVersions = async (
  programId: string
): Promise<ApiResponse<ProgramVersion[]>> => {
  return get(`${BASE_PATH}/version/${programId}`);
};

/**
 * Get a specific program by version ID and provider.
 */
export const getProgramByVersion = async (
  versionId: string,
  provider: string = 'masterentity'
): Promise<ApiResponse<Program>> => {
  const response: any = await get(`${BASE_PATH}/${versionId}`, { provider });

  // Transform the deeply nested API response to match UI expectations
  const transformedProgram = transformApiProgramDetail(response);

  return transformedProgram as unknown as ApiResponse<Program>;
};

/**
 * Create a new program.
 */
export const createProgram = async (
  program: Partial<Program>
): Promise<ApiResponse<Program>> => {
  return post(BASE_PATH, program);
};

/**
 * Update an existing program.
 */
export const updateProgram = async (
  programId: string,
  program: Partial<Program>
): Promise<ApiResponse<Program>> => {
  return put(`${BASE_PATH}/${programId}`, undefined, {
    params: { programMasterEntityDto: JSON.stringify(program) },
  });
};

/**
 * Update content lock status for a program.
 */
export const updateContentLock = async (
  programId: string,
  programVersion: { contentLock: boolean }
): Promise<ApiResponse> => {
  return put(`${BASE_PATH}/${programId}/contentlock`, programVersion);
};

/**
 * Get episodes for a series by season.
 * Endpoint: GET /programs/episodes/{seriesId}?season={seasonNumber}
 */
export const getEpisodes = async (
  seriesId: string,
  season?: number
): Promise<ApiResponse<Program[]>> => {
  const params: Record<string, any> = {};
  if (season !== undefined) {
    params.season = season;
  }
  return get(`${BASE_PATH}/episodes/${seriesId}`, params);
};

/**
 * Get ALL episodes for a series (no season filter).
 * Endpoint: GET /programs/{seriesId}/episodes
 */
export const getAllEpisodesOfSeries = async (
  seriesId: string
): Promise<ApiResponse<Program[]>> => {
  return get(`${BASE_PATH}/${seriesId}/episodes`);
};

/**
 * Get program images.
 */
export const getProgramImages = async (
  programId: string
): Promise<ApiResponse<ProgramImage[]>> => {
  return get(`${BASE_PATH}/images/${programId}`);
};

/**
 * Upload a program image.
 */
export const uploadProgramImage = async (
  programId: string,
  formData: FormData
): Promise<ApiResponse<ProgramImage>> => {
  return uploadFile(`${BASE_PATH}/uploadImage/${programId}`, formData);
};

// NOTE: getGenres, getRatings, and getAdvisories have been removed from here.
// Use the centralized versions in reference.service.ts instead, which are loaded
// once at app startup into AppContext and available via the useApp() hook.

/**
 * Get market configuration.
 */
export const getMarket = async (): Promise<string> => {
  return get(`${BASE_PATH}/market`);
};

/**
 * Get available system and reference names for search filters.
 */
export const getSystemAndRefNames = async (): Promise<ApiResponse> => {
  return get(`${BASE_PATH}/systemAndRefName`);
};

/**
 * Check for duplicate programs before saving.
 */
export const checkDuplicates = async (data: {
  id: string;
  titles: string[];
  origAirDate?: string;
  releaseYear?: number;
}): Promise<ApiResponse<Program[]>> => {
  return post(`${BASE_PATH}/dateAndTitles`, data);
};
