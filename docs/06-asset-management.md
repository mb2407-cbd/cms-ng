# Asset Management

## Overview

Asset Management provides tools for searching, viewing, and reporting on digital assets (images, videos, metadata). Assets are sourced from various providers and tracked throughout their lifecycle. This feature includes search, detail views, and specialized reports for identifying issues.

## Pending Tasks

### [ ] Asset Search and List

**Status**: Not Started

**Objective**: Create searchable, filterable list of all assets.

**File**: `src/pages/assets/AssetsPage.tsx`

**Features**:
- Search assets by ID, name, program title
- Filter by:
  - Asset type (image, video, metadata)
  - Status (active, deprecated, archived)
  - Source system (GraceNote, DMS, etc.)
  - Created date range
  - Last modified date range
- Sort by name, created date, size
- Pagination with customizable page size
- Bulk actions (delete, export, update status)

**Search Implementation**:
```typescript
interface AssetSearchRequest {
  searchString?: string;
  assetType?: string[];
  status?: string[];
  source?: string[];
  createdAfter?: string;
  createdBefore?: string;
  sortBy?: 'name' | 'createdDate' | 'size';
  sortOrder?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

const searchAssets = async (
  request: AssetSearchRequest
): Promise<AssetSearchResponse>
```

**API Endpoint**:
```
POST /assets/search
Content-Type: application/json

{
  "searchString": "game of thrones",
  "assetType": ["image"],
  "status": ["active"],
  "page": 1,
  "pageSize": 20
}
```

**Response**:
```json
{
  "assets": [
    {
      "id": "asset123",
      "name": "Game of Thrones - Season 1 Poster",
      "type": "image",
      "size": 2048576,
      "status": "active",
      "source": "gracenote",
      "relatedPrograms": [
        { "id": "prog1", "title": "Game of Thrones" }
      ],
      "createdDate": "2024-01-15T10:00:00Z",
      "updatedDate": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 142,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8
}
```

**UI Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Assets                                                  │
├─────────────────────────────────────────────────────────┤
│ [Search box]  [+ Upload Asset]                          │
│                                                          │
│ Type: All ▼  Status: All ▼  Source: All ▼  [Filters]   │
│                                                          │
│ ID         │ Name             │ Type  │ Size   │ Actions│
├─────────────────────────────────────────────────────────┤
│ asset123   │ GoT Season 1     │ Image │ 2.0 MB │ [View] │
│ asset124   │ Breaking Bad     │ Image │ 1.8 MB │ [View] │
│ asset125   │ Metadata XML     │ Data  │ 142 KB │ [View] │
└─────────────────────────────────────────────────────────┘
```

### [ ] Asset Detail View

**Status**: Not Started

**Objective**: Display comprehensive information about a single asset.

**File**: `src/pages/assets/AssetDetailPage.tsx`

**Features**:
- Asset metadata (ID, name, type, size, source)
- Preview (if image: show thumbnail; if video: show player)
- Related programs (shows which programs use this asset)
- Version history
- Usage statistics
- Download option
- Delete option (with confirmation)
- Edit metadata

**Asset Details Tabs**:
```
┌────────────────────────────────────────────────────────┐
│ Asset: GoT Season 1 Poster                             │
├────────────────────────────────────────────────────────┤
│ Overview | Usage | History | Metadata                  │
├────────────────────────────────────────────────────────┤
│ OVERVIEW TAB                                           │
│ ┌────────────────────┐  Type: Image                   │
│ │                    │  Format: JPG                   │
│ │   [Preview]        │  Size: 2.0 MB                 │
│ │                    │  Resolution: 1920x1080         │
│ │                    │  Source: GraceNote             │
│ └────────────────────┘  Created: 2024-01-15           │
│                         Modified: 2024-01-15           │
└────────────────────────────────────────────────────────┘
```

**Component Structure**:
```tsx
export function AssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>();

  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => assetService.getAsset(assetId),
  });

  if (isLoading) return <SkeletonLoader />;

  return (
    <div className="space-y-6">
      <AssetHeader asset={asset} onDelete={handleDelete} />

      <Tabs defaultValue="overview">
        <TabList>
          <Tab value="overview">Overview</Tab>
          <Tab value="usage">Usage</Tab>
          <Tab value="history">History</Tab>
          <Tab value="metadata">Metadata</Tab>
        </TabList>

        <TabContent value="overview">
          <AssetOverviewTab asset={asset} />
        </TabContent>
        <TabContent value="usage">
          <AssetUsageTab assetId={assetId} />
        </TabContent>
        <TabContent value="history">
          <AssetHistoryTab assetId={assetId} />
        </TabContent>
        <TabContent value="metadata">
          <AssetMetadataTab asset={asset} onUpdate={handleUpdate} />
        </TabContent>
      </Tabs>
    </div>
  );
}
```

**Usage Tab**:
```tsx
<div className="space-y-4">
  <h3 className="font-bold">Programs Using This Asset</h3>
  <div className="grid gap-4">
    {relatedPrograms.map(program => (
      <div key={program.id} className="border rounded p-4">
        <h4>{program.title}</h4>
        <p className="text-sm text-gray-600">ID: {program.id}</p>
        <p className="text-sm">Type: {program.programType}</p>
        <a href={`/programs/${program.id}`} className="text-blue-500">
          View Program
        </a>
      </div>
    ))}
  </div>
</div>
```

**API Endpoint**:
```
GET /assets/{assetId}               - Get asset details
GET /assets/{assetId}/usage         - Get programs using asset
GET /assets/{assetId}/history       - Get version history
```

### [ ] Asset Reports

**Status**: Not Started

**Objective**: Generate specialized reports for asset management.

**File**: `src/pages/assets/AssetReportsPage.tsx`

**Report Types**:

#### 1. All Assets Report
- Complete list of all assets
- Export to CSV/Excel
- Filterable, sortable
- Metrics: total count, total size, by type

#### 2. Duplicate Assets Report
- Detect similar/identical assets
- Group by similarity score
- Show duplicates side-by-side
- Merge/delete recommendations

**Logic**:
```typescript
interface DuplicateGroup {
  assetIds: string[];
  similarity: number;      // 0.0 to 1.0
  potentiallyDuplicate: true;
}

async function findDuplicateAssets(): Promise<DuplicateGroup[]> {
  // Use image hashing or metadata comparison
  // Return groups of similar assets
}
```

**API Endpoint**:
```
GET /assets/reports/duplicates
Response: Array of duplicate groups
```

#### 3. Missing Genres Report
- Find programs missing genre information
- Show program title and ID
- Link to program detail for editing

**API Endpoint**:
```
GET /assets/reports/missing-genres
Response: Programs with missing genres
```

#### 4. Orphaned Assets Report
- Assets not linked to any program
- Options to delete or archive
- Metrics: count, total size

**API Endpoint**:
```
GET /assets/reports/orphaned
Response: Assets with no related programs
```

#### 5. Asset Usage Report
- How many times each asset is used
- Programs using asset
- Export usage statistics

**API Endpoint**:
```
GET /assets/reports/usage
Response: Usage statistics per asset
```

**Report Generation UI**:
```tsx
<div className="space-y-6">
  <div className="grid grid-cols-2 gap-4">
    <ReportCard
      title="All Assets"
      description="Complete asset inventory"
      onClick={() => navigateTo('/assets/reports/all')}
    />
    <ReportCard
      title="Duplicates"
      description="Identify duplicate assets"
      onClick={() => navigateTo('/assets/reports/duplicates')}
    />
    <ReportCard
      title="Missing Genres"
      description="Programs without genres"
      onClick={() => navigateTo('/assets/reports/missing-genres')}
    />
    <ReportCard
      title="Orphaned Assets"
      description="Assets not linked to programs"
      onClick={() => navigateTo('/assets/reports/orphaned')}
    />
    <ReportCard
      title="Usage Statistics"
      description="Asset usage across programs"
      onClick={() => navigateTo('/assets/reports/usage')}
    />
  </div>

  <ExportOptions
    onExport={(format) => handleExport(format)}
  />
</div>
```

**Export Implementation**:
```typescript
const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
  const data = await assetService.getReportData(reportType);

  if (format === 'csv') {
    exportToCSV(data, `asset-report-${reportType}.csv`);
  } else if (format === 'excel') {
    exportToExcel(data, `asset-report-${reportType}.xlsx`);
  } else if (format === 'pdf') {
    exportToPDF(data, `asset-report-${reportType}.pdf`);
  }
};
```

**CSV Export Example**:
```
Asset ID,Name,Type,Size (MB),Status,Source,Created Date
asset123,GoT Season 1,image,2.0,active,GraceNote,2024-01-15
asset124,Breaking Bad,image,1.8,active,GraceNote,2024-01-16
```

### [ ] Asset Statistics Dashboard

**Status**: Not Started

**Objective**: Display overview statistics and metrics for asset management.

**File**: `src/components/assets/AssetStatsDashboard.tsx`

**Metrics**:
- Total assets count
- Total asset size (GB)
- Assets by type (pie chart)
- Assets by source (bar chart)
- Assets by status (pie chart)
- Orphaned assets count
- Duplicate assets count
- Most used assets
- Largest assets
- Recently added assets

**Dashboard Layout**:
```
┌──────────────────────────────────────────────────────┐
│ Asset Statistics                                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Total Assets: 1,234        Total Size: 45.6 GB    │
│  Orphaned: 12              Duplicates: 8            │
│                                                      │
│  ┌─ By Type (pie)  ─┐  ┌─ By Source (bar) ─┐      │
│  │ Image: 78%       │  │ GraceNote:  45%   │      │
│  │ Video: 15%       │  │ DMS:        35%   │      │
│  │ Other: 7%        │  │ VLS:        20%   │      │
│  └──────────────────┘  └───────────────────┘      │
│                                                      │
│  Most Used Assets        │  Largest Assets         │
│  ├─ Asset 123 (45 uses)  │  ├─ Video 1 (2.1 GB)   │
│  ├─ Asset 124 (32 uses)  │  ├─ Video 2 (1.8 GB)   │
│  └─ Asset 125 (28 uses)  │  └─ Image 1 (856 MB)   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Component**:
```tsx
export function AssetStatsDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['assets', 'statistics'],
    queryFn: () => assetService.getStatistics(),
  });

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard title="Total Assets" value={stats.totalCount} />
      <StatCard title="Total Size" value={`${stats.totalSizeGB} GB`} />
      <StatCard title="Orphaned" value={stats.orphanedCount} />
      <StatCard title="Duplicates" value={stats.duplicateGroups} />

      <div className="col-span-2">
        <PieChart data={stats.byType} title="Assets by Type" />
      </div>

      <BarChart data={stats.bySource} title="Assets by Source" />
      <div>
        <MostUsedAssets assets={stats.mostUsed} />
      </div>
    </div>
  );
}
```

**API Endpoint**:
```
GET /assets/statistics
Response:
{
  "totalCount": 1234,
  "totalSizeBytes": 49006400000,
  "byType": { "image": 0.78, "video": 0.15, "other": 0.07 },
  "bySource": { "gracenote": 0.45, "dms": 0.35, "vls": 0.20 },
  "orphanedCount": 12,
  "duplicateGroups": 8,
  "mostUsed": [
    { "assetId": "asset123", "uses": 45 }
  ],
  "largest": [
    { "assetId": "video1", "sizeBytes": 2147483648 }
  ]
}
```

## Data Models

### Asset
```typescript
interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'metadata' | 'other';
  format?: string;        // jpg, mp4, xml, etc.
  sizeBytes: number;
  status: 'active' | 'deprecated' | 'archived';
  source: string;         // GraceNote, DMS, VLS
  sourceId?: string;      // ID in source system
  checksum?: string;      // For duplicate detection
  metadata?: Record<string, any>;
  relatedPrograms?: Array<{
    id: string;
    title: string;
    programType: string;
  }>;
  createdDate: string;
  updatedDate: string;
  createdBy?: string;
  updatedBy?: string;
}

interface AssetSearchResponse {
  assets: Asset[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

## API Endpoints Reference

### Asset Operations
```
GET    /assets                      - List assets
GET    /assets/{assetId}            - Get asset details
POST   /assets                      - Upload new asset
PUT    /assets/{assetId}            - Update asset metadata
DELETE /assets/{assetId}            - Delete asset

POST   /assets/search              - Search with filters
GET    /assets/{assetId}/usage     - Get programs using asset
GET    /assets/{assetId}/history   - Get version history

GET    /assets/statistics          - Dashboard statistics
GET    /assets/reports/all         - All assets report
GET    /assets/reports/duplicates  - Duplicate detection
GET    /assets/reports/missing-genres - Missing genre report
GET    /assets/reports/orphaned    - Orphaned assets
GET    /assets/reports/usage       - Usage statistics
```

## Implementation Order

1. Asset Search and List Page
2. Asset Detail View
3. Asset Statistics Dashboard
4. Asset Reports
   - All Assets Report
   - Duplicate Detection
   - Missing Genres Report
   - Orphaned Assets Report
   - Usage Statistics Report

## Testing Checklist

- [ ] Search filters work correctly
- [ ] Pagination displays correct items
- [ ] Detail page shows all asset info
- [ ] Related programs list accurate
- [ ] Duplicate detection identifies similar assets
- [ ] Reports generate with correct data
- [ ] CSV/Excel export creates proper files
- [ ] Statistics dashboard loads and updates
- [ ] Delete asset with confirmation
- [ ] Asset status changes persist
- [ ] Search results update in real-time
