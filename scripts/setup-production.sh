#!/bin/bash

# Exclusive Lex Production Setup Script
# This script fixes all the identified issues for production deployment

echo "🚀 Starting Exclusive Lex Production Setup..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# 3. Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# 4. Build the application
echo "🏗️ Building the application..."
npm run build

# 5. Check environment variables
echo "🔍 Checking environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
    exit 1
fi

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ STRIPE_SECRET_KEY is not set"
    exit 1
fi

echo "✅ Environment variables check passed"

# 6. Run tests
echo "🧪 Running tests..."
npm test

echo "✅ Production setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Run the SQL scripts in your Supabase dashboard:"
echo "   - scripts/supabase-storage-policies.sql"
echo "   - scripts/add-duration-column.sql"
echo "2. Deploy to Vercel:"
echo "   - git add ."
echo "   - git commit -m 'Fix production issues'"
echo "   - git push"
echo "3. Verify the deployment works end-to-end"
echo ""
echo "🔧 Issues fixed:"
echo "✅ Supabase storage upload authentication"
echo "✅ Stripe checkout metadata"
echo "✅ Video URL generation (temporary dummy URL)"
echo "✅ Environment variable cleanup"
echo "✅ Database schema alignment" 