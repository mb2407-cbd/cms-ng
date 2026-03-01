/**
 * @file channel.service.ts
 * @description Service for Channel management operations
 * @author VLS Team
 * @date 2026-02-15
 */
import { get, post, put, uploadFile } from './api.service';
import type {
  ServiceChannel,
  ChannelSearchRequest,
  ProviderChannel,
} from '../types/channel.types';
import type { ApiResponse, Region, Label } from '../types';

const BASE_PATH = '/channels';

/**
 * Search service channels with filters.
 */
export const searchChannels = async (
  searchRequest: ChannelSearchRequest,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<ServiceChannel[]>> => {
  return post(`${BASE_PATH}/servicechannel/search`, searchRequest, {
    params: { page, size },
  });
};

/**
 * Get all service channels.
 */
export const getAllChannels = async (): Promise<ServiceChannel[]> => {
  return get(`${BASE_PATH}/servicechannel`);
};

/**
 * Get a channel by channel ID with full details payload.
 */
export const getChannelDetails = async (
  channelId: string
): Promise<ApiResponse<ServiceChannel>> => {
  return get(`${BASE_PATH}/search/${channelId}`);
};

/**
 * Get all published channels.
 */
export const getPublishedChannels = async (): Promise<ServiceChannel[]> => {
  return get(`${BASE_PATH}/get-all`);
};

/**
 * Create a new service channel.
 */
export const createChannel = async (
  channel: Partial<ServiceChannel>
): Promise<ApiResponse<ServiceChannel>> => {
  return post(`${BASE_PATH}/servicechannel`, channel);
};

/**
 * Update an existing service channel.
 */
export const updateChannel = async (
  channel: Partial<ServiceChannel>
): Promise<ApiResponse<ServiceChannel>> => {
  return put(`${BASE_PATH}/servicechannel`, channel);
};

/**
 * Toggle a channel property (status, adult, auto, bubble, engineering, ppv).
 */
export const toggleChannelProperty = async (
  channelId: string,
  property: string,
  value: boolean,
  userId: string
): Promise<ApiResponse> => {
  return put(`${BASE_PATH}/servicechannel/${channelId}/${property}`, undefined, {
    params: { userId, value },
  });
};

/**
 * Get channel images.
 */
export const getChannelImages = async (
  channelId: string,
  prgSvcId: string
): Promise<ApiResponse> => {
  return get(`${BASE_PATH}/images/search/${channelId}/${prgSvcId}`);
};

/**
 * Save channel images.
 */
export const saveChannelImages = async (data: {
  channelImages: any[];
  channelId: string;
  prgSvcId: string;
}): Promise<ApiResponse> => {
  return post(`${BASE_PATH}/images`, data);
};

/**
 * Get all regions.
 */
export const getRegions = async (): Promise<Region[]> => {
  return get('/regions');
};

/**
 * Get all labels/categories.
 */
export const getLabels = async (): Promise<Label[]> => {
  return get('/labels');
};

/**
 * Search providers with pagination.
 */
export const searchProviders = async (
  source: string[],
  searchString: string,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<ProviderChannel[]>> => {
  return post('/providers', { source, searchString }, {
    params: { page, size },
  });
};

/**
 * Search providers using legacy platform endpoint used by old UI.
 */
export const searchProvidersByPlatform = async (
  source: string[],
  searchString: string,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<ProviderChannel[]>> => {
  return post('/providers/platform', { source, searchString }, {
    params: { page, size },
  });
};

/**
 * Get slave channels for a master.
 */
export const getSlaveChannels = async (
  sourceId: string
): Promise<ApiResponse<ServiceChannel[]>> => {
  return get(`${BASE_PATH}/servicechannel/${sourceId}/slaves`);
};

/**
 * Get master channels.
 */
export const getMasterChannels = async (): Promise<ApiResponse<ServiceChannel[]>> => {
  return get(`${BASE_PATH}/servicechannel/masterChannel`);
};

/**
 * Persist provider/daypart mapping changes for a channel.
 */
export const saveProviderMappings = async (
  channel: Partial<ServiceChannel>
): Promise<ApiResponse<ServiceChannel>> => {
  return post(`${BASE_PATH}/mappingChannel`, channel);
};

/**
 * Request guide ingest for a mapped provider service.
 */
export const requestGuide = async (
  prgSvcId: string,
  startDate: string,
  endDate: string,
  sourceId: string
): Promise<ApiResponse> => {
  return post(`/schedules/mi/${prgSvcId}/${startDate}/${endDate}/${sourceId}`, {});
};

const flattenForFormData = (obj: any): Record<string, any> => {
  const target: Record<string, any> = {};
  const walk = (node: any, keyPrefix?: string) => {
    if (node === null || node === undefined) return;
    Object.keys(node).forEach((key) => {
      const value = node[key];
      const newKey = keyPrefix === undefined
        ? key
        : Number.isNaN(Number(key))
          ? `${keyPrefix}.${key}`
          : `${keyPrefix}[${key}]`;
      if (value && typeof value === 'object' && !(value instanceof File)) {
        walk(value, newKey);
      } else {
        target[newKey] = value;
      }
    });
  };
  walk(obj);
  return target;
};

/**
 * Upload/update channel images using multipart payload expected by legacy API.
 */
export const saveChannelImagesForm = async (data: {
  channelImages: Array<{
    id?: string;
    uri?: string;
    ratio?: string;
    width?: number;
    height?: number;
    category?: string;
    published?: boolean;
    imageFile?: File;
  }>;
  channelId: string;
  prgSvcId: string;
}): Promise<ApiResponse> => {
  const payload = new FormData();
  const flat = flattenForFormData(data);
  Object.entries(flat).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      payload.append(key, value as any);
    }
  });
  return uploadFile(`${BASE_PATH}/images`, payload);
};

/**
 * Get master-channel details by master source ID.
 */
export const getMasterChannelOfSlave = async (
  masterSource: string
): Promise<ApiResponse<ServiceChannel>> => {
  return get(`${BASE_PATH}/master/${masterSource}`);
};

/**
 * Get broadcast info by platform.
 */
export const getBroadcastInfo = async (
  platform: string
): Promise<ApiResponse> => {
  return get(`${BASE_PATH}/broadcast/${platform}`);
};
