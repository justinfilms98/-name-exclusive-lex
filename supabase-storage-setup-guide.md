# Supabase Storage Policy Setup Guide

## Issue
The SQL approach doesn't work because storage policies in Supabase need to be set up through the Storage Management interface, not SQL.

## Solution: Use Supabase Storage Management Interface

### Step 1: Access Storage Management

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Open Storage**
   - Click on "Storage" in the left sidebar
   - You should see your `media` bucket

### Step 2: Configure Bucket Policies

1. **Click on the `media` bucket**
   - This will open the bucket management interface

2. **Go to "Policies" tab**
   - Click on the "Policies" tab in the bucket interface

3. **Enable RLS (Row Level Security)**
   - Make sure RLS is enabled for the bucket

### Step 3: Create Storage Policies

You need to create these policies through the Supabase interface:

#### Policy 1: Allow Access to Purchased Media
- **Policy Name**: `Allow access to purchased media`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
EXISTS (
  SELECT 1 FROM public.purchases p
  JOIN public.collections c ON p.collection_id = c.id
  WHERE p.user_id = auth.uid()
  AND p.is_active = true
  AND (
    (c.media_filename IS NOT NULL AND name = c.media_filename)
    OR
    (c.video_path IS NOT NULL AND name = c.video_path)
    OR
    (c.media_filename IS NOT NULL AND name LIKE c.media_filename || '%')
    OR
    (c.video_path IS NOT NULL AND name LIKE c.video_path || '%')
  )
)
```

#### Policy 2: Allow Admin Uploads
- **Policy Name**: `Allow admin uploads`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND auth.users.email = 'contact.exclusivelex@gmail.com'
)
```

#### Policy 3: Allow Admin Updates
- **Policy Name**: `Allow admin updates`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND auth.users.email = 'contact.exclusivelex@gmail.com'
)
```

#### Policy 4: Allow Admin Deletes
- **Policy Name**: `Allow admin deletes`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND auth.users.email = 'contact.exclusivelex@gmail.com'
)
```

### Step 4: Alternative - Use Supabase CLI

If you prefer command line, you can use Supabase CLI:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Create storage policies
supabase db push
```

### Step 5: Test the Policies

1. **Test with a user who has purchased content**
   - Should be able to access video files
   - Should see videos load successfully

2. **Test with a user who hasn't purchased content**
   - Should get "Access Denied" or "Object not found"
   - Should not be able to access video files

3. **Test admin access**
   - Only `contact.exclusivelex@gmail.com` should be able to upload/update/delete

## Troubleshooting

### If policies still don't work:

1. **Check bucket permissions**
   - Make sure the `media` bucket exists
   - Verify RLS is enabled

2. **Check user authentication**
   - Ensure users are properly authenticated
   - Check `auth.uid()` is working

3. **Check purchase data**
   - Verify purchases exist in the database
   - Ensure `is_active = true` for purchases

4. **Check file paths**
   - Verify `media_filename` and `video_path` are correct
   - Ensure files exist in the bucket

## Quick Fix for Testing

If you need immediate access for testing, you can temporarily create a more permissive policy:

```sql
-- TEMPORARY - FOR TESTING ONLY
-- This allows any authenticated user to access media files
CREATE POLICY "Allow authenticated access to media" ON storage.objects
  FOR SELECT USING (auth.role() = 'authenticated');
```

**⚠️ WARNING**: This is permissive and should only be used for testing. Remove it before production. 