import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  // Get the userId from Supabase Auth users table
  const { data: user, error: userError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .single();
  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get all purchases for this user, joining with CollectionVideo
  const { data: purchases, error: purchaseError } = await supabase
    .from('Purchase')
    .select('id, videoId, createdAt, expiresAt, video:CollectionVideo(id, title, thumbnail, duration)')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false });

  if (purchaseError) {
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }

  return NextResponse.json(purchases || []);
} 