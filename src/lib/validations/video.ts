import { z } from 'zod';

export const collectionVideoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  duration: z.number().int().positive(),
  thumbnailPath: z.string().optional(),
  videoPath: z.string().optional(),
  collection: z.string().min(1),
  thumbnail: z.string().optional(),
  videoUrl: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
  // Add any other fields your API expects
}); 