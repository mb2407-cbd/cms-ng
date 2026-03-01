/**
 * @file asset.service.ts
 * @description Service for Asset management operations.
 * @author VLS Team
 * @date 2026-02-20
 */
import { get, post } from './api.service';
import type {
  AssetDetail,
  AssetFilterOption,
  AssetListItem,
  AssetSearchRequest,
  AssetSearchResponseEnvelope,
  AmountAssetMapped,
} from '../types/asset.types';

const BASE_PATH = '/assets';

/**
 * Search assets with filters and pagination.
 */
export const searchAssets = async (
  request: AssetSearchRequest,
  page: number = 1,
  size: number = 20
): Promise<AssetSearchResponseEnvelope> => {
  return post(`${BASE_PATH}/search`, request, { params: { page, size } });
};

/**
 * Fetch full asset detail by composite key (assetId + dmsId).
 * The API returns `{ response: AssetDetail }`.
 */
export const getAssetDetail = async (
  assetId: string,
  dmsId: string
): Promise<AssetDetail> => {
  const envelope = await get<{ response?: AssetDetail }>(
    `${BASE_PATH}/asset/${encodeURIComponent(assetId)}/${encodeURIComponent(dmsId)}`
  );
  return (envelope?.response ?? envelope) as AssetDetail;
};

/**
 * @deprecated Use getAssetDetail instead. Kept for backwards compatibility.
 */
export const getAssetByCompositeId = async (
  compositeId: string
): Promise<{ response?: AssetListItem }> => {
  const [assetId = '', dmsId = ''] = compositeId.split('-');
  return get(`${BASE_PATH}/asset/${assetId}/${dmsId}`);
};

/**
 * Fetch available service/provider categories for filter dropdowns.
 */
export const getServiceCategories = async (): Promise<{ response?: AssetFilterOption[] }> => {
  return get(`${BASE_PATH}/category`);
};

/**
 * Fetch available channels for filter dropdowns.
 */
export const getAssetChannels = async (): Promise<{ response?: AssetFilterOption[] }> => {
  return get(`${BASE_PATH}/channel`);
};

/**
 * Fetch asset mapping metrics (mapped vs total titles).
 */
export const getAmountAssetMapped = async (): Promise<{ response?: AmountAssetMapped }> => {
  return get(`${BASE_PATH}/asset-mapped`);
};
