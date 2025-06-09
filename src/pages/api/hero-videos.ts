import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { heroVideoSchema } from '@/lib/validations/video';
import { z } from 'zod';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { status, category, ageRating } = req.query;

      const where = {
        ...(status && status !== 'all' ? { status: String(status) } : {}),
        ...(category && category !== 'all' ? { category: String(category) } : {}),
        ...(ageRating && ageRating !== 'all' ? { ageRating: String(ageRating) } : {}),
      };

      const videos = await prisma.heroVideo.findMany({ 
        where,
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          videoUrl: true,
          order: true,
          price: true,
          status: true,
          ageRating: true,
          category: true,
          tags: true,
          moderatedBy: true,
          moderatedAt: true,
          rejectionReason: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      return res.status(200).json(videos);
    } catch (err) {
      console.error("Error in GET /api/hero-videos:", err);
      return res.status(500).json({
        error: "Failed to fetch hero videos",
        details: String(err)
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;
      
      // Validate input
      const validatedData = heroVideoSchema.parse(data);

      // Only pick fields that exist in the Prisma model
      const {
        title, description, thumbnail, videoUrl, order,
        price, status, ageRating, category, tags
      } = validatedData;

      // Check if slot is already taken
      const existingVideo = await prisma.heroVideo.findFirst({
        where: { order }
      });

      if (existingVideo) {
        return res.status(400).json({
          error: `Slot ${order} is already taken`
        });
      }

      // Set initial status to pending if not draft
      let finalStatus = status;
      if (finalStatus !== 'draft') {
        finalStatus = 'pending';
      }

      const video = await prisma.heroVideo.create({
        data: {
          title,
          description,
          thumbnail,
          videoUrl,
          order,
          price,
          status: finalStatus,
          ageRating,
          category,
          tags,
        },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          videoUrl: true,
          order: true,
          price: true,
          status: true,
          ageRating: true,
          category: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      
      return res.status(200).json(video);
    } catch (err) {
      console.error("Error in POST /api/hero-videos:", err);
      
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: err.errors
        });
      }
      
      return res.status(500).json({
        error: "Failed to create hero video",
        details: err instanceof Error ? err.stack || err.message : String(err)
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 