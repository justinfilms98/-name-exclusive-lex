import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create server-side Supabase client for auth operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('OAuth callback received:', { 
      hasCode: !!code, 
      hasError: !!error, 
      errorDescription,
      next,
      origin 
    });

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', { error, errorDescription });
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`);
    }

    // Handle missing code
    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(`${origin}/auth/error?error=missing_code&description=${encodeURIComponent('No authorization code received')}`);
    }

    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError);
      return NextResponse.redirect(`${origin}/auth/error?error=exchange_failed&description=${encodeURIComponent(exchangeError.message)}`);
    }

    if (!data.session) {
      console.error('No session returned from code exchange');
      return NextResponse.redirect(`${origin}/auth/error?error=no_session&description=${encodeURIComponent('No session created')}`);
    }

    console.log('OAuth success for user:', data.user?.email);

    // Create response with redirect
    const response = NextResponse.redirect(`${origin}${next}`);
    
    // Set auth cookies
    const { access_token, refresh_token } = data.session;
    if (access_token) {
      response.cookies.set('sb-access-token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }
    
    if (refresh_token) {
      response.cookies.set('sb-refresh-token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }

    return response;

  } catch (error) {
    console.error('OAuth callback exception:', error);
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/auth/error?error=callback_exception&description=${encodeURIComponent('Unexpected error during authentication')}`);
  }
} 