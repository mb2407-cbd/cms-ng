# Grid Guide View (Channels)

## Objective
Provide a first implementation of an EPG-style grid guide directly within the `Channels` screen so users can:
- switch between current list view and guide view
- visually inspect schedules across multiple channels for a selected date
- select multiple channels in guide view as a precursor to bulk publish workflows

## Information Architecture Decision
For initial rollout, `Channels` remains a single top-level menu item with two internal views:
- `List` (existing channel management table)
- `Guide` (new grid view)

This keeps filters and context in one screen and avoids adding another top-level navigation item during MVP.

## MVP Scope Implemented
- Added `List | Guide` view switcher in Channels header.
- Added `Guide` layout with:
  - platform/search filters reused from existing sidebar
  - date picker
  - window controls (`start hour`, `hours visible`)
  - horizontally + vertically scrollable timeline grid
  - sticky channel column and sticky time header
- Added per-channel row selection checkboxes in guide view.
- Added placeholder action button: `Publish Selected` (non-destructive; informs that full publish flow is next).
- Added schedule loading for guide rows from existing schedule APIs.

## Data Loading Approach
- Source channel rows from the already-loaded channels list (current filtered/paged result set).
- For schedule-capable channels, request schedule for selected date in `GMT` using:
  - `getScheduleVersions(channelId, date, 'GMT')`
  - fallback to `getScheduleVersionById(versionId)` when version listing response does not include events.
- Added in-memory per-channel/day cache in guide mode to reduce repeat fetches while changing view controls.

## UX Notes
- Event blocks are clipped to current visible time window.
- Empty rows show a subtle "No events in window" message.
- Loading and row-level error states are visible in the grid.
- Guide view selection is independent from list row actions.

## Non-MVP / Next Steps
1. Wire `Publish Selected` to multi-channel, multi-day publish API flow.
2. Add draft vs published toggle and readiness validation badges.
3. Add virtualization for larger channel counts and longer windows.
4. Persist guide-specific preferences (window size, start hour, date) per user.
5. Add preflight modal for publish safety (conflicts, missing schedules, lock state).

## Git Flow
- Branch naming for feature work follows prefix: `codex/`.
- This feature branch: `codex/feature-grid-guide-basic`.
- Intended merge target after review: `develop`.
