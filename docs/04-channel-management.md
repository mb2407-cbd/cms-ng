# Channel Management

## Overview

Channel Management handles the creation, configuration, and maintenance of broadcast and streaming channels. Channels are the distribution points for programs across different platforms (OTT and DTH). This feature manages channel metadata, DRM/CDN configuration, scheduling associations, and provider mappings.

## Pending Tasks

### [ ] Channel List Page with Search and Filters

**Status**: Not Started

**Objective**: Create a searchable, filterable list of all channels.

**File**: `src/pages/channels/ChannelsPage.tsx`

**Features**:
- List all channels with pagination
- Real-time search by channel name, call sign
- Filter by:
  - Platform (OTT, DTH)
  - Channel type (Linear, VOD, etc.)
  - Source system (GraceNote, DMS, etc.)
  - Processing type
  - Status (active/inactive)
  - Region
  - Master/Slave channels
- Sort by name, created date, updated date
- Show channel thumbnails
- Quick action buttons (edit, delete, view schedule)

**Search Implementation**:
```typescript
const searchChannels = async (
  searchTerm: string,
  filters: ChannelSearchRequest,
  page: number
): Promise<SearchResponse<ServiceChannel>>
```

**Filter UI**:
```
┌─────────────────────────────────────────────┐
│ Channels                                    │
├─────────────────────────────────────────────┤
│ [Search box]      [+ Create Channel]        │
│                                              │
│ Platform: □ OTT  □ DTH  □ Both             │
│ Type: □ Linear □ VOD □ Premium  [Clear]   │
│                                              │
│ Name                │ Type  │ Status │ Edit │
├─────────────────────────────────────────────┤
│ HBO HD              │ Linear│ Active │ [+] │
│ Showtime            │ Linear│ Inactive│[+] │
│ Sports Plus         │ VOD   │ Active │ [+] │
└─────────────────────────────────────────────┘
```

**Data Loading**:
- Use React Query with debounced search
- Load 20 items per page
- Show skeleton loaders while loading
- Handle empty state with helpful message

**API Endpoint**:
```
POST /channels/search
Content-Type: application/json

{
  "searchString": "HBO",
  "platform": ["ott"],
  "chanType": ["linear"],
  "source": ["gracenote"],
  "published": true,
  "page": 1,
  "pageSize": 20
}
```

**Response**:
```json
{
  "channels": [ServiceChannel[]],
  "total": 42,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

### [ ] Channel Detail Form (Create/Edit)

**Status**: Not Started

**Objective**: Create comprehensive form for managing channel configuration.

**File**: `src/pages/channels/ChannelDetailPage.tsx` (main container)

**Sub-components**:
- `ChannelBasicInfo.tsx` - Names, type, platform
- `ChannelRegionCategory.tsx` - Region and category assignment
- `ChannelDRM.tsx` - DRM configuration
- `ChannelCDN.tsx` - CDN configuration
- `ChannelDayparts.tsx` - Daypart management
- `ChannelMasterSlave.tsx` - Master/slave linking
- `ChannelProviderMapping.tsx` - Provider channel mapping
- `ChannelPropertyToggles.tsx` - Status, adult, transmit, bubble, PPV

**Form Tabs Layout**:
```
┌─────────────────────────────────────────────────┐
│ Channel: HBO HD                                 │
├─────────────────────────────────────────────────┤
│ [← Back] [Save] [Delete]                        │
├─────────────────────────────────────────────────┤
│ Basic | Regional | DRM/CDN | Dayparts | Mapping│
├─────────────────────────────────────────────────┤
│ TAB CONTENT                                     │
└─────────────────────────────────────────────────┘
```

**1. Channel Names (Multi-language)**

Support multiple languages and name types:

**Fields**:
- `channelNames[]`:
  - `value` (string) - Channel name
  - `lang` (string) - Language code (en, es, pt)
  - `type` (string) - Name type (display, legal, short, etc.)

**Component**:
```tsx
<div className="space-y-4">
  <h3>Channel Names</h3>
  {['en', 'es', 'pt'].map(lang => (
    <InputField
      key={lang}
      label={`Channel Name (${lang.toUpperCase()})`}
      value={getChannelName(lang)}
      onChange={(value) => updateChannelName(lang, value)}
    />
  ))}
</div>
```

**Data Structure**:
```typescript
channelNames: [
  { value: 'HBO HD', lang: 'en', type: 'display' },
  { value: 'HBO HD', lang: 'es', type: 'display' },
  { value: 'HBO HD', lang: 'pt', type: 'display' },
]
```

**2. Channel Type, Platform Target, Processing Type**

**Fields**:
- `channelType` (string) - Linear, VOD, Premium, Event, PPV
- `channelTarget` (string) - ott, dth, both
- `processingType` (string) - Manual, Automated, Hybrid
- `callSign` (string) - Broadcast call sign

**Options from Backend**:
```typescript
const channelTypes = ['Linear', 'VOD', 'Premium', 'Event'];
const platforms = ['ott', 'dth', 'both'];
const processingTypes = ['Manual', 'Automated', 'Hybrid'];
```

**Component**:
```tsx
<div className="grid grid-cols-2 gap-4">
  <SelectField
    label="Channel Type *"
    options={channelTypes}
    value={channel.channelType}
    onChange={(value) => updateChannel({ channelType: value })}
    required
  />
  <SelectField
    label="Platform Target *"
    options={platforms}
    value={channel.channelTarget}
    onChange={(value) => updateChannel({ channelTarget: value })}
    required
  />
  <SelectField
    label="Processing Type"
    options={processingTypes}
    value={channel.processingType}
    onChange={(value) => updateChannel({ processingType: value })}
  />
  <InputField
    label="Call Sign"
    value={channel.callSign || ''}
    onChange={(value) => updateChannel({ callSign: value })}
  />
</div>
```

**3. Region Assignment**

Allow users to assign channel to one or more regions.

**Component**:
```tsx
<MultiSelect
  label="Regions"
  options={availableRegions}
  value={channel.regions?.map(r => r.id) || []}
  onChange={(regionIds) => updateRegions(regionIds)}
  renderValue={(id) => findRegion(id)?.name}
/>
```

**API Call**:
```typescript
const { data: regions } = useQuery({
  queryKey: ['regions'],
  queryFn: () => referenceService.getRegions(),
});
```

**4. Category Assignment**

Assign channel to content categories (Sports, News, Movies, etc.).

**Component**:
```tsx
<MultiSelect
  label="Categories"
  options={availableCategories}
  value={channel.categories?.map(c => c.id) || []}
  onChange={(categoryIds) => updateCategories(categoryIds)}
/>
```

**5. DRM Configuration**

Manage Digital Rights Management for the channel.

**Fields** (from `ChannelUrl.drms[]`):
- DRM Provider (Widevine, FairPlay, PlayReady)
- Vendor/vendor name
- Certificate URL
- License URL
- DRM ID

**Component**:
```tsx
<ProgramDRM
  drms={channel.urls?.[0]?.drms || []}
  onAdd={addDRM}
  onRemove={removeDRM}
  onUpdate={updateDRM}
/>
```

**DRM Form**:
```tsx
interface DRMFormProps {
  drm?: Drm;
  onSave: (drm: Drm) => void;
  onCancel: () => void;
}

export function DRMForm({ drm, onSave, onCancel }: DRMFormProps) {
  const [formData, setFormData] = useState(drm || {});

  const drmOptions = ['Widevine', 'FairPlay', 'PlayReady', 'Marlin'];

  return (
    <div className="space-y-4">
      <SelectField
        label="DRM Type *"
        options={drmOptions}
        value={formData.drm}
        onChange={(value) => setFormData({ ...formData, drm: value })}
        required
      />
      <InputField
        label="Vendor Name *"
        value={formData.vendorName}
        onChange={(value) => setFormData({ ...formData, vendorName: value })}
        required
      />
      <InputField
        label="Certificate URL"
        type="url"
        value={formData.certificateUrl || ''}
        onChange={(value) => setFormData({ ...formData, certificateUrl: value })}
      />
      <InputField
        label="License URL"
        type="url"
        value={formData.licenseUrl || ''}
        onChange={(value) => setFormData({ ...formData, licenseUrl: value })}
      />
      <div className="flex gap-2">
        <button onClick={() => onSave(formData)}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
```

**6. CDN Configuration**

Manage Content Delivery Network configuration.

**Fields** (from `ChannelUrl.cdns[]`):
- CDN Vendor (Akamai, AWS CloudFront, etc.)
- Base URL
- CDN Channel ID
- CDN Country
- Resolution
- Content Type

**Component**:
```tsx
<ChannelCDN
  cdns={channel.urls?.[0]?.cdns || []}
  onAdd={addCDN}
  onRemove={removeCDN}
  onUpdate={updateCDN}
/>
```

**CDN Table**:
```
Vendor       │ Base URL              │ Country │ Actions
─────────────┼───────────────────────┼─────────┼────────
Akamai       │ https://edge1.ak... │ BR      │ Edit Del
CloudFront   │ https://d123.cf...  │ BR      │ Edit Del
```

### [ ] Channel Image Management

**Status**: Not Started

**Objective**: Upload and manage channel logos/thumbnails.

**Features**:
- Upload channel logo/image
- Set primary image
- Support different sizes for different platforms
- Image preview
- Delete image

**Component**:
```tsx
<ChannelImageUpload
  channelId={channelId}
  currentImage={channel.channelImage}
  onUpload={handleImageUpload}
  onDelete={handleImageDelete}
/>
```

### [ ] Channel Property Toggles

**Status**: Not Started

**Objective**: Manage boolean flags for channel properties.

**Toggle Properties**:
- `status` (boolean) - Active/inactive
- `adult` (boolean) - Adult content indicator
- `auto` (boolean) - Auto-transmit schedule
- `bubble` (boolean) - Bubble channel
- `ppv` (boolean) - Pay-per-view
- `published` (boolean) - Published status

**Component**:
```tsx
<div className="space-y-2">
  <ToggleSwitch
    label="Active"
    checked={channel.status || false}
    onChange={(value) => updateChannel({ status: value })}
  />
  <ToggleSwitch
    label="Adult Content"
    checked={channel.adult || false}
    onChange={(value) => updateChannel({ adult: value })}
  />
  <ToggleSwitch
    label="Auto-Transmit"
    checked={channel.auto || false}
    onChange={(value) => updateChannel({ auto: value })}
  />
  <ToggleSwitch
    label="Bubble Channel"
    checked={channel.bubble || false}
    onChange={(value) => updateChannel({ bubble: value })}
  />
  <ToggleSwitch
    label="Pay-Per-View"
    checked={channel.ppv || false}
    onChange={(value) => updateChannel({ ppv: value })}
  />
  <ToggleSwitch
    label="Published"
    checked={channel.published || false}
    onChange={(value) => updateChannel({ published: value })}
  />
</div>
```

### [ ] Master/Slave Channel Linking

**Status**: Not Started

**Objective**: Link slave channels to master channels for content sharing.

**Concepts**:
- Master channel: Original channel with all metadata
- Slave channel: Linked channel that inherits content from master
- Use case: Regional variants of same channel

**Fields**:
- `masterSource` (string) - ID of master channel
- `isSlave` (boolean) - Is this a slave channel?

**Component**:
```tsx
<div className="space-y-4">
  <CheckboxField
    label="This is a Slave Channel"
    checked={channel.dthInfo?.isSlave || false}
    onChange={handleSlaveToggle}
  />

  {channel.dthInfo?.isSlave && (
    <SelectField
      label="Master Channel *"
      options={masterChannels}
      value={channel.dthInfo?.masterSource}
      onChange={(value) => updateDthInfo({ masterSource: value })}
      required
    />
  )}
</div>
```

**API Endpoint**:
```
GET /channels/masters - Get list of master channels
```

### [ ] Provider Channel Mapping

**Status**: Not Started

**Objective**: Map VLS channels to provider channels (GraceNote, DMS, etc.).

**Concepts**:
- VLS channel: Internal channel definition
- Provider channel: External provider's channel definition
- Map: Link VLS channel to one or more provider channels

**Fields** (from `ProviderChannel`):
- Provider (gracenote, dms, blim, etc.)
- Provider channel name
- Provider channel ID
- Language
- Broadcast languages
- Editorial languages

**Component**:
```tsx
<ChannelProviderMapping
  channelId={channel.id}
  mappings={channel.providerMappings || []}
  onAdd={addMapping}
  onRemove={removeMapping}
/>
```

**Mapping Table**:
```
Provider     │ Provider Channel ID │ Name    │ Language │ Actions
─────────────┼────────────────────┼─────────┼──────────┼────────
GraceNote    │ 12345              │ HBO HD  │ en       │ Edit Del
DMS          │ gc789              │ HBO     │ en, es   │ Edit Del
```

**API Endpoints**:
```
GET /channels/{id}/mappings           - List mappings
POST /channels/{id}/mappings          - Add mapping
DELETE /channels/{id}/mappings/{id}   - Remove mapping
GET /channels/provider-channels       - Search provider channels
```

### [ ] Daypart Management

**Status**: Not Started

**Objective**: Manage dayparts (time periods) for programming guides.

**Concepts**:
- Daypart: Time period (e.g., 6am-12pm)
- Schedule service channel: Specific guide channel for a daypart
- Used for multi-guide schedules

**Fields** (from `Daypart`):
- Start date
- End date
- Mappings (array of DaypartMapping):
  - Start date
  - End date
  - Service channel ID (prgSvcId)
  - Language

**Component**:
```tsx
<ChannelDayparts
  dayparts={channel.dayParts || []}
  onAdd={addDaypart}
  onRemove={removeDaypart}
  onUpdate={updateDaypart}
/>
```

**Daypart Form**:
```tsx
interface DaypartFormProps {
  daypart?: Daypart;
  onSave: (daypart: Daypart) => void;
  onCancel: () => void;
}

export function DaypartForm({ daypart, onSave, onCancel }: DaypartFormProps) {
  const [formData, setFormData] = useState(daypart || {
    startDate: '',
    endDate: '',
    mappings: [],
  });

  return (
    <div className="space-y-4">
      <DateField
        label="Start Date *"
        value={formData.startDate}
        onChange={(value) => setFormData({ ...formData, startDate: value })}
        required
      />
      <DateField
        label="End Date *"
        value={formData.endDate}
        onChange={(value) => setFormData({ ...formData, endDate: value })}
        required
      />

      <div className="mt-6">
        <h4 className="font-bold mb-2">Mappings</h4>
        {formData.mappings?.map((mapping, index) => (
          <div key={index} className="grid grid-cols-3 gap-2 mb-2">
            <DateField
              label="Start Date"
              value={mapping.startDate}
              onChange={(value) => updateMapping(index, 'startDate', value)}
            />
            <DateField
              label="End Date"
              value={mapping.endDate}
              onChange={(value) => updateMapping(index, 'endDate', value)}
            />
            <SelectField
              label="Service Channel"
              options={serviceChannels}
              value={mapping.prgSvcId}
              onChange={(value) => updateMapping(index, 'prgSvcId', value)}
            />
          </div>
        ))}
        <button onClick={() => addMapping()}>+ Add Mapping</button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => onSave(formData)}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
```

## API Endpoints Reference

### Channel Operations
```
GET    /channels                      - List channels
GET    /channels/{id}                 - Get channel details
POST   /channels                      - Create channel
PUT    /channels/{id}                 - Update channel
DELETE /channels/{id}                 - Delete channel
POST   /channels/search              - Search with filters

GET    /channels/{id}/images         - Get channel images
POST   /channels/{id}/images         - Upload image
DELETE /channels/{id}/images/{imgId} - Delete image

GET    /channels/{id}/mappings       - List provider mappings
POST   /channels/{id}/mappings       - Add mapping
DELETE /channels/{id}/mappings/{id}  - Remove mapping

GET    /channels/provider-channels   - Search provider channels
GET    /channels/masters             - List master channels

GET    /reference/regions            - Get available regions
GET    /reference/categories         - Get available categories
GET    /reference/channel-types      - Get available channel types
```

## Data Models

### ServiceChannel
From `src/types/channel.types.ts`:

```typescript
interface ServiceChannel {
  id: string;
  name?: string;
  callSign?: string;
  channelTarget: string;        // ott, dth, both
  channelType: string;          // Linear, VOD, Premium, etc.
  language?: string;
  auto?: boolean;               // Auto-transmit
  adult?: boolean;              // Adult content
  status?: boolean;             // Active/inactive
  bubble?: boolean;
  vcId?: string;
  masterSource?: string;
  region?: string;
  assignedTo?: string[];
  categories?: ChannelCategory[];
  channelNames?: ValueLang[];   // Multi-language names
  createdDate: string;
  updatedDate: string;
  dayParts?: Daypart[];
  descriptions?: Description[];
  processingType?: string;      // Manual, Automated, Hybrid
  published: boolean;
  urls?: ChannelUrl[];          // DRM/CDN config
  dthInfo?: DthInfo;            // DTH-specific settings
  timeZone?: string;
  ppv?: boolean;                // Pay-per-view
}
```

### Daypart
```typescript
interface Daypart {
  id?: string;
  startDate: string;
  endDate: string;
  mappings?: DaypartMapping[];
}

interface DaypartMapping {
  startDate: string;
  endDate: string;
  prgSvcId?: string;
  lang?: string;
}
```

### DRM Configuration
```typescript
interface Drm {
  drmId: string;
  name: string;
  drm: string;
  vendorId: string;
  vendorName: string;
  certificateUrl?: string;
  licenseUrl?: string;
}
```

### CDN Configuration
```typescript
interface Cdn {
  vendorId: string;
  vendorName: string;
  baseUrl: string;
  cdnChannelId?: string;
  cdnCountry?: string;
}
```

## Implementation Order

1. Channel List Page with Search/Filters
2. Channel Detail Form - Basic Info
3. Channel Detail Form - DRM/CDN
4. Channel Image Management
5. Property Toggles
6. Master/Slave Linking
7. Provider Channel Mapping
8. Daypart Management

## Testing Checklist

- [ ] Search filters work correctly
- [ ] Channel names in multiple languages
- [ ] Platform target validation (ott/dth/both)
- [ ] Region assignment with multi-select
- [ ] DRM configuration CRUD
- [ ] CDN configuration CRUD
- [ ] Channel image upload and delete
- [ ] Property toggles persist
- [ ] Master/slave linking validation
- [ ] Provider mappings searchable
- [ ] Daypart mappings editable
- [ ] Delete channel with confirmation
- [ ] Form validation on save
