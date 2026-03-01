# Genre and Rating Translation - Fix Summary

## Problem
User reported that genre and rating translation wasn't working - IDs were showing instead of human-readable names, and no API calls were being made to fetch the genre/rating reference data.

## Root Cause Analysis

### Issue 1: Reference Data Not Being Loaded
- The app has an `AppContext` with infrastructure to load genres and ratings globally
- `AppContext` has a `loadReferenceData()` function that fetches genres, ratings, regions, labels, etc.
- **Problem**: `loadReferenceData()` was never being called, so genres and ratings stayed empty arrays
- **Result**: No API calls were made to `/genres` or `/ratings` endpoints

### Issue 2: Wrong Import in ProgramBasicInfoTab
- `ProgramBasicInfoTab.tsx` was trying to import `getGenres` and `getRatings` from `program.service.ts`
- These functions don't exist in `program.service.ts`
- The correct location is `reference.service.ts`
- **Result**: Even if we had used React Query, it would have failed due to wrong imports

## Solution Implemented

### 1. Load Reference Data on App Startup
**File**: `src/components/layout/AppLayout.tsx`

Added useEffect to call `loadReferenceData()` when the app mounts:

```typescript
import { useApp } from '../../context/AppContext';

const AppLayout: React.FC = () => {
  const { loadReferenceData } = useApp();

  // Load reference data (genres, ratings, etc.) on mount
  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  // ... rest of component
};
```

**Result**: On app startup, genres and ratings are now fetched from the API and stored in AppContext.

### 2. Use AppContext Instead of React Query
**File**: `src/pages/programs/tabs/ProgramBasicInfoTab.tsx`

**Before** (incorrect):
```typescript
import { useQuery } from '@tanstack/react-query';
import { getGenres, getRatings } from '../../../services/program.service'; // Wrong!

const { data: genresData } = useQuery({
  queryKey: ['genres'],
  queryFn: getGenres,
  staleTime: 1000 * 60 * 60,
});
```

**After** (correct):
```typescript
import { useApp } from '../../../context/AppContext';

const { genres, ratings } = useApp(); // Get from global context

// Create lookup maps
const genreMap = useMemo(() => {
  const map = new Map<string, string>();
  genres.forEach((genre) => {
    map.set(genre.id, genre.name || genre.id);
  });
  return map;
}, [genres]);

const ratingMap = useMemo(() => {
  const map = new Map<string, string>();
  ratings.forEach((rating) => {
    const key = rating.rating || rating.code || rating.id;
    map.set(key, rating.name || key);
  });
  return map;
}, [ratings]);
```

### 3. Added Rating Translation Display
Updated the ratings section to show both the human-readable name and the code:

```typescript
{rating.rating && (
  <div>
    <span className="text-[var(--color-neutral-500)] text-xs">Rating:</span>
    <div className="text-[var(--color-neutral-800)] dark:text-white mt-1">
      <div className="font-medium">{getRatingName(rating.rating)}</div>
      <div className="text-xs text-[var(--color-neutral-500)] font-mono mt-0.5">
        {rating.rating}
      </div>
    </div>
  </div>
)}
```

**Display**:
- Top line: "PG-13" → Human name from rating map
- Bottom line: "PG-13" → Original code (in smaller gray text)

## How It Works Now

### Data Flow:
1. **App Startup** → `AppLayout` mounts
2. **Load Reference Data** → `loadReferenceData()` called
3. **API Calls** → Parallel requests to `/genres`, `/ratings`, `/regions`, etc.
4. **Store in Context** → Results stored in AppContext state
5. **Components Access** → Any component can use `useApp()` hook to access genres/ratings
6. **Translation** → Maps convert IDs to human-readable names

### API Calls Made:
- `GET /genres` - Returns all genre definitions with id and name
- `GET /ratings` - Returns all rating definitions with id, name, and rating code

### Benefits of AppContext Approach:
- ✅ Single API call on app startup (not repeated on every page)
- ✅ Cached in memory for the entire session
- ✅ Available to all components via `useApp()` hook
- ✅ Consistent with existing app architecture
- ✅ No duplicate React Query setup needed

## Testing
To verify the fix:
1. Open browser DevTools → Network tab
2. Reload the app
3. Should see API calls to `/genres` and `/ratings` on startup
4. Open a program detail page
5. Genres should show as "Action", "Drama", etc. instead of IDs
6. Ratings should show human-readable names like "PG-13" with code below

## Debug Logging
Added console logs to track the translation process:
- `[Genre Debug] Genre map created with X entries`
- `[Genre Debug] Program genres: [array]`
- `[Genre Debug] Translating ID -> Name`
- `[Rating Debug] Rating map created with X entries`

Check browser console to see if maps are being populated correctly.
