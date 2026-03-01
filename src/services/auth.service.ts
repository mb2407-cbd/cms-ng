/**
 * @file auth.service.ts
 * @description Authentication service for user login/logout
 * @author VLS Team
 * @date 2026-02-15
 */
import MD5 from 'crypto-js/md5';
import { post, setAuthToken, clearAuthToken, setUserInfo } from './api.service';
import type { LoginRequest, LoginResponse, UserInfo } from '../types';

/**
 * Authenticate user with username and password.
 * Supports demo mode for development/testing.
 */
export const login = async (credentials: LoginRequest): Promise<UserInfo> => {
  // Demo mode: allow demo/demo login without hitting API
  if (credentials.username === 'demo' && credentials.password === 'demo') {
    const demoUser: UserInfo = {
      id: 'demo-user-1',
      username: 'demo',
      firstname: 'Demo',
      lastname: 'User',
      email: 'demo@vls.com',
      accessToken: 'demo-token-' + Date.now(),
      roleIds: ['admin'],
      admin: true,
      active: true,
      rights: [
        'program.read',
        'program.write',
        'program.publish',
        'program.lock',
        'channel.read',
        'channel.write',
      ],
    };

    setAuthToken(demoUser.accessToken);
    setUserInfo(demoUser);
    return demoUser;
  }

  // Real API call - hash password with MD5 (legacy requirement)
  const hashedPassword = MD5(credentials.password).toString();
  const response = await post<LoginResponse>('/users/login', {
    username: credentials.username,
    password: hashedPassword,
  });

  // Check for error in response
  if (response.errorMessage || response.user?.errorMessage) {
    throw new Error(response.errorMessage || response.user?.errorMessage || 'Login failed');
  }

  const userInfo: UserInfo = {
    id: response.user.id,
    username: response.user.username,
    firstname: response.user.firstname,
    lastname: response.user.lastname,
    email: response.user.email,
    accessToken: response.user.accessToken,
    roleIds: response.user.roleIds || [],
    admin: response.user.admin,
    active: response.user.active,
    // Rights will be populated from JWT token or role mapping in future
    rights: [],
  };

  setAuthToken(response.user.accessToken);
  setUserInfo(userInfo);

  return userInfo;
};

/**
 * Logout the current user and clear session data.
 */
export const logout = async (): Promise<void> => {
  try {
    await post('/users/logout');
  } catch {
    // Silently fail - we still want to clear local state
  } finally {
    clearAuthToken();
  }
};

/**
 * Validate the current session token.
 */
export const validateSession = async (): Promise<boolean> => {
  try {
    await post('/users/validate');
    return true;
  } catch {
    clearAuthToken();
    return false;
  }
};
