/**
 * @file common.types.ts
 * @description Shared TypeScript type definitions
 * @author VLS Team
 * @date 2026-02-15
 */

export interface ApiResponse<T = any> {
  data?: T;
  errorCode?: string;
  errorMessage?: string;
  timestamp?: string;
  requestId?: string;
}

export interface PaginatedResponse<T = any> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface PageRequest {
  page: number;
  size: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

export interface Genre {
  id: string;
  names: Array<{
    value: string;
    language: string;
  }>;
  externalRefs?: Array<{
    system: string;
    refName: string;
    id: string;
  }>;
  createdDate?: number;
  updatedDate?: number;
}

export interface RatingDefinition {
  id: string;
  rating: string;
  code?: string;
  organization?: string;
  countryCode?: string;
  descriptions?: Array<{
    description: string;
    language: string;
  }>;
  createdDate?: string;
  updatedDate?: string;
}

export interface Region {
  id: string;
  name: string;
  abbrev?: string;
}

export interface Label {
  id: string;
  name: string;
  type?: string;
}

export interface UserInfo {
  id: string;
  username: string;
  accessToken: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  roleIds: string[];
  admin?: boolean;
  active?: boolean;
  rights?: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserRoleDTO {
  id: string;
  username: string;
  firstname?: string;
  lastname?: string;
  roleIds: string[];
  email?: string;
  accessToken: string;
  active?: boolean;
  admin?: boolean;
  flag?: boolean;
  errorMessage?: string;
  logonUserId?: number;
}

export interface LoginResponse {
  user: UserRoleDTO;
  errorMessage?: string;
}

export interface AppConfig {
  defaultTimeZone?: string;
  [key: string]: any;
}

export interface VersionInfo {
  version: string;
  buildDate?: string;
  environment?: string;
}

/** Platform types */
export const Platform = {
  OTT: 'ott',
  DTH: 'dth',
  BOTH: 'both',
} as const;

export type Platform = typeof Platform[keyof typeof Platform];

/** Language codes */
export const LanguageCode = {
  EN: 'en',
  ES: 'es',
  PT: 'pt',
  PT_BR: 'pt-BR',
} as const;

export type LanguageCode = typeof LanguageCode[keyof typeof LanguageCode];
