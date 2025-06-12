# Test Plan for Production Fixes

## Issues Fixed:

### 1. HeroVideo API 500 Errors
- ✅ Added `moderated` Boolean field to HeroVideo schema
- ✅ Updated API handlers to include `moderated` field in queries
- ✅ Added bodyParser configuration for large uploads (100mb)

### 2. Analytics API 400 Error
- ✅ Removed requirement for `videoId` parameter
- ✅ Made analytics endpoint return data for all videos when no videoId provided
- ✅ Added video information to analytics response

### 3. Collection Items 413 Error
- ✅ Removed file upload handling from API route
- ✅ Added bodyParser limit of 1mb for JSON payloads only
- ✅ Created client-side upload service for Supabase storage
- ✅ Updated API to accept metadata only (filePath, thumbnailPath, etc.)

## Test Steps:

### Test 1: HeroVideo API
1. GET /api/hero-videos - should return 200 with video data including `moderated` field
2. POST /api/hero-videos - should create new video with `moderated: false`
3. PUT /api/hero-videos - should update video and include `moderated` field

### Test 2: Analytics API
1. GET /api/hero-videos/analytics - should return 200 (no videoId required)
2. GET /api/hero-videos/analytics?videoId=1 - should return 200 with specific video analytics
3. GET /api/hero-videos/analytics?days=30 - should return 200 with date-filtered analytics

### Test 3: Collection Items API
1. GET /api/collections/[id]/items - should return 200 with collection items
2. POST /api/collections/[id]/items - should accept JSON metadata and return 200
3. File uploads should be handled client-side via Supabase storage

## Client-Side Upload Flow:
1. User selects file in collection interface
2. File uploaded directly to Supabase storage using `uploadCollectionMedia()`
3. API called with metadata only (filePath, thumbnailPath, etc.)
4. Database record created with storage paths

## Verification:
- No more 500 errors on hero-video endpoints
- No more 400 errors on analytics endpoint
- No more 413 errors on collection uploads
- Files properly stored in Supabase storage
- Metadata properly stored in Postgres via Prisma 