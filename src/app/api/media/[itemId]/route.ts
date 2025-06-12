import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const { itemId } = params;
    
    if (!itemId) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    // Get the media item to retrieve file paths
    const mediaItem = await prisma.mediaItem.findUnique({
      where: { id: itemId },
      select: {
        filePath: true,
        thumbnailPath: true,
      }
    });

    if (!mediaItem) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 });
    }

    // Delete from database first
    await prisma.mediaItem.delete({
      where: { id: itemId }
    });

    // Remove files from storage
    const filesToRemove: string[] = [mediaItem.filePath];
    if (mediaItem.thumbnailPath) {
      filesToRemove.push(mediaItem.thumbnailPath);
    }

    const { error: storageError } = await supabaseAdmin.storage
      .from('media')
      .remove(filesToRemove);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Don't fail the request if storage deletion fails
      // The database record is already deleted
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting media item:', error);
    return NextResponse.json(
      { error: 'Failed to delete media item' },
      { status: 500 }
    );
  }
} 