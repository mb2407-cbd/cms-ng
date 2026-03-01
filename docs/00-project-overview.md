# VLS UI Modern - Project Overview

## Project Description

VLS UI Modern is a comprehensive content management system (CMS) for managing video licensing and distribution across multiple platforms (OTT and DTH). The application enables users to manage programs, channels, schedules, assets, and perform advanced workflows like program mapping and publishing.

## Technology Stack

### Frontend
- **React 19** - UI framework with modern hooks and concurrent features
- **React Router v6** - Client-side routing
- **TypeScript 5.9** - Type-safe JavaScript
- **Vite 7** - Fast build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Query (@tanstack/react-query v5)** - Server state management
- **Axios** - HTTP client for API communication
- **Lucide React** - Icon library
- **React Markdown** - Markdown rendering for AI chat

### Development
- **ESLint 9** - Code linting
- **Prettier** - Code formatting (to be configured)
- **Vitest** - Unit testing framework (to be set up)

### Build & Deployment
- CI/CD pipeline via AWS CodeBuild (buildspec.yml to be configured)
- Environment-specific configurations (dev/staging/prod)

## Project Structure

```
vls-ui-modern/
├── docs/                      # Feature documentation (this folder)
├── src/
│   ├── pages/                # Page components by feature
│   │   ├── login/           # Authentication pages
│   │   ├── dashboard/       # Dashboard pages
│   │   ├── programs/        # Program management
│   │   ├── channels/        # Channel management
│   │   ├── schedules/       # Schedule management
│   │   ├── assets/          # Asset management
│   │   ├── workflows/       # Workflow pages (mapping, etc)
│   │   ├── publishing/      # Publishing read-only views
│   │   └── admin/           # Admin panels
│   ├── components/          # Reusable React components
│   │   ├── auth/           # Auth-related components
│   │   ├── layout/         # Layout wrapper components
│   │   ├── common/         # Shared UI components
│   │   ├── programs/       # Program-specific components
│   │   ├── channels/       # Channel-specific components
│   │   ├── schedules/      # Schedule-specific components
│   │   ├── assets/         # Asset-specific components
│   │   └── chat/           # AI chat components
│   ├── services/           # API service layer
│   ├── context/            # React context (auth, app state)
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   ├── constants/          # Application constants
│   ├── utils/              # Utility functions
│   ├── assets/             # Static assets (images, fonts)
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── public/                  # Static files
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
├── README.md               # Project README
└── .gitignore              # Git ignore rules
```

## Running the Project

### Prerequisites
- Node.js 18+ and npm

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```
The app runs on `http://localhost:5173` by default. Vite is configured to proxy API requests to `/api` (see `vite.config.ts`).

### Build for Production
```bash
npm run build
```
Compiles TypeScript and bundles with Vite. Output goes to `dist/`.

### Preview Production Build
```bash
npm run preview
```
Serves the built app locally to test before deployment.

### Linting
```bash
npm run lint
```
Runs ESLint across the codebase.

## Feature Documentation

All features are documented in separate markdown files. Each includes implementation status, API endpoints, data models, and business rules.

| Document | Feature | Status |
|----------|---------|--------|
| [01-environment-infrastructure.md](./01-environment-infrastructure.md) | Setup, build, testing, CI/CD | Mostly Complete |
| [02-authentication-rbac.md](./02-authentication-rbac.md) | Login, auth, role-based access | In Progress |
| [03-program-management.md](./03-program-management.md) | Programs, versioning, images, metadata | In Progress |
| [04-channel-management.md](./04-channel-management.md) | Channels, DRM, CDN, dayparts | Not Started |
| [05-schedule-management.md](./05-schedule-management.md) | Scheduling, events, timeline | Not Started |
| [06-asset-management.md](./06-asset-management.md) | Asset search, reports, statistics | Not Started |
| [07-program-mapping.md](./07-program-mapping.md) | Program mapping workflow | Not Started |
| [08-publishing-readonly.md](./08-publishing-readonly.md) | Published content views | Not Started |
| [09-dashboard-ai-chat.md](./09-dashboard-ai-chat.md) | Dashboard, stats, AI integration | Partially Complete |
| [10-design-system.md](./10-design-system.md) | Design system, components, accessibility | In Progress |

## Architecture Decisions

### 1. State Management Strategy
- **Server State**: React Query handles all API data fetching, caching, and synchronization
- **Auth State**: Dedicated AuthContext for JWT tokens, user info, and auth methods
- **App State**: AppContext for global UI state (theme, notifications, etc.)
- **Component State**: useState for local UI state (form inputs, toggles, etc.)

### 2. API Communication
- Axios client with centralized configuration (`services/api.service.ts`)
- Request interceptors automatically attach JWT Bearer token
- Response interceptors handle 401 errors and redirect to login
- All API calls wrapped in service functions for consistency

### 3. Authentication & Authorization
- JWT tokens stored in localStorage
- AuthContext provides login/logout/validate methods
- ProtectedRoute component wraps routes requiring authentication
- RBAC enforced via rights-based visibility of UI elements (to be fully implemented)

### 4. Component Architecture
- Page components handle routing and layout
- Container components manage data fetching with React Query
- Presentational components receive data as props
- Hooks abstract complex logic for reusability

### 5. Styling Approach
- Tailwind CSS for utility-first styling
- CSS variables for theming (dark mode support)
- Component-scoped styles via className composition
- Responsive design with Tailwind breakpoints

### 6. Type Safety
- TypeScript for all source code
- Type definitions in `types/` directory organized by domain
- Strict mode enabled in tsconfig.json
- Avoid `any` types; use proper interfaces and unions

### 7. API Versioning
- Base URL: `/api` (proxied in dev, direct in prod)
- V1 API: Traditional endpoint structure
- V2 API: Improved timezone handling for schedules (in progress)
- Version negotiation through headers or URL patterns

### 8. Testing Strategy
- Vitest for unit tests (to be configured)
- React Query provides test utilities for async testing
- Component testing with React Testing Library patterns
- E2E testing scope (TBD based on CI/CD setup)

### 9. Development Workflow
- Vite dev server with hot module replacement (HMR)
- TypeScript compilation in watch mode
- API proxy through Vite for development
- Environment variables for dev/staging/prod

### 10. Code Organization
- Separation of concerns: pages > containers > components > hooks > services
- Co-location of related types and constants
- Barrel exports (index.ts) for clean imports
- Service layer abstracts API implementation details

## Key Files to Understand

### Authentication
- `src/context/AuthContext.tsx` - Auth state and methods
- `src/services/auth.service.ts` - Login/logout logic
- `src/components/auth/ProtectedRoute.tsx` - Protected routes

### API Communication
- `src/services/api.service.ts` - Axios client configuration
- `src/services/program.service.ts` - Program API calls
- `src/services/channel.service.ts` - Channel API calls
- `src/services/schedule.service.ts` - Schedule API calls

### Type Definitions
- `src/types/program.types.ts` - Program, Image, Rating, etc.
- `src/types/channel.types.ts` - ServiceChannel, Daypart, etc.
- `src/types/schedule.types.ts` - Schedule, Event, etc.

### Constants & Configuration
- `src/constants/app.constants.ts` - Program types, ratings, dimensions, limits

### Layout & Navigation
- `src/App.tsx` - Route definitions
- `src/components/layout/AppLayout.tsx` - Main layout wrapper
- `src/components/layout/TopNav.tsx` - Navigation bar

## Common Development Tasks

### Adding a New Page
1. Create file in `src/pages/<feature>/`
2. Add Route to `src/App.tsx`
3. Add link in TopNav or other navigation
4. Use useQuery for data fetching with React Query
5. Follow component composition patterns

### Adding an API Call
1. Add method to service file in `src/services/`
2. Define response type in `src/types/`
3. Use useQuery/useMutation in component
4. Handle loading/error states with React Query

### Updating Data Models
1. Modify type in `src/types/`
2. Update validation in `src/constants/app.constants.ts`
3. Update API service if needed
4. Update component props and usage

### Testing
1. Create `.test.ts` or `.test.tsx` next to component
2. Use Vitest + React Testing Library
3. Mock API calls with React Query test utilities
4. Test user interactions and state changes

## API Base Configuration

The API is proxied through Vite in development mode:

**Development**: `http://localhost:5173` → proxied to backend at `http://localhost:8080` (or configured proxy target)

**Production**: Direct API calls to `https://api.example.com`

Configure proxy target in `vite.config.ts` under the `server.proxy` section.

## Environment Setup

Create `.env` file in project root:
```
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_NAME=VLS UI Modern
VITE_LOG_LEVEL=debug
```

Current env setup is manual. See [01-environment-infrastructure.md](./01-environment-infrastructure.md) for task to implement automated environment variables for dev/staging/prod.

## Next Steps

1. Complete environment infrastructure setup (ESLint/Prettier/Vitest)
2. Implement session timeout and token refresh
3. Build out program detail/edit form (largest feature)
4. Implement channel management CRUD
5. Build schedule timeline viewer
6. Integrate with backend AI agent for chat features
7. Add comprehensive error handling and toast notifications
8. Accessibility audit and responsive design testing
9. Set up CI/CD pipeline with CodeBuild

## Support & Questions

Refer to the feature-specific documentation files for detailed implementation guidance. Each feature doc includes:
- Completed tasks with checkboxes
- Pending tasks with detailed requirements
- API endpoints and data models
- Business rules and validation logic
- Component structure recommendations
