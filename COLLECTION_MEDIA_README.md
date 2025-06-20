# Collection Media System

<!-- Deployment trigger: Header refactor with NextAuth server component -->

This document describes the new flexible media management system for collections.

## Overview

The new system replaces the fixed-slot collection videos with a flexible media system that supports:
- Multiple collections
- Variable number of media items per collection
- Support for both videos and photos
- Proper file storage and cleanup
- Row-level security

## Database Schema

### Collections Table
```sql
CREATE TABLE "public"."Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);
```

### Media Items Table
```sql
CREATE TABLE "public"."MediaItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL, -- 'video' or 'photo'
    "filePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "duration" INTEGER, -- Duration in seconds for videos
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);
```

## API Endpoints

### Collections
- `GET /api/collections` - List all collections
- `POST /api/collections` - Create a new collection

### Media Items
- `GET /api/collections/[id]/items` - Get media items for a collection
- `POST /api/collections/[id]/items` - Upload new media item
- `DELETE /api/media/[itemId]` - Delete a media item

## Features

### Frontend Components
1. **CollectionMediaPage** - Main admin page for managing media
2. **MediaItemCard** - Individual media item display with edit/delete
3. **Toast Notifications** - User feedback for all operations

### Key Features
- **Flexible Media Count**: No fixed slots, add as many items as needed
- **File Management**: Automatic upload to Supabase Storage with cleanup
- **Error Handling**: Comprehensive error handling with user feedback
- **Loading States**: Visual feedback during operations
- **Delete Confirmation**: Modal confirmation before deletion
- **Optimistic Updates**: UI updates immediately, reverts on error

### Security
- Row-level security enabled on all tables
- Service role for admin operations
- Public read access for media items
- Proper file cleanup on deletion

## Setup Instructions

1. **Database Setup**: Run the SQL script in `scripts/setup-database.sql`
2. **Environment Variables**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
3. **Storage Bucket**: Create a 'media' bucket in Supabase Storage
4. **Storage Policies**: Configure RLS policies for the media bucket

## Usage

1. Navigate to `/admin/collection-videos`
2. Select a collection from the dropdown
3. Click "Upload Media" to add new items
4. Use the cards to edit or delete existing items
5. All operations provide toast notifications

## File Structure

```
src/app/admin/collection-videos/
├── page.tsx                    # Main page with ToastProvider
├── CollectionMediaPage.tsx     # Main component
└── CollectionVideosPage.tsx    # Old component (deprecated)

src/app/api/
├── collections/
│   ├── route.ts               # Collection management
│   └── [id]/items/route.ts    # Media items for collection
└── media/[itemId]/route.ts    # Individual media operations

src/components/
├── Toast.tsx                  # Toast notification system
└── MediaItemCard.tsx          # Media item display component

src/lib/
└── supabaseAdmin.ts           # Supabase admin client
```

## Migration from Old System

The old `CollectionVideo` model is still available for backward compatibility. The new system provides:
- Better flexibility
- Proper file management
- Improved error handling
- Better user experience

## Future Enhancements

- Edit functionality for media items
- Bulk operations
- Media preview/player
- Advanced filtering and search
- Collection management UI 