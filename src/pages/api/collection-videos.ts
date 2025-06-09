import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { collectionVideoSchema } from '@/lib/validations/video';
import { z } from 'zod';
import { deleteFile } from '@/lib/services/uploadService';
import { supabase } from '@/lib/supabase';

const TABLE_NAME = 'collection_videos';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

// Note: bodyParser: false was intentionally removed to restore DELETE query parsing for id (?id=...) requests.
// If you need raw upload handling, use bodyParser: false only in a dedicated upload route.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API route hit:', req.method, req.url);

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
    // 1) Try req.query first
    let id: string | null = null;
    if (req.query.id) {
      const raw = req.query.id;
      id = Array.isArray(raw) ? raw[0] : raw;
    }
    // 2) Fallback: parse directly from req.url
    if (!id) {
      const url = req.url || '';
      id = new URLSearchParams(url.split('?')[1] || '').get('id');
    }

    console.log('DELETE branch reached, id:', id);

    // validate
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Missing or invalid id' });
    }

    // perform delete
    const deleteId = Number(id);
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', deleteId);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, deleted: data });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 