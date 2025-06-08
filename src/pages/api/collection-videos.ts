import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { collectionVideoSchema } from '@/lib/validations/video';
import { z } from 'zod';

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
      const data = req.body;
      console.log('POST /api/collection-videos', data);
      
      // Validate input
      const validatedData = collectionVideoSchema.parse(data);

      // Only pick fields that exist in the Prisma model
      const {
        collection, title, description, thumbnail, videoUrl, thumbnailPath, videoPath, order, duration
      } = validatedData;
      // Price is not in the Zod schema but is required by Prisma
      const safePrice = typeof (validatedData as any).price === 'number' ? (validatedData as any).price : 0;

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
          price: safePrice,
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
        details: String(err)
      });
    }
  }

  if (req.method === 'PUT') {
    const { id, ...fields } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const { data, error } = await prisma
      .from('collection_videos')
      .update(fields)
      .eq('id', id)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing id' });
    const { error } = await prisma
      .from('collection_videos')
      .delete()
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 