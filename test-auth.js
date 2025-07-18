// Simple authentication test script
require('dotenv').config();

async function testAuth() {
  console.log('🔐 Testing Authentication Setup...\n');
  
  // Check environment variables
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET', 
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];
  
  console.log('📋 Environment Variables:');
  let allGood = true;
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: configured`);
    } else {
      console.log(`❌ ${varName}: MISSING`);
      allGood = false;
    }
  });
  
  if (!allGood) {
    console.log('\n❌ Missing environment variables. Check your .env file.');
    return;
  }
  
  // Test database connection
  console.log('\n🗄️ Testing Database Connection:');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if we can query users (NextAuth table)
    const userCount = await prisma.user.count();
    console.log(`✅ Users table accessible (${userCount} users)`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
    return;
  }
  
  console.log('\n🎉 Authentication setup looks good!');
  console.log('\n📝 Next steps:');
  console.log('1. Deploy to Vercel');
  console.log('2. Test sign-in functionality');
  console.log('3. Check Vercel logs for any remaining issues');
}

testAuth().catch(console.error); 