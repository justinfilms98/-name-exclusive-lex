import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: { bodyParser: { sizeLimit: '100mb' } }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email } = req.query;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    // Get the userId from Supabase Auth users table
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all purchases for this user, joining with CollectionVideo
    const { data: purchases, error: purchaseError } = await supabase
      .from('Purchase')
      .select('id, videoId, createdAt, expiresAt, video:CollectionVideo(id, title, thumbnail, duration)')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (purchaseError) {
      return res.status(500).json({ error: 'Failed to fetch purchases' });
    }

    return res.status(200).json(purchases || []);
  } catch (error: any) {
    console.error('Error in user-purchases:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 