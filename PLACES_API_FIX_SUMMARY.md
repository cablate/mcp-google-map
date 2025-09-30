# Google Places API Migration Fix

## Problem
The `get_place_details` tool was returning HTTP 403 errors with the message:
```
Failed to get place details for ChIJQ2BmJhVwhlQRPkt6FWiet90: You're calling a legacy API, which is not enabled for your project. To get newer features and more functionality, switch to the Places API (New) or Routes API.
```

## Solution
Migrated from the legacy Google Places API to the new Places API (New) to resolve the HTTP 403 errors and ensure continued functionality.

## Changes Made

### 1. Added New Dependency
- Added `@googlemaps/places` package (v2.1.0) to `package.json`
- This is the official Google client library for the new Places API

### 2. Created New Service Class
- **File**: `src/services/NewPlacesService.ts`
- Implements the new Places API client
- Maintains backward compatibility by transforming the new API response format to match the legacy format
- Handles field mapping and data transformation

### 3. Updated PlacesSearcher
- **File**: `src/services/PlacesSearcher.ts`
- Modified `getPlaceDetails()` method to use the new `NewPlacesService`
- Maintains the same interface and response format for existing code

### 4. Key Features of the New Implementation
- Uses the new Places API (New) endpoint
- Proper field mask handling to avoid unnecessary billing
- Maintains backward compatibility with existing response structure
- Enhanced error handling for the new API
- Support for all existing place details fields (name, address, rating, reviews, etc.)

### 5. Testing
- Created `test-new-api.js` script to verify the new implementation
- Build process verified to work correctly
- Maintains existing functionality while using the new API

## Files Modified
1. `package.json` - Added new dependency
2. `src/services/NewPlacesService.ts` - New service class (created)
3. `src/services/PlacesSearcher.ts` - Updated to use new service
4. `README.md` - Added information about the API migration
5. `test-new-api.js` - Test script (created)

## How to Apply the Fix

### Option 1: Apply the Patch File
```bash
git apply places-api-fix.patch
```

### Option 2: Manual Implementation
1. Install the new dependency:
   ```bash
   npm install @googlemaps/places
   ```

2. Copy the new service file:
   ```bash
   cp src/services/NewPlacesService.ts /path/to/your/project/src/services/
   ```

3. Update `src/services/PlacesSearcher.ts` to import and use the new service:
   ```typescript
   import { NewPlacesService } from "./NewPlacesService.js";
   
   // In constructor:
   this.newPlacesService = new NewPlacesService(apiKey);
   
   // In getPlaceDetails method:
   const details = await this.newPlacesService.getPlaceDetails(placeId);
   ```

## Benefits
- ✅ Resolves HTTP 403 errors from legacy API
- ✅ Uses the latest Google Places API with improved features
- ✅ Maintains backward compatibility
- ✅ Better error handling and field management
- ✅ Future-proof implementation

## Testing
To test the fix, run:
```bash
export GOOGLE_MAPS_API_KEY="your-api-key"
node test-new-api.js
```

This will test the `get_place_details` functionality with the new API implementation.