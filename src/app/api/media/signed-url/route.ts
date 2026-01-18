import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseRouteClient } from "@/lib/supabase/route";
import { isAdminEmail } from "@/lib/auth";

// Force dynamic rendering - never cache this route
// This ensures cookies are always read fresh from the request
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Body = {
  collectionId: string;
  path: string;
};

/**
 * POST /api/media/signed-url
 * 
 * Returns a short-lived signed URL for media files after verifying:
 * 1. User is authenticated (via Supabase auth cookies)
 * 2. User has access (via purchases OR entry_access OR admin)
 * 3. Requested path belongs to the collection
 * 
 * Why 401 was happening:
 * - Client fetch was missing credentials: "include" (now fixed)
 * - Route handler wasn't reading cookies correctly (now using SSR client)
 * - Session cookies weren't being sent from browser (fixed with credentials)
 */
export async function POST(req: Request) {
  // Log cookie presence for debugging (names only, no values)
  const cookieHeader = req.headers.get("cookie");
  const hasCookieHeader = !!cookieHeader;
  const supabaseCookieNames: string[] = [];
  
  if (cookieHeader) {
    // Extract cookie names (Supabase uses sb-<project-ref>-auth-token pattern)
    const cookiePattern = /([^=]+)=/g;
    let match;
    while ((match = cookiePattern.exec(cookieHeader)) !== null) {
      const name = match[1];
      if (name.includes("sb-") || name.includes("supabase")) {
        supabaseCookieNames.push(name);
      }
    }
  }

  console.log("[signed-url] Request received:", {
    hasCookieHeader,
    supabaseCookieCount: supabaseCookieNames.length,
    supabaseCookieNames: supabaseCookieNames.length > 0 ? supabaseCookieNames : "none",
  });

  const supabase = supabaseRouteClient();

  // Try getUser() first (preferred method)
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  // Fallback: if getUser() fails but cookies exist, try getSession()
  let session = null;
  if ((userErr || !user?.id) && hasCookieHeader) {
    console.log("[signed-url] getUser() failed, trying getSession() fallback");
    const sessionResult = await supabase.auth.getSession();
    session = sessionResult.data?.session || null;
    
    if (session?.user) {
      console.log("[signed-url] Session found via fallback, user:", session.user.id);
    } else {
      console.log("[signed-url] No session found via fallback either");
    }
  }

  const authenticatedUser = user || session?.user || null;

  if (!authenticatedUser?.id) {
    console.log("[signed-url] 401 Unauthorized:", {
      hasCookieHeader,
      supabaseCookieCount: supabaseCookieNames.length,
      getUserError: userErr?.message || "none",
      hasSession: !!session,
    });
    
    return NextResponse.json(
      { error: "Unauthorized (no session found)" },
      { 
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }

  console.log("[signed-url] User authenticated:", authenticatedUser.id);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad JSON" },
      { 
        status: 400,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }

  const { collectionId, path } = body || ({} as Body);
  if (!collectionId || !path) {
    return NextResponse.json(
      { error: "Missing collectionId/path" },
      { 
        status: 400,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }

  const cleanPath = String(path).replace(/^\/+/, "");

  // Admin bypass
  const adminBypass = isAdminEmail(authenticatedUser.email || null);

  // 1) Purchase check
  const { data: purchase, error: purchaseErr } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .eq("user_id", authenticatedUser.id)
    .eq("collection_id", collectionId)
    .maybeSingle();

  if (purchaseErr) {
    console.error("[signed-url] Purchase lookup error:", purchaseErr);
    return NextResponse.json(
      { error: "Purchase lookup failed" },
      { 
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }

  // 2) Entry access check (permanent OR not expired)
  const nowIso = new Date().toISOString();

  const { data: entryAccess, error: entryErr } = await supabaseAdmin
    .from("entry_access")
    .select("id, expires_at, status, is_active, access_type")
    .eq("user_id", authenticatedUser.id)
    .eq("collection_id", collectionId)
    .maybeSingle();

  if (entryErr) {
    console.error("[signed-url] Entry access lookup error:", entryErr);
    return NextResponse.json(
      { error: "Entry access lookup failed" },
      { 
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
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
    console.log("[signed-url] 403 Forbidden:", {
      userId: authenticatedUser.id,
      collectionId,
      hasPurchase: !!purchase,
      hasEntryAccess: !!entryAccess,
      adminBypass,
    });
    
    return NextResponse.json(
      { error: "Forbidden" },
      { 
        status: 403,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
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
    return NextResponse.json(
      { error: "Invalid asset path" },
      { 
        status: 400,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }

  // Sign from the correct bucket
  const expiresIn = 60;

  const { data, error } = await supabaseAdmin.storage
    .from("media")
    .createSignedUrl(cleanPath, expiresIn);

  if (error || !data?.signedUrl) {
    console.error("[signed-url] Failed to sign URL:", error);
    return NextResponse.json(
      { error: "Failed to sign URL" },
      { 
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }

  console.log("[signed-url] Success:", {
    userId: authenticatedUser.id,
    collectionId,
    path: cleanPath,
  });

  return NextResponse.json(
    { signedUrl: data.signedUrl },
    { 
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
