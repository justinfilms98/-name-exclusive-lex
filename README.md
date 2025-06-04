# Next.js Paywalled Video Streaming Template

A modern, secure template for selling and streaming videos with Next.js, Stripe, Supabase, and NextAuth.

## Features
- Google login (NextAuth)
- Stripe checkout/payments
- Supabase Postgres + Storage
- Secure, expiring video access tokens
- Modern, brandable UI (easy to customize colors)
- Security: disables right-click, download, screenshare, drag on video

## Quick Start

1. **Clone this repo**
2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```
3. **Set up environment variables**
   - Copy `.env.example` to `.env.local` and fill in your keys (see below)
4. **Set up Supabase**
   - Run the provided script to auto-create the schema:
     ```bash
     npx supabase db reset --file supabase/schema.sql
     ```
   - Or manually run the SQL in `supabase/schema.sql` in the Supabase SQL editor
   - Create a `videos` storage bucket in Supabase Storage
5. **Set up Stripe**
   - Add products/prices for your videos
6. **Run locally**
   ```bash
   npm run dev
   ```
7. **Deploy to Vercel/Netlify**

## Environment Variables

See `.env.example` for all required variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- ...

## Supabase Schema

See `supabase/schema.sql` for the full schema. Key tables:
- `purchase_tokens` (token, user_id, video_id, expires_at, ...)
- `CollectionVideo` (id, title, videoUrl, ...)

## Customization
- Update `/src/app/collections/watch/[videoId]/VideoPlayer.tsx` for your brand colors
- Add new videos in Supabase
- Update authentication providers in `/src/app/api/auth/[...nextauth]/route.ts`
- Use your own Stripe products/prices

## License

MIT 