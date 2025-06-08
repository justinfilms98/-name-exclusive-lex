import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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
      .select(`
        id,
        videoId,
        createdAt,
        expiresAt,
        video:CollectionVideo (
          id,
          title,
          thumbnail,
          duration
        )
      `)
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (purchaseError) {
      console.error('Error fetching purchases:', purchaseError);
      return res.status(500).json({ error: 'Failed to fetch purchases' });
    }

    return res.status(200).json(purchases || []);
  } catch (err) {
    console.error('Error in user-purchases:', err);
    return res.status(500).json({
      error: 'Internal server error',
      details: String(err)
    });
  }
} 