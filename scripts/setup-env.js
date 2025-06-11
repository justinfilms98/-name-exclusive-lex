#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Environment variable templates
const ENV_TEMPLATE = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# Database Configuration
DATABASE_URL=your_database_url_here

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Google OAuth (if using Google sign-in)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Optional: NextAuth (if using NextAuth.js)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
`;

const VERCEL_ENV_TEMPLATE = `# Vercel Environment Variables
# Copy these to your Vercel project settings

# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Stripe
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Database
DATABASE_URL

# Application
NEXT_PUBLIC_BASE_URL
NEXT_PUBLIC_SITE_URL

# Optional: Google OAuth
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

# Optional: NextAuth
NEXTAUTH_URL
NEXTAUTH_SECRET
`;

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'DATABASE_URL'
];

const OPTIONAL_VARS = [
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_SITE_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET'
];

function createEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists. Skipping creation.');
    return;
  }

  fs.writeFileSync(envPath, ENV_TEMPLATE);
  console.log('✅ Created .env.local template');
  console.log('📝 Please update the values in .env.local with your actual credentials');
}

function createVercelEnvTemplate() {
  const vercelEnvPath = path.join(process.cwd(), 'vercel-env-template.txt');
  fs.writeFileSync(vercelEnvPath, VERCEL_ENV_TEMPLATE);
  console.log('✅ Created vercel-env-template.txt');
  console.log('📝 Use this as a reference when setting up Vercel environment variables');
}

function checkExistingEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local not found');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const missingVars = [];

  for (const varName of REQUIRED_VARS) {
    if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your_`)) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.log('⚠️  Missing or incomplete required environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    return false;
  }

  console.log('✅ All required environment variables are set');
  return true;
}

function validateEnvValues() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local not found');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  const issues = [];

  for (const line of lines) {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && (!value || value === 'your_' || value.includes('here'))) {
        issues.push(key);
      }
    }
  }

  if (issues.length > 0) {
    console.log('⚠️  Environment variables with placeholder values:');
    issues.forEach(key => console.log(`   - ${key}`));
    return false;
  }

  return true;
}

function syncToVercel() {
  try {
    console.log('🔄 Syncing environment variables to Vercel...');
    
    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('❌ Vercel CLI not found. Please install it with: npm i -g vercel');
      return;
    }

    // Check if project is linked
    try {
      execSync('vercel env ls', { stdio: 'pipe' });
    } catch (error) {
      console.log('❌ Project not linked to Vercel. Please run: vercel link');
      return;
    }

    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env.local not found');
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value && !value.includes('your_') && !value.includes('here')) {
          try {
            execSync(`vercel env add ${key} production`, { 
              input: value,
              stdio: ['pipe', 'pipe', 'pipe']
            });
            console.log(`✅ Added ${key} to Vercel`);
          } catch (error) {
            console.log(`⚠️  Failed to add ${key} to Vercel (may already exist)`);
          }
        }
      }
    }

    console.log('✅ Environment variables synced to Vercel');
  } catch (error) {
    console.error('❌ Error syncing to Vercel:', error.message);
  }
}

function showHelp() {
  console.log(`
🔧 Environment Variables Setup Script

Usage: node scripts/setup-env.js [command]

Commands:
  init          Create .env.local template and Vercel template
  check         Check if required environment variables are set
  validate      Validate that environment variables have actual values
  sync          Sync environment variables to Vercel (requires Vercel CLI)
  help          Show this help message

Examples:
  node scripts/setup-env.js init
  node scripts/setup-env.js check
  node scripts/setup-env.js sync
`);
}

function main() {
  const command = process.argv[2] || 'help';

  switch (command) {
    case 'init':
      createEnvFile();
      createVercelEnvTemplate();
      break;
    case 'check':
      checkExistingEnv();
      break;
    case 'validate':
      validateEnvValues();
      break;
    case 'sync':
      syncToVercel();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  createEnvFile,
  createVercelEnvTemplate,
  checkExistingEnv,
  validateEnvValues,
  syncToVercel
}; 