/**
 * @file schedule.service.ts
 * @description Service for Schedule management operations
 * @author VLS Team
 * @date 2026-02-15
 */
import { get, post, put } from './api.service';
import type { ScheduleVersion, ScheduleBulkCopy, ScheduleEvent } from '../types';
import type { ApiResponse } from '../types';

const BASE_PATH = '/schedules';
const V2_BASE_PATH = '/v2/schedules';

/**
 * Get schedule versions for a channel and date.
 * Always uses v2 endpoint with timeZone param (defaults to GMT).
 */
export const getScheduleVersions = async (
  channelId: string,
  date: string,
  timezone?: string
): Promise<ApiResponse<ScheduleVersion[]>> => {
  const params: Record<string, any> = {
    channelId,
    date,
    timeZone: timezone || 'GMT',
  };
  return get(`${V2_BASE_PATH}/version`, params);
};

/**
 * Get a specific schedule version by ID (with full events).
 * Uses v2 endpoint.
 */
export const getScheduleVersionById = async (
  id: string
): Promise<ApiResponse<ScheduleVersion>> => {
  return get(`${V2_BASE_PATH}/version/${id}`);
};

/**
 * Save a new schedule version.
 */
export const saveScheduleVersion = async (
  version: ScheduleVersion
): Promise<ApiResponse<ScheduleVersion>> => {
  return post(`${V2_BASE_PATH}/version`, version);
};

/**
 * Save and publish a schedule version.
 */
export const saveAndPublishSchedule = async (
  version: ScheduleVersion
): Promise<ApiResponse<ScheduleVersion>> => {
  return post(`${V2_BASE_PATH}/version/saveAndPublish`, version);
};

/**
 * Publish a specific schedule version.
 */
export const publishScheduleVersion = async (
  scheduleVersionId: string
): Promise<ApiResponse> => {
  return put(`${BASE_PATH}/version/${scheduleVersionId}/publish`);
};

/**
 * Lock a schedule.
 */
export const lockSchedule = async (
  scheduleId: string
): Promise<ApiResponse> => {
  return put(`${BASE_PATH}/version/lock/${scheduleId}`);
};

/**
 * Validate schedule events.
 */
export const validateEvents = async (
  events: ScheduleEvent[]
): Promise<ApiResponse> => {
  return post(`${BASE_PATH}/validate-events`, events);
};

/**
 * Bulk copy schedules.
 */
export const bulkCopySchedules = async (
  bulkCopy: ScheduleBulkCopy,
  timezone: string = 'GMT'
): Promise<ApiResponse> => {
  return post(`${V2_BASE_PATH}/bulkCopy`, bulkCopy, {
    params: { timeZone: timezone },
  });
};

/**
 * Manual ingest schedules from provider.
 */
export const manualIngest = async (
  prgSvcId: string,
  startDate: string,
  endDate: string,
  sourceId: string
): Promise<ApiResponse> => {
  return post(`${BASE_PATH}/mi/${prgSvcId}/${startDate}/${endDate}/${sourceId}`);
};

/**
 * Get schedule report.
 */
export const getScheduleReport = async (data: {
  channelId: string;
  startDate: string;
  endDate: string;
}): Promise<ApiResponse> => {
  return post(`${V2_BASE_PATH}/scheduleReport`, data);
};
