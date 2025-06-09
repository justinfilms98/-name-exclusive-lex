import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { id },
    method,
  } = req;

  // Normalize to a single string, then int
  const videoId = Array.isArray(id) ? id[0] : (id ?? '');
  const parsedId = parseInt(videoId, 10);

  if (method === 'DELETE') {
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: 'Invalid or missing video ID' });
    }

    console.log('DELETE branch reached, deleting video id=', parsedId);

    const { error } = await supabaseAdmin
      .from('CollectionVideo')
      .delete()
      .eq('id', parsedId);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['DELETE']);
  return res.status(405).end(`Method ${method} Not Allowed`);
} 