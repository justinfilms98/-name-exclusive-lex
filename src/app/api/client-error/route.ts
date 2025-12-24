import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log to server console (Vercel logs)
    console.error('[CLIENT ERROR]', {
      message: body.message,
      stack: body.stack,
      userAgent: body.userAgent,
      url: body.url,
      type: body.type,
      timestamp: new Date().toISOString(),
    });

    // Return 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Even if parsing fails, log what we can
    console.error('[CLIENT ERROR - Parse Failed]', error);
    return new NextResponse(null, { status: 204 });
  }
}

