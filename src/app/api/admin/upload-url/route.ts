import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getToken } from 'next-auth/jwt';

// Ensure the user is an admin before proceeding
async function isAdmin(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set.");
  }
  const token = await getToken({ req, secret });
  return token?.role === 'admin';
}

export async function POST(req: NextRequest) {
  try {
    if (!await isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { fileName, fileType, collection } = await req.json();

    if (!fileName || !fileType || !collection) {
      return NextResponse.json({ error: 'Missing required fields: fileName, fileType, collection' }, { status: 400 });
    }

    // Determine bucket and path based on collection type
    let bucketName: string;
    let filePath: string;

    if (collection === 'hero-videos') {
      bucketName = 'videos';
      filePath = `hero/${Date.now()}-${fileName}`;
    } else if (collection === 'hero-videos/thumbnails') {
      bucketName = 'thumbnails';
      filePath = `hero/${Date.now()}-${fileName}`;
    } else if (collection === 'collection-videos') {
      bucketName = 'videos';
      filePath = `collections/${Date.now()}-${fileName}`;
    } else if (collection === 'collection-videos/thumbnails') {
      bucketName = 'thumbnails';
      filePath = `collections/${Date.now()}-${fileName}`;
    } else {
      // Default fallback
      bucketName = 'videos';
      filePath = `${collection}/${Date.now()}-${fileName}`;
    }

    console.log(`Creating signed URL for bucket: ${bucketName}, path: ${filePath}`);

    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ...data, filePath });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 