# Supabase Authentication Fix Guide

## Issue
Only specific emails (contact.exclusivelex and justinbecerra98) can sign in, but you want anyone with a Google account to be able to sign up while keeping admin access restricted to exclusive lex.

## Root Cause
The issue is likely in the Supabase dashboard configuration, not in the code. Here are the steps to fix it:

## Step 1: Check Supabase Auth Settings

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Check Authentication Settings**
   - Go to Authentication > Settings
   - Make sure "Enable email confirmations" is **DISABLED** for Google OAuth
   - Make sure "Enable email change confirmations" is **DISABLED**

3. **Check Google OAuth Configuration**
   - Go to Authentication > Providers
   - Click on Google provider
   - Make sure it's **ENABLED**
   - Check that your Google OAuth credentials are correct
   - Verify the redirect URL is: `https://your-domain.com/auth/callback`

## Step 2: Check Google OAuth App Settings

1. **Go to Google Cloud Console**
   - Navigate to https://console.cloud.google.com
   - Select your project

2. **Check OAuth 2.0 Client ID**
   - Go to APIs & Services > Credentials
   - Find your OAuth 2.0 Client ID
   - Click on it to edit

3. **Verify Authorized Domains**
   - Make sure these domains are added:
     - `your-domain.com`
     - `supabase.co`
     - `localhost` (for development)

4. **Check Authorized Redirect URIs**
   - Add: `https://your-domain.com/auth/callback`
   - Add: `https://your-project-ref.supabase.co/auth/v1/callback`

## Step 3: Check Supabase RLS Policies

1. **Go to Supabase Dashboard > SQL Editor**
2. **Run this query to check current policies:**

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public';
```

3. **If there are restrictive policies, run this to allow all authenticated users:**

```sql
-- Allow all authenticated users to read their own data
CREATE POLICY "Users can read own data" ON auth.users
  FOR SELECT USING (auth.uid() = id);

-- Allow all authenticated users to update their own data
CREATE POLICY "Users can update own data" ON auth.users
  FOR UPDATE USING (auth.uid() = id);
```

## Step 4: Check Environment Variables

Make sure these are set correctly in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 5: Test the Fix

1. **Clear browser data**
   - Clear cookies and local storage
   - Sign out completely

2. **Test with different Google accounts**
   - Try signing in with various Google accounts
   - Check browser console for errors

3. **Check Supabase logs**
   - Go to Supabase Dashboard > Logs
   - Look for authentication errors

## Step 6: Code Changes Made

The following code changes have been implemented to improve error handling:

### 1. Enhanced Auth Functions (`src/lib/auth.ts`)
- Added better error handling and logging
- Added `canSignUp()` function to allow all Google users
- Added `validateUserAuth()` function for better user validation

### 2. Improved Supabase Client (`src/lib/supabase.ts`)
- Added comprehensive error handling and logging
- Enhanced session management
- Better Google OAuth error reporting

### 3. Better UI Feedback (`src/app/HeaderClient.tsx` & `src/app/login/page.tsx`)
- Added loading states and error messages
- Better user feedback for authentication issues
- Improved error handling and display

## Step 7: Verify Admin Access

The admin access is controlled by this line in `src/lib/auth.ts`:

```typescript
export const ADMIN_EMAIL = 'contact.exclusivelex@gmail.com'
```

Only this email will have admin access. All other users will be regular users.

## Troubleshooting

### If users still can't sign in:

1. **Check browser console for errors**
2. **Check Supabase logs for authentication failures**
3. **Verify Google OAuth credentials are correct**
4. **Make sure redirect URLs are properly configured**
5. **Check if there are any IP restrictions in Google Cloud Console**

### Common Issues:

1. **"Invalid redirect URI" error**
   - Check that the redirect URL in Google OAuth matches exactly
   - Make sure both `https://your-domain.com/auth/callback` and `https://your-project-ref.supabase.co/auth/v1/callback` are added

2. **"Access denied" error**
   - Check if there are any domain restrictions in Google OAuth
   - Make sure the Google OAuth app is properly configured

3. **"Session expired" error**
   - Clear browser data and try again
   - Check if the session refresh is working properly

## Final Notes

- The code changes ensure better error handling and user feedback
- Admin access remains restricted to `contact.exclusivelex@gmail.com`
- All other Google users will be able to sign up and use the platform as regular users
- The authentication flow now provides better debugging information

After making these changes, anyone with a Google account should be able to sign up and sign in, while only exclusive lex will have admin access. 