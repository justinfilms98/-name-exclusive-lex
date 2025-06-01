import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Debug: Log the first 6 chars of the env vars
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL?.slice(0, 6));
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 6));
    const { data, error } = await supabase.from('CollectionVideo').select('*');
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Catch error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 