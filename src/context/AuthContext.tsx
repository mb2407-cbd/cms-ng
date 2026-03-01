/**
 * @file AuthContext.tsx
 * @description React context for authentication state management
 * @author VLS Team
 * @date 2026-02-15
 */
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as authService from '../services/auth.service';
import { getUserInfo, getAuthToken } from '../services/api.service';
import type { UserInfo, LoginRequest } from '../types';

const ALLOW_ALL_RIGHTS_STORAGE_KEY = 'vls_allow_all_rights';
const ALLOW_ALL_RIGHTS_ENV_ENABLED = import.meta.env.VITE_AUTH_ALLOW_ALL_RIGHTS === 'true';

const isTruthyFlag = (value: string | null): boolean => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
};

const isAllowAllRightsEnabled = (): boolean => {
  if (ALLOW_ALL_RIGHTS_ENV_ENABLED) return true;
  try {
    return isTruthyFlag(localStorage.getItem(ALLOW_ALL_RIGHTS_STORAGE_KEY));
  } catch {
    return false;
  }
};

const userHasRight = (user: UserInfo | null, right: string): boolean => {
  const rights = user?.rights || [];
  if (!rights.length) return false;
  if (rights.includes(right)) return true;
  if (rights.includes('*:*')) return true;
  const [resource] = right.split(':');
  if (resource && rights.includes(`${resource}:*`)) return true;
  return false;
};

interface AuthContextType {
  /** Current authenticated user, or null if not logged in */
  user: UserInfo | null;
  /** Whether auth state is still being determined */
  loading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Login with credentials */
  login: (credentials: LoginRequest) => Promise<void>;
  /** Logout current user */
  logout: () => Promise<void>;
  /** Check if user has a specific right */
  hasRight: (right: string) => boolean;
  /** Check if user has a specific role */
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = getUserInfo();
      const token = getAuthToken();

      if (storedUser && token) {
        // Check if this is demo mode (token starts with 'demo-token-')
        const isDemoMode = token.startsWith('demo-token-');

        if (isDemoMode) {
          // Demo mode - always accept stored user
          setUser(storedUser);
        } else {
          // Real mode - validate with backend
          try {
            const isValid = await authService.validateSession();
            if (isValid) {
              setUser(storedUser);
            }
          } catch {
            // Session invalid - user will need to login again
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    // Call auth service - it handles both demo and real mode
    const userInfo = await authService.login(credentials);
    setUser(userInfo);

    const isDemoMode = userInfo.accessToken.startsWith('demo-token-');
    if (isDemoMode) {
      console.log('✅ Demo mode: Logged in as', userInfo.username);
    } else {
      console.log('✅ Logged in as', userInfo.username);
    }
  }, []);

  const logout = useCallback(async () => {
    // Call auth service logout - it handles cleanup
    await authService.logout();
    setUser(null);
    console.log('✅ Logged out');
  }, []);

  const hasRight = useCallback(
    (right: string): boolean => {
      if (isAllowAllRightsEnabled()) return true;
      return userHasRight(user, right);
    },
    [user]
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      return user?.roleIds?.includes(role) ?? false;
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    hasRight,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access authentication context.
 * Must be used within an AuthProvider.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
