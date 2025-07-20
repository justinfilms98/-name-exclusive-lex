-- Seed sample collections for testing
-- Run this in Supabase SQL Editor to add test data

INSERT INTO collections (id, title, description, price, duration, video_path, thumbnail_path, photo_paths) VALUES
(
  gen_random_uuid(),
  'Exclusive Collection 1',
  'A premium video collection featuring exclusive content. This is a sample collection for testing the platform.',
  29.99,
  1800, -- 30 minutes
  'collections/sample1/video.mp4',
  'collections/sample1/thumbnail.jpg',
  ARRAY['collections/sample1/photo1.jpg', 'collections/sample1/photo2.jpg']
),
(
  gen_random_uuid(),
  'Premium Experience',
  'Limited edition content with behind-the-scenes access. Perfect for testing purchase and viewing functionality.',
  49.99,
  3600, -- 60 minutes
  'collections/sample2/video.mp4',
  'collections/sample2/thumbnail.jpg',
  ARRAY['collections/sample2/photo1.jpg']
),
(
  gen_random_uuid(),
  'VIP Access Bundle',
  'Exclusive VIP content with extended viewing time. This collection tests longer access duration and higher pricing.',
  99.99,
  7200, -- 120 minutes
  'collections/sample3/video.mp4',
  'collections/sample3/thumbnail.jpg',
  ARRAY[]
);

-- Verify the data was inserted
SELECT id, title, price, duration, created_at FROM collections ORDER BY created_at; 