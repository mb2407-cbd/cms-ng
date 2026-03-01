# Authentication & Role-Based Access Control (RBAC)

## Overview

This feature handles user authentication via JWT tokens, session management, and role-based access control (RBAC) for protecting resources and showing/hiding UI elements based on user rights.

## Completed Tasks

### [x] Login Page UI

**Status**: Complete

**File**: `src/pages/login/LoginPage.tsx`

**Features**:
- Email and password input fields
- Submit button with loading state
- Error message display
- Responsive design with Tailwind CSS
- Form validation feedback
- Logo and branding
- "Remember me" functionality (placeholder)

**Design**:
- Clean, centered layout
- Dark mode support via Tailwind `dark:` classes
- Input focus states and validation
- Error toast or inline message display
- Loading spinner during authentication

**UI Components Used**:
- Custom form inputs with labels
- Button component with loading state
- Error message container
- LoadingSpinner component

**Accessibility**:
- Proper label associations
- ARIA attributes for error messages
- Keyboard navigation support
- Tab order optimization

### [x] Auth Service (Login/Logout/Validate)

**Status**: Complete

**File**: `src/services/auth.service.ts`

**Exported Methods**:

#### `login(email: string, password: string): Promise<AuthResponse>`
Authenticates user with email and password.

**Request**:
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN",
    "rights": ["program:read", "program:write", "channel:read"]
  },
  "expiresIn": 3600
}
```

#### `logout(): Promise<void>`
Clears authentication state and calls logout endpoint.

**Request**:
```
POST /auth/logout
Authorization: Bearer <token>
```

**Effects**:
- Removes token from localStorage
- Clears user info from storage
- Clears auth context
- Redirects to login page (handled by API interceptor)

#### `validateToken(): Promise<boolean>`
Validates current JWT token with backend.

**Request**:
```
GET /auth/validate
Authorization: Bearer <token>
```

**Response**:
```json
{
  "valid": true,
  "user": { /* user data */ }
}
```

**Returns**: `true` if token valid, `false` if invalid/expired

#### `refreshToken(): Promise<string>`
Obtains new access token using refresh token.

**Request**:
```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response**:
```json
{
  "token": "new_access_token",
  "expiresIn": 3600
}
```

**Returns**: New JWT access token

### [x] Auth Context with JWT Token Management

**Status**: Complete

**File**: `src/context/AuthContext.tsx`

**Context Structure**:
```typescript
interface AuthContextType {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  error: string | null;

  // Methods
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  validateSession(): Promise<boolean>;
  refreshSession(): Promise<boolean>;

  // Utilities
  hasRight(right: string): boolean;
  hasAnyRight(rights: string[]): boolean;
  hasAllRights(rights: string[]): boolean;
}
```

**Features**:
- JWT token stored in localStorage under key `vls_auth_token`
- User info stored under `vls_auth_user`
- Token auto-validated on app startup
- Refresh token support for extending sessions
- Error state tracking
- Loading state during auth operations

**Usage**:
```tsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();

  return (
    <>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.firstName}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Please log in</p>
      )}
    </>
  );
}
```

**Token Payload Structure** (JWT):
```json
{
  "sub": "user123",
  "email": "user@example.com",
  "role": "ADMIN",
  "rights": ["program:read", "program:write", "channel:read"],
  "iat": 1708000000,
  "exp": 1708003600
}
```

**Providers & Setup**:
- AuthContext.Provider wraps entire app in `src/main.tsx`
- useAuth hook provides easy context access
- Token attached to all API requests via axios interceptor
- 401 responses trigger automatic logout and redirect

### [x] Protected Route Component

**Status**: Complete

**File**: `src/components/auth/ProtectedRoute.tsx`

**Usage**:
```tsx
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute requiredRights={['dashboard:read']}>
        <DashboardPage />
      </ProtectedRoute>
    }
  />
</Routes>
```

**Behavior**:
- Checks if user is authenticated
- Verifies required rights if specified
- Redirects to login if not authenticated
- Shows error page if rights insufficient
- Shows loading spinner while validating session

**Props**:
```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRights?: string[];  // Optional: require specific rights
  fallback?: ReactNode;        // Custom fallback UI
}
```

**Flow**:
1. Check if `isAuthenticated` is true
2. If authenticated, validate `requiredRights` (if provided)
3. If checks pass, render children
4. If not authenticated, redirect to `/login`
5. If insufficient rights, show error/forbidden page

## Pending Tasks

### [ ] RBAC Rights-Based UI Element Visibility

**Status**: Not Started

**Objective**: Hide or disable UI elements (buttons, links, forms) based on user rights.

**Current State**:
- Auth context has `hasRight()`, `hasAnyRight()`, `hasAllRights()` methods defined
- ProtectedRoute supports `requiredRights` prop
- No conditional rendering implemented for individual elements

**Tasks**:

#### 1. Create `useRights` Custom Hook
**File**: `src/hooks/useRights.ts`

```typescript
export function useRights() {
  const { user } = useAuth();

  return {
    canRead(resource: string): boolean {
      // Check if user has ${resource}:read right
    },
    canWrite(resource: string): boolean {
      // Check if user has ${resource}:write right
    },
    canDelete(resource: string): boolean {
      // Check if user has ${resource}:delete right
    },
    canPublish(resource: string): boolean {
      // Check if user has ${resource}:publish right
    },
  };
}
```

#### 2. Create `<Can>` Component
**File**: `src/components/auth/Can.tsx`

```tsx
interface CanProps {
  I?: string;  // "read" | "write" | "delete" | "publish"
  a?: string;  // resource: "program" | "channel" | "schedule"
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ I, a, children, fallback = null }: CanProps) {
  const { canRead, canWrite, canDelete, canPublish } = useRights();

  const can = I === 'read' ? canRead(a) :
              I === 'write' ? canWrite(a) :
              I === 'delete' ? canDelete(a) :
              I === 'publish' ? canPublish(a) : false;

  return can ? children : fallback;
}
```

**Usage**:
```tsx
<Can I="write" a="program">
  <button onClick={handleEdit}>Edit Program</button>
</Can>

<Can I="delete" a="program" fallback={<p>No delete permission</p>}>
  <button onClick={handleDelete} className="bg-red-500">Delete</button>
</Can>
```

#### 3. Create `useCanDisable` Hook
For disabling elements instead of hiding:

```typescript
export function useCanDisable() {
  const { canRead, canWrite } = useRights();

  return {
    disabledIf(condition: boolean): { disabled: boolean; title?: string } {
      return {
        disabled: condition,
        title: condition ? 'You do not have permission' : undefined,
      };
    },
  };
}
```

**Usage**:
```tsx
const { disabledIf } = useCanDisable();
const rights = useRights();

<button {...disabledIf(!rights.canWrite('program'))}>
  Edit Program
</button>
```

#### 4. Rights Constants
**File**: `src/constants/rights.constants.ts`

```typescript
export const RIGHTS = {
  // Program rights
  PROGRAM_READ: 'program:read',
  PROGRAM_WRITE: 'program:write',
  PROGRAM_DELETE: 'program:delete',
  PROGRAM_PUBLISH: 'program:publish',

  // Channel rights
  CHANNEL_READ: 'channel:read',
  CHANNEL_WRITE: 'channel:write',
  CHANNEL_DELETE: 'channel:delete',

  // Schedule rights
  SCHEDULE_READ: 'schedule:read',
  SCHEDULE_WRITE: 'schedule:write',
  SCHEDULE_PUBLISH: 'schedule:publish',

  // Asset rights
  ASSET_READ: 'asset:read',
  ASSET_WRITE: 'asset:write',

  // Admin rights
  ADMIN_USERS: 'admin:users',
  ADMIN_ROLES: 'admin:roles',
  ADMIN_SETTINGS: 'admin:settings',
} as const;
```

#### 5. Update Components to Use RBAC
Examples of components to update:

**Program Detail Page**:
```tsx
function ProgramDetailPage() {
  return (
    <>
      <ProgramDetails program={program} readOnly={!canWrite('program')} />

      <Can I="write" a="program">
        <button onClick={handleSave}>Save Changes</button>
      </Can>

      <Can I="publish" a="program">
        <button onClick={handlePublish}>Publish</button>
      </Can>

      <Can I="delete" a="program">
        <button onClick={handleDelete} className="bg-red-500">
          Delete Program
        </button>
      </Can>
    </>
  );
}
```

**Channel Management**:
```tsx
<Can I="write" a="channel">
  <button className="bg-blue-500">Create Channel</button>
</Can>

{channels.map(channel => (
  <div key={channel.id}>
    <ChannelCard channel={channel} />
    <Can I="write" a="channel">
      <button onClick={() => editChannel(channel.id)}>Edit</button>
    </Can>
  </div>
))}
```

#### 6. Testing Rights
Create test suite `src/hooks/useRights.test.ts`:

```typescript
describe('useRights', () => {
  it('should return true when user has right', () => {
    const user = { rights: ['program:read'] };
    // Mock auth context with user
    const { canRead } = useRights();
    expect(canRead('program')).toBe(true);
  });

  it('should return false when user lacks right', () => {
    const user = { rights: [] };
    // Mock auth context with user
    const { canRead } = useRights();
    expect(canRead('program')).toBe(false);
  });
});
```

**Implementation Notes**:
- Rights come from AD/backend via user object after login
- Rights array in JWT payload defines what user can do
- Frontend enforces rights for UX (backend still validates)
- Different display strategies: hide element vs disable element vs show warning
- Admin role may have wildcard rights like `*:*`

### [ ] Session Timeout Handling with Automatic Logout

**Status**: Not Started

**Objective**: Automatically log out users after period of inactivity and provide warning.

**Tasks**:

#### 1. Create Session Manager Service
**File**: `src/services/session.service.ts`

```typescript
interface SessionConfig {
  inactivityTimeoutMs: number;  // e.g., 30 minutes
  warningBeforeLogoutMs: number; // e.g., 5 minutes
}

export const sessionService = {
  startSessionMonitor(config: SessionConfig, onTimeout: () => void) {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        onTimeout();
      }, config.inactivityTimeoutMs);
    };

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer, true);
    });

    resetTimer(); // Start initial timer

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer, true);
      });
    };
  },

  showWarning(remainingMs: number): void {
    // Show toast or modal warning user of imminent logout
  },
};
```

#### 2. Add Session Monitor Hook
**File**: `src/hooks/useSessionTimeout.ts`

```typescript
export function useSessionTimeout(timeoutMs = 1800000) {
  const { logout } = useAuth();

  useEffect(() => {
    const sessionTimeout = timeoutMs;
    const warningTime = 300000; // 5 minutes before timeout
    let warningShown = false;

    const handleTimeout = async () => {
      sessionService.showWarning(0);
      await logout();
    };

    const cleanup = sessionService.startSessionMonitor(
      {
        inactivityTimeoutMs: sessionTimeout,
        warningBeforeLogoutMs: warningTime,
      },
      handleTimeout
    );

    return cleanup;
  }, [logout]);
}
```

#### 3. Integrate into App Layout
**File**: `src/components/layout/AppLayout.tsx`

```tsx
export function AppLayout() {
  useSessionTimeout(1800000); // 30 minutes

  return (
    <div>
      <TopNav />
      <main>{/* page content */}</main>
      <StatusBar />
    </div>
  );
}
```

#### 4. Session Warning Modal
**File**: `src/components/auth/SessionWarningModal.tsx`

```tsx
interface SessionWarningModalProps {
  remainingSeconds: number;
  onLogout: () => void;
  onContinue: () => void;
}

export function SessionWarningModal({
  remainingSeconds,
  onLogout,
  onContinue,
}: SessionWarningModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm">
        <h2 className="text-xl font-bold mb-2">Session Expiring</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          Your session will expire in {remainingSeconds} seconds due to inactivity.
        </p>
        <div className="flex gap-2">
          <button onClick={onLogout} className="flex-1 bg-red-500">
            Logout
          </button>
          <button onClick={onContinue} className="flex-1 bg-blue-500">
            Continue Session
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Configuration**:
- Timeout from env var: `VITE_SESSION_TIMEOUT_MS`
- Default: 30 minutes (1800000 ms)
- Warning appears 5 minutes before logout
- User can click "Continue" to reset timer

**References**:
- https://www.ietf.org/rfc/rfc7234.txt (HTTP caching / session handling)

### [ ] Token Refresh Mechanism

**Status**: Not Started

**Objective**: Automatically refresh access token before expiration using refresh token.

**Background**:
- Access tokens expire (typically 1 hour)
- Refresh tokens last longer (typically 7 days)
- Refresh should happen silently without user interaction
- Prevent "sudden" logout mid-action

**Tasks**:

#### 1. Implement Token Refresh Logic in Auth Service
```typescript
// In src/services/auth.service.ts

const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh 5 min before expiry

export async function shouldRefreshToken(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  const payload = parseJWT(token);
  const expiryTime = payload.exp * 1000;
  const timeUntilExpiry = expiryTime - Date.now();

  return timeUntilExpiry < TOKEN_REFRESH_THRESHOLD;
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  try {
    const response = await post<{ token: string; expiresIn: number }>(
      '/auth/refresh',
      { refreshToken }
    );

    localStorage.setItem(AUTH_TOKEN_KEY, response.token);
    return response.token;
  } catch (error) {
    // Refresh failed, logout user
    logout();
    return null;
  }
}
```

#### 2. Create Token Refresh Hook
**File**: `src/hooks/useTokenRefresh.ts`

```typescript
export function useTokenRefresh() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Check every 10 seconds if token needs refresh
    const interval = setInterval(async () => {
      if (await authService.shouldRefreshToken()) {
        const newToken = await authService.refreshAccessToken();
        if (newToken) {
          // Invalidate all queries to refetch with new token
          queryClient.invalidateQueries();
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [queryClient]);
}
```

#### 3. Integrate into App Layout
```tsx
export function AppLayout() {
  useSessionTimeout();
  useTokenRefresh(); // Auto-refresh token

  return (
    // ... layout
  );
}
```

#### 4. Axios Interceptor for Automatic Refresh
Update `src/services/api.service.ts`:

```typescript
// Response interceptor that handles 401 with automatic refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await authService.refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest); // Retry original request
        }
      } catch (refreshError) {
        // Refresh failed, logout
        await authService.logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

**Token Refresh Flow**:
1. Every 10 seconds, check if token expires in < 5 minutes
2. If yes, call `/auth/refresh` with refresh token
3. Store new access token in localStorage
4. Invalidate React Query cache to refetch with new token
5. If refresh fails, auto-logout user

### [ ] Role-to-Rights Mapping UI in Admin Section

**Status**: Not Started

**Objective**: Create admin interface for managing role definitions and their associated rights.

**Current State**:
- No admin role management page
- No way to edit role definitions
- Rights are defined on backend, hardcoded in frontend

**Tasks**:

#### 1. Create Role Management Page
**File**: `src/pages/admin/RoleManagementPage.tsx`

Features:
- List all roles with their descriptions
- Create new role
- Edit existing role
- Delete role (with confirmation)
- Assign rights to roles

**UI Layout**:
```
┌─────────────────────────────────────┐
│ Role Management                     │
│ [+ Create New Role]                 │
├─────────────────────────────────────┤
│ Role Name    │ Rights Count│ Actions │
├─────────────────────────────────────┤
│ Admin        │ 20          │ Edit Del│
│ Editor       │ 15          │ Edit Del│
│ Viewer       │ 5           │ Edit Del│
└─────────────────────────────────────┘
```

#### 2. Create Role Form Component
**File**: `src/components/admin/RoleForm.tsx`

```typescript
interface RoleFormProps {
  role?: Role;
  onSubmit: (role: Role) => Promise<void>;
  onCancel: () => void;
}

export function RoleForm({ role, onSubmit, onCancel }: RoleFormProps) {
  const [formData, setFormData] = useState<Role>(
    role || { id: '', name: '', description: '', rights: [] }
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleRightsToggle = (right: string) => {
    setFormData(prev => ({
      ...prev,
      rights: prev.rights.includes(right)
        ? prev.rights.filter(r => r !== right)
        : [...prev.rights, right],
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">
        {role ? 'Edit Role' : 'Create Role'}
      </h2>

      <div className="mb-4">
        <label>Role Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="mb-4">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <div className="mb-4">
        <h3 className="font-bold mb-2">Rights</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(RIGHTS).map(right => (
            <label key={right} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.rights.includes(right)}
                onChange={() => handleRightsToggle(right)}
              />
              <span className="ml-2">{right}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
```

#### 3. API Endpoints for Role Management
```
GET    /admin/roles              - List all roles
GET    /admin/roles/:id          - Get role details
POST   /admin/roles              - Create new role
PUT    /admin/roles/:id          - Update role
DELETE /admin/roles/:id          - Delete role
GET    /admin/rights             - List all available rights
```

#### 4. Role Type Definition
**File**: `src/types/role.types.ts`

```typescript
export interface Role {
  id: string;
  name: string;
  description: string;
  rights: string[];
  createdDate?: string;
  updatedDate?: string;
  userCount?: number;
}

export interface RoleResponse {
  roles: Role[];
  total: number;
}
```

#### 5. Create Role Service
**File**: `src/services/role.service.ts`

```typescript
export const roleService = {
  async getRoles(): Promise<Role[]> {
    return get('/admin/roles');
  },

  async getRole(id: string): Promise<Role> {
    return get(`/admin/roles/${id}`);
  },

  async createRole(role: Omit<Role, 'id'>): Promise<Role> {
    return post('/admin/roles', role);
  },

  async updateRole(id: string, role: Partial<Role>): Promise<Role> {
    return put(`/admin/roles/${id}`, role);
  },

  async deleteRole(id: string): Promise<void> {
    return delete(`/admin/roles/${id}`);
  },

  async listAvailableRights(): Promise<string[]> {
    return get('/admin/rights');
  },
};
```

#### 6. Navigation to Role Management
Add to admin section navigation:
```tsx
<li>
  <NavLink to="/admin/roles">Role Management</NavLink>
</li>
```

**Access Control**:
- Only users with `admin:roles` right can access
- ProtectedRoute should enforce: `requiredRights={['admin:roles']}`

**Data Flow**:
1. User navigates to `/admin/roles`
2. Page fetches roles list from backend
3. User clicks Edit or Create
4. Form fetches available rights
5. User modifies rights checkboxes
6. Submit calls API to save role
7. Page refreshes to show updates

## Business Rules & Validation

### Authentication
1. **JWT Token Structure**:
   - Header: `{ alg: "HS256", typ: "JWT" }`
   - Payload: `{ sub, email, role, rights, iat, exp }`
   - Signature: HMAC-SHA256(base64(header) + "." + base64(payload), secret)

2. **Token Lifetime**:
   - Access token: 1 hour (3600 seconds)
   - Refresh token: 7 days
   - Warning at: 5 minutes before expiry
   - Auto-logout: immediately after expiry

3. **Password Requirements**:
   - Minimum 8 characters
   - At least 1 uppercase letter
   - At least 1 number
   - At least 1 special character

4. **Failed Login Attempts**:
   - Lock account after 5 failed attempts
   - Lock duration: 30 minutes
   - Send email notification after 3 attempts

### Authorization (RBAC)
1. **Rights Model**:
   - Format: `resource:action`
   - Examples: `program:read`, `channel:write`, `admin:users`
   - Wildcard: `*:*` grants all rights

2. **Rights Enforcement**:
   - Frontend: Hide/disable UI elements
   - Backend: Validate rights on every request
   - API returns 403 Forbidden if rights insufficient

3. **Role Assignment**:
   - Users assigned to role(s)
   - User rights = union of all assigned roles' rights
   - Role changes take effect on next login

4. **Default Roles**:
   - **Admin**: All rights
   - **Editor**: program:*, channel:*, schedule:*, asset:*
   - **Viewer**: *:read only
   - **Guest**: dashboard:read only

### Session Management
1. **Session Timeout**:
   - Idle timeout: 30 minutes
   - Absolute timeout: 8 hours
   - Warning: 5 minutes before idle timeout

2. **Activity Tracking**:
   - Reset by: mouse, keyboard, scroll, touch
   - Not reset by: focus/blur events
   - Client-side tracking only (not sent to server)

3. **Multiple Tabs**:
   - Logout in one tab logs out all tabs (via localStorage events)
   - Token refresh in one tab refreshes all tabs

### Integration with Microsoft AD
(To be implemented)
1. LDAP/AD integration for user authentication
2. AD groups mapped to application roles
3. Rights pulled from AD group membership
4. Single Sign-On (SSO) via SAML/OAuth

## API Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "code": "AUTH_001"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "User does not have required rights",
  "code": "AUTH_002",
  "requiredRights": ["program:write"]
}
```

### 400 Bad Request (Login)
```json
{
  "error": "Bad Request",
  "message": "Invalid email or password",
  "code": "AUTH_003"
}
```

### 429 Too Many Requests (Rate Limit)
```json
{
  "error": "Too Many Requests",
  "message": "Account locked due to multiple failed login attempts",
  "retryAfter": 1800,
  "code": "AUTH_004"
}
```

## Implementation Order

1. Complete Session Timeout (highest priority for UX)
2. Token Refresh Mechanism
3. RBAC UI Element Visibility (widely used across features)
4. Role Management Admin UI
5. AD Integration (depends on backend support)

## Testing Checklist

- [ ] Login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Session warning appears 5 minutes before timeout
- [ ] Logout works from modal
- [ ] Continue session resets timer
- [ ] Token auto-refresh before expiry
- [ ] Protected routes redirect to login
- [ ] Can/Cannot components show/hide correctly
- [ ] Admin can create/edit/delete roles
- [ ] Rights changes reflected in UI
- [ ] Works with multiple browser tabs (localStorage sync)
