# Exclusive Lex - Premium Video Platform

A Next.js-based premium video platform with Supabase authentication, Stripe payments, and admin management.

## 🚀 Features

- **Public Site**: Browse collections and hero videos
- **Authentication**: Google OAuth with Supabase
- **Admin Panel**: Manage videos, collections, and user access
- **Payment Processing**: Stripe integration for secure purchases
- **Video Streaming**: Secure video delivery with access control
- **Responsive Design**: Mobile-first design with Tailwind CSS

## 🏗️ Architecture

### API Routes Structure

The application follows RESTful API conventions:

```
/api/
├── collection-videos/
│   ├── route.ts              # GET, POST, PUT, DELETE all videos
│   └── [id]/
│       └── route.ts          # GET, PUT, DELETE individual video
├── hero-videos/
│   ├── route.ts              # GET, POST, PUT, DELETE all hero videos
│   └── [id]/
│       └── route.ts          # GET, PUT, DELETE individual hero video
├── verify-purchase/
│   └── route.ts              # Verify Stripe payments and create access
├── checkout/
│   └── route.ts              # Create Stripe checkout sessions
└── webhooks/
    └── stripe/
        └── route.ts          # Handle Stripe webhooks
```

### Authentication Model

- **Supabase Auth**: Google OAuth integration
- **Role-based Access**: Admin role via `user_metadata.role` or specific email
- **Protected Routes**: `/admin/*` routes require admin privileges
- **Session Management**: Automatic session handling with Supabase

### Database Schema

Key models:
- `User`: Authentication and user data
- `CollectionVideo`: Videos organized in collections
- `HeroVideo`: Featured videos for homepage
- `Purchase`: User purchase records with expiration
- `VideoAnalytics`: View and engagement tracking

## 🛠️ Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Stripe account
- Vercel account (for deployment)

### 2. Environment Variables

Run the setup script to create environment templates:

```bash
node scripts/setup-env.js init
```

This creates:
- `.env.local` - Local development environment
- `vercel-env-template.txt` - Reference for Vercel deployment

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Database
DATABASE_URL=your_database_url

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Database Setup

1. **Prisma Migration**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

2. **Supabase RLS Policies**:
   - Enable RLS on all tables
   - Configure policies for anon and authenticated users
   - Set up service role access for admin operations

### 4. Supabase Configuration

1. **Authentication**:
   - Enable Google OAuth provider
   - Configure redirect URLs
   - Set up email templates

2. **Storage**:
   - Create `thumbnails` bucket (public)
   - Create `videos` bucket (private)
   - Configure storage policies

3. **RLS Policies**:
   ```sql
   -- Example policy for collection_videos
   CREATE POLICY "Public read access" ON collection_videos
   FOR SELECT USING (true);
   
   -- Admin write access
   CREATE POLICY "Admin write access" ON collection_videos
   FOR ALL USING (
     auth.jwt() ->> 'email' = 'contact.exclusivelex@gmail.com' OR
     auth.jwt() ->> 'role' = 'admin'
   );
   ```

### 5. Stripe Configuration

1. **Webhook Endpoint**:
   - Create webhook in Stripe dashboard
   - Point to `/api/webhooks/stripe`
   - Listen for `checkout.session.completed`

2. **Product Configuration**:
   - Set up products in Stripe dashboard
   - Configure pricing and metadata

### 6. Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
node scripts/setup-env.js init
# Edit .env.local with your values

# Run database migrations
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### 7. Deployment to Vercel

1. **Link to Vercel**:
   ```bash
   npx vercel link
   ```

2. **Set Environment Variables**:
   ```bash
   node scripts/setup-env.js sync
   ```
   Or manually add them in Vercel dashboard

3. **Deploy**:
   ```bash
   npx vercel --prod
   ```

## 🔧 Development Workflow

### API Development

All API routes follow consistent patterns:

```typescript
// Example: GET /api/collection-videos
export async function GET(req: NextRequest) {
  try {
    // Implementation
    return NextResponse.json(data, { headers: corsHeaders });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: "Error message" },
      { status: 500, headers: corsHeaders }
    );
  }
}
```

### Adding New Routes

1. Create route file in appropriate directory
2. Implement HTTP methods (GET, POST, PUT, DELETE)
3. Add CORS headers and error handling
4. Add validation with Zod schemas
5. Test with appropriate HTTP client

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Verify API routes
npm run verify-routes
```

## 🔒 Security Features

- **CORS Protection**: All API routes include CORS headers
- **Input Validation**: Zod schemas for all API inputs
- **Authentication**: Supabase JWT tokens
- **Authorization**: Role-based access control
- **Secure Storage**: Private video storage with signed URLs
- **Payment Verification**: Server-side Stripe verification

## 📊 Monitoring and Analytics

- **Error Logging**: Console logging for all API errors
- **Purchase Tracking**: Complete purchase flow monitoring
- **Video Analytics**: View tracking and engagement metrics
- **User Activity**: Authentication and access logging

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **Environment Variables**:
   ```bash
   node scripts/setup-env.js check
   node scripts/setup-env.js validate
   ```

3. **Supabase Connection**:
   - Verify URL and keys in environment
   - Check RLS policies
   - Test with Supabase dashboard

4. **Stripe Integration**:
   - Verify webhook endpoint
   - Check payment status in Stripe dashboard
   - Validate session verification

### Debug Mode

Enable debug logging:

```bash
DEBUG=* npm run dev
```

## 📝 API Documentation

### Collection Videos

```typescript
// GET /api/collection-videos
// Query params: collection, category, ageRating

// POST /api/collection-videos
// Body: { collection, title, description, thumbnail, videoUrl, price, order, ... }

// PUT /api/collection-videos
// Body: { id, ...updateData }

// DELETE /api/collection-videos
// Body: { id }
```

### Hero Videos

```typescript
// GET /api/hero-videos
// Query params: status, category, ageRating

// POST /api/hero-videos
// Body: { title, description, thumbnail, videoUrl, order, price, ... }

// PUT /api/hero-videos
// Body: { id, ...updateData }

// DELETE /api/hero-videos
// Body: { id }
```

### Purchase Verification

```typescript
// GET /api/verify-purchase?session_id=xxx&user_email=xxx
// POST /api/verify-purchase
// Body: { sessionId, userEmail }
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with proper error handling
4. Add tests for new functionality
5. Submit pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Email: contact.exclusivelex@gmail.com
- Create an issue in the repository
- Check the troubleshooting section above 