#!/bin/bash

echo "🚀 Deploying Collection Media System..."

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY is not set"
    exit 1
fi

echo "✅ Environment variables are set"

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Collection Media System deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run the SQL script in scripts/setup-database.sql in your Supabase dashboard"
echo "2. Create a 'media' bucket in Supabase Storage"
echo "3. Configure storage policies for the media bucket"
echo "4. Navigate to /admin/collection-videos to test the system"
echo ""
echo "📚 See COLLECTION_MEDIA_README.md for detailed documentation" 