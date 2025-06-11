import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // List all collection videos
    const { data, error } = await supabase
      .from('collection_videos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    // Add a new collection video
    const { title, description, price, duration, thumbnail_url, video_url, creator_id } = req.body;
    const { data, error } = await supabase
      .from('collection_videos')
      .insert([
        { title, description, price, duration, thumbnail_url, video_url, creator_id }
      ])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data[0]);
  }

  if (req.method === 'PUT') {
    const { id, ...fields } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const { data, error } = await supabase
      .from('collection_videos')
      .update(fields)
      .eq('id', id)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data[0]);
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query as { id?: string };
      if (!id) {
        return res.status(400).json({ error: 'Missing video id' });
      }
      const { data, error } = await supabase
        .from('collection_videos')
        .delete()
        .eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, deleted: data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 