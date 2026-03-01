# Series Expansion UI - Design Proposal

## Current State
The Programs list shows Movies and Series, but not individual Episodes. Episodes are filtered out by default.

## Problem
When users see a Series in the list, they need a way to view and access its Episodes without leaving the Programs page.

## Proposed Solution: Inline Expandable Rows

### UI Pattern
**Expandable rows with chevron indicator** - Common pattern seen in file explorers, task lists, and data tables.

### Visual Design

```
┌─────────────────────────────────────────────────────────────────┐
│ Image | Type   | Title                  | ID    | Platform | ... │
├─────────────────────────────────────────────────────────────────┤
│ [img] | Movie  | The Dark Knight        | MV001 | OTT      | ... │
│ [img] | Series | Breaking Bad        ▼  | SH002 | BOTH     | ... │ ← Expandable
│   [i] |   ↳ Ep | Pilot (S1E1)          | EP101 | BOTH     | ... │ ← Episode (indented)
│   [i] |   ↳ Ep | Cat's in the Bag      | EP102 | BOTH     | ... │
│   [i] |   ↳ Ep | ...and the Bag's...   | EP103 | BOTH     | ... │
│ [img] | Movie  | Inception              | MV003 | OTT      | ... │
└─────────────────────────────────────────────────────────────────┘
```

### Interaction Flow

**1. Series Row (Collapsed State)**
- Shows series thumbnail, title, and metadata
- **Chevron icon (▶)** on the left side of the title
- Click **chevron** → Expands to show episodes
- Click **row** → Navigates to series detail page

**2. Series Row (Expanded State)**
- Chevron rotates down (▼)
- Episodes appear as child rows below
- Episodes are visually indented
- Episodes have smaller thumbnails
- Episode format: "Title (S{season}E{episode})"

**3. Episode Rows**
- Slightly indented from left
- Smaller thumbnail (or no thumbnail)
- Type badge shows "Ep" or "Episode"
- Episode ID shown
- Click episode row → Navigates to episode detail

### Implementation Requirements

**API Call:**
- Endpoint: `GET /api/v2/programs/series/{seriesId}/episodes`
- Or: `POST /api/v2/programs/search` with filter for seriesId

**State Management:**
```typescript
const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
const [episodeCache, setEpisodeCache] = useState<Record<string, Program[]>>({});
```

**Component Changes:**
1. Add chevron button to series rows
2. Fetch episodes when series is expanded
3. Render episode rows when series is expanded
4. Cache fetched episodes to avoid re-fetching

### Alternative: Load All Episodes Initially
If the API already returns episodes in the search results, we could:
- Keep episodes in memory but don't display by default
- Group episodes by series
- Show/hide episode rows based on expansion state
- No additional API call needed

## Implementation Phases

### Phase 1: Basic Expansion (Recommended MVP)
- Add chevron to series rows
- Fetch and display episodes on expand
- Simple indented row layout
- Cache episodes in component state

### Phase 2: Enhanced UX
- Lazy loading (load only visible episodes)
- Episode count badge on series row (e.g., "42 episodes")
- Pagination for series with many episodes
- Season grouping (expand by season)

### Phase 3: Advanced Features
- Search/filter episodes within expanded series
- Bulk operations on episodes
- Episode thumbnails from S3
- Episode metadata preview on hover

## Technical Considerations

**Performance:**
- Fetching 20+ episodes per series could be slow
- Cache aggressively to avoid redundant API calls
- Consider virtualization for series with 100+ episodes

**API Schema:**
- Episode response should match the same transform as programs
- Need to confirm episode API endpoint structure

**State Management:**
- Use React Query for episode fetching and caching
- Invalidate episode cache when series is updated

## Product Requirements (Confirmed)

1. **Interaction Model**: Clicking the series row expands it inline to show episodes. Does NOT navigate to detail page.
2. **Episode Count**: YES - Show total episode count in the series row (e.g., "Breaking Bad (62 episodes)")
3. **Episodes to Load**: ~10 relevant episodes per expansion. API determines relevance.
4. **Episode Sorting**: Episodes sorted in reverse order by season/original air date (newest first)
5. **State Persistence**: NO - Expanded state does NOT persist when navigating back. User can re-expand as needed.

## Pagination Strategy

**Current Concern**: Loading too many programs with "Load More" button could cause performance issues.

**Recommendation**: Implement **true pagination** instead of infinite scroll:
- Show 20 programs per page (current default)
- Add pagination controls at bottom: `< Previous | Page 1 of 15 | Next >`
- Allow jumping to specific pages
- Show total count: "Showing 1-20 of 287 programs"

**Benefits:**
- Users can navigate to specific pages
- More predictable scrolling behavior
- Better for CMS workflows (finding specific content)
- Prevents DOM bloat from loading hundreds of rows
- Standard pattern for admin/management interfaces

**Alternative**: Keep "Load More" but add a "Reset" button to clear and start from page 1.

## Implementation Approach

**MVP Scope:**
1. Add chevron icon to series rows
2. Show episode count next to series title: `Breaking Bad (62 episodes)`
3. On chevron click → Fetch ~10 relevant episodes from API
4. Display episodes as indented child rows
5. Episodes sorted by season/air date (newest first)
6. Cache episodes in component state to avoid refetch
7. Replace "Load More" with true pagination controls

**API Integration:**
- Endpoint: `GET /api/v2/programs/series/{seriesId}/episodes?limit=10`
- Transform episode response using same `transformApiProgram()` function
- Display episode format: "Pilot (S1E1)" or "Title (Season 1, Episode 1)"

**Why inline expansion?**
- Keeps user in context (no navigation away)
- Familiar pattern (file explorer, task list)
- Progressive disclosure (show detail only when needed)
- Works well for both desktop and tablet
- Reduces cognitive load - user stays on same page
