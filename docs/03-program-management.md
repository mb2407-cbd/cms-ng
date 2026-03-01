# Program Management

## Overview

Program Management is the largest and most complex feature. It handles viewing, editing, versioning, and publishing of video programs (movies, series, episodes, sports content) across multiple platforms (OTT and DTH). Programs contain metadata in multiple languages, ratings, images, cast/crew info, and more.

---

## Completed Tasks

### [x] Programs Listing Page with Search, Filters & Caching

**Status**: Complete
**File**: `src/pages/programs/ProgramsPage.tsx`

**Features**:
- Sidebar layout: collapsible left panel (280px) with search + filters + AI assistant placeholder
- Compact table list with columns: Image, Type, Title, Program ID, Platform, Year, Status, Actions
- Search bar with 500ms debounce
- Program type filter dropdown — uses 2-letter API codes (`MV`, `SH`, `SV`, `SP`, `EP`)
- Platform filter dropdown (OTT / DTH) — applied client-side (API only accepts type codes)
- Default filter: `['MV', 'SH', 'SV', 'SP']` — shows all main types, excludes raw episodes
- "Clear all filters" button appears when filters are active
- Pagination: 20 results per page, previous/next controls, result count display
- "New Program" button in header (navigates to `/programs/new`)
- Loading spinner and empty state handling
- Dark mode support

**Episode Expansion (in-row)**:
- Series (`SH`) and Sport (`SP`) rows have a chevron expand button
- On expand: fetches up to 10 episodes via `GET /programs/{id}/episodes`
- Episode sub-rows show: S{n}E{n} badge, type badge, title, program ID, air date, release year, publish status
- Episode rows are clickable and navigate to episode detail
- Spinner shown on expand button while loading

**Module-Level Cache (Back-Navigation)**:
```typescript
let cachedSearchState: {
  query: string; typeFilter: string; platformFilter: string;
  programs: Program[]; page: number; totalPages: number; totalResults: number;
} | null = null;
```
- Cache is populated on every successful search
- On component mount, state is initialized from cache if present
- `initialLoadDone` ref skips the initial API call when cache exists
- Result: navigating back from a detail page restores the previous listing instantly

**Key Fix — API Filter Codes**:
- Filter dropdown values MUST be 2-letter codes: `'MV'`, `'SH'`, `'SV'`, `'SP'`, `'EP'`
- Long names like `'MOVIE'`, `'SERIES'` do NOT work with the search API
- Platform values (`'ott'`, `'dth'`) must NOT be included in the `filters` array; they are applied client-side

---

### [x] Program Detail/Edit Page

**Status**: Complete
**File**: `src/pages/programs/ProgramDetailPage.tsx`

**Layout**:
- Opens as a full-screen modal overlay (fixed z-50, 4px margin inset, rounded shadow)
- Header with hero background image (18% opacity / 14% dark), gradient overlay, thumbnail
- Tab bar: Details | Episodes (series only) | Images | Cast & Crew | Metadata
- Main content area (flex-1 overflow-auto)
- Version History Sidebar (width: 224px, always visible)

**Header**:
- Background image blurred behind header (opacity 0.18 light / 0.14 dark — increased from 0.08)
- Small 56×56 thumbnail at left
- "Back to Series" breadcrumb link for episode programs (ChevronLeft + series ID)
- Program title (English preferred), type badge, Published badge, Locked badge, version, base ID
- Action buttons: Save, Publish, Lock/Unlock, Close (X)
- "Unsaved" warning indicator (AlertCircle + amber text)

**Program ID Display**:
- Always shows base ID (14 chars, e.g. `SH010064900000`) — never the versioned ID
- Computed via `getBaseId()`: strips version suffix if `id.length > 14 && /^[A-Z]{2}/.test(id)`

**Episode / Series Detection**:
```typescript
const isSeries = program?.programType === 'SH' || program?.programType === 'SP'
  || pid.startsWith('SH') || pid.startsWith('SP');

const isEpisode = program?.programType === 'EP' || program?.programType === 'SE'
  || pid.startsWith('EP');

const parentSeriesId = program?.seriesId || program?.parentProgramId || '';
```

**Permission-Gated Actions** (via `useAuth().hasRight()`):
- `program.write` → enables Save and field editing
- `program.publish` → shows Publish button
- `program.lock` → shows Lock/Unlock toggle

**State Management**:
- Reset effect on `id` param change: clears `editedProgram`, `hasUnsavedChanges`, version pages, hero image, active tab
- Init effect compares IDs to avoid overwriting when navigating between programs:
```typescript
useEffect(() => {
  if (program) {
    const currentEditId = editedProgram?.id || editedProgram?._id;
    const newProgramId = program.id || program._id;
    if (!currentEditId || currentEditId !== newProgramId) {
      setEditedProgram(program);
    }
  }
}, [program]);
```

**Data Fetching Flow** (React Query):
1. `getProgramVersions(id)` → `GET /programs/{id}/versions` → returns `{ response: { masterEntity: [], gracenote: [] } }`
2. Auto-select published version (`versions.find(v => v.published)`)
3. `getProgramByVersion(versionId, 'masterentity')` → loads full program detail
4. `getProgramImages(baseId)` → hero image fallback if not in program.pictures

**Mutations**:
- `updateProgram(id, editedProgram)` → `PUT /programs/{id}`
- `updateContentLock(id, { contentLock })` → `PATCH /programs/{id}/lock`

---

### [x] Version History Sidebar

**Status**: Complete (part of ProgramDetailPage)

**Master Entity Versions**:
- Sorted: published first, then newest first by version number
- Paginated: 10 per page with chevron prev/next + page indicator
- Each bubble: version number (`v{N}`), `PUB` badge (green), Lock icon, updated date
- Click to switch to that version (loads it via React Query)

**Gracenote / TMS Versions**:
- Paginated: 10 per page
- Each entry shows: `TMS` badge (blue), TMS ID (truncated if > 16 chars), version label, language, updated date
- TMS ID extracted from `externalRefs` (where `refName === 'tmsId'`), fallback to `version.tmsId` or `version.id`
- Version label: `v{version}` or parsed from last 3 digits of ID suffix

---

### [x] Tab: Details (Basic Info)

**Status**: Complete
**File**: `src/pages/programs/tabs/ProgramBasicInfoTab.tsx`

**Fields (read-only if `!canEdit`)**:
- Original Title (max 120 chars)
- English / Spanish / Portuguese Titles (max 120 chars each, with character counter)
- English / Spanish / Portuguese Short Titles (max 100 chars each)
- English / Spanish / Portuguese Episode Titles (max 150 chars, shown for EP/SE types)
- English / Spanish / Portuguese Descriptions (max 500 chars, textarea)
- English / Spanish / Portuguese Short Descriptions (max 250 chars, textarea)
- Original Audio Language (dropdown)
- Release Year
- Original Air Date
- Game Date / Game Time (shown for SP/SE sport types)
- Ratings (MPAA, TV-PG, DJCTQ/Brazil) — dropdown selects per rating system
- Genres (multi-value display)
- Content Lock toggle

All field limits sourced from `app.constants.ts` (`PROGRAM_VALIDATION_MAPPING`).

---

### [x] Tab: Episodes (Series/Sport programs only)

**Status**: Complete
**File**: `src/pages/programs/tabs/ProgramEpisodesTab.tsx`

**Shown only when `isSeries === true`** (SH or SP type, or ID starts with SH/SP).

**Episode Fetching**:
- Base program ID extracted: uses `program.programId` first, then strips version suffix from `program.id`
- Primary: `GET /programs/{seriesId}/episodes` (all episodes, correct endpoint)
- Fallback: `GET /programs/episodes/{id}` (per-season endpoint) if primary fails or returns empty
- Auto-expands first season on load

**Layout**:
- Summary bar: "N seasons | N episodes", Expand All / Collapse All buttons
- Season accordions with header showing: season number, year badge, episode count, premiere/finale dates, season title
- Episode table per season: Ep #, Title, Air Date, Program ID, Status (Pub/Draft)
- Episode rows are clickable → navigate to `/programs/{episodeId}`
- Empty season message if season metadata exists but no episodes fetched

**Service Functions Used**:
```typescript
getAllEpisodesOfSeries(seriesId)  // GET /programs/{seriesId}/episodes
getEpisodes(seriesId)              // GET /programs/episodes/{seriesId} (fallback)
```

---

### [x] Tab: Images

**Status**: Complete
**File**: `src/pages/programs/tabs/ProgramImagesTab.tsx`

**Features**:
- Images fetched from program.images or via `GET /programs/{id}/images`
- Gallery grouped by ratio: 16:9 (wide) and 2:3 (portrait)
- Shows image metadata: dimensions, upload date, status
- Published image indicator
- Upload support (file input)
- Image preview on click

---

### [x] Tab: Cast & Crew

**Status**: Complete
**File**: `src/pages/programs/tabs/ProgramCastCrewTab.tsx`

**Features**:
- Displays credits array from program data
- Grouped by credit type (Actor, Director, Producer, etc.)
- Shows person name, character name, order
- Add / Remove crew members (when `!readOnly`)

---

### [x] Tab: Metadata

**Status**: Complete
**File**: `src/pages/programs/tabs/ProgramMetadataTab.tsx`

**Fields displayed**:
- Program ID (base 14-char ID only, never versioned)
- Source / Provider
- External References (Gracenote TMS ID, Root ID, VLS IDs, etc.)
- Provider Info
- Keywords
- Releases (country, date, type, medium)
- Awards
- Advisory information
- Production companies
- Countries of origin

---

### [x] Program Service API Integration

**Status**: Complete
**File**: `src/services/program.service.ts`

**Key Functions**:

| Function | HTTP | Endpoint | Description |
|----------|------|----------|-------------|
| `searchPrograms(req, page, size)` | POST | `/v2/programs/search` | Search with type filter codes |
| `getProgramByVersion(versionId, source)` | GET | `/programs/{versionId}?source={source}` | Full program detail |
| `getProgramVersions(id)` | GET | `/programs/{id}/versions` | All versions (masterEntity + gracenote) |
| `updateProgram(id, data)` | PUT | `/programs/{id}` | Save program changes |
| `updateContentLock(id, data)` | PATCH | `/programs/{id}/lock` | Toggle content lock |
| `getProgramImages(id)` | GET | `/programs/{id}/images` | Program images |
| `uploadImage(id, file, ratio)` | POST | `/programs/{id}/images` | Upload program image |
| `getAllEpisodesOfSeries(seriesId)` | GET | `/programs/{seriesId}/episodes` | All episodes (primary) |
| `getEpisodes(id)` | GET | `/programs/episodes/{id}` | Per-season episodes (fallback) |

**Search Request Format**:
```json
{
  "searchString": "game of thrones",
  "filters": ["MV", "SH", "SV", "SP"]
}
```
> Note: `filters` only accepts 2-letter program type codes. Platform filtering is done client-side.

**Version Response Format**:
```json
{
  "response": {
    "masterEntity": [
      { "id": "SH010064900000001", "version": 1, "published": true, "updatedDate": "...", "contentLock": false }
    ],
    "gracenote": [
      { "id": "...", "externalRefs": [{ "refName": "tmsId", "id": "SH12345678" }], "language": "es", "updatedDate": "..." }
    ]
  }
}
```

---

### [x] Type System & Constants

**File**: `src/types/program.types.ts` / `src/constants/app.constants.ts`

**Program Type Codes** (actual API values):
```typescript
PROGRAM_TYPES = {
  MOVIE: 'MOVIE', SERIES: 'SERIES', SHOW: 'SHOW', SPORT: 'SPORT', EPISODE: 'EPISODE',
  // Legacy 2-letter codes used in search API:
  MV: 'MV', SH: 'SH', SV: 'SV', SP: 'SP', EP: 'EP', SE: 'SE',
}
```

**ID Conventions**:
- Movie IDs start with `MV`
- Series/Show/Sport IDs start with `SH` or `SP`
- Episode IDs start with `EP`
- Base ID = 14 characters (e.g. `SH010064900000`)
- Versioned ID = base + 3-digit suffix (e.g. `SH010064900000001`)
- All UI displays show base ID only; API calls for versioned data use full ID

**Character Limits**:
```
MAX_TITLE_SIZE = 120
MAX_EPISODE_TITLE_SIZE = 150
MAX_SHORT_TITLE_SIZE = 100
MAX_DESCRIPTION_SIZE = 500
MAX_SHORT_DESCRIPTION_SIZE = 250
```

---

## Pending Tasks

### [ ] Implement Program Creation Logic

**Status**: Not Started
**Priority**: High

**Objective**: Build the form and API integration to create new programs from scratch.

**Route**: `/programs/new` (already registered in router, no implementation yet)

**Proposed Flow**:
1. **Type Selection** — choose program type (MV, SH, SV, SP, EP, SE) with description cards
2. **Basic Info** — enter titles in 3 languages (EN/ES/PT), original audio language
3. **Market & Parent** — select market/region; if EP/SE, select parent series via search
4. **Required Fields** — ratings (MPAA, TVPG, DJCTQ), at least 1 genre, release year
5. **Review & Create** — confirm all fields, call `POST /programs`, redirect to edit page

**Validation**:
- Titles required in all 3 languages
- At least 1 genre
- Valid date formats (YYYY-MM-DD)
- For episodes: parent series must be set

**File to create**: `src/pages/programs/CreateProgramPage.tsx`

---

### [ ] Retest Program Management with User Permissions

**Status**: Not Started
**Priority**: High

**Objective**: Verify RBAC gates work correctly end-to-end for all key actions.

**Scenarios to test**:
- `program.write` — can edit fields; cannot edit when missing
- `program.publish` — Publish button visible and functional; hidden when missing
- `program.lock` — Lock/Unlock button visible and functional; hidden when missing
- `program.imageAdd` — Upload button visible in Images tab; hidden when missing
- `program.publishImage` — Publish image action available; hidden when missing
- **Create permission** — "New Program" button and creation flow gated appropriately
- **Read-only mode** — all fields disabled, no action buttons when user has only read rights
- **Content lock** — locked program prevents editing even for users with `program.write`

**Files involved**:
- `src/context/AuthContext.tsx` — `hasRight()` implementation
- `ProgramDetailPage.tsx` — `canEdit`, `canPublish`, `canLock` permission checks
- `ProgramImagesTab.tsx` — upload/publish image permission checks
- `ProgramBasicInfoTab.tsx` — readOnly prop propagation

---

### [ ] Implement Audit Trail for Program Changes

**Status**: Not Started
**Priority**: Medium

**Objective**: Track and display a history of changes made to a program by users.

**Proposed Implementation**:
- New tab "History" or "Audit Trail" in `ProgramDetailPage.tsx`
- API endpoint: `GET /programs/{id}/audit` or `GET /programs/{id}/history`
- Display: table of who changed what and when
  - Timestamp
  - User (name/email)
  - Action (field updated, published, locked, image uploaded, etc.)
  - Before/after values for key fields

**File to create**: `src/pages/programs/tabs/ProgramAuditTab.tsx`

---

### [ ] Add Missing Program Fields

**Status**: Not Started
**Priority**: Medium

**Objective**: Identify and add program fields visible in the old Angular UI or returned by the API that are not yet displayed or editable in the new UI.

**Fields likely missing** (to be confirmed against API responses and old Angular UI):
- `dthInfo` — DTH-specific settings (useEpisodeTitle, publishParent, concatSeriesTitle)
- `targetPlatform` — OTT vs DTH designation
- `colorization` — Black & white or color indicator
- `madeForTV` — boolean flag
- `originalNetwork` — broadcasting network
- `runTime` — runtime in minutes
- `countryOfOrigin` — country of production
- `advisories` — content advisories (Violence, Language, etc.)
- `sportType` / `league` / `venue` — sports metadata beyond game date/time

**Action**: Review API response for a known program and compare against what's shown in `ProgramBasicInfoTab.tsx` and `ProgramMetadataTab.tsx`. Add missing fields.

---

### [ ] Duplicate Detection Before Save

**Status**: Not Started
**Priority**: Low

**Objective**: Warn users when creating a program that appears to already exist.

**Logic**:
- Before saving a new program, check for existing programs with similar titles
- Show modal with potential duplicates
- Let user confirm intent (create new vs. navigate to existing)

**Proposed API**:
```
POST /programs/check-duplicates
{ "title": "Game of Thrones", "releaseYear": 2011, "programType": "SH" }
```

---

## API Endpoints Reference

### Program Operations
```
GET    /programs/{id}                     Get program by versioned ID
GET    /programs/{id}/versions            Get all versions (masterEntity + gracenote)
PUT    /programs/{id}                     Update program metadata
PATCH  /programs/{id}/lock               Toggle content lock
POST   /programs                          Create new program [NOT YET IMPLEMENTED]
POST   /v2/programs/search                Search programs (accepts 2-letter type codes)

GET    /programs/{id}/images              List program images
POST   /programs/{id}/images              Upload image (multipart/form-data)
DELETE /programs/{id}/images/{imgId}      Delete image

GET    /programs/{seriesId}/episodes      Get ALL episodes of a series (preferred)
GET    /programs/episodes/{id}            Get episodes by season (fallback)

GET    /programs/{id}/audit               Audit trail [PROPOSED]
POST   /programs/check-duplicates         Duplicate check [PROPOSED]
```

---

## Bug Fixes Applied

| Bug | Root Cause | Fix |
|-----|------------|-----|
| Search by type not working | Filter values were `'MOVIE'`, `'SERIES'` — API requires `'MV'`, `'SH'` | Changed all filter option values to 2-letter codes |
| DTH programs not searchable | Platform values (`'ott'`, `'dth'`) were sent in `filters[]` — API rejects them | Moved platform filtering to client-side post-processing |
| Episode tab never showed data | Wrong API endpoint used (`/programs/episodes/{id}`) | Added `getAllEpisodesOfSeries()` using correct `GET /programs/{id}/episodes` |
| Episode detail blank on first load | `editedProgram` held stale series data; `!editedProgram` guard blocked init | Reset state on `id` change; compare IDs in init effect instead of null-check |
| Listing reloaded on back navigation | No caching — ProgramsPage always fetched on mount | Added module-level `cachedSearchState`; skip initial fetch if cache exists |
| Background image too subtle | `opacity-[0.08]` too low to see | Increased to `opacity-[0.18]` (dark: 0.14) |
| Program ID shows versioned format | Direct use of `program.id` which includes suffix | Added `getBaseId()` helper; display base 14-char ID everywhere |
| Version sidebar cluttered | Each bubble showed full program ID + lots of metadata | Removed program ID; compact bubble shows only v{N}, PUB badge, date |
| Gracenote versions unreadable | No pagination + no TMS ID display | Added 10/page pagination + `getGnTmsId()` helper extracts from `externalRefs` |

---

## Testing Checklist

### Completed
- [x] Search debounces correctly (500ms)
- [x] Type filter sends correct 2-letter codes to API
- [x] Platform filter applied client-side
- [x] Pagination works with search
- [x] Back navigation restores listing from cache
- [x] Series/Sport rows expand to show up to 10 episodes
- [x] Episode rows in listing navigate to episode detail
- [x] Episode detail shows "Back to Series" breadcrumb
- [x] State resets when navigating between programs
- [x] Episodes tab fetches and groups by season
- [x] Multi-language titles and descriptions editable
- [x] Character limits enforced with counters
- [x] Version sidebar shows published version first
- [x] Gracenote versions display TMS ID
- [x] Content lock badge shown in header
- [x] Permission-gated Save/Publish/Lock buttons

### Pending
- [ ] Create new program flow
- [ ] Publish image from Images tab (permission check)
- [ ] Add/remove cast & crew
- [ ] RBAC tested with different user roles
- [ ] Audit trail tab displays history
- [ ] Missing fields added and verified
- [ ] Duplicate detection modal
