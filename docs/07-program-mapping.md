# Program Mapping Workflow

## Overview

Program Mapping handles the workflow for matching programs from external providers (like Gracenote) to VLS internal program entities. This is critical for reconciling provider-supplied content with the VLS master data. The workflow includes searching, matching, confirming, and publishing mappings.

## Pending Tasks

### [ ] Unmapped Programs List

**Status**: Not Started

**Objective**: Display programs that need mapping to VLS entities.

**File**: `src/pages/workflows/ProgramMappingPage.tsx`

**Features**:
- List of unmapped programs from external providers
- Show program details (title, year, type, provider)
- Filter by provider, program type, date range
- Search by title
- Sort by date, title, provider
- Pagination
- Quick action: "Map Program" button
- Bulk actions: "Map Selected", "Skip Selected"

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│ Program Mapping Workflow                            │
├─────────────────────────────────────────────────────┤
│ [Search box]  Provider: GraceNote ▼  [+ Map Manual]│
│                                                      │
│ Unmapped Count: 342                                 │
│                                                      │
│ Title          │ Year │ Type │ Provider │ Actions   │
├─────────────────────────────────────────────────────┤
│ Game of Thrones│ 2011 │ SH   │ GraceNote│ [Map]     │
│ Breaking Bad   │ 2008 │ SH   │ GraceNote│ [Map]     │
│ The Office     │ 2005 │ SV   │ GraceNote│ [Map]     │
│                     [Previous] [1] [2] [Next]       │
└─────────────────────────────────────────────────────┘
```

**Data Structure**:
```typescript
interface UnmappedProgram {
  id: string;
  providerId: string;       // ID in provider system
  title: string;
  alternativeTitles?: string[];
  year?: number;
  programType: string;
  provider: string;         // GraceNote, DMS, etc.
  metadata?: Record<string, any>;
  createdDate: string;
  suggestedMatches?: {
    vlsId: string;
    matchScore: number;
    matchReason: string;
  }[];
}
```

**API Endpoint**:
```
GET /mapping/unmapped
Query params:
  - provider: string
  - programType?: string
  - page: number
  - pageSize: number

Response:
{
  "programs": [UnmappedProgram[]],
  "total": 342,
  "page": 1,
  "pageSize": 20
}
```

**Component**:
```tsx
export function ProgramMappingPage() {
  const [provider, setProvider] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data: unmappedPrograms, isLoading } = useQuery({
    queryKey: ['unmapped-programs', provider, page],
    queryFn: () => mappingService.getUnmappedPrograms({
      provider,
      searchString: searchTerm,
      page,
      pageSize: 20,
    }),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded"
        />
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Providers</option>
          <option value="gracenote">GraceNote</option>
          <option value="dms">DMS</option>
        </select>
      </div>

      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Showing {unmappedPrograms.programs.length} of {unmappedPrograms.total}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Title</th>
                  <th className="text-left py-2">Year</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Provider</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {unmappedPrograms.programs.map(program => (
                  <tr key={program.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{program.title}</td>
                    <td className="py-2">{program.year}</td>
                    <td className="py-2">{program.programType}</td>
                    <td className="py-2">{program.provider}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleMapProgram(program.id)}
                        className="text-blue-500 hover:underline"
                      >
                        Map
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(unmappedPrograms.total / 20)}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
```

### [ ] Program Search for Mapping Target

**Status**: Not Started

**Objective**: Search for existing VLS programs to match against unmapped provider programs.

**Features**:
- Search VLS programs by title, ID, year
- Auto-suggest similar programs based on title
- Show program details (type, year, platform)
- Display match confidence score

**Component**:
```tsx
interface ProgramSearchDialogProps {
  providerProgram: UnmappedProgram;
  onSelect: (vlsProgram: Program) => void;
  onCancel: () => void;
}

export function ProgramSearchDialog({
  providerProgram,
  onSelect,
  onCancel,
}: ProgramSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState(providerProgram.title);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['vls-programs-search', searchTerm],
    queryFn: () => programService.search(searchTerm),
    enabled: searchTerm.length > 2,
  });

  const calculateMatchScore = (vlsProgram: Program): number => {
    // Fuzzy string matching on titles
    // Match year if available
    // Match program type
    // Return score 0-1
    return fuzzyMatch(providerProgram.title, vlsProgram.titles[0]?.value || '');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          Find Match for: {providerProgram.title}
        </h2>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search VLS programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            autoFocus
          />
        </div>

        {isLoading ? (
          <p>Searching...</p>
        ) : searchResults && searchResults.length > 0 ? (
          <div className="space-y-2 mb-4">
            {searchResults
              .map(prog => ({
                program: prog,
                score: calculateMatchScore(prog),
              }))
              .sort((a, b) => b.score - a.score)
              .map(({ program, score }) => (
                <div
                  key={program.id}
                  className={`border rounded p-3 cursor-pointer hover:bg-blue-50 ${
                    selectedProgram?.id === program.id ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => setSelectedProgram(program)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">
                        {program.englishTitle?.value || program.titles[0]?.value}
                      </p>
                      <p className="text-sm text-gray-600">
                        {program.releaseYear} | {program.programType}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        {(score * 100).toFixed(0)}% match
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-600 mb-4">No programs found</p>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedProgram && onSelect(selectedProgram)}
            disabled={!selectedProgram}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Select Match
          </button>
        </div>
      </div>
    </div>
  );
}
```

**API Endpoint**:
```
POST /programs/search
Content-Type: application/json

{
  "searchString": "Game of Thrones",
  "filters": [],
  "page": 1,
  "pageSize": 10
}
```

### [ ] Map/Unmap Workflow

**Status**: Not Started

**Objective**: Create and manage mappings between provider programs and VLS programs.

**Workflow Steps**:

#### Step 1: Select Unmapped Program
User clicks "Map" button on unmapped program from the list.

#### Step 2: Search for VLS Match
Dialog opens with program search where user finds the matching VLS program.

#### Step 3: Confirm Mapping
Display both programs side-by-side, showing comparison of key fields.

```
Provider Program (GraceNote)  |  VLS Program
─────────────────────────────┼──────────────────
Title: Game of Thrones        |  Title: Game of Thrones
Year: 2011                    |  Year: 2011
Type: Series                  |  Type: Series
Episodes: 73                  |  Episodes: 73
```

#### Step 4: Cast Role Assignment (if needed)
If programs have different cast lists, user can map actors.

#### Step 5: Save Mapping
Create mapping record linking provider program to VLS program.

**Data Structure**:
```typescript
interface ProgramMapping {
  id?: string;
  providerProgramId: string;
  vlsProgramId: string;
  provider: string;
  status: 'pending' | 'confirmed' | 'published' | 'rejected';
  matchConfidence: number;     // 0-1
  castMappings?: CastMapping[];
  notes?: string;
  createdDate?: string;
  confirmedDate?: string;
  confirmedBy?: string;
  publishedDate?: string;
}

interface CastMapping {
  providerPersonId: string;
  vlsPersonId: string;
  personName: string;
  role?: string;
}
```

**Component**:
```tsx
export function MappingWorkflowDialog({
  unmappedProgram,
  onComplete,
  onCancel,
}: MappingWorkflowDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedVlsProgram, setSelectedVlsProgram] = useState<Program | null>(null);
  const [castMappings, setCastMappings] = useState<CastMapping[]>([]);

  const handleNext = async () => {
    if (step === 5) {
      // Save mapping
      const mapping: ProgramMapping = {
        providerProgramId: unmappedProgram.id,
        vlsProgramId: selectedVlsProgram!.id,
        provider: unmappedProgram.provider,
        status: 'pending',
        matchConfidence: 0.95,
        castMappings,
      };

      await mappingService.createMapping(mapping);
      onComplete(mapping);
    } else {
      setStep((step + 1) as any);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-xl font-bold mb-4">Map Program</h2>

        {/* Step indicators */}
        <div className="flex justify-between mb-6">
          {[1, 2, 3, 4, 5].map(s => (
            <div
              key={s}
              className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                s <= step ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 1 && <Step1Provider program={unmappedProgram} />}
        {step === 2 && (
          <Step2Search
            program={unmappedProgram}
            onSelect={setSelectedVlsProgram}
          />
        )}
        {step === 3 && (
          <Step3Confirm
            providerProgram={unmappedProgram}
            vlsProgram={selectedVlsProgram!}
          />
        )}
        {step === 4 && (
          <Step4CastMapping
            providerProgram={unmappedProgram}
            vlsProgram={selectedVlsProgram!}
            onMappingsChange={setCastMappings}
          />
        )}
        {step === 5 && <Step5Summary mapping={{ providerProgramId: unmappedProgram.id }} />}

        {/* Navigation */}
        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          {step > 1 && (
            <button
              onClick={() => setStep((step - 1) as any)}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            disabled={step === 2 && !selectedVlsProgram}
          >
            {step === 5 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### [ ] Publish Mapping

**Status**: Not Started

**Objective**: Publish confirmed mappings to make them active in the system.

**Features**:
- List pending/unpublished mappings
- Bulk publish mappings
- Review mapping before publish
- Publish confirmation
- Publish history/audit trail

**Component**:
```tsx
export function PublishMappingDialog({
  mapping,
  onPublish,
  onCancel,
}: PublishMappingDialogProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [comment, setComment] = useState('');

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await mappingService.publishMapping(mapping.id, { comment });
      onPublish();
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <p className="font-bold">Provider Program</p>
        <p>{mapping.providerProgram?.title}</p>
      </div>

      <div>▼</div>

      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <p className="font-bold">VLS Program</p>
        <p>{mapping.vlsProgram?.englishTitle?.value}</p>
      </div>

      <div>
        <label className="block font-bold mb-2">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-4 py-2 border rounded"
          rows={3}
          placeholder="Add note about this mapping..."
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 border rounded">
          Cancel
        </button>
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          {isPublishing ? 'Publishing...' : 'Publish Mapping'}
        </button>
      </div>
    </div>
  );
}
```

**API Endpoint**:
```
POST /mapping/{mappingId}/publish
Content-Type: application/json

{
  "comment": "Matched based on title and year"
}
```

### [ ] Cast Role Assignment

**Status**: Not Started

**Objective**: Map cast members between provider and VLS programs if they differ.

**Features**:
- Show cast from both programs side-by-side
- Manually link cast members
- Auto-match based on name similarity
- Review and confirm cast mapping

**Component**:
```tsx
interface CastMappingStepProps {
  providerCast: CastAndCrew[];
  vlsCast: CastAndCrew[];
  onMappingsChange: (mappings: CastMapping[]) => void;
}

export function CastMappingStep({
  providerCast,
  vlsCast,
  onMappingsChange,
}: CastMappingStepProps) {
  const [mappings, setMappings] = useState<CastMapping[]>([]);

  const handleMapActor = (providerPersonId: string, vlsPersonId: string) => {
    const newMapping: CastMapping = {
      providerPersonId,
      vlsPersonId,
      personName: vlsCast.find(c => c.personId === vlsPersonId)?.name?.preferred || '',
      role: vlsCast.find(c => c.personId === vlsPersonId)?.characterName,
    };

    setMappings([...mappings.filter(m => m.providerPersonId !== providerPersonId), newMapping]);
    onMappingsChange(mappings);
  };

  return (
    <div>
      <h3 className="font-bold mb-4">Cast Mapping</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-bold mb-2">Provider Cast</h4>
          <div className="space-y-2">
            {providerCast.map(person => (
              <div key={person.personId} className="border rounded p-2">
                <p className="font-bold">{person.firstName} {person.lastName}</p>
                <p className="text-sm">{person.characterName || person.role}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-2">VLS Cast</h4>
          <div className="space-y-2">
            {vlsCast.map(person => (
              <div key={person.personId} className="border rounded p-2 cursor-pointer hover:bg-blue-50">
                <p className="font-bold">{person.name?.preferred || `${person.firstName} ${person.lastName}`}</p>
                <p className="text-sm">{person.characterName || person.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## API Endpoints Reference

### Mapping Operations
```
GET    /mapping/unmapped              - Get unmapped programs
POST   /mapping                       - Create new mapping
GET    /mapping/{mappingId}           - Get mapping details
PUT    /mapping/{mappingId}           - Update mapping
DELETE /mapping/{mappingId}           - Delete mapping

POST   /mapping/{mappingId}/confirm   - Confirm mapping
POST   /mapping/{mappingId}/publish   - Publish mapping
POST   /mapping/bulk-publish          - Publish multiple mappings

GET    /mapping/history               - Mapping history/audit
GET    /mapping/statistics            - Mapping statistics
```

## Data Models

### ProgramMapping
```typescript
interface ProgramMapping {
  id: string;
  providerProgramId: string;
  vlsProgramId: string;
  provider: string;        // gracenote, dms, etc.
  status: 'pending' | 'confirmed' | 'published' | 'rejected';
  matchConfidence: number;  // 0-1
  castMappings?: CastMapping[];
  episodeMappings?: EpisodeMapping[];
  notes?: string;
  createdDate: string;
  createdBy: string;
  confirmedDate?: string;
  confirmedBy?: string;
  publishedDate?: string;
  publishedBy?: string;
}

interface CastMapping {
  providerPersonId: string;
  vlsPersonId: string;
  personName: string;
  role?: string;
}

interface EpisodeMapping {
  providerEpisodeId: string;
  vlsEpisodeId: string;
  seasonNumber: number;
  episodeNumber: number;
}
```

## Business Rules

1. **Match Confidence**: Calculate based on:
   - Title match (fuzzy string matching)
   - Year match (exact or within 1 year)
   - Program type match
   - Episode count match (for series)

2. **Status Workflow**:
   - pending: User created mapping, awaiting confirmation
   - confirmed: Mapping reviewed and approved
   - published: Mapping active in system
   - rejected: Mapping declined, marked for review

3. **Cast Mapping**:
   - Optional if cast lists match
   - Required if provider and VLS have different cast
   - Role/character name should match after mapping

4. **Audit Trail**:
   - Track who created, confirmed, published mapping
   - Keep timestamps of all changes
   - Allow reverting to previous mapping versions

## Implementation Order

1. Unmapped Programs List
2. Program Search for Mapping Target
3. Map/Unmap Workflow
4. Cast Role Assignment
5. Publish Mapping

## Testing Checklist

- [ ] Unmapped programs list displays correctly
- [ ] Search finds matching VLS programs
- [ ] Match confidence calculated accurately
- [ ] Mapping created with correct data
- [ ] Cast mapping works for multi-actor programs
- [ ] Publish workflow confirms and saves
- [ ] Audit trail tracks changes
- [ ] Bulk publish handles multiple mappings
- [ ] Cannot map same provider program twice
- [ ] Unmap removes mapping and reverts status
