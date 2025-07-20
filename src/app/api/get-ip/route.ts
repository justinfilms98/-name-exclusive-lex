import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get IP from various headers (for different proxy setups)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cloudflareIp = request.headers.get('cf-connecting-ip');
    
    let ip = 'unknown';
    
    if (cloudflareIp) {
      ip = cloudflareIp;
    } else if (forwarded) {
      ip = forwarded.split(',')[0].trim();
    } else if (realIp) {
      ip = realIp;
    } else {
      // Fallback for development
      ip = 'localhost';
    }

    return NextResponse.json({ ip });
  } catch (error) {
    console.error('Failed to get IP:', error);
    return NextResponse.json({ ip: 'unknown' });
  }
} 