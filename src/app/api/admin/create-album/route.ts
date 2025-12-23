import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/auth';

// Use service role key for admin operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Use anon key for auth checks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to generate slug from name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Helper function to generate unique slug
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  const maxAttempts = 100; // Prevent infinite loop

  for (let i = 0; i < maxAttempts; i++) {
    const { data, error } = await supabaseAdmin
      .from('albums')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found, which is what we want
      console.error('Error checking slug uniqueness:', error);
      throw new Error(`Failed to validate slug: ${error.message}`);
    }

    if (!data) {
      // Slug is available
      return slug;
    }

    // Slug exists, try with counter
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  throw new Error('Unable to generate unique slug after multiple attempts');
}

export async function POST(request: NextRequest) {
  try {
    // Get session to verify admin
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Not authorized. Please log in.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let user;
    
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

      if (authError) {
        console.error('Auth error:', authError);
        return NextResponse.json(
          { error: 'Invalid authentication' },
          { status: 401 }
        );
      }

      if (!authUser) {
        return NextResponse.json(
          { error: 'Not authorized. Please log in.' },
          { status: 401 }
        );
      }
      
      user = authUser;
    } catch (authErr) {
      console.error('Auth exception:', authErr);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    if (!isAdmin(user.email || '')) {
      return NextResponse.json(
        { error: 'Not authorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description, thumbnail_path } = body;

    // Validate input
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Album name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const baseSlug = slugify(name.trim());
    if (!baseSlug) {
      return NextResponse.json(
        { error: 'Album name must contain at least one letter or number' },
        { status: 400 }
      );
    }

    // Generate unique slug (auto-increment if duplicate)
    let uniqueSlug: string;
    try {
      uniqueSlug = await generateUniqueSlug(baseSlug);
    } catch (error: any) {
      console.error('Error generating unique slug:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to generate unique slug' },
        { status: 500 }
      );
    }

    // Create album (thumbnail_path is optional)
    // Generate id - some schemas require explicit id (TEXT), others auto-generate (UUID)
    const albumData: any = {
      name: name.trim(),
      slug: uniqueSlug,
      description: description?.trim() || null,
      thumbnail_path: thumbnail_path || null,
    };

    // Try insert - if it fails due to missing id, retry with generated id
    let { data, error } = await supabaseAdmin
      .from('albums')
      .insert([albumData])
      .select();

    // If error suggests missing id field, retry with generated id
    if (error && (error.message?.includes('null value') || error.code === '23502')) {
      console.log('Retrying with generated id...');
      albumData.id = crypto.randomUUID();
      const retryResult = await supabaseAdmin
        .from('albums')
        .insert([albumData])
        .select();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Supabase error creating album:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Handle specific Supabase errors
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'An album with this slug already exists. Please try again.' },
          { status: 409 }
        );
      }

      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        return NextResponse.json(
          { error: 'Permission denied. RLS policy may be blocking insert. Please check database policies.' },
          { status: 403 }
        );
      }

      // Return detailed error for debugging
      const errorMessage = error.message || 'Failed to create album';
      const errorDetails = {
        message: errorMessage,
        code: error.code,
        details: error.details,
        hint: error.hint,
      };
      console.error('Full error object:', errorDetails);
      
      return NextResponse.json(
        { 
          error: errorMessage,
          ...(process.env.NODE_ENV === 'development' && { details: errorDetails })
        },
        { status: 500 }
      );
    }

    if (!data || !data[0]) {
      return NextResponse.json(
        { error: 'Album created but no data returned' },
        { status: 500 }
      );
    }

    return NextResponse.json({ album: data[0] }, { status: 201 });

  } catch (error: any) {
    console.error('Create album error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create album' },
      { status: 500 }
    );
  }
}

