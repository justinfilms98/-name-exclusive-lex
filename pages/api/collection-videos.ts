import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const pricingSchema = z.object({
  type: z.enum(['one_time', 'subscription', 'rental']),
  price: z.number().min(0),
  currency: z.string().length(3),
  duration: z.number().optional(),
  discount: z.number().min(0).max(100).optional(),
  promoCode: z.string().optional(),
  region: z.string().optional(),
  isActive: z.boolean().default(true),
});

const collectionVideoSchema = z.object({
  collection: z.string().min(1, "Collection name is required"),
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  thumbnail: z.string().url("Invalid thumbnail URL"),
  videoUrl: z.string().url("Invalid video URL"),
  thumbnailPath: z.string().optional(),
  videoPath: z.string().optional(),
  order: z.number().int().min(1),
  category: z.string().min(1, "Category is required"),
  ageRating: z.enum(['G', 'PG', 'PG-13', 'R']).default('PG'),
  tags: z.array(z.string()).default([]),
  pricing: z.array(pricingSchema).min(1, "At least one pricing option is required"),
  duration: z.number().optional(),
  price: z.number().min(0),
});

const updateCollectionVideoSchema = collectionVideoSchema.extend({
  id: z.number().int().positive(),
});

export const config = {
  api: { bodyParser: { sizeLimit: '100mb' } }
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
          category: true,
          ageRating: true,
          tags: true,
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
        collection, title, description, thumbnail, videoUrl, thumbnailPath, videoPath, order, duration,
        category, ageRating, tags
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
          category,
          ageRating,
          tags,
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
          category: true,
          ageRating: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      
      return res.status(201).json(video);
    } catch (err) {
      console.error('Error in POST /api/collection-videos:', err);
      
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: err.errors
        });
      }
      
      return res.status(500).json({
        error: "Failed to create collection video"
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const data = req.body;
      console.log('PUT /api/collection-videos', data);
      // Validate input
      const validatedData = updateCollectionVideoSchema.parse(data);
      const { id, pricing, ...updateData } = validatedData; // Remove pricing before update
      // Check if slot is already taken by another video in this collection
      const existingVideo = await prisma.collectionVideo.findFirst({
        where: {
          collection: updateData.collection,
          order: updateData.order,
          id: { not: id }, // Exclude current video
        }
      });
      if (existingVideo) {
        return res.status(400).json({
          error: `Slot ${updateData.order} is already taken in collection ${updateData.collection}`
        });
      }
      const video = await prisma.collectionVideo.update({
        where: { id },
        data: { ...updateData },
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
          category: true,
          ageRating: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      return res.status(200).json(video);
    } catch (err) {
      console.error('Error in PUT /api/collection-videos:', err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: err.errors
        });
      }
      return res.status(500).json({
        error: "Failed to update collection video"
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      console.log('DELETE /api/collection-videos', { id });
      if (!id) {
        return res.status(400).json({
          error: "Video ID is required"
        });
      }
      const video = await prisma.collectionVideo.delete({
        where: { id: parseInt(id) },
        select: {
          thumbnailPath: true,
          videoPath: true,
        }
      });
      // TODO: Delete files from storage
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error in DELETE /api/collection-videos:', err);
      return res.status(500).json({
        error: "Failed to delete collection video"
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 