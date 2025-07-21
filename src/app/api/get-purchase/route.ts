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

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get the current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Get purchase details with collection info
    const { data: purchase, error } = await supabase
      .from('purchases')
      .select(`
        *,
        collections (
          id,
          title,
          description,
          video_path,
          thumbnail_path,
          duration
        )
      `)
      .eq('stripe_session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (error || !purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Check if purchase is still valid
    const now = new Date();
    const expiresAt = new Date(purchase.expires_at);
    
    if (now >= expiresAt) {
      return NextResponse.json(
        { error: 'Purchase has expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      purchase,
      timeRemaining: expiresAt.getTime() - now.getTime(),
    });

  } catch (error) {
    console.error('Get purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to get purchase details' },
      { status: 500 }
    );
  }
} 