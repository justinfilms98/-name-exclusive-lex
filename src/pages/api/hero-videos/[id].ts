import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method === 'DELETE') {
    try {
      await prisma.heroVideo.delete({ where: { id: Number(id) } });
      return res.status(204).end();
    } catch (error) {
      console.error('Delete hero video failed:', error);
      return res.status(500).json({ error: 'Failed to delete video' });
    }
  }
  res.setHeader('Allow', ['DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 