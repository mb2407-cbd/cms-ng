# Asset Management Blueprint (React Modern UI)

## Context

This blueprint defines implementation of **Assets List** and **Asset Detail** in `vls-ui-modern` using:
- Legacy behavior/business logic from Angular (`vls-ui-application`)
- Actual backend contracts from `vls-api-service`
- Updated UX decisions from product direction

This document supersedes generic assumptions in `06-asset-management.md` where they conflict with current backend and legacy parity.

## Key Product Decisions (Confirmed)

1. **Search/filter panel must be on the right side** (not left).
2. **Use pagination** (Prev/Next + page state), **not infinite scroll**.
3. Initial delivery focus: functional parity and workflow consistency with current modern screens (Programs/Channels).

## Scope

### In Scope (Phase 1 + 2)
- Assets list/search page (`/assets`)
- Asset detail view (opened from list; modal-style overlay consistent with Program detail pattern)
- Read-first workflow with mapped metadata and tabs
- API wiring to real endpoints
- Theme consistency (dark-first currently)
- RBAC-ready UI guards

### Out of Scope (Later)
- Full create/edit/delete workflows (unless explicitly enabled later)
- Bulk actions
- New report redesign beyond parity needs

## Target Routes

- `GET /assets` -> Assets workspace (list + right search/filter bar)
- `GET /assets/:assetCompositeId` or modal state route pattern aligned to Program details
  - `assetCompositeId` format: `${assetId}-${dmsId}`

Note: backend detail endpoint requires both `assetId` and `dmsId`.

## Backend Contracts (Source of Truth)

### List/Search
- `POST /api/assets/search?page={page}&size={size}`
- Request body:
```json
{
  "filters": ["MV", "SH", "EP"],
  "additionalFilters": ["Published", "Unpublished"],
  "categories": ["<serviceCategoryId>"],
  "channelIds": ["<channelId>"],
  "searchString": "..."
}
```

### Detail
- `GET /api/assets/asset/{assetId}/{dmsId}`

### Filter sources
- `GET /api/assets/category`
- `GET /api/assets/channel`

### Header metrics
- `GET /api/assets/asset-mapped`

### Supporting (if needed for parity in detail enrichment)
- Program versions/details via existing program endpoints used by modern Program screens.

## RBAC (UI enforcement-ready)

Use rights pattern already adopted in modern app:
- `asset:read`
- `asset:create`
- `asset:update`
- `asset:publish`
- `asset:delete`

Temporary allow-all mode should continue honoring existing `vls_allow_all_rights` behavior for local testing.

## UX Layout Blueprint

## Assets Page
- Main area:
  - Header/title + result count
  - Paginated asset table/list
  - Row click opens Asset Detail
- Right sidebar (fixed inside page content):
  - Search box
  - Program-type filters (MV/SH/EP)
  - Additional filters (Published/Unpublished)
  - Filter mode selector:
    - Service Category
    - Channel
  - Filter value selector based on mode
  - Reset filters action

## Asset Detail
- Modal-style overlay (same interaction model as Program detail)
- Top bar:
  - Asset title/ID context
  - Status badge
  - Close/back action
  - Mapping metrics strip (from `asset-mapped`)
- Body sections/tabs:
  - **Asset Info** (DMS ID, Program Mapper ID, Asset ID, Program ID, Vrio ID, Service Provider, Service Category, channels, display season/episode, availability dates, created/updated)
  - **Program Info** (titles, descriptions, program type, tmsId, season/episode, alternate season/episode, release year, air date, runtime, rating summary, descriptor, genres)
  - **Cast and Crew**
  - **Provider Images**
  - **Program Images**
  - **Asset URL Info** (Widevine / Playready / Fairplay DRM + CDN cards)

## Business Logic Parity Rules

1. Search debounce: 500ms.
2. Keep suppression rule from legacy: skip search call when `searchString.length === 1`.
3. Status badge mapping:
   - `published=true` -> Published
   - `published=false` -> Unpublished
   - missing -> Not Available
4. Program type badge derived from `programId` prefix (`MV`, `SH`, `EP`, etc.).
5. Asset selection key must include both `assetId` and `dmsId`.
6. Detail date formatting should be normalized for consistent display.
7. Program enrichment:
   - Fetch latest program version
   - Build rating string (MPAA/TVPG/DJCTQ)
   - Compute cast/crew grouping
   - Resolve titles/descriptions language presentation
8. URL info extraction by DRM type:
   - Widevine
   - Playready
   - Fairplay

## Pagination Scheme (Replacing Infinite Scroll)

- Request params:
  - `page` starts at `1` (to match existing asset UI behavior)
  - `size` default `20`
- Footer controls:
  - Prev / Next buttons
  - `Page X of Y`
  - `Showing N of totalElements`
- Reset to page 1 on any filter/search change.

## Data/Type Plan (React)

- `AssetListItem`
- `AssetDetail`
- `AssetSearchRequest`
- `AssetSearchResponseEnvelope` (support legacy envelope shape: `response`, `totalElements`, `totalPages`)
- `AssetMappedStats`
- `AssetUrlInfo`

Implement response normalizers to handle envelope differences robustly.

## File Plan

- `src/pages/assets/AssetsPage.tsx`
- `src/pages/assets/AssetDetailPage.tsx`
- `src/services/asset.service.ts`
- `src/types/asset.types.ts`
- `src/components/assets/AssetFiltersSidebar.tsx` (right panel)
- `src/components/assets/AssetListTable.tsx`
- `src/components/assets/tabs/*` (detail tabs)
- `src/App.tsx` route replacement for `/assets`

## Implementation Phases

1. **Phase 1: List foundation**
   - Route + page scaffold
   - Right sidebar filters
   - Search + API integration
   - Pagination + row selection

2. **Phase 2: Detail foundation**
   - Modal detail shell
   - Asset info + program info sections
   - Top status/metrics strip

3. **Phase 3: Detail parity tabs**
   - Cast/Crew
   - Provider/Program images
   - Asset URL Info

4. **Phase 4: Hardening**
   - RBAC gating + temporary allow-all compatibility
   - Empty/loading/error states
   - Visual polish and theme alignment
   - Integration tests for core flows

## Acceptance Criteria

1. User can search/filter assets from right sidebar and get paginated results.
2. Clicking an asset opens details with correct composite ID fetch.
3. Asset and program metadata fields display correctly for selected item.
4. Tabs render parity content with no blocking errors when sections are empty.
5. Pagination, filters, and selection state are stable across interactions.
6. Access-denied and temporary-allow-all logic work as expected.

## Open Questions (To Resolve Before Full Edit Workflows)

1. Confirm whether asset detail remains read-only in MVP or includes selective edits.
2. Confirm final route style for detail (`/assets/:id` vs modal state only) to match desired navigation history behavior.
3. Confirm rights naming contract from backend JWT for assets (exact strings and aliases).
