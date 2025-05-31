const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchCustomUsers() {
  // Fetch all users from your custom User table
  const { data, error } = await supabase
    .from('User')
    .select('email, name');
  if (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }
  return data;
}

async function migrateUsers() {
  const users = await fetchCustomUsers();
  for (const user of users) {
    if (!user.email) continue;
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      email_confirm: true,
      password: Math.random().toString(36).slice(-10) + 'A1!', // temp password
      user_metadata: { name: user.name }
    });
    if (error) {
      console.error('Error creating user:', user.email, error);
      continue;
    }
    // Send password reset email
    await supabase.auth.admin.resetPasswordForEmail(user.email);
    console.log('Migrated and sent reset email to:', user.email);
  }
}

migrateUsers(); 