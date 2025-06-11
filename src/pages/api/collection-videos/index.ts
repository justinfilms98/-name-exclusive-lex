import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const videos = await prisma.collectionVideo.findMany({
        orderBy: { order: 'asc' },
      });
      return res.status(200).json(videos);
    } catch (error) {
      console.error('Fetch collection videos failed:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  res.setHeader('Allow', ['GET']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
} 