# UploadThing Setup Guide

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# UploadThing Configuration
UPLOADTHING_SECRET=your-uploadthing-secret-here
UPLOADTHING_APP_ID=your-uploadthing-app-id-here

# Keep existing Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Setup Steps

1. **Create UploadThing Account**: Go to [uploadthing.com](https://uploadthing.com) and create an account
2. **Create New App**: Create a new app in your UploadThing dashboard
3. **Get Credentials**: Copy your App ID and Secret from the dashboard
4. **Update Environment**: Replace the placeholder values in `.env.local` with your actual credentials
5. **Restart Development Server**: Restart your Next.js development server

## Features Implemented

- ✅ Video upload endpoint (`/api/uploadthing/core.ts`)
- ✅ Upload API route (`/api/uploadthing/route.ts`)
- ✅ Protected video access endpoint (`/api/protected-video/route.ts`)
- ✅ Hero upload widget component (`/components/HeroUploadWidget.tsx`)
- ✅ Integration with admin hero-videos page
- ✅ Supabase database integration for storing video URLs

## Usage

1. **Admin Upload**: Use the upload widget in `/admin/hero-videos` to upload new hero videos
2. **Protected Access**: Videos are accessible via `/api/protected-video?id=collectionId` with proper authentication
3. **Database Storage**: Video URLs are automatically saved to the `hero_videos` table in Supabase

## File Structure

```
src/
├── app/
│   └── api/
│       ├── uploadthing/
│       │   ├── core.ts          # Upload configuration
│       │   └── route.ts         # Upload endpoint
│       └── protected-video/
│           └── route.ts         # Protected media access
├── components/
│   └── HeroUploadWidget.tsx     # Upload widget component
└── lib/
    └── supabase.ts              # Supabase client (unchanged)
```

## Next Steps

1. Set up your UploadThing account and add credentials
2. Test the upload functionality
3. Configure any additional upload endpoints as needed
4. Add proper authentication to the upload middleware if required 