/**
 * @file AppContext.tsx
 * @description React context for global application state
 * @author VLS Team
 * @date 2026-02-15
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import * as referenceService from '../services/reference.service';
import type { Genre, RatingDefinition, Region, Label, AppConfig, VersionInfo } from '../types';
import {
  type EnvironmentName,
  type EnvironmentConfig,
  ENVIRONMENTS,
  getStoredEnvironment,
  setStoredEnvironment,
} from '../config/environment.config';

export type ThemeName = 'vls-dark' | 'vls-light' | 'checkbox-dark' | 'checkbox-light';

const THEME_STORAGE_KEY = 'vls_theme';

const getStoredTheme = (): ThemeName => {
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === 'vls-dark' || raw === 'vls-light' || raw === 'checkbox-dark' || raw === 'checkbox-light') return raw;
  // Legacy migration support
  if (raw === 'vls-indigo') return 'vls-dark';
  if (raw === 'checkbox-green') return 'checkbox-dark';
  return 'vls-dark';
};

const isDarkTheme = (theme: ThemeName): boolean => theme.endsWith('dark');
const getThemeBrand = (theme: ThemeName): 'vls' | 'checkbox' => (theme.startsWith('checkbox') ? 'checkbox' : 'vls');

interface AppContextType {
  /** Current platform (OTT/DTH) */
  platform: string;
  setPlatform: (platform: string) => void;
  /** Dark mode state */
  darkMode: boolean;
  toggleDarkMode: () => void;
  /** Reference data */
  genres: Genre[];
  ratings: RatingDefinition[];
  regions: Region[];
  labels: Label[];
  advisories: string[];
  appConfig: AppConfig | null;
  versionInfo: VersionInfo | null;
  /** Pre-computed lookup maps for genres and ratings */
  genreMap: Map<string, string>;
  ratingLookup: Map<string, { code: string; rating: string }>;
  /** Resolve a genre ID to its display name */
  getGenreName: (genreId: string) => string;
  /** Loading state for reference data */
  referenceDataLoading: boolean;
  /** Load all reference data */
  loadReferenceData: () => Promise<void>;
  /** Chat panel visibility */
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  /** Active environment (staging / production) */
  environment: EnvironmentConfig;
  environmentName: EnvironmentName;
  setEnvironment: (env: EnvironmentName) => void;
  /** Active color theme */
  themeName: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [platform, setPlatform] = useState<string>('ott');
  const [chatOpen, setChatOpen] = useState(false);
  const [environmentName, setEnvironmentName] = useState<EnvironmentName>(getStoredEnvironment());
  const [themeName, setThemeName] = useState<ThemeName>(getStoredTheme());
  const darkMode = isDarkTheme(themeName);

  const environment = ENVIRONMENTS[environmentName];

  const setEnvironment = useCallback((env: EnvironmentName) => {
    setStoredEnvironment(env);
    setEnvironmentName(env);
  }, []);

  const setTheme = useCallback((theme: ThemeName) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    setThemeName(theme);
  }, []);

  // Reference data
  const [genres, setGenres] = useState<Genre[]>([]);
  const [ratings, setRatings] = useState<RatingDefinition[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [advisories, setAdvisories] = useState<string[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [referenceDataLoading, setReferenceDataLoading] = useState(false);

  // ── Pre-computed lookup maps (derived from reference data) ──────
  const genreMap = useMemo(() => {
    const map = new Map<string, string>();
    genres.forEach((genre: any) => {
      const englishName = genre.names?.find((n: any) => n.language === 'en')?.value;
      const firstName = genre.names?.[0]?.value;
      map.set(genre.id, englishName || firstName || genre.id);
    });
    return map;
  }, [genres]);

  const ratingLookup = useMemo(() => {
    const map = new Map<string, { code: string; rating: string }>();
    ratings.forEach((r: any) => {
      map.set(r.id, { code: r.code || '', rating: r.rating || '' });
    });
    return map;
  }, [ratings]);

  const getGenreName = useCallback(
    (genreId: string): string => genreMap.get(genreId) || genreId,
    [genreMap]
  );

  useEffect(() => {
    const root = document.documentElement;
    const dark = isDarkTheme(themeName);
    root.classList.toggle('dark', dark);
    root.setAttribute('data-theme', getThemeBrand(themeName));
    root.setAttribute('data-appearance', dark ? 'dark' : 'light');
    localStorage.setItem('vls_dark_mode', dark ? 'true' : 'false');
  }, [themeName]);

  const toggleDarkMode = useCallback(() => {
    setThemeName((current) => {
      const next =
        current === 'vls-dark' ? 'vls-light' :
        current === 'vls-light' ? 'vls-dark' :
        current === 'checkbox-dark' ? 'checkbox-light' :
        'checkbox-dark';
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const loadReferenceData = useCallback(async () => {
    setReferenceDataLoading(true);
    try {
      const [genresRes, ratingsRes, regionsRes, labelsRes, advisoriesRes, configRes, versionRes] =
        await Promise.allSettled([
          referenceService.getGenres(),
          referenceService.getRatings(),
          referenceService.getRegions(),
          referenceService.getLabels(),
          referenceService.getAdvisories(),
          referenceService.getDefaultConfigs(),
          referenceService.getVersionInfo(),
        ]);

      if (genresRes.status === 'fulfilled') setGenres(genresRes.value);
      if (ratingsRes.status === 'fulfilled') setRatings(ratingsRes.value);
      if (regionsRes.status === 'fulfilled') setRegions(regionsRes.value);
      if (labelsRes.status === 'fulfilled') setLabels(labelsRes.value);
      if (advisoriesRes.status === 'fulfilled') setAdvisories(advisoriesRes.value);
      if (configRes.status === 'fulfilled') setAppConfig(configRes.value);
      if (versionRes.status === 'fulfilled') setVersionInfo(versionRes.value);
    } finally {
      setReferenceDataLoading(false);
    }
  }, []);

  const value: AppContextType = {
    platform,
    setPlatform,
    darkMode,
    toggleDarkMode,
    genres,
    ratings,
    regions,
    labels,
    advisories,
    appConfig,
    versionInfo,
    genreMap,
    ratingLookup,
    getGenreName,
    referenceDataLoading,
    loadReferenceData,
    chatOpen,
    setChatOpen,
    environment,
    environmentName,
    setEnvironment,
    themeName,
    setTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/**
 * Hook to access global application context.
 * Must be used within an AppProvider.
 */
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
