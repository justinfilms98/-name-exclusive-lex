import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseRouteClient } from "@/lib/supabase/route";
import { isAdminEmail } from "@/lib/auth";
import { cookies } from "next/headers";

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
 * 1. User is authenticated (via Supabase auth cookies OR Authorization header)
 * 2. User has access (via purchases OR entry_access OR admin)
 * 3. Requested path belongs to the collection
 * 
 * Supports both cookie-based auth (via SSR client) and token-based auth (via Authorization header)
 */
export async function POST(req: Request) {
  // Check for Authorization header (token-based auth from client)
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.replace("Bearer ", "");

  // Also check cookies (for SSR/cookie-based auth)
  const cookieHeader = req.headers.get("cookie");
  const hasCookieHeader = !!cookieHeader;

  let authenticatedUser = null;
  let authError = null;

  // Try token-based auth first (from Authorization header)
  if (bearerToken) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(bearerToken);
      if (user && !error) {
        authenticatedUser = user;
        console.log("[signed-url] User authenticated via Authorization header:", user.id);
      } else {
        authError = error?.message || "Invalid token";
      }
    } catch (err) {
      authError = "Token validation failed";
    }
  }

  // Fallback to cookie-based auth if token auth failed
  if (!authenticatedUser && hasCookieHeader) {
    const supabase = supabaseRouteClient();
    
    // Try getUser() first (preferred method)
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    // Fallback: if getUser() fails, try getSession()
    let session = null;
    if (userErr || !user?.id) {
      const sessionResult = await supabase.auth.getSession();
      session = sessionResult.data?.session || null;
    }

    authenticatedUser = user || session?.user || null;
    
    if (authenticatedUser) {
      console.log("[signed-url] User authenticated via cookies:", authenticatedUser.id);
    } else {
      authError = userErr?.message || "No session found";
    }
  }

  if (!authenticatedUser?.id) {
    console.log("[signed-url] 401 Unauthorized:", {
      hasAuthHeader: !!bearerToken,
      hasCookieHeader,
      authError: authError || "none",
    });
    
    return NextResponse.json(
      { error: "Unauthorized" },
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

  // 2) Entry access check
  // Note: entry_access table schema:
  // - user_id (UUID, PRIMARY KEY) - NOT "id"
  // - status (TEXT: 'pending', 'active', 'revoked')
  // - No expires_at, is_active, or access_type columns
  // Access is permanent once status is 'active'
  const { data: entryAccess, error: entryErr } = await supabaseAdmin
    .from("entry_access")
    .select("user_id, status")
    .eq("user_id", authenticatedUser.id)
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

  // Entry access is active if status is 'active' (permanent access)
  const hasEntryAccess = !!entryAccess && entryAccess.status === "active";

  const allowed = adminBypass || !!purchase || hasEntryAccess;

  if (!allowed) {
    console.log("[signed-url] 403 Forbidden:", {
      userId: authenticatedUser.id,
      collectionId,
      hasPurchase: !!purchase,
      hasEntryAccess: !!entryAccess,
      entryAccessStatus: entryAccess?.status,
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
