import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (sessionId) {
      // Get specific purchase by session_id
      const { data: purchase, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .single();

      if (error) {
        return NextResponse.json({ 
          error: 'Purchase not found',
          sessionId,
          errorDetails: error.message 
        });
      }

      return NextResponse.json({ purchase });
    } else {
      // Get all purchases
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        return NextResponse.json({ error: error.message });
      }

      return NextResponse.json({ purchases });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 