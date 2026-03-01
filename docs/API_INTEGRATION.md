# VLS UI Modern - API Integration Guide

## Overview

The VLS UI Modern application is now integrated with the actual VLS API Service hosted on AWS API Gateway. The system supports both **Demo Mode** (for development/testing) and **Real API Mode** (for production use).

## API Configuration

### AWS API Gateway Endpoint
```
https://86xcffn8cf.execute-api.us-west-2.amazonaws.com/api
```

### Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```bash
# API Base URL
VITE_API_BASE_URL=https://86xcffn8cf.execute-api.us-west-2.amazonaws.com/api
```

## Authentication Modes

### Demo Mode

Demo mode allows you to test the application without connecting to the real API.

**Login Credentials:**
- Username: `demo`
- Password: `demo`

**Features:**
- ✅ Bypasses API authentication
- ✅ Uses mock data for all endpoints
- ✅ Full permissions granted automatically
- ✅ Token format: `demo-token-{timestamp}`
- ✅ 8 mock programs available

**How it works:**
1. User enters "demo/demo" credentials
2. `auth.service.ts` detects demo credentials
3. Creates a local user object with full rights
4. All API calls check for `demo-token-*` prefix and return mock data

### Real API Mode

Real API mode connects to the actual VLS API Service.

**Login Process:**
1. User enters actual credentials
2. POST request to `/api/users/login`
3. Receives JWT token in response
4. Token stored in localStorage as `vls_auth_token`
5. Token attached to all subsequent requests via Authorization header

**API Request Flow:**
```
Login Request:
POST /api/users/login
Body: { username: string, password: string }

Response:
{
  user: {
    id: string
    username: string
    firstname: string
    lastname: string
    email: string
    accessToken: string  // JWT token
    roleIds: string[]
    admin: boolean
    active: boolean
  },
  errorMessage?: string
}
```

## JWT Token Handling

### Token Storage
- Key: `vls_auth_token`
- Location: `localStorage`
- Format: JWT string

### Token Attachment
All API requests automatically include the token:
```typescript
Authorization: Bearer {token}
```

### Token Validation
- Demo tokens: Start with `demo-token-`, never validated
- Real tokens: Validated on app initialization via `/api/users/validate`
- Invalid tokens: User redirected to login page

### Token Lifecycle
1. **Login**: Token stored in localStorage
2. **App Init**: Token checked and validated
3. **API Requests**: Token attached to Authorization header
4. **401 Response**: Token cleared, user redirected to login
5. **Logout**: Token removed from localStorage

## Current Limitations

### Rights/Permissions
⚠️ **Note:** The JWT token does not currently return the full list of user rights.

**Workaround:**
- Demo mode: All rights granted automatically
- Real API mode: Rights array is empty (`rights: []`)
- Future: Rights will be populated from JWT claims or role mapping

**Impact:**
- Permission checks like `hasRight('program.write')` will return `false`
- To temporarily enable features, you can:
  1. Use demo mode for development
  2. Modify AuthContext to grant default rights based on roleIds
  3. Wait for backend to include rights in JWT response

### Available Role Information
From real API login:
- ✅ `roleIds`: Array of role IDs (e.g., `['admin']`)
- ✅ `admin`: Boolean flag
- ❌ `rights`: Not populated yet

## Code Structure

### Key Files

**API Client (`src/services/api.service.ts`)**
- Axios instance configuration
- Request/response interceptors
- Token attachment logic
- Error handling (401 redirects)

**Authentication Service (`src/services/auth.service.ts`)**
- `login()`: Handles both demo and real authentication
- `logout()`: Clears session data
- `validateSession()`: Validates existing token

**Auth Context (`src/context/AuthContext.tsx`)**
- User state management
- Session initialization
- Permission helpers (`hasRight`, `hasRole`)

**Program Service (`src/services/program.service.ts`)**
- Demo mode detection via token prefix
- Mock data for demo mode
- Real API calls for production

### Demo Mode Detection

```typescript
// Check if current session is demo mode
const isDemoMode = (): boolean => {
  const token = localStorage.getItem('vls_auth_token');
  return token?.startsWith('demo-token-') || false;
};
```

## Testing

### Test Demo Mode
1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:5173`
3. Login with `demo/demo`
4. Verify: Console shows "✅ Demo mode: Logged in as demo"
5. Browse programs - should see 8 mock programs

### Test Real API Mode
1. Ensure `.env` has correct API URL
2. Login with real credentials
3. Verify: Console shows "✅ Logged in as {username}"
4. Check Network tab - API requests go to AWS endpoint
5. Check Authorization headers include JWT token

### Debug Tips

**Enable Console Logging:**
```typescript
// In api.service.ts, add to request interceptor:
console.log('API Request:', config.url, config.headers);
```

**Check Token:**
```javascript
// In browser console:
localStorage.getItem('vls_auth_token')
```

**Check User Info:**
```javascript
// In browser console:
JSON.parse(localStorage.getItem('vls_auth_user'))
```

## Migration from Demo to Production

When deploying to production:

1. **Remove demo mode detection** (optional):
   ```typescript
   // In auth.service.ts, remove:
   if (credentials.username === 'demo' && credentials.password === 'demo') {
     // ... demo user creation
   }
   ```

2. **Set production API URL:**
   ```bash
   VITE_API_BASE_URL=https://your-production-api.com/api
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Deploy `dist-aws/` directory**

## Common Issues

### CORS Errors
If you see CORS errors when calling the API:
- Verify AWS API Gateway CORS configuration
- Check that credentials are being sent correctly
- Ensure API Gateway allows Authorization header

### 401 Unauthorized
- Token may be expired - clear localStorage and login again
- Token format incorrect - check Authorization header format
- Backend authentication may have changed

### Demo Mode Not Working
- Ensure you're using exactly "demo/demo" (case-sensitive)
- Check console for error messages
- Verify `auth.service.ts` has demo mode logic

### API Calls Failing
- Check Network tab for actual error response
- Verify API base URL is correct
- Ensure AWS API Gateway is accessible
- Check that token is being attached to requests

## Future Enhancements

- [ ] JWT token includes full rights/permissions
- [ ] Refresh token support
- [ ] Role-to-rights mapping service
- [ ] SSO integration (LDAP/OAuth)
- [ ] Token expiration warning
- [ ] Automatic token refresh

## Support

For API-related issues:
- Check AWS API Gateway logs
- Review OpenAPI spec: `vls-api-service/openapi.json`
- Contact backend team for API changes

For UI-related issues:
- Check browser console for errors
- Enable debug mode: `VITE_DEBUG=true`
- Review component state in React DevTools
