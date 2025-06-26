import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const collectionId = searchParams.get("id");

  if (!collectionId) {
    return NextResponse.json({ error: "Missing collection ID" }, { status: 400 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has purchased this collection
  const { data: purchase } = await supabase
    .from("purchases")
    .select("*")
    .eq("collection_id", collectionId)
    .eq("user_id", session.user.id)
    .single();

  if (!purchase) {
    return NextResponse.json({ error: "Forbidden - Purchase required" }, { status: 403 });
  }

  // Check if purchase has expired
  if (purchase.expires_at && new Date() > new Date(purchase.expires_at)) {
    return NextResponse.json({ error: "Purchase expired" }, { status: 403 });
  }

  // Redirect to the media URL
  return NextResponse.redirect(purchase.media_url);
} 