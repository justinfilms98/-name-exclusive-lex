import { z } from 'zod';

export const collectionVideoSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.number().nonnegative(),
  duration: z.number().int().positive(),
  thumbnailPath: z.string().min(1),
  videoPath: z.string().min(1),
  collection: z.string().min(1),
  thumbnail: z.string().min(1),
  videoUrl: z.string().min(1),
  order: z.number().int().nonnegative(),
  // Add any other fields your API expects
}); 