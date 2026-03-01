# Bulk Copy And Selection Actions (Schedule Screen)

## Objective
Bring the old Bulk Copy capability into the new schedule UI (`vls-ui-modern`) with a better entry point:
- user selects schedule events directly on timeline
- bulk actions appear next to `Remove`
- `Bulk Copy` opens a configuration dialog and submits to existing backend bulk-copy API

## Implemented UI Behavior
- File: `src/pages/schedules/SchedulePage.tsx`
- When one or more events are selected, action bar now shows:
  - `Bulk Copy`
  - `Move` (placeholder action)
  - `Remove`
- Clicking `Bulk Copy` opens `BulkCopyModal` with:
  - original channel (pre-filled from current schedule channel)
  - destination channel
  - start date
  - end date
  - destination start date
  - number of copies (1-30)
  - published flag
  - overwrite flag
  - timezone context (displayed and used in API call)

## Event-Level Interaction Updates
- Single click on an event toggles event selection.
- Double click on an event opens `Edit Schedule Event` modal.
- Program ID click opens/closes `Program info` popup in-lane (overlay style).
- Program info control uses up/down icon (`ChevronUp` / `ChevronDown`) with tooltip `Program info`.
- Day-column lane-width expand behavior was removed to avoid conflict with Program info behavior.
- Event selection now persists while scrolling/changing visible day window; selected items are no longer cleared during range reload.

## Defaulting Logic
- Selected events are used to compute initial date values:
  - `startDate` = earliest selected event start date (in selected schedule timezone)
  - `endDate` = latest selected event end date (in selected schedule timezone)
  - `destStartDate` = same as start date by default
- Original channel is set to the current channel being edited.
- Bulk copy selection is sourced from a persistent selected-event cache, so off-screen selected events are included.

## API Wiring
- Service updated: `src/services/schedule.service.ts`
- `bulkCopySchedules` now accepts timezone and sends:
  - endpoint: `POST /v2/schedules/bulkCopy`
  - query param: `timeZone=<selected_timezone>`
  - body: `ScheduleBulkCopy` payload compatible with existing backend

## Validation
Client-side validation added before submit:
- original channel required
- destination channel required
- start/end/destination start dates required
- start date must be `<=` end date
- number of copies must be between 1 and 30

## Notes
- Current backend bulk-copy API is date-range based, not event-ID based.
- In this implementation, selected events are used to pre-fill the copy range; submission still executes as range copy (same backend behavior as old UI).
- `Move` is visible in bulk actions and currently shows a “planned” message.
- Program info popup is positioned with extra top offset so the event's time/duration row remains visible.

## Implementation Details (Selection Persistence)
- File: `src/pages/schedules/SchedulePage.tsx`
- Added `selectedEventCache: Map<string, ScheduleEvent>` state.
- `loadAllDays` no longer clears `selectedEvents`.
- `toggleEventSelect(evId, event)` updates both selected ID set and cache.
- `toggleAllEventsForDay` now batch-updates selected IDs and cache entries.
- `DayTimelineColumn` now passes event payload to `onToggleEvent`.
- `openBulkCopyDialog` builds selected events from cache + currently loaded days to avoid missing off-screen selections.
