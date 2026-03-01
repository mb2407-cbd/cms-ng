/**
 * @file environment.config.ts
 * @description Centralized environment configuration for API endpoints and CDN URLs.
 *              Supports runtime switching between Staging and Production.
 * @author VLS Team
 * @date 2026-02-24
 */

export type EnvironmentName = 'staging' | 'production';

export interface EnvironmentConfig {
  name: EnvironmentName;
  label: string;
  apiBaseUrl: string;
  cloudfrontBaseUrl: string;
  /** Short color-coded indicator for the status bar */
  badgeColor: string;
}

/**
 * All available environments.
 * ──────────────────────────────────────────────────────────────────
 * To update URLs: edit the entries below.  No other file changes needed.
 * ──────────────────────────────────────────────────────────────────
 */
export const ENVIRONMENTS: Record<EnvironmentName, EnvironmentConfig> = {
  staging: {
    name: 'staging',
    label: 'Staging',
    apiBaseUrl: 'https://86xcffn8cf.execute-api.us-west-2.amazonaws.com/api',
    cloudfrontBaseUrl: 'https://d355knccl7z6vu.cloudfront.net',
    badgeColor: 'amber',
  },
  production: {
    name: 'production',
    label: 'Production',
    // ── UPDATE THESE with real production URLs ──
    apiBaseUrl: 'https://PRODUCTION_API_GATEWAY.execute-api.us-west-2.amazonaws.com/api',
    cloudfrontBaseUrl: 'https://PRODUCTION_CLOUDFRONT.cloudfront.net',
    badgeColor: 'green',
  },
};

const STORAGE_KEY = 'vls_environment';

/**
 * Read the persisted environment choice (defaults to staging).
 */
export const getStoredEnvironment = (): EnvironmentName => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'production' || stored === 'staging') return stored;
  return 'staging';
};

/**
 * Persist the environment choice.
 */
export const setStoredEnvironment = (env: EnvironmentName): void => {
  localStorage.setItem(STORAGE_KEY, env);
};

/**
 * Get the full config for the currently selected environment.
 */
export const getCurrentEnvironment = (): EnvironmentConfig => {
  return ENVIRONMENTS[getStoredEnvironment()];
};

/**
 * Get the API base URL for the current environment.
 * In dev mode, always uses the Vite proxy (/api) regardless of selection.
 */
export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (import.meta.env.DEV) {
    return '/api';
  }
  return getCurrentEnvironment().apiBaseUrl;
};

/**
 * Get the CloudFront image base URL for the current environment.
 */
export const getCloudfrontBaseUrl = (): string => {
  return getCurrentEnvironment().cloudfrontBaseUrl;
};
