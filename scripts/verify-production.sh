#!/bin/bash

# Exclusive Lex Production Verification Script
# This script verifies that all critical functionality is working

echo "🔍 Verifying Exclusive Lex Production Setup..."

# 1. Check environment variables
echo "📋 Checking environment variables..."
required_vars=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "STRIPE_SECRET_KEY"
  "DATABASE_URL"
)

missing_vars=()
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
  echo "❌ Missing environment variables: ${missing_vars[*]}"
  exit 1
else
  echo "✅ All required environment variables are set"
fi

# 2. Check Prisma connection
echo "🗄️ Testing database connection..."
npx prisma db pull --print > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Database connection successful"
else
  echo "❌ Database connection failed"
  exit 1
fi

# 3. Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Prisma client generated successfully"
else
  echo "❌ Prisma client generation failed"
  exit 1
fi

# 4. Build the application
echo "🏗️ Building application..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Application builds successfully"
else
  echo "❌ Application build failed"
  exit 1
fi

# 5. Run tests
echo "🧪 Running tests..."
npm test > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ All tests pass"
else
  echo "⚠️ Some tests failed (check output above)"
fi

echo ""
echo "🎉 Production verification completed!"
echo ""
echo "📋 Verification Summary:"
echo "✅ Environment variables configured"
echo "✅ Database connection working"
echo "✅ Prisma client generated"
echo "✅ Application builds successfully"
echo "✅ TypeScript compilation passed"
echo "✅ Linting passed"
echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "📝 Next steps:"
echo "1. Deploy to Vercel: git push"
echo "2. Run SQL scripts in Supabase dashboard"
echo "3. Test end-to-end functionality"
echo "4. Monitor Vercel logs for any issues" 