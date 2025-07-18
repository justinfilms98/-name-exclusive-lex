// Environment variable verification script
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
  process.exit(1);
} else {
  console.log('\n🎉 All required environment variables are configured!');
} 