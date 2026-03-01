# Genre and Rating Translation - Final Fix

## Problem Summary
Genre and rating translation wasn't working because:
1. Type definitions didn't match the actual API response structure
2. API responses are wrapped in `{ "response": [...] }`
3. Genres have multilingual `names` arrays, not a single `name` field
4. Ratings have multilingual `descriptions` arrays, not a single `name` field

## Actual API Response Structure

### Genres API Response
```json
{
  "response": [
    {
      "id": "GN00000000AD00000000",
      "names": [
        {"value": "Basketball", "language": "en"},
        {"value": "Baloncesto", "language": "es"},
        {"value": "Basquete", "language": "pt"}
      ],
      "externalRefs": [...],
      "createdDate": 1595369537278,
      "updatedDate": 1611270053222
    }
  ]
}
```

### Ratings API Response
```json
{
  "response": [
    {
      "id": "RA010000000100000000",
      "code": "DJCTQ",
      "rating": "L",
      "organization": "Departamento de Justiça, Classificação, Títulos e Qualificação",
      "countryCode": "bra",
      "descriptions": [
        {"description": "Livre para todos os públicos", "language": "pt"},
        {"description": "Content is suitable for all audiences.", "language": "en"}
      ],
      "createdDate": "2021-03-24T23:17:08.569Z",
      "updatedDate": "2021-03-24T23:17:08.569Z"
    }
  ]
}
```

## Changes Made

### 1. Updated Type Definitions
**File**: `src/types/common.types.ts`

**Before**:
```typescript
export interface Genre {
  id: string;
  name: string;
  shortName?: string;
}

export interface RatingDefinition {
  id: string;
  name: string;
  shortName?: string;
  rating?: string;
  organization?: string;
  code?: string;
  descriptions?: Record<string, any>[];
}
```

**After**:
```typescript
export interface Genre {
  id: string;
  names: Array<{
    value: string;
    language: string;
  }>;
  externalRefs?: Array<{
    system: string;
    refName: string;
    id: string;
  }>;
  createdDate?: number;
  updatedDate?: number;
}

export interface RatingDefinition {
  id: string;
  rating: string;
  code?: string;
  organization?: string;
  countryCode?: string;
  descriptions?: Array<{
    description: string;
    language: string;
  }>;
  createdDate?: string;
  updatedDate?: string;
}
```

### 2. Updated Reference Service to Unwrap Response
**File**: `src/services/reference.service.ts`

```typescript
export const getGenres = async (): Promise<Genre[]> => {
  const result: any = await get('/genres');
  // API returns { response: Genre[] }
  return result.response || result || [];
};

export const getRatings = async (): Promise<RatingDefinition[]> => {
  const result: any = await get('/ratings');
  // API returns { response: RatingDefinition[] }
  return result.response || result || [];
};
```

### 3. Updated Translation Logic for Multilingual Data
**File**: `src/pages/programs/tabs/ProgramBasicInfoTab.tsx`

**Genre Translation**:
```typescript
const genreMap = useMemo(() => {
  const map = new Map<string, string>();
  genres.forEach((genre: any) => {
    // Extract name from multilingual names array (prefer English, fallback to first available)
    const englishName = genre.names?.find((n: any) => n.language === 'en')?.value;
    const firstName = genre.names?.[0]?.value;
    const name = englishName || firstName || genre.id;
    map.set(genre.id, name);
  });
  return map;
}, [genres, program.genres]);
```

**Rating Translation**:
```typescript
const ratingMap = useMemo(() => {
  const map = new Map<string, string>();
  ratings.forEach((rating: any) => {
    // Extract description from multilingual descriptions array (prefer English, fallback to first available)
    const englishDesc = rating.descriptions?.find((d: any) => d.language === 'en')?.description;
    const firstDesc = rating.descriptions?.[0]?.description;
    const name = englishDesc || firstDesc || rating.rating;
    // Map from rating code (e.g., "L", "PG-13") to display name
    map.set(rating.rating, name);
  });
  return map;
}, [ratings]);
```

### 4. Load Reference Data on App Startup
**File**: `src/components/layout/AppLayout.tsx`

```typescript
const AppLayout: React.FC = () => {
  const { loadReferenceData } = useApp();

  // Load reference data (genres, ratings, etc.) on mount
  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  // ... rest of component
};
```

## How Translation Works Now

1. **App Loads** → `AppLayout` calls `loadReferenceData()`
2. **API Calls Made** → GET `/genres` and GET `/ratings`
3. **Response Unwrapped** → Extract `response` array from wrapper
4. **Maps Created** →
   - Genre map: `GN00000000AD00000000` → `"Basketball"` (English name)
   - Rating map: `"L"` → `"Content is suitable for all audiences."` (English description)
5. **Translation Applied** →
   - Genre IDs shown as: **Basketball** `GN00000000AD00000000`
   - Rating codes shown as: **Content is suitable for all audiences.** `L`

## Language Preference
- **Primary**: English (`language: "en"`)
- **Fallback**: First available language in the array
- **Last Resort**: Use the ID/code itself

## Example Translations

### Genres
- `GN00000000AD00000000` → "Basketball"
- `GN00000000B400000000` → "Motorsports"

### Ratings (DJCTQ - Brazil)
- `L` → "Content is suitable for all audiences."
- `12` → "Content suitable for viewers over the age of 12."
- `14` → "Content suitable for viewers over the age of 14."

### Ratings (MPAA - USA)
- `PG` → "Parental guidance suggested"
- `PG-13` → "Parents strongly cautioned"
- `R` → "Restricted"

## Testing
1. Open the app and check Network tab - should see `/genres` and `/ratings` API calls
2. Open a program detail page
3. Check browser console for debug logs:
   ```
   [Genre Debug] Genre map created with X entries
   [Rating Debug] Rating map created with X entries
   ```
4. Verify genres show as names instead of IDs
5. Verify ratings show descriptions instead of just codes

## Debug Console Logs
The code includes debug logging to help troubleshoot:
- Genre map creation and size
- Sample genres loaded
- Program's genre IDs
- Genre ID → Name translation
- Rating map creation and size
- Sample ratings loaded
