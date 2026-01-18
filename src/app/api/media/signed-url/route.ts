import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseRouteClient } from "@/lib/supabase/route";

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

  if (!purchase) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const expiresIn = 60;
  const { data, error } = await supabaseAdmin.storage
    .from("media")
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Failed to sign URL" }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl }, { status: 200 });
}
