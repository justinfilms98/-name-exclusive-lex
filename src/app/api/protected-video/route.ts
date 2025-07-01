import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const collectionId = searchParams.get("id");

  if (!collectionId) {
    return NextResponse.json({ error: "Missing collection ID" }, { status: 400 });
  }

  // TODO: Replace Supabase logic with NextAuth if needed.

  // Redirect to the media URL
  return NextResponse.redirect(purchase.media_url);
} 