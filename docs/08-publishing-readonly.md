# Publishing Read-Only Views

## Overview

Publishing Read-Only Views provide visibility into the state of content that has been published to external platforms. These are read-only views of data from the publishing-side database, showing what has actually been delivered to OTT and DTH platforms.

## Pending Tasks

### [ ] Published Channels View

**Status**: Not Started

**Objective**: Display channels that are published and active on platforms.

**File**: `src/pages/publishing/PublishedChannelsPage.tsx`

**Features**:
- List all published channels
- Filter by platform (OTT, DTH)
- Filter by region
- Filter by status (active, inactive, archived)
- Show last publish date
- Show platform availability indicator
- Click to view channel details
- Display publish history

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│ Published Channels                                  │
├─────────────────────────────────────────────────────┤
│ Platform: [OTT ▼]  Region: [All ▼]  Status: [All ▼]│
│                                                      │
│ Channel Name     │ Type   │ Status │ Last Publish  │
├─────────────────────────────────────────────────────┤
│ HBO HD           │ Linear │ Active │ 2024-02-15... │
│  ✓ OTT  ✓ DTH   │        │        │ 14:30:00      │
├─────────────────────────────────────────────────────┤
│ Showtime         │ Linear │ Active │ 2024-02-14... │
│  ✓ OTT  ✗ DTH   │        │        │ 10:15:00      │
└─────────────────────────────────────────────────────┘
```

**Data Structure**:
```typescript
interface PublishedChannel {
  id: string;
  name: string;
  channelType: string;
  status: 'active' | 'inactive' | 'archived';
  platforms: {
    ott?: {
      isActive: boolean;
      lastPublishDate: string;
      version?: number;
    };
    dth?: {
      isActive: boolean;
      lastPublishDate: string;
      version?: number;
    };
  };
  region?: string;
  lastModifiedDate: string;
  publishHistory?: PublishEvent[];
}

interface PublishEvent {
  date: string;
  platform: 'ott' | 'dth';
  version: number;
  publishedBy: string;
  comment?: string;
}
```

**API Endpoint** (Publishing Database):
```
GET /publishing/channels
Query params:
  - platform?: ott|dth
  - region?: string
  - status?: active|inactive|archived
  - page: number
  - pageSize: number

Response:
{
  "channels": [PublishedChannel[]],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

**Component**:
```tsx
export function PublishedChannelsPage() {
  const [platform, setPlatform] = useState<'ott' | 'dth' | ''>('');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data: publishedChannels, isLoading } = useQuery({
    queryKey: ['published-channels', platform, region, status, page],
    queryFn: () => publishingService.getPublishedChannels({
      platform: platform || undefined,
      region: region || undefined,
      status: status || undefined,
      page,
      pageSize: 20,
    }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Published Channels</h1>

      <div className="flex gap-4">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as any)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Platforms</option>
          <option value="ott">OTT</option>
          <option value="dth">DTH</option>
        </select>

        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Regions</option>
          {/* Region options */}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Channel Name</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Platforms</th>
                <th className="text-left py-2">Last Publish</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {publishedChannels.channels.map(channel => (
                <tr key={channel.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 font-bold">{channel.name}</td>
                  <td className="py-2">{channel.channelType}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-sm font-bold ${
                      channel.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {channel.status}
                    </span>
                  </td>
                  <td className="py-2">
                    {channel.platforms.ott?.isActive && <span className="mr-2">✓ OTT</span>}
                    {channel.platforms.dth?.isActive && <span>✓ DTH</span>}
                  </td>
                  <td className="py-2 text-sm">
                    {formatDate(
                      channel.platforms.ott?.lastPublishDate ||
                      channel.platforms.dth?.lastPublishDate
                    )}
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => navigateTo(`/publishing/channels/${channel.id}`)}
                      className="text-blue-500 hover:underline"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(publishedChannels.total / 20)}
        onPageChange={setPage}
      />
    </div>
  );
}
```

**Detailed Channel View**:
```tsx
export function PublishedChannelDetailPage() {
  const { channelId } = useParams<{ channelId: string }>();

  const { data: channel } = useQuery({
    queryKey: ['published-channel', channelId],
    queryFn: () => publishingService.getPublishedChannel(channelId),
  });

  const { data: publishHistory } = useQuery({
    queryKey: ['channel-publish-history', channelId],
    queryFn: () => publishingService.getChannelPublishHistory(channelId),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{channel?.name}</h1>
        <p className="text-gray-600">Type: {channel?.channelType}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h3 className="font-bold mb-2">OTT Platform</h3>
          {channel?.platforms.ott ? (
            <>
              <p className="text-green-600">✓ Active</p>
              <p className="text-sm text-gray-600">
                Last publish: {formatDate(channel.platforms.ott.lastPublishDate)}
              </p>
              <p className="text-sm text-gray-600">Version: {channel.platforms.ott.version}</p>
            </>
          ) : (
            <p className="text-gray-600">Not published</p>
          )}
        </div>

        <div className="border rounded p-4">
          <h3 className="font-bold mb-2">DTH Platform</h3>
          {channel?.platforms.dth ? (
            <>
              <p className="text-green-600">✓ Active</p>
              <p className="text-sm text-gray-600">
                Last publish: {formatDate(channel.platforms.dth.lastPublishDate)}
              </p>
              <p className="text-sm text-gray-600">Version: {channel.platforms.dth.version}</p>
            </>
          ) : (
            <p className="text-gray-600">Not published</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-4">Publish History</h3>
        <div className="space-y-2">
          {publishHistory?.map((event: PublishEvent) => (
            <div key={`${event.date}-${event.platform}`} className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="font-bold">{event.platform.toUpperCase()} - Version {event.version}</p>
              <p className="text-sm text-gray-600">{formatDatetime(event.date)}</p>
              <p className="text-sm text-gray-600">By: {event.publishedBy}</p>
              {event.comment && <p className="text-sm italic">{event.comment}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### [ ] Published Programs View

**Status**: Not Started

**Objective**: Display programs that are published and available on platforms.

**File**: `src/pages/publishing/PublishedProgramsPage.tsx`

**Features**:
- List published programs with pagination
- Filter by platform (OTT, DTH)
- Filter by program type
- Filter by platform region
- Search by title
- Show publication status for each platform
- Show last publish date
- Display image availability
- Click to view program details

**UI Layout**:
```
┌──────────────────────────────────────────────────────┐
│ Published Programs                                   │
├──────────────────────────────────────────────────────┤
│ [Search]  Platform: [OTT ▼]  Type: [All ▼]          │
│                                                       │
│ Title               │ Type │ OTT │ DTH │ Last Update│
├──────────────────────────────────────────────────────┤
│ Game of Thrones     │ SH   │  ✓  │  ✓  │ 2024-02-15│
│ Breaking Bad        │ SH   │  ✓  │  ✗  │ 2024-02-14│
│ The Office (US)     │ SV   │  ✓  │  ✗  │ 2024-02-13│
│ Avatar              │ MV   │  ✓  │  ✓  │ 2024-02-12│
└──────────────────────────────────────────────────────┘
```

**Data Structure**:
```typescript
interface PublishedProgram {
  id: string;
  title: string;
  programType: string;
  releaseYear?: number;
  thumbnail?: string;
  platforms: {
    ott?: {
      isPublished: boolean;
      lastPublishDate?: string;
      version?: number;
      imageCounts?: {
        wide: number;
        portrait: number;
      };
    };
    dth?: {
      isPublished: boolean;
      lastPublishDate?: string;
      version?: number;
    };
  };
  contentStatus: 'complete' | 'partial' | 'incomplete';
  lastModifiedDate: string;
  publishHistory?: PublishEvent[];
}
```

**API Endpoint**:
```
GET /publishing/programs
Query params:
  - searchString?: string
  - platform?: ott|dth
  - programType?: string
  - page: number
  - pageSize: number

Response:
{
  "programs": [PublishedProgram[]],
  "total": 5432,
  "page": 1,
  "pageSize": 20
}
```

**Component**:
```tsx
export function PublishedProgramsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [platform, setPlatform] = useState<'ott' | 'dth' | ''>('');
  const [programType, setProgramType] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: publishedPrograms, isLoading } = useQuery({
    queryKey: ['published-programs', debouncedSearch, platform, programType, page],
    queryFn: () => publishingService.getPublishedPrograms({
      searchString: debouncedSearch,
      platform: platform || undefined,
      programType: programType || undefined,
      page,
      pageSize: 20,
    }),
    enabled: !!debouncedSearch || !platform,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Published Programs</h1>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded"
        />

        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as any)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Platforms</option>
          <option value="ott">OTT</option>
          <option value="dth">DTH</option>
        </select>

        <select
          value={programType}
          onChange={(e) => setProgramType(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Types</option>
          <option value="MV">Movie</option>
          <option value="SH">Series</option>
          <option value="SV">Show</option>
          <option value="EP">Episode</option>
        </select>
      </div>

      {isLoading ? (
        <SkeletonLoader />
      ) : publishedPrograms && publishedPrograms.programs.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Title</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Year</th>
                  <th className="text-left py-2">OTT</th>
                  <th className="text-left py-2">DTH</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Last Update</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {publishedPrograms.programs.map(program => (
                  <tr key={program.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-bold">{program.title}</td>
                    <td className="py-2">{program.programType}</td>
                    <td className="py-2">{program.releaseYear}</td>
                    <td className="py-2">
                      {program.platforms.ott?.isPublished ? '✓' : '✗'}
                    </td>
                    <td className="py-2">
                      {program.platforms.dth?.isPublished ? '✓' : '✗'}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-sm font-bold ${
                        program.contentStatus === 'complete'
                          ? 'bg-green-100 text-green-800'
                          : program.contentStatus === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {program.contentStatus}
                      </span>
                    </td>
                    <td className="py-2 text-sm">
                      {formatDate(program.lastModifiedDate)}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => navigateTo(`/publishing/programs/${program.id}`)}
                        className="text-blue-500 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(publishedPrograms.total / 20)}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div className="text-center py-8 text-gray-600">
          No published programs found
        </div>
      )}
    </div>
  );
}
```

**Detailed Program View**:
```tsx
export function PublishedProgramDetailPage() {
  const { programId } = useParams<{ programId: string }>();

  const { data: program } = useQuery({
    queryKey: ['published-program', programId],
    queryFn: () => publishingService.getPublishedProgram(programId),
  });

  const { data: images } = useQuery({
    queryKey: ['published-program-images', programId],
    queryFn: () => publishingService.getPublishedProgramImages(programId),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{program?.title}</h1>
        <p className="text-gray-600">
          {program?.programType} • {program?.releaseYear}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {program?.thumbnail && (
          <img
            src={program.thumbnail}
            alt={program.title}
            className="rounded"
          />
        )}

        <div className="col-span-2 space-y-4">
          <div className="border rounded p-4">
            <h3 className="font-bold mb-2">Publication Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold">OTT</p>
                {program?.platforms.ott?.isPublished ? (
                  <>
                    <p className="text-green-600">✓ Published</p>
                    <p className="text-sm text-gray-600">
                      Version {program.platforms.ott.version}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(program.platforms.ott.lastPublishDate)}
                    </p>
                  </>
                ) : (
                  <p className="text-red-600">✗ Not Published</p>
                )}
              </div>
              <div>
                <p className="font-bold">DTH</p>
                {program?.platforms.dth?.isPublished ? (
                  <>
                    <p className="text-green-600">✓ Published</p>
                    <p className="text-sm text-gray-600">
                      Version {program.platforms.dth.version}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(program.platforms.dth.lastPublishDate)}
                    </p>
                  </>
                ) : (
                  <p className="text-red-600">✗ Not Published</p>
                )}
              </div>
            </div>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-bold mb-2">Content Completion</h3>
            <p className="text-sm mb-2">
              Status: <strong>{program?.contentStatus}</strong>
            </p>
            <div className="w-full bg-gray-200 rounded h-2">
              <div
                className={`h-2 rounded ${
                  program?.contentStatus === 'complete'
                    ? 'bg-green-500 w-full'
                    : program?.contentStatus === 'partial'
                    ? 'bg-yellow-500 w-3/4'
                    : 'bg-red-500 w-1/4'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-4">Published Images</h3>
        <div className="grid grid-cols-4 gap-4">
          {images?.map(image => (
            <div key={image.id} className="border rounded overflow-hidden">
              <img src={image.uri} alt={image.id} className="w-full h-auto" />
              <p className="text-sm p-2">{image.ratio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## API Endpoints Reference

### Publishing Data Endpoints
```
GET    /publishing/channels                  - List published channels
GET    /publishing/channels/{channelId}      - Get channel details
GET    /publishing/channels/{channelId}/history - Publish history

GET    /publishing/programs                  - List published programs
GET    /publishing/programs/{programId}      - Get program details
GET    /publishing/programs/{programId}/images - Published images
GET    /publishing/programs/{programId}/history - Publish history

GET    /publishing/statistics                - Publishing dashboard stats
GET    /publishing/sync-status               - Sync status with live systems
```

## Data Sources

These views read from the **Publishing Database** which is:
- A read-only replica of published content
- Synced from the VLS system when content is published
- Represents what's actually live on OTT/DTH platforms
- May lag behind main database by a few minutes

## Implementation Order

1. Published Channels View
2. Published Programs View
3. Detailed Channel View
4. Detailed Program View

## Testing Checklist

- [ ] Channels list displays with correct filters
- [ ] Program list searches and filters correctly
- [ ] Platform indicators show OTT/DTH status
- [ ] Last publish dates display correctly
- [ ] Click through to detail pages works
- [ ] Channel publish history displays events
- [ ] Program images display in detail view
- [ ] Content completion status shows accurately
- [ ] Pagination works on all list views
- [ ] Read-only (no edit buttons shown)
