import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseRouteClient } from "@/lib/supabase/route";
import { isAdminEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Body = {
  collectionId: string;
  path: string;
};

export async function POST(req: Request) {
  const supabase = supabaseRouteClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { collectionId, path } = body || ({} as Body);
  if (!collectionId || !path) {
    return NextResponse.json(
      { error: "Missing collectionId/path" },
      { status: 400 }
    );
  }

  const cleanPath = String(path).replace(/^\/+/, "");

  // Admin bypass
  const adminBypass = isAdminEmail(user.email || null);

  // 1) Purchase check
  const { data: purchase, error: purchaseErr } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("collection_id", collectionId)
    .maybeSingle();

  if (purchaseErr) {
    return NextResponse.json(
      { error: "Purchase lookup failed" },
      { status: 500 }
    );
  }

  // 2) Entry access check (permanent OR not expired)
  const nowIso = new Date().toISOString();

  const { data: entryAccess, error: entryErr } = await supabaseAdmin
    .from("entry_access")
    .select("id, expires_at, status, is_active, access_type")
    .eq("user_id", user.id)
    .eq("collection_id", collectionId)
    .maybeSingle();

  if (entryErr) {
    return NextResponse.json(
      { error: "Entry access lookup failed" },
      { status: 500 }
    );
  }

  const hasEntryAccess =
    !!entryAccess &&
    (entryAccess.access_type === "permanent" ||
      entryAccess.expires_at === null ||
      entryAccess.expires_at > nowIso) &&
    entryAccess.is_active !== false &&
    (entryAccess.status ? entryAccess.status !== "revoked" : true);

  const allowed = adminBypass || !!purchase || hasEntryAccess;

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Optional: verify the path belongs to that collection (prevents requesting random files)
  const { data: collection } = await supabaseAdmin
    .from("collections")
    .select("video_path, photo_path, thumbnail_path, photo_paths")
    .eq("id", collectionId)
    .maybeSingle();

  const allowedPaths = new Set<string>();
  if (collection?.video_path) {
    const clean = String(collection.video_path).replace(/^\/+/, "");
    allowedPaths.add(clean);
  }
  if (collection?.photo_path) {
    const clean = String(collection.photo_path).replace(/^\/+/, "");
    allowedPaths.add(clean);
  }
  if (collection?.thumbnail_path) {
    const clean = String(collection.thumbnail_path).replace(/^\/+/, "");
    allowedPaths.add(clean);
  }
  if (Array.isArray(collection?.photo_paths)) {
    collection.photo_paths.forEach((p: string) => {
      if (p) {
        const clean = String(p).replace(/^\/+/, "");
        allowedPaths.add(clean);
      }
    });
  }

  if (allowedPaths.size > 0 && !allowedPaths.has(cleanPath)) {
    return NextResponse.json({ error: "Invalid asset path" }, { status: 400 });
  }

  // Sign from the correct bucket
  const expiresIn = 60;

  const { data, error } = await supabaseAdmin.storage
    .from("media")
    .createSignedUrl(cleanPath, expiresIn);

  if (error || !data?.signedUrl) {
    console.error("Failed to sign URL:", error);
    return NextResponse.json({ error: "Failed to sign URL" }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl }, { status: 200 });
}
