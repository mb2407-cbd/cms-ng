/**
 * @file reference.service.ts
 * @description Service for fetching reference/lookup data (genres, ratings, etc.)
 * @author VLS Team
 * @date 2026-02-15
 */
import { get } from './api.service';
import type { Genre, RatingDefinition, Region, Label, AppConfig, VersionInfo } from '../types';

/**
 * Get all genres.
 * API returns ResponseDTO with genres in the 'response' field.
 */
export const getGenres = async (): Promise<Genre[]> => {
  const result: any = await get('/genres');
  // API returns { response: Genre[] }
  return result.response || result || [];
};

/**
 * Get all rating definitions.
 * API returns ResponseDTO with ratings in the 'response' field.
 */
export const getRatings = async (): Promise<RatingDefinition[]> => {
  const result: any = await get('/ratings');
  // API returns { response: RatingDefinition[] }
  return result.response || result || [];
};

/**
 * Get all regions.
 */
export const getRegions = async (): Promise<Region[]> => {
  return get('/regions');
};

/**
 * Get all categories/labels.
 */
export const getLabels = async (): Promise<Label[]> => {
  return get('/labels');
};

/**
 * Get all advisories.
 */
export const getAdvisories = async (): Promise<string[]> => {
  return get('/advisories');
};

/**
 * Get all celebrities.
 */
export const getCelebrities = async (
  search?: string
): Promise<any[]> => {
  const params = search ? { search } : undefined;
  return get('/celebrities/search', params);
};

/**
 * Get all organizations.
 */
export const getOrganizations = async (): Promise<any[]> => {
  return get('/organizations');
};

/**
 * Get default app configurations.
 */
export const getDefaultConfigs = async (): Promise<AppConfig> => {
  return get('/app-configs/default-configs');
};

/**
 * Get API version info.
 */
export const getVersionInfo = async (): Promise<VersionInfo> => {
  return get('/version');
};
