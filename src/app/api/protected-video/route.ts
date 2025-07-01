import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trackError } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get("id");

    if (!mediaId) {
      return NextResponse.json({ error: "Missing media ID" }, { status: 400 });
    }

    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch the media item
    const media = await prisma.collectionMedia.findUnique({
      where: { id: mediaId },
      include: { collection: true },
    });

    if (!media) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    // Check if user has a valid purchase for this media
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: session.user.id,
        mediaId: mediaId,
        expiresAt: { gt: new Date() }, // Only valid purchases
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase required to access this content" },
        { status: 403 }
      );
    }

    if (!media.videoUrl) {
      return NextResponse.json(
        { error: "Video URL not available" },
        { status: 404 }
      );
    }

    // TODO: If using UploadThing, you might need to generate a presigned URL here
    // For now, redirect to the stored video URL
    return NextResponse.redirect(media.videoUrl);

  } catch (error) {
    console.error("Protected video error:", error);
    
    await trackError(error as Error, {
      endpoint: "/api/protected-video",
      method: "GET",
    });

    return NextResponse.json(
      { error: "Failed to access video" },
      { status: 500 }
    );
  }
} 