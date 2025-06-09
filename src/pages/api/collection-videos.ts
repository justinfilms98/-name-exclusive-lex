import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { collectionVideoSchema } from '@/lib/validations/video';
import { z } from 'zod';
import { deleteFile } from '@/lib/services/uploadService';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      console.log('GET /api/collection-videos');
      const videos = await prisma.collectionVideo.findMany({
        orderBy: { order: 'asc' },
        select: {
          id: true,
          collection: true,
          title: true,
          description: true,
          thumbnail: true,
          videoUrl: true,
          thumbnailPath: true,
          videoPath: true,
          order: true,
          price: true,
          duration: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      // Always return a pricing array for each video
      const videosWithPricing = videos.map(v => ({
        ...v,
        pricing: [{ type: 'one_time', price: v.price || 0, currency: 'USD', isActive: true }],
      }));
      return res.status(200).json(videosWithPricing);
    } catch (err) {
      console.error('Error in GET /api/collection-videos:', err);
      return res.status(500).json({
        error: 'Failed to fetch collection videos',
        details: String(err)
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const parsed = collectionVideoSchema.parse(req.body);
      console.log('POST /api/collection-videos', parsed);
      const { collection, title, description, thumbnail, videoUrl, thumbnailPath, videoPath, order, duration, price } = parsed;

      // Check if slot is already taken in this collection
      const existingVideo = await prisma.collectionVideo.findFirst({
        where: {
          collection,
          order,
        }
      });
      
      if (existingVideo) {
        return res.status(400).json({
          error: `Slot ${order} is already taken in collection ${collection}`
        });
      }

      const video = await prisma.collectionVideo.create({ 
        data: {
          collection,
          title,
          description,
          thumbnail,
          videoUrl,
          thumbnailPath,
          videoPath,
          order,
          price,
          duration,
        },
        select: {
          id: true,
          collection: true,
          title: true,
          description: true,
          thumbnail: true,
          videoUrl: true,
          thumbnailPath: true,
          videoPath: true,
          order: true,
          price: true,
          duration: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      
      return res.status(200).json(video);
    } catch (err) {
      console.error('Error in POST /api/collection-videos:', err);
      
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.errors
        });
      }
      
      return res.status(500).json({
        error: 'Failed to create collection video',
        details: err instanceof Error ? err.stack || err.message : String(err)
      });
    }
  }

  if (req.method === 'PUT') {
    const { id, ...fields } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
      const updated = await prisma.collectionVideo.update({
        where: { id },
        data: fields,
      });
      return res.status(200).json(updated);
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || typeof id !== 'string' || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Missing or invalid id' });
    }
    try {
      // Find the video to get file paths
      const video = await prisma.collectionVideo.findUnique({ where: { id: Number(id) } });
      if (!video) return res.status(404).json({ error: 'Video not found' });
      // Delete files from storage
      if (video.videoPath) await deleteFile(video.videoPath, 'video');
      if (video.thumbnailPath) await deleteFile(video.thumbnailPath, 'thumbnail');
      // Delete from DB
      await prisma.collectionVideo.delete({ where: { id: Number(id) } });
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 