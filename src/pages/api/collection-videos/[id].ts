import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  if (req.method === 'GET') {
    try {
      const videos = await prisma.collectionVideo.findMany({ orderBy: { order: 'asc' } });
      return res.status(200).json(videos);
    } catch (error) {
      console.error('Fetch collection videos failed:', error);
      return res.status(500).json({ error: 'Failed to fetch videos' });
    }
  }
  if (req.method === 'DELETE') {
    try {
      await prisma.collectionVideo.delete({ where: { id } });
      return res.status(204).end();
    } catch (error) {
      console.error('Delete collection video failed:', error);
      return res.status(500).json({ error: 'Failed to delete video' });
    }
  }
  res.setHeader('Allow', ['GET','DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
} 