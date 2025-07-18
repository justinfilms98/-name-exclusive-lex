// Environment variable verification script
// Run this locally to verify your .env file

// Try to load .env file if available
try {
  require('dotenv').config();
} catch (error) {
  console.log('💡 Note: Install dotenv to automatically load .env file: npm install dotenv');
  console.log('   Or make sure your environment variables are set in your shell.\n');
}

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'UPLOADTHING_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

console.log('🔍 Verifying environment variables...\n');

const missing = [];
const present = [];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    present.push(varName);
    console.log(`✅ ${varName}: configured`);
  } else {
    missing.push(varName);
    console.log(`❌ ${varName}: MISSING`);
  }
});

console.log('\n📊 Summary:');
console.log(`✅ Configured: ${present.length}`);
console.log(`❌ Missing: ${missing.length}`);

if (missing.length > 0) {
  console.log('\n🚨 Missing variables:');
  missing.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  
  console.log('\n💡 To fix this:');
  console.log('1. Create/update your .env file in the project root');
  console.log('2. Add the missing environment variables');
  console.log('3. Make sure your .env file is not committed to git (it should be in .gitignore)');
  console.log('4. Run this script again locally: node verify-env.js');
  
  process.exit(1);
} else {
  console.log('\n🎉 All required environment variables are configured!');
} 