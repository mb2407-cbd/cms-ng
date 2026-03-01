/**
 * @file programMapping.service.ts
 * @description Service for Program Mapping workflow API operations
 * @author VLS Team
 * @date 2026-02-24
 */
import { get, post, put } from './api.service';
import type {
  ProgramMapping,
  ProgramMappingSearchRequest,
  ProgramMappingSearchResponse,
} from '../types/programMapping.types';

const BASE_PATH = '/programMapping';

/**
 * Search program mappings with filters and pagination.
 */
export const searchProgramMappings = async (
  searchData: ProgramMappingSearchRequest,
  page: number = 0,
  size: number = 20
): Promise<ProgramMappingSearchResponse> => {
  return post(`${BASE_PATH}/search?page=${page}&size=${size}`, searchData);
};

/**
 * Get a single program mapping by mapper ID.
 */
export const getProgramMapping = async (mapperId: string): Promise<ProgramMapping> => {
  return get(`${BASE_PATH}/${mapperId}`);
};

/**
 * Create a new program mapping (PPV Program).
 */
export const createProgramMapping = async (mapping: any): Promise<any> => {
  return post(BASE_PATH, mapping);
};

/**
 * Batch submit (map and publish) checked mappings.
 */
export const mapAndPublish = async (mappings: ProgramMapping[]): Promise<any> => {
  return put(`${BASE_PATH}/mapAndPublish`, mappings);
};

/**
 * Request provider info (Gracenote enrichment) for a mapping.
 */
export const requestProviderInfo = async (mapperId: string): Promise<any> => {
  return put(`${BASE_PATH}/requestProviderInfo/${mapperId}`, {});
};

/**
 * Update mapping status.
 */
export const updateMappingStatus = async (mapperId: string, status: string): Promise<any> => {
  return put(`${BASE_PATH}/status/${mapperId}`, { status });
};

/**
 * Get available cast roles.
 */
export const getRolesOfCast = async (): Promise<string[]> => {
  return get(`${BASE_PATH}/rolesOfCast`);
};

// ─── MOCK DATA for Demo Mode ─────────────────────────────────────

const MOCK_MAPPINGS: ProgramMapping[] = [
  {
    id: 'MAP001',
    mapperId: 'MAP001',
    type: 'MOVIE',
    status: 'unmapped',
    titles: [
      { lang: 'en', value: 'The Great Adventure' },
      { lang: 'es', value: 'La Gran Aventura' },
    ],
    descriptions: [
      { lang: 'en', value: 'An epic journey across uncharted territories.' },
    ],
    genres: [],
    ratings: [],
    externalRefs: [],
    providerInfo: [{ system: 'VLS', key: 'skipMetadataEnrichment', value: 'false' }],
    releaseYear: '2024',
    checked: false,
    published: false,
  },
  {
    id: 'MAP002',
    mapperId: 'MAP002',
    dmsId: 'DMS-10042',
    type: 'EPISODE',
    status: 'unmapped',
    titles: [
      { lang: 'en', value: 'Crime Stories' },
      { lang: 'es', value: 'Historias de Crimen' },
    ],
    episodeTitles: [
      { lang: 'en', value: 'The Missing Witness' },
      { lang: 'es', value: 'El Testigo Perdido' },
    ],
    descriptions: [
      { lang: 'en', value: 'A detective uncovers a conspiracy while investigating a missing witness.' },
    ],
    genres: [],
    ratings: [],
    externalRefs: [{ id: 'TBX-001', system: 'TBX', refName: 'tbxId' }],
    providerInfo: [{ system: 'VLS', key: 'skipMetadataEnrichment', value: 'false' }],
    seasonNumber: '3',
    episodeNumber: '7',
    checked: false,
    published: false,
  },
  {
    id: 'MAP003',
    mapperId: 'MAP003',
    dmsId: 'DMS-20087',
    type: 'MOVIE',
    status: 'mapped',
    titles: [
      { lang: 'en', value: 'Midnight Express' },
      { lang: 'es', value: 'Expreso de Medianoche' },
    ],
    descriptions: [
      { lang: 'en', value: 'A thriller set on a cross-country train.' },
    ],
    genres: ['Thriller'],
    ratings: [],
    externalRefs: [],
    providerInfo: [],
    releaseYear: '2023',
    programId: 'MV010099800000',
    mappedProgram: {
      id: 'MV010099800000001',
      programType: 'MV',
      titles: [
        { lang: 'en', value: 'Midnight Express' },
        { lang: 'es', value: 'Expreso de Medianoche' },
      ],
      descriptions: [
        { lang: 'en', value: 'A thriller set on a cross-country night train with unexpected twists.' },
      ],
      releaseYear: 2023,
      source: 'api',
      published: true,
    } as any,
    checked: false,
    published: false,
  },
  {
    id: 'MAP004',
    mapperId: 'MAP004',
    type: 'SERIES',
    status: 'incomplete',
    titles: [
      { lang: 'en', value: 'Sky Watchers' },
      { lang: 'es', value: 'Vigilantes del Cielo' },
    ],
    descriptions: [
      { lang: 'en', value: 'A documentary series about astronomy and space exploration.' },
    ],
    genres: [],
    ratings: [],
    externalRefs: [],
    providerInfo: [{ system: 'VLS', key: 'skipMetadataEnrichment', value: 'false' }],
    checked: false,
    published: false,
  },
  {
    id: 'MAP005',
    mapperId: 'MAP005',
    dmsId: 'DMS-30012',
    type: 'MOVIE',
    status: 'unmappable',
    titles: [
      { lang: 'en', value: 'Lost in Translation Redux' },
      { lang: 'es', value: 'Perdidos en la Traducción Redux' },
    ],
    descriptions: [
      { lang: 'en', value: 'A reimagining of the classic film.' },
    ],
    genres: [],
    ratings: [],
    externalRefs: [],
    providerInfo: [
      {
        system: 'GraceNote',
        key: 'Unmappable.message',
        value: {
          reason: 'No matching content found',
          detail: ['Title not in Gracenote database', 'No alternate matches available'],
        },
      },
    ],
    releaseYear: '2025',
    checked: false,
    published: false,
  },
  {
    id: 'MAP006',
    mapperId: 'MAP006',
    type: 'MOVIE',
    status: 'unmapped',
    titles: [
      { lang: 'en', value: 'Ocean Depths' },
      { lang: 'es', value: 'Profundidades del Océano' },
    ],
    descriptions: [
      { lang: 'en', value: 'An underwater adventure documentary exploring the deepest parts of the ocean.' },
    ],
    genres: [],
    ratings: [],
    externalRefs: [],
    providerInfo: [{ system: 'VLS', key: 'skipMetadataEnrichment', value: 'true' }],
    releaseYear: '2024',
    checked: false,
    published: false,
  },
  {
    id: 'MAP007',
    mapperId: 'MAP007',
    dmsId: 'DMS-40055',
    type: 'EPISODE',
    status: 'unmapped',
    titles: [
      { lang: 'en', value: 'Nature Chronicles' },
      { lang: 'es', value: 'Crónicas de la Naturaleza' },
    ],
    episodeTitles: [
      { lang: 'en', value: 'The Arctic Fox' },
      { lang: 'es', value: 'El Zorro Ártico' },
    ],
    descriptions: [
      { lang: 'en', value: 'Following the life of an arctic fox through the seasons.' },
    ],
    genres: [],
    ratings: [],
    externalRefs: [],
    providerInfo: [{ system: 'VLS', key: 'skipMetadataEnrichment', value: 'false' }],
    seasonNumber: '1',
    episodeNumber: '4',
    checked: false,
    published: false,
  },
  {
    id: 'MAP008',
    mapperId: 'MAP008',
    type: 'SERIES',
    status: 'mapped',
    titles: [
      { lang: 'en', value: 'Tech Frontiers' },
      { lang: 'es', value: 'Fronteras Tecnológicas' },
    ],
    descriptions: [
      { lang: 'en', value: 'A series exploring cutting-edge technology innovations.' },
    ],
    genres: ['Documentary', 'Science'],
    ratings: [],
    externalRefs: [],
    providerInfo: [],
    programId: 'SH010064900000',
    mappedProgram: {
      id: 'SH010064900000001',
      programType: 'SH',
      titles: [
        { lang: 'en', value: 'Tech Frontiers' },
        { lang: 'es', value: 'Fronteras Tecnológicas' },
      ],
      descriptions: [
        { lang: 'en', value: 'Exploring innovations in AI, robotics, and space tech.' },
      ],
      releaseYear: 2024,
      source: 'api',
      published: true,
    } as any,
    checked: false,
    published: false,
  },
];

/**
 * Get mock mappings for demo mode.
 */
export const getMockMappings = (
  searchData: ProgramMappingSearchRequest,
  page: number,
  size: number
): ProgramMappingSearchResponse => {
  let results = [...MOCK_MAPPINGS];

  // Filter by status
  if (searchData.status.length > 0) {
    results = results.filter(m => searchData.status.includes(m.status));
  }

  // Filter by type
  if (searchData.types.length > 0) {
    results = results.filter(m => {
      const typeMap: Record<string, string[]> = {
        MV: ['MOVIE'],
        SH: ['SERIES', 'SHOW'],
        EP: ['EPISODE'],
        ES: ['SPORT'],
      };
      return searchData.types.some(t => typeMap[t]?.includes(m.type));
    });
  }

  // Search
  if (searchData.searchString) {
    const q = searchData.searchString.toLowerCase();
    results = results.filter(m =>
      m.titles.some(t => t.value?.toLowerCase().includes(q)) ||
      m.id.toLowerCase().includes(q)
    );
  }

  const total = results.length;
  const start = page * size;
  const paged = results.slice(start, start + size);

  return {
    response: paged,
    totalElements: total,
    totalPages: Math.ceil(total / size),
    currentPage: page,
  };
};
