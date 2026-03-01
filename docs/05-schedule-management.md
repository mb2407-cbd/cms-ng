# Schedule Management

## Overview

Schedule Management handles the creation, editing, viewing, and publishing of broadcast schedules. This includes multi-day timeline views, event management, qualifiers, blackout regions, and schedule validation. The V2 API provides improved timezone handling for global distribution.

## Pending Tasks

### [ ] Schedule Viewer - Multi-Day Timeline View

**Status**: Not Started

**Current Limitation**: Single-day view only (to be addressed)

**Objective**: Create a timeline-based schedule viewer supporting multiple days.

**File**: `src/pages/schedules/ScheduleViewerPage.tsx`

**Features**:
- Multi-day timeline display (7-day, 14-day, 30-day views)
- Drag-and-drop event positioning
- Event resizing to change duration
- Timezone-aware display (V2 API)
- Zoom in/out timeline
- Channel/program filtering
- Event details on hover
- Color-coded by program type

**Timeline Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Schedule: HBO HD                    7-Day View                  │
│ [← Prev] Today [Next →]  [Zoom -] [Zoom +]  [Export] [Publish] │
├─────────────────────────────────────────────────────────────────┤
│ Time │ Mon 2/17 │ Tue 2/18 │ Wed 2/19 │ Thu 2/20 │ Fri 2/21   │
├─────┼──────────┼──────────┼──────────┼──────────┼────────────┤
│ 6am │          │          │          │          │            │
│ 7am │ Movie A  │ Movie B  │ Show X   │ Movie A  │ Movie C    │
│     │ (2h)    │ (2h 30m) │ (1h 30m) │ (2h)    │ (3h)       │
│ 9am │          │          │          │          │            │
│ ...  │          │          │          │          │            │
└─────┴──────────┴──────────┴──────────┴──────────┴────────────┘
```

**Component Structure**:
```tsx
export function ScheduleViewerPage() {
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: today(),
    end: today().add(7, 'days'),
  });
  const [zoomLevel, setZoomLevel] = useState(1);

  const { data: schedule } = useQuery({
    queryKey: ['schedule', selectedChannel, dateRange],
    queryFn: () => scheduleService.getSchedule(
      selectedChannel,
      dateRange.start,
      dateRange.end
    ),
  });

  return (
    <div className="h-full flex flex-col">
      <ScheduleControls
        selectedChannel={selectedChannel}
        onChannelChange={setSelectedChannel}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
      />
      <ScheduleTimeline
        schedule={schedule}
        dateRange={dateRange}
        zoomLevel={zoomLevel}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        onEventClick={handleEventClick}
      />
    </div>
  );
}
```

**API Endpoint** (V2):
```
GET /v2/schedules/{channelId}
Query params:
  - startDate: YYYY-MM-DD
  - endDate: YYYY-MM-DD
  - timezone: IANA timezone (America/New_York)
  - platform: ott|dth
```

**Response**:
```json
{
  "schedule": {
    "channelId": "ch123",
    "startDate": "2024-02-17",
    "endDate": "2024-02-24",
    "timezone": "America/New_York",
    "events": [
      {
        "id": "event1",
        "programId": "prog123",
        "startTime": "2024-02-17T06:00:00-05:00",
        "endTime": "2024-02-17T08:00:00-05:00",
        "program": { /* program details */ },
        "qualifiers": ["HD", "CC"],
        "blackoutRegions": []
      }
    ]
  }
}
```

### [ ] Schedule Version Management

**Status**: Not Started

**Objective**: Track and manage different versions of schedules.

**Features**:
- List all schedule versions
- View version details (created date, creator, changes)
- Revert to previous version
- Compare two versions
- Archive old versions

**API Endpoints**:
```
GET    /schedules/{channelId}/versions       - List versions
GET    /schedules/{channelId}/versions/{v}   - Get version
POST   /schedules/{channelId}/versions       - Create version
PUT    /schedules/{channelId}/versions/{v}   - Update version
DELETE /schedules/{channelId}/versions/{v}   - Delete version
GET    /schedules/versions/{v1}/compare/{v2} - Compare versions
```

**Component**:
```tsx
<ScheduleVersions
  channelId={channelId}
  currentVersion={schedule.version}
  onVersionSelect={handleVersionSelect}
  onRevert={handleRevert}
  onCompare={handleCompare}
/>
```

### [ ] Schedule Event Editing (Drag/Resize on Timeline)

**Status**: Not Started

**Objective**: Allow inline editing of schedule events on the timeline.

**Features**:
- Drag event to new time
- Resize event to change duration
- Edit event details (program, qualifiers, etc.)
- Delete event
- Add new event (click empty time slot)
- Validation prevents conflicts

**Drag/Resize Handler**:
```typescript
const handleEventDrop = async (eventId: string, newStartTime: DateTime) => {
  const event = schedule.events.find(e => e.id === eventId);
  const duration = event.endTime.diff(event.startTime);
  const newEndTime = newStartTime.plus(duration);

  // Validate no conflicts
  if (hasConflict(newStartTime, newEndTime, eventId)) {
    showErrorToast('Time slot conflicts with another event');
    return;
  }

  // Update event
  const updatedEvent = { ...event, startTime: newStartTime, endTime: newEndTime };
  await scheduleService.updateEvent(channelId, updatedEvent);

  // Refresh schedule
  queryClient.invalidateQueries({ queryKey: ['schedule', channelId] });
};
```

**Resize Handler**:
```typescript
const handleEventResize = async (eventId: string, newEndTime: DateTime) => {
  const event = schedule.events.find(e => e.id === eventId);
  const minDuration = 15 * 60 * 1000; // 15 minutes

  if (newEndTime.diff(event.startTime) < minDuration) {
    showErrorToast('Event must be at least 15 minutes long');
    return;
  }

  const updatedEvent = { ...event, endTime: newEndTime };
  await scheduleService.updateEvent(channelId, updatedEvent);

  queryClient.invalidateQueries({ queryKey: ['schedule', channelId] });
};
```

### [ ] Event Qualifiers Management

**Status**: Not Started

**Objective**: Manage qualifiers (closed captions, HD, surround, etc.) for schedule events.

**Qualifiers**:
- CC (Closed Captions)
- HD (High Definition)
- 4K (Ultra HD)
- SS (Surround Sound)
- SAP (Secondary Audio Program)
- AD (Audio Description)
- Stereo, Mono, Dolby

**Component**:
```tsx
<EventQualifiersForm
  qualifiers={event.qualifiers || []}
  onChange={handleQualifiersChange}
/>
```

**Implementation**:
```tsx
const availableQualifiers = [
  { id: 'CC', label: 'Closed Captions' },
  { id: 'HD', label: 'High Definition' },
  { id: '4K', label: 'Ultra HD (4K)' },
  { id: 'SS', label: 'Surround Sound' },
  { id: 'SAP', label: 'Secondary Audio' },
  { id: 'AD', label: 'Audio Description' },
];

export function EventQualifiersForm({ qualifiers, onChange }) {
  return (
    <div className="space-y-2">
      {availableQualifiers.map(qualifier => (
        <CheckboxField
          key={qualifier.id}
          label={qualifier.label}
          checked={qualifiers.includes(qualifier.id)}
          onChange={(checked) => {
            if (checked) {
              onChange([...qualifiers, qualifier.id]);
            } else {
              onChange(qualifiers.filter(q => q !== qualifier.id));
            }
          }}
        />
      ))}
    </div>
  );
}
```

### [ ] Blackout Region Management

**Status**: Not Started

**Objective**: Define geographic regions where programs should not air.

**Concepts**:
- Blackout: Prevent program airing in specific region
- Use case: Sports events blacked out in home team region
- Region: Geographic area (US state, country, etc.)

**Fields**:
- Program/Event ID
- Region(s) affected
- Start date
- End date
- Reason (licensing restriction, sports blackout, etc.)

**Component**:
```tsx
<BlackoutForm
  event={event}
  onAdd={addBlackout}
  onRemove={removeBlackout}
/>
```

**Blackout Entry**:
```typescript
interface Blackout {
  id?: string;
  regionId: string;
  startDate: string;
  endDate: string;
  reason: string;
}
```

### [ ] Schedule Validation

**Status**: Not Started

**Objective**: Validate schedules before publishing.

**Validation Rules**:
- No time gaps (except planned breaks)
- No overlapping events
- All programs exist and are active
- Required metadata present
- Total runtime matches channel requirements
- Proper lead time for publishing (e.g., 24 hours)

**Validator Function**:
```typescript
export interface ValidationError {
  eventId?: string;
  type: 'gap' | 'overlap' | 'missing_program' | 'invalid_time';
  message: string;
  startTime?: DateTime;
  endTime?: DateTime;
}

export async function validateSchedule(
  channelId: string,
  schedule: ScheduleEvent[]
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Check for gaps
  for (let i = 0; i < schedule.length - 1; i++) {
    const current = schedule[i];
    const next = schedule[i + 1];
    if (current.endTime < next.startTime) {
      errors.push({
        type: 'gap',
        message: `Gap between events: ${current.endTime} to ${next.startTime}`,
        startTime: current.endTime,
        endTime: next.startTime,
      });
    }
  }

  // Check for overlaps
  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      const a = schedule[i];
      const b = schedule[j];
      if (a.startTime < b.endTime && b.startTime < a.endTime) {
        errors.push({
          eventId: a.id,
          type: 'overlap',
          message: `Event overlaps with another event`,
        });
      }
    }
  }

  // Check programs exist
  for (const event of schedule) {
    const program = await programService.getProgram(event.programId);
    if (!program) {
      errors.push({
        eventId: event.id,
        type: 'missing_program',
        message: `Program ${event.programId} not found`,
      });
    }
  }

  return errors;
}
```

**UI Display**:
```tsx
const { data: validationErrors } = useMutation({
  mutationFn: () => scheduleService.validateSchedule(channelId),
});

{validationErrors && validationErrors.length > 0 && (
  <div className="bg-red-50 border border-red-200 rounded p-4">
    <h3 className="font-bold text-red-800">Validation Errors</h3>
    <ul className="space-y-1 mt-2">
      {validationErrors.map((error, idx) => (
        <li key={idx} className="text-red-700">
          {error.message}
        </li>
      ))}
    </ul>
  </div>
)}
```

### [ ] Schedule Publish Workflow

**Status**: Not Started

**Objective**: Publish validated schedules to platforms (OTT/DTH).

**Steps**:
1. Select schedule version
2. Select target platform(s)
3. Run validation
4. Confirm publish
5. Monitor publish status

**API Endpoint**:
```
POST /schedules/{channelId}/publish
Content-Type: application/json

{
  "version": 1,
  "platforms": ["ott", "dth"],
  "effectiveDate": "2024-02-20",
  "comment": "Q1 schedule update"
}
```

**Component**:
```tsx
<SchedulePublishDialog
  channelId={channelId}
  schedule={schedule}
  onPublish={handlePublish}
/>
```

### [ ] Bulk Copy Schedules Between Channels

**Status**: Not Started

**Objective**: Copy schedule from one channel to another (useful for channel variants).

**Features**:
- Select source channel
- Select target channel(s)
- Date range to copy
- Adjust program mappings if needed
- Confirm and execute copy

**API Endpoint**:
```
POST /schedules/bulk-copy
Content-Type: application/json

{
  "sourceChannelId": "ch123",
  "targetChannelIds": ["ch456", "ch789"],
  "startDate": "2024-02-17",
  "endDate": "2024-02-24",
  "adjustProgramMappings": true
}
```

### [ ] Manual Ingest Trigger

**Status**: Not Started

**Objective**: Allow manual triggering of schedule ingestion from provider.

**Features**:
- Select channel
- Select date range
- Trigger ingest
- Show progress/status
- Handle conflicts with existing schedule

**Component**:
```tsx
<ManualIngestDialog
  channelId={channelId}
  onIngest={handleIngest}
/>
```

**API Endpoint**:
```
POST /schedules/{channelId}/ingest
Content-Type: application/json

{
  "startDate": "2024-02-17",
  "endDate": "2024-02-24",
  "provider": "gracenote"
}
```

### [ ] Schedule Report Generation

**Status**: Not Started

**Objective**: Generate reports from schedule data.

**Report Types**:
- Program Summary (counts by program type)
- Rotation Report (how often programs air)
- Genre Distribution
- Schedule Completeness
- Conflicts/Gaps Report

**Component**:
```tsx
<ScheduleReportGenerator
  channelId={channelId}
  dateRange={dateRange}
  reportTypes={selectedReports}
  onGenerate={handleGenerate}
/>
```

**Export Formats**:
- PDF
- CSV
- Excel

### [ ] Timezone-Aware Display (V2 API)

**Status**: Not Started

**Objective**: Properly handle timezones using V2 API improvements.

**Features**:
- Display schedule in channel's timezone
- Convert times when viewing from different timezone
- Daylight saving time handling
- Schedule events in ISO 8601 format with timezone

**Data Structure**:
```json
{
  "channelId": "ch123",
  "timezone": "America/New_York",
  "events": [
    {
      "id": "event1",
      "startTime": "2024-02-17T18:00:00-05:00",
      "endTime": "2024-02-17T20:00:00-05:00"
    }
  ]
}
```

**Hook for Timezone Handling**:
```typescript
export function useScheduleTimezone(
  channelTimezone: string,
  userTimezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
) {
  return {
    formatChannelTime(iso: string): string {
      const dt = DateTime.fromISO(iso);
      return dt.toFormat('HH:mm', { locale: 'en' });
    },

    toUserTimezone(iso: string): string {
      const dt = DateTime.fromISO(iso).setZone(userTimezone);
      return dt.toFormat('HH:mm ZZZZ');
    },

    convertToChannelTime(date: DateTime): DateTime {
      return date.setZone(channelTimezone);
    },
  };
}
```

## API Endpoints Reference

### Schedule Operations
```
GET    /schedules                           - List schedules
GET    /schedules/{channelId}               - Get channel schedule
POST   /schedules                           - Create schedule
PUT    /schedules/{channelId}               - Update schedule
DELETE /schedules/{channelId}               - Delete schedule

GET    /v2/schedules/{channelId}            - V2 API with timezone support
POST   /v2/schedules/{channelId}            - V2 create schedule

GET    /schedules/{channelId}/versions      - List versions
POST   /schedules/{channelId}/versions      - Create version
GET    /schedules/{channelId}/events        - List events in schedule
POST   /schedules/{channelId}/events        - Add event
PUT    /schedules/{channelId}/events/{id}   - Update event
DELETE /schedules/{channelId}/events/{id}   - Delete event

POST   /schedules/{channelId}/validate      - Validate schedule
POST   /schedules/{channelId}/publish       - Publish schedule
POST   /schedules/{channelId}/ingest        - Manual ingest
POST   /schedules/bulk-copy                 - Copy between channels
POST   /schedules/report                    - Generate report
```

## Data Models

### Schedule Event
```typescript
interface ScheduleEvent {
  id: string;
  channelId: string;
  programId: string;
  program?: Program;
  startTime: DateTime;  // ISO 8601 with timezone
  endTime: DateTime;
  qualifiers?: string[];  // CC, HD, SAP, etc.
  blackoutRegions?: Blackout[];
  metadata?: Record<string, any>;
  createdDate?: string;
  updatedDate?: string;
}

interface Blackout {
  id?: string;
  regionId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}
```

### Schedule
```typescript
interface Schedule {
  id: string;
  channelId: string;
  version?: number;
  events: ScheduleEvent[];
  startDate: string;
  endDate: string;
  timezone: string;
  published: boolean;
  publishedDate?: string;
  createdDate: string;
  updatedDate: string;
}
```

## Implementation Order

1. Schedule Viewer - Multi-Day Timeline View (foundation)
2. Event Editing - Drag/Resize
3. Event Qualifiers Management
4. Schedule Validation
5. Schedule Publish Workflow
6. Schedule Version Management
7. Timezone-Aware Display (V2 API)
8. Blackout Region Management
9. Manual Ingest Trigger
10. Bulk Copy Schedules
11. Schedule Report Generation

## Testing Checklist

- [ ] Timeline displays multiple days correctly
- [ ] Drag/drop moves event without conflicts
- [ ] Resize changes event duration
- [ ] Validation detects gaps and overlaps
- [ ] Publish workflow saves and marks as published
- [ ] Version management creates and switches versions
- [ ] Qualifiers toggle on/off
- [ ] Blackout regions apply correctly
- [ ] Timezone conversion works correctly
- [ ] Bulk copy creates events in target channels
- [ ] Manual ingest populates schedule
- [ ] Reports generate and export correctly
