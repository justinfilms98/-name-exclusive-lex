# 🔧 Google OAuth Setup Guide for Exclusive Lex

## 🚨 Current Issue
Google OAuth login is failing with `DNS_PROBE_FINISHED_NXDOMAIN` error for the Supabase domain. This guide provides step-by-step fixes.

## ✅ Required Configuration

### 1. Supabase Auth Settings

**Site URL**: `https://exclusivelex.com`

**Redirect URLs** (add these in Supabase Dashboard > Authentication > URL Configuration):
```
https://exclusivelex.com
https://exclusivelex.com/auth/v1/callback
https://exclusivelex.com/auth/callback
http://localhost:3000 (for development)
```

**Additional Settings**:
- Enable Google OAuth provider
- Ensure Google Client ID and Secret are correctly entered
- Set Site URL to `https://exclusivelex.com`

### 2. Google Cloud Console Configuration

**OAuth Consent Screen**:
- Add `qgafqefeqotzfnrpuszso.supabase.co` to **Authorized Domains**
- Add `https://exclusivelex.com` to **Authorized JavaScript Origins**

**OAuth 2.0 Client**:
- **Authorized Redirect URI**: `https://qgafqefeqotzfnrpuszso.supabase.co/auth/v1/callback`
- **Authorized JavaScript Origins**: 
  - `https://exclusivelex.com`
  - `http://localhost:3000` (for development)

### 3. Environment Variables

**Required Variables** (check in Vercel and `.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://qgafqefeqotzfnrpuszso.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_URL=https://exclusivelex.com
NEXT_PUBLIC_BASE_URL=https://exclusivelex.com
```

**Important**: 
- No trailing slashes
- No whitespace
- Exact protocol (https://)

### 4. DNS Configuration

**Domain Setup**:
- Point `exclusivelex.com` to Vercel's servers
- Point `www.exclusivelex.com` to Vercel's servers
- Add domain in Vercel dashboard
- Ensure SSL certificates are valid

**Cloudflare (if using)**:
- Turn proxy **OFF** (gray cloud) for Supabase domain
- Keep proxy **ON** for custom domain
- Don't proxy `supabase.co` traffic

### 5. OAuth Callback Routes

**Implemented Routes**:
- `/auth/v1/callback` - Main Supabase callback (recommended)
- `/auth/callback` - Alternative callback
- `/auth/error` - Error handling page

## 🔧 Code Changes Applied

### 1. Enhanced Google OAuth Configuration
```typescript
// src/app/signin/SignInClient.tsx
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/v1/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    }
  }
});
```

### 2. Robust Callback Handler
```typescript
// src/app/auth/v1/callback/route.ts
// Handles code exchange with proper error handling
// Sets auth cookies securely
// Redirects to success or error page
```

### 3. User-Friendly Error Page
```typescript
// src/app/auth/error/page.tsx
// Displays specific error messages
// Provides retry options
// Shows debugging information
```

### 4. Enhanced Stripe Integration
```typescript
// src/app/api/checkout/route.ts
// Supports anonymous purchases
// Includes authentication status in metadata
// Handles both logged-in and guest users
```

## 🧪 Testing Checklist

### Pre-Deployment
- [ ] Supabase Auth settings configured
- [ ] Google Cloud OAuth client updated
- [ ] Environment variables set correctly
- [ ] DNS records pointing to Vercel
- [ ] SSL certificates valid

### Post-Deployment
- [ ] Test Google sign-in on production domain
- [ ] Verify callback routes work
- [ ] Check error handling for network issues
- [ ] Test anonymous checkout flow
- [ ] Verify authenticated checkout flow
- [ ] Test sign-out and sign-in again

## 🚨 Troubleshooting

### DNS Issues
1. **Check DNS propagation**: Use `nslookup exclusivelex.com`
2. **Verify Vercel domain**: Check Vercel dashboard
3. **Test Supabase domain**: `ping qgafqefeqotzfnrpuszso.supabase.co`
4. **Clear DNS cache**: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### OAuth Errors
1. **Redirect URI mismatch**: Check Google Console and Supabase settings
2. **Domain not authorized**: Add domain to Google OAuth consent screen
3. **Invalid client credentials**: Verify Client ID and Secret in Supabase

### Network Issues
1. **Try different network**: Test on mobile data vs WiFi
2. **Check firewall**: Ensure no blocking of OAuth domains
3. **VPN interference**: Disable VPN if using one

## 📞 Support

If issues persist:
1. Check browser console for specific errors
2. Verify all configuration steps completed
3. Test on different devices/networks
4. Contact Supabase support for domain issues
5. Check Vercel deployment logs

---

**Status**: ✅ Configuration guide ready
**Next Step**: Apply these settings and test OAuth flow 