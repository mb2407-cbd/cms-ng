# Program Mapping — Business Logic & Requirements

## Overview

The Program Mapping workflow bridges the gap between an **Asset Management System** (AMS) and the **VLS Content Management System** (CMS). When an AMS needs enriched metadata for its content catalog, it sends mapping requests to VLS. An operator then resolves each request by either matching it to an existing VLS program or requesting enrichment from an external metadata provider (Gracenote).

---

## Core Workflow

```
Asset Management System ──(mapping request)──> VLS Program Mapping Queue
     │
     ▼
Operator sees pending requests in the Program Mapping screen
     │
     ├── Option A: Search VLS local program collection → drag & drop to map
     ├── Option B: Click "Request Provider Info" → sends to Gracenote
     │       │
     │       ├── Gracenote returns enriched metadata → auto-mapped (status: "mapped")
     │       ├── Gracenote cannot map → status: "unmappable" + reason
     │       └── Awaiting response → status: "incomplete"
     │
     └── Option C: Manually create a new PPV Program → map it
     │
     ▼
Operator reviews mapped programs → checks them → clicks "Save and Next" to publish
```

---

## Data Model

### ProgramMapping Entity

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique mapping request ID (also used as `mapperId`) |
| `programId` | string | VLS program ID (set when mapped) |
| `mappedProgram` | Program | Full VLS program object (set when mapped) |
| `connectorId` | string | External connector identifier |
| `type` | enum | `MOVIE`, `EPISODE`, `SERIES` |
| `status` | enum | `unmapped`, `mapped`, `incomplete`, `unmappable` |
| `titles` | Title[] | Multi-language titles from AMS |
| `descriptions` | Description[] | Multi-language descriptions from AMS |
| `episodeTitles` | Title[] | Episode titles (for EP type) |
| `genres` | string[] | Genre IDs |
| `ratings` | Rating[] | Content ratings |
| `credits` | Credit[] | Cast & crew |
| `externalRefs` | ExternalRef[] | External references (tmsId, rootId, etc.) |
| `providerInfo` | ProviderInfo[] | System metadata and enrichment flags |
| `seasonNumber` | string | Season number (episodes/series) |
| `episodeNumber` | string | Episode number |
| `releaseYear` | string | Release year (required for MOVIE) |
| `origAirDate` | string | Original air date (required for EPISODE/SERIES) |
| `runTime` | number | Duration in minutes |
| `checked` | boolean | Selected for batch submission |
| `published` | boolean | Whether mapping has been published |
| `autoPublished` | boolean | Auto-publish flag |
| `dmsId` | string | DMS system ID |
| `mapperId` | string | Mapper system ID |

### ProviderInfo Structure

```typescript
{
  system: 'VLS' | 'GraceNote',
  key: string,      // e.g., 'skipMetadataEnrichment', 'Unmappable.message'
  value: any         // boolean for skip flag; { reason, detail[] } for unmappable
}
```

---

## Status State Machine

```
                 ┌──────────────┐
     NEW ──────> │  unmapped    │
                 └──────┬───────┘
                        │
          ┌─────────────┼──────────────┐
          ▼             ▼              ▼
   ┌────────────┐ ┌──────────┐  ┌────────────┐
   │  mapped    │ │incomplete│  │  (manual    │
   │ (drag-drop │ │(awaiting │  │   PPV       │
   │  or auto)  │ │ provider)│  │   create)   │
   └────────────┘ └────┬─────┘  └─────┬──────┘
                       │              │
              ┌────────┼──────┐       │
              ▼        ▼      ▼       ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  mapped  │ │unmappable│ │  mapped   │
        │  (auto)  │ │(w/reason)│ │  (new)    │
        └──────────┘ └──────────┘ └──────────┘
```

### Status Definitions

- **unmapped**: New request from AMS; no VLS program linked yet.
- **mapped**: Successfully linked to a VLS program (manually via drag-drop, or automatically via provider).
- **incomplete**: Provider info requested from Gracenote; awaiting response.
- **unmappable**: Gracenote could not find a match; includes reason and detail.

---

## Business Rules

### Mapping Rules
1. **Drag-and-drop mapping**: Operator drags a program from the VLS program list onto an unmapped request. The system fetches the published version of that program and links it.
2. **Cannot map to "incomplete" programs**: If a mapping request is in `incomplete` status, drag-drop is disabled (it is awaiting provider info).
3. **Published version preferred**: When fetching a VLS program for mapping, the system looks for the published version first; falls back to the latest version if no published version exists.
4. **No active version warning**: If a program has no active versions, a warning is shown: "No active version for this program yet."

### Validation Rules
5. **English title**: Required for all program types.
6. **Spanish/Portuguese title**: Required for all program types (Spanish for SSLA market; Portuguese for Sky/Brazil market).
7. **Release year**: Required for `MOVIE` type.
8. **Original air date**: Required for `EPISODE` and `SERIES` types.

### Provider Integration Rules
9. **Request Provider Info**: Sends request to Gracenote for enrichment. Sets status to `incomplete`.
10. **Skip Metadata Enrichment**: If `providerInfo` contains `skipMetadataEnrichment = true`, the Gracenote request button is hidden and a message is shown: "Gracenote metadata enhancement restricted".
11. **Unmappable Reason**: When Gracenote returns `unmappable`, the reason is extracted from `providerInfo[key='Unmappable.message'].value.reason` and detail from `.value.detail[]`.

### Submission Rules
12. **Batch submission**: Only checked (`checked = true`) mappings are submitted via "Save and Next".
13. **Confirmation required**: Both "Save and Next" and "Request Provider Info" require user confirmation via modal dialog.
14. **Post-submission refresh**: After successful submission, the mapping list is refreshed.

### System Identification
15. **System badge**: Each mapping request shows its source system:
    - If no `dmsId` → `PPV`
    - If `externalRefs` contains system `TBX` → `TBX`
    - Otherwise → `DMS`

---

## Multi-Language Support

| Market | Primary Language | Secondary Language |
|--------|-----------------|-------------------|
| SSLA   | English (en)    | Spanish (es)      |
| Sky    | English (en)    | Portuguese (pt)   |

The market is detected from the URL (contains "sky" → Sky/Brazil market).

### Title Resolution Order
1. Try to find title in the requested language
2. If not found, fall back to the first available title

---

## Program Type Mapping

| Full Type | Abbreviation | Badge Color |
|-----------|-------------|-------------|
| MOVIE     | MV          | Warning (amber) |
| SERIES    | SH          | Danger (red) |
| EPISODE   | EP          | Secondary (gray) |
| SHOW      | SH          | Info (cyan) |
| SPORT     | SH          | Primary (blue) |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/programMapping/search` | Search mappings with filters + pagination |
| GET    | `/programMapping/{mapperId}` | Get single mapping |
| POST   | `/programMapping` | Create new mapping (PPV) |
| PUT    | `/programMapping/mapAndPublish` | Batch submit checked mappings |
| PUT    | `/programMapping/requestProviderInfo/{mapperId}` | Request Gracenote enrichment |
| PUT    | `/programMapping/status/{mapperId}` | Update mapping status |
| GET    | `/programMapping/rolesOfCast` | Get available cast roles |

### Search Request Body
```json
{
  "searchString": "search text",
  "types": ["MV", "SH", "EP", "ES"],
  "status": ["unmapped", "mapped", "incomplete", "unmappable"]
}
```

### Search Response
```json
{
  "response": [ProgramMapping],
  "totalElements": 150,
  "totalPages": 8,
  "currentPage": 1
}
```

---

## UI Layout (Current Angular Implementation)

### Two-Panel Layout
- **Left 8 columns**: Mapping requests list with filters
  - Header: "VOD / PPV Titles" + type checkboxes + status filter dropdown + search
  - Each row shows: title, type badge, season/episode, description, IDs
  - Left half = AMS request data
  - Right half = Mapped VLS program data (or status message)
- **Right 4 columns**: VLS program search panel
  - Searchable program list with drag support
  - Programs can be dragged onto the left panel's drop zones

### Footer Actions
- **Create PPV Program** button (opens creation modal)
- **Pagination** (center)
- **Save and Next** button (submits checked mappings)

### Compare Modal
Side-by-side comparison table showing:
- English/Spanish/Portuguese titles and episode titles
- Program type, year, season/episode numbers
- Alternate season/episode numbers
- Ratings, genres, cast, crew
- Descriptions in all languages

### Create PPV Modal
Form with fields:
- Program type selector (MOVIE/EPISODE/SERIES)
- Release year (MOVIE) or Original air date (non-MOVIE)
- Season/episode numbers (disabled for MOVIE)
- Genres (multi-select)
- Ratings (multi-select, filtered to MPAA + TVPG)
- English title & description
- Spanish/Portuguese title & description
- Credits search (typeahead for celebrities) with role selector (Actor/Director)

---

## Key Interactions

1. **Select a mapping row**: Click to highlight; shows detail in the right panel context.
2. **Drag VLS program**: From right panel → drop on left panel row's right half.
3. **Check mapping**: Checkbox on the right half of a mapped row marks it for submission.
4. **"MORE" button**: Opens compare modal for side-by-side review.
5. **"Request Provider Info"**: Visible only on unmapped rows without a `programId` and without `skipMetadataEnrichment`.
6. **Filter toggles**: Program type checkboxes (MV, SH, EP, ES) and status dropdown filter the list in real-time.
