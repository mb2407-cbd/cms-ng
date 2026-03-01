# Recent Enhancements Summary

This file summarizes changes implemented in this workspace session for future reference.

## Schedule Screen (`src/pages/schedules/SchedulePage.tsx`)

### Bulk actions and Bulk Copy
- Added bulk action options when events are selected:
  - `Bulk Copy`
  - `Move` (placeholder/info modal)
  - `Remove`
- Added `BulkCopyModal` and wired submit to existing bulk-copy backend:
  - `POST /v2/schedules/bulkCopy?timeZone=<selected_timezone>`
- Added bulk-copy validation:
  - required channels
  - required dates
  - start/end date ordering
  - copies in range `1..30`
- Default values come from selected events (earliest start / latest end in selected timezone).

### Navigation behavior
- Added day-shift controls and then finalized icon behavior:
  - `<<` = previous page/window (`numDays`)
  - `<` = previous day
  - `Today`
  - `>` = next day
  - `>>` = next page/window (`numDays`)
- Fixed left-to-right ordering to keep previous page before previous day.
- Persisted selected layout (`3D/5D/7D`) in localStorage so it is restored on reload.
- Optimized one-day navigation (`<` / `>`): the screen now shifts existing columns and loads only the newly exposed day instead of reloading the full visible range.
- Added per-day schedule cache keyed by channel/timezone/date so already visible days are reused from memory and only missing days are fetched.
- Added lightweight slide animation on one-day navigation for a smoother left/right movement feel.

### Event interactions
- Single click on event toggles selection.
- Double click opens `Edit Schedule Event` dialog.
- Program ID and info icon open/collapse a `Program info` popup in the lane.
- Program info popup uses tooltip text `Program info`.
- Removed day-lane width expansion behavior that conflicted with Program info interaction.
- Program info popup now floats as overlay (no event bubble resize/contract while open).
- Program info popup vertical offset was adjusted so time/duration/info row remains visible.
- Fixed time gutter top label (`00:00`) clipping.
- Selection persistence fix:
  - Selected events are no longer cleared when schedule range reloads during scroll/day navigation.
  - Added selected-event cache so `Bulk Copy` can include selected items even when they are off-screen/not currently loaded.

## Channels Screen (`src/pages/channels/ChannelsPage.tsx`)

### Grid Guide MVP
- Added a `List | Guide` view switcher in Channels header.
- Added first-pass Guide view with:
  - date selector
  - day-range selector (`3D`, `5D`, `7D`) starting from selected date
  - start-hour control with fixed 24-hour window per day
  - multi-channel row selection
  - horizontal time-grid rendering of schedule events
  - schedule data loading via existing schedule APIs
- Added Guide channel-page navigation controls (`Prev Channels` / `Next Channels`) to page through channel sets.
- Added placeholder `Publish Selected` action (full bulk publish wiring is next step).

## Program Detail Screen

### Runtime display in minutes
- File: `src/pages/programs/tabs/ProgramBasicInfoTab.tsx`
- Runtime field now shows and accepts minutes in UI.
- Runtime is still mapped to seconds on save (`minutes * 60`) for backend compatibility.

### Episode API fallback fix
- File: `src/pages/programs/tabs/ProgramEpisodesTab.tsx`
- Removed fallback call to `/programs/episodes/{seriesId}`.
- Episodes tab now only calls canonical endpoint:
  - `GET /programs/{seriesId}/episodes`
- Empty response is treated as valid "No Episodes Found" state (no second API call).

## Branding Changes (CMS)
- Top nav brand changed from `VLS` to `CMS`:
  - logo badge letter `V` -> `C`
  - text `VLS` -> `CMS`
  - file: `src/components/layout/TopNav.tsx`
- Browser title and favicon updated:
  - title: `CMS`
  - favicon: `/cms.svg`
  - file: `index.html`
- Added icon asset:
  - `public/cms.svg`
