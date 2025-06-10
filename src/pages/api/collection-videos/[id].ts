import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const videoId = req.query.id;

  if (req.method === 'GET') {
    // Temporary: confirm route works
    return res.status(200).json({ message: 'Route OK', id: videoId });
  }

  if (req.method === 'DELETE') {
    // Admin check: require Authorization header with Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const token = authHeader.replace('Bearer ', '');
    // Get user from token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid user token' });
    }
    // Check admin by email (set ADMIN_EMAIL in env)
    const isAdmin = user.email && user.email === process.env.ADMIN_EMAIL;
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    // Perform deletion
    const { error: deleteError } = await supabaseAdmin
      .from('CollectionVideo')
      .delete()
      .eq('id', videoId);
    if (deleteError) {
      console.error('Delete error:', deleteError);
      return res.status(500).json({ error: deleteError.message });
    }
    return res.status(204).end(); // No Content (success)
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
} 