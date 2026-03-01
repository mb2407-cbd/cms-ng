# Environment & Infrastructure Setup

## Overview

This document tracks the setup and configuration of the development environment, build tools, testing framework, and CI/CD infrastructure for the VLS UI Modern project.

## Completed Tasks

### [x] React + Vite + TypeScript Project Scaffold

**Status**: Complete

- React 19.2.0 installed and configured
- Vite 7.3.1 with React plugin (@vitejs/plugin-react)
- TypeScript 5.9.3 configured with strict mode
- Entry point: `src/main.tsx` → `index.html`
- React Router v6.30.3 ready for SPA routing
- Project created with standard React + Vite + TS template

**Key Files**:
- `vite.config.ts` - Build and dev server configuration
- `tsconfig.json` - TypeScript compiler options (strict: true)
- `tsconfig.app.json` - App-specific TS config
- `index.html` - HTML template with root div

**Dev Server**:
```bash
npm run dev
# Runs on http://localhost:5173 with HMR enabled
```

### [x] Tailwind CSS Integration

**Status**: Complete

- Tailwind CSS 4.1.18 installed
- @tailwindcss/vite 4.1.18 plugin configured
- Vite configured with Tailwind plugin
- CSS imports work with Tailwind directives
- Dark mode support enabled via CSS custom properties
- Responsive breakpoints available (sm, md, lg, xl, 2xl)

**Key Features**:
- Utility-first styling approach
- Dark mode: `dark:` prefix for dark theme styles
- Custom color palette via CSS variables in `src/index.css`
- Animation keyframes defined for smooth transitions
- Properly configured in `vite.config.ts`

**Usage**:
```tsx
<div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
  Content with dark mode support
</div>
```

### [x] Project Directory Structure

**Status**: Complete

Source directory organized by feature/domain:

```
src/
├── pages/                 # Feature pages (routed components)
├── components/           # Reusable React components
├── services/            # API service layer
├── context/             # React context for state
├── types/               # TypeScript type definitions
├── constants/           # Application constants
├── utils/               # Utility functions
├── hooks/               # Custom React hooks
├── assets/              # Static files (images, etc)
├── App.tsx              # Route definitions
└── main.tsx             # Entry point
```

**Naming Conventions**:
- Components: PascalCase (e.g., `LoginPage.tsx`, `UserCard.tsx`)
- Services: camelCase with `.service.ts` suffix (e.g., `auth.service.ts`)
- Types: PascalCase with `.types.ts` suffix (e.g., `program.types.ts`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
- Utils: camelCase with `.utils.ts` suffix (e.g., `string.utils.ts`)

### [x] .gitignore Configuration

**Status**: Complete

Configured `.gitignore` includes:
- `node_modules/` - Dependencies
- `dist/` - Build output
- `.env.local` - Local environment secrets
- `.DS_Store` - macOS files
- `*.log` - Log files

**Current Content** (`/.gitignore`):
```
node_modules/
dist/
.env.local
.DS_Store
```

**Enhancement Needed**: Add more patterns for IDE files, lock files handling, etc.

### [x] Vite Dev Server with API Proxy

**Status**: Complete

Vite configured with proxy for API development:

**File**: `vite.config.ts`
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Backend URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Adjust based on actual backend URL
      },
    },
  },
});
```

**Development Workflow**:
1. Frontend dev server: `http://localhost:5173`
2. API requests to `/api/*` proxied to backend
3. No CORS issues in development
4. Backend can run on separate port (e.g., 8080)

**Configuration Notes**:
- Update `target` URL to match your backend
- `changeOrigin: true` masks origin header
- `rewrite` function modifies request path if needed

### [x] React Router Setup

**Status**: Complete

React Router v6.30.3 configured with route definitions.

**File**: `src/App.tsx`
- Route definitions for all pages
- Nested routes for complex layouts
- Protected routes via ProtectedRoute component
- Route parameters support (e.g., `/programs/:id`)

**Key Routes**:
- `/login` - Login page (public)
- `/dashboard` - Dashboard (protected)
- `/programs` - Programs list and management
- `/channels` - Channel management
- `/schedules` - Schedule management
- `/assets` - Asset management
- `/workflows/*` - Workflow pages
- `/publishing/*` - Publishing views
- `/admin/*` - Admin panels

**Route Guards**:
```tsx
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

### [x] React Query Integration

**Status**: Complete

React Query (@tanstack/react-query v5.90.21) installed and ready.

**Setup**:
- QueryClientProvider wraps app in `src/main.tsx`
- QueryClient configured with default options
- useQuery hook for GET requests (with caching)
- useMutation hook for POST/PUT/DELETE
- useQueryClient hook for manual cache updates

**Usage Example**:
```tsx
// Fetching data
const { data, isLoading, error } = useQuery({
  queryKey: ['programs'],
  queryFn: () => programService.getPrograms(),
});

// Mutation
const { mutate } = useMutation({
  mutationFn: (program) => programService.updateProgram(program),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['programs'] });
  },
});
```

**Benefits**:
- Automatic caching and deduplication
- Background refetching
- Optimistic updates support
- Built-in error handling
- DevTools available for debugging

## Pending Tasks

### [ ] Environment Variables (.env) for Dev/Staging/Prod

**Status**: Not Started

**Objective**: Implement environment-specific configuration for different deployment stages.

**Tasks**:
1. Create `.env` template file listing all required variables
2. Create environment-specific files:
   - `.env.development` - Local development
   - `.env.staging` - Staging environment
   - `.env.production` - Production environment
3. Document environment variables and their purposes
4. Implement env loading in app initialization
5. Add Vite environment variable plugin if needed
6. Add env variable validation on app startup

**Required Variables**:
```
VITE_API_BASE_URL=         # API base URL
VITE_APP_NAME=             # Application name
VITE_LOG_LEVEL=            # Logging level (debug/info/warn/error)
VITE_ENABLE_AI_CHAT=       # Enable/disable AI chat feature
VITE_SESSION_TIMEOUT_MS=   # Session timeout in milliseconds
VITE_MAX_FILE_UPLOAD_SIZE= # Max file upload size in bytes
```

**Implementation Approach**:
- Use Vite's `import.meta.env` for accessing variables
- Prefix all client-side vars with `VITE_`
- Create config loader service for type-safe access
- Add validation to prevent missing required vars
- Document in README how to set env vars

**Reference**:
- Vite env docs: https://vitejs.dev/guide/env-and-testing.html
- Create `src/config/environment.ts` for type-safe env access

**Example Implementation**:
```typescript
// src/config/environment.ts
export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  appName: import.meta.env.VITE_APP_NAME || 'VLS UI',
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
  enableAiChat: import.meta.env.VITE_ENABLE_AI_CHAT === 'true',
  sessionTimeoutMs: parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MS || '1800000'),
};
```

### [ ] ESLint + Prettier Configuration

**Status**: Not Started

**Objective**: Set up code linting and formatting to maintain code quality and consistency.

**Current State**:
- ESLint 9.39.1 installed with base config
- ESLint config file exists (`eslint.config.js`)
- Prettier not yet installed or configured

**Tasks**:
1. Install Prettier: `npm install -D prettier`
2. Create `.prettierrc.json` with code style rules
3. Create `.prettierignore` for files to skip
4. Enhance ESLint config:
   - Add React plugin rules
   - Add React Hooks plugin rules (already installed)
   - Configure TypeScript rules
   - Add import sorting rules
5. Add pre-commit hook (husky) to enforce linting
6. Create npm scripts for linting and formatting

**Configuration Files to Create**:

`.prettierrc.json`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

`.prettierignore`:
```
node_modules/
dist/
build/
.next/
coverage/
package-lock.json
```

**ESLint Enhancement**:
- Update `eslint.config.js` to include React and TypeScript rules
- Configure specific rules for code style consistency
- Add import ordering plugin (eslint-plugin-import)
- Enable React Hooks rules already installed

**Pre-commit Hook Setup** (optional but recommended):
```bash
npm install -D husky lint-staged
npx husky install
```

Configure `.husky/pre-commit`:
```bash
npm run lint
npm run format
```

**npm Scripts to Add**:
```json
{
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

**Benefits**:
- Consistent code style across team
- Catch potential bugs with linting
- Auto-fix many issues
- Enforce best practices
- Easier code reviews

### [ ] Unit Test Framework Setup (Vitest)

**Status**: Not Started

**Objective**: Set up Vitest for unit testing React components and utilities.

**Current State**:
- Vitest not yet installed
- React Testing Library not installed
- No test files created

**Tasks**:
1. Install test dependencies:
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom
   npm install -D jsdom @vitest/ui
   ```

2. Create `vitest.config.ts`:
   ```typescript
   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react';
   import tailwindcss from '@tailwindcss/vite';

   export default defineConfig({
     plugins: [react(), tailwindcss()],
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: './src/test/setup.ts',
       coverage: {
         provider: 'v8',
         reporter: ['text', 'json', 'html'],
       },
     },
   });
   ```

3. Create test setup file (`src/test/setup.ts`):
   - Import @testing-library/jest-dom matchers
   - Mock window.matchMedia for responsive tests
   - Configure global test utilities

4. Create example test files:
   - `src/components/common/LoadingSpinner.test.tsx`
   - `src/utils/string.utils.test.ts`
   - `src/services/auth.service.test.ts`

5. Add npm scripts:
   ```json
   {
     "test": "vitest",
     "test:ui": "vitest --ui",
     "test:coverage": "vitest --coverage"
   }
   ```

**Testing Patterns**:

**Component Testing**:
```tsx
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders loading text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

**Hook Testing** (use react-hooks-testing-library):
```tsx
import { renderHook } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('returns initial auth state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

**Service Testing**:
```tsx
import { vi } from 'vitest';
import { authService } from './auth.service';

describe('authService', () => {
  it('calls login endpoint', async () => {
    const mockRequest = vi.spyOn(api, 'post');
    await authService.login('user@example.com', 'password');
    expect(mockRequest).toHaveBeenCalledWith('/auth/login', expect.any(Object));
  });
});
```

**React Query Testing**:
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { ProgramList } from './ProgramList';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('ProgramList', () => {
  it('displays programs', async () => {
    render(<ProgramList />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/programs/i)).toBeInTheDocument();
    });
  });
});
```

**Coverage Targets**:
- Overall: 70%+
- Critical paths (auth, data fetching): 90%+
- UI components: 60%+

**Reference**:
- Vitest docs: https://vitest.dev
- React Testing Library: https://testing-library.com/react

### [ ] CI/CD Pipeline Configuration (AWS CodeBuild)

**Status**: Not Started

**Objective**: Set up automated building, testing, and deployment via AWS CodeBuild.

**Tasks**:
1. Create `buildspec.yml` in project root for CodeBuild
2. Define build phases:
   - **Pre-build**: Install dependencies, run linting
   - **Build**: Run TypeScript compilation, build app
   - **Post-build**: Run tests, generate coverage reports
3. Configure artifact output (dist folder)
4. Set up environment variables in CodeBuild project
5. Create S3 bucket for build artifacts
6. Configure CloudFront for static hosting
7. Set up deployment pipeline stages (dev → staging → prod)
8. Add build status badges to README

**buildspec.yml Template**:
```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo "Installing dependencies..."
      - npm ci
      - npm run lint

  build:
    commands:
      - echo "Building application..."
      - npm run build
      - npm run test:coverage

  post_build:
    commands:
      - echo "Build completed on `date`"
      - echo "Preparing artifacts..."

artifacts:
  files:
    - '**/*'
  base-directory: dist
  name: BuildArtifact

cache:
  paths:
    - 'node_modules/**/*'
    - '.npm/**/*'

reports:
  coverage:
    files:
      - 'coverage/coverage-final.json'
    file-format: 'CLOVERXML'
```

**Pipeline Stages**:
1. **Source**: GitHub/CodeCommit repo
2. **Build**: CodeBuild (lint, test, compile)
3. **Deploy-Dev**: Deploy to dev S3+CloudFront
4. **Deploy-Staging**: Manual approval required
5. **Deploy-Prod**: Manual approval required

**Environment Variables**:
- `NODE_ENV` - Environment (development/staging/production)
- `VITE_API_BASE_URL` - API endpoint
- `AWS_S3_BUCKET` - S3 bucket for assets
- `CLOUDFRONT_DISTRIBUTION` - CloudFront distribution ID

**Deployment Script** (`scripts/deploy.sh`):
```bash
#!/bin/bash
set -e

ENVIRONMENT=$1
S3_BUCKET="vls-ui-${ENVIRONMENT}"
DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name vls-ui-${ENVIRONMENT} --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' --output text)

echo "Deploying to S3: ${S3_BUCKET}"
aws s3 sync dist/ s3://${S3_BUCKET}/ --delete

echo "Invalidating CloudFront: ${DISTRIBUTION_ID}"
aws cloudfront create-invalidation --distribution-id ${DISTRIBUTION_ID} --paths "/*"

echo "Deployment completed!"
```

**Reference**:
- AWS CodeBuild docs: https://docs.aws.amazon.com/codebuild/
- Buildspec reference: https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html

## Running the Build Pipeline

### Lint Code
```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Format Code
```bash
npm run format
npm run format:check
```

### Run Tests
```bash
npm run test
npm run test:ui     # Interactive UI
npm run test:coverage
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Development Workflow

1. **Local Development**:
   ```bash
   npm install
   npm run dev
   # Code with HMR enabled
   ```

2. **Before Commit**:
   ```bash
   npm run lint:fix
   npm run format
   npm run test
   ```

3. **Push to Repository**:
   - Pre-commit hooks run linting
   - CI/CD pipeline triggered automatically

4. **Code Review**:
   - BuildStatus passed before merge
   - Lint and test must pass

## Troubleshooting

### Vite Dev Server Issues
- Clear `.vite` cache: `rm -rf node_modules/.vite`
- Restart dev server
- Check port 5173 is available

### TypeScript Compilation Errors
- Run `npm run build` to see full errors
- Check `tsconfig.json` settings
- Ensure all types are properly imported

### API Proxy Not Working
- Verify backend is running on configured port
- Check `vite.config.ts` proxy configuration
- Test backend URL directly in browser

### Test Failures
- Ensure mocks are set up correctly
- Check async test handling with async/await
- Verify DOM is in expected state before assertions

## Next Steps

1. Implement environment variables system
2. Configure ESLint + Prettier + pre-commit hooks
3. Set up Vitest with test suite for core utilities
4. Create buildspec.yml and AWS CodeBuild project
5. Set up automated deployments to dev/staging/prod
