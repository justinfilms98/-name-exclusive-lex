import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, headers, query: { id } } = req;

  if (method === 'DELETE') {
    // Admin-only check
    const authHeader = headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user?.email || user.email !== 'contact.exclusivelex@gmail.com') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    const { error } = await supabaseAdmin
      .from('collection_videos')
      .delete()
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }
  if (method === 'GET') {
    return res.status(200).json({ ok: true, id });
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).end(`Method ${method} Not Allowed`);
} 