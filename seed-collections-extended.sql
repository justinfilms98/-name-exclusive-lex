-- Extended seed data - 12 collections for masonry grid
-- Run this in Supabase SQL Editor after running the main schema

-- Clear existing collections first (optional)
-- DELETE FROM collections;

-- Insert 12 diverse collections for masonry grid
INSERT INTO collections (id, title, description, price, duration, video_path, thumbnail_path, photo_paths) VALUES
(
  gen_random_uuid(),
  'Midnight Sessions',
  'Intimate late-night content captured in exclusive behind-the-scenes moments.',
  24.99,
  1500, -- 25 minutes
  'collections/midnight/video.mp4',
  'collections/midnight/thumbnail.jpg',
  ARRAY['collections/midnight/photo1.jpg', 'collections/midnight/photo2.jpg']
),
(
  gen_random_uuid(),
  'Golden Hour Chronicles',
  'Premium sunset photography sessions with exclusive modeling content.',
  34.99,
  2100, -- 35 minutes
  'collections/golden/video.mp4',
  'collections/golden/thumbnail.jpg',
  ARRAY['collections/golden/photo1.jpg', 'collections/golden/photo2.jpg', 'collections/golden/photo3.jpg']
),
(
  gen_random_uuid(),
  'Exclusive Studio Sessions',
  'Professional studio content with high-end production value and exclusive access.',
  49.99,
  3600, -- 60 minutes
  'collections/studio/video.mp4',
  'collections/studio/thumbnail.jpg',
  ARRAY['collections/studio/photo1.jpg']
),
(
  gen_random_uuid(),
  'Ocean Breeze Collection',
  'Beachside exclusive content with natural lighting and ocean views.',
  29.99,
  1800, -- 30 minutes
  'collections/ocean/video.mp4',
  'collections/ocean/thumbnail.jpg',
  ARRAY['collections/ocean/photo1.jpg', 'collections/ocean/photo2.jpg']
),
(
  gen_random_uuid(),
  'Urban Nights',
  'City skyline backdrop with exclusive nighttime photography and video content.',
  39.99,
  2700, -- 45 minutes
  'collections/urban/video.mp4',
  'collections/urban/thumbnail.jpg',
  ARRAY['collections/urban/photo1.jpg', 'collections/urban/photo2.jpg', 'collections/urban/photo3.jpg', 'collections/urban/photo4.jpg']
),
(
  gen_random_uuid(),
  'Vintage Glamour',
  'Classic vintage-style exclusive content with retro aesthetics.',
  44.99,
  3000, -- 50 minutes
  'collections/vintage/video.mp4',
  'collections/vintage/thumbnail.jpg',
  ARRAY['collections/vintage/photo1.jpg']
),
(
  gen_random_uuid(),
  'Natural Beauty',
  'Outdoor nature settings with exclusive content in scenic locations.',
  27.99,
  1650, -- 27.5 minutes
  'collections/nature/video.mp4',
  'collections/nature/thumbnail.jpg',
  ARRAY['collections/nature/photo1.jpg', 'collections/nature/photo2.jpg']
),
(
  gen_random_uuid(),
  'Luxury Penthouse',
  'High-end penthouse exclusive content with luxury interior backdrops.',
  69.99,
  4500, -- 75 minutes
  'collections/penthouse/video.mp4',
  'collections/penthouse/thumbnail.jpg',
  ARRAY['collections/penthouse/photo1.jpg', 'collections/penthouse/photo2.jpg', 'collections/penthouse/photo3.jpg']
),
(
  gen_random_uuid(),
  'Artistic Expressions',
  'Creative artistic content with unique visual aesthetics and exclusive access.',
  32.99,
  2200, -- 36.7 minutes
  'collections/artistic/video.mp4',
  'collections/artistic/thumbnail.jpg',
  ARRAY['collections/artistic/photo1.jpg']
),
(
  gen_random_uuid(),
  'Poolside Paradise',
  'Exclusive poolside content with tropical vibes and crystal clear video quality.',
  36.99,
  2400, -- 40 minutes
  'collections/poolside/video.mp4',
  'collections/poolside/thumbnail.jpg',
  ARRAY['collections/poolside/photo1.jpg', 'collections/poolside/photo2.jpg']
),
(
  gen_random_uuid(),
  'Rooftop Revelations',
  'Exclusive rooftop content with city panoramic views and premium access.',
  42.99,
  2850, -- 47.5 minutes
  'collections/rooftop/video.mp4',
  'collections/rooftop/thumbnail.jpg',
  ARRAY['collections/rooftop/photo1.jpg', 'collections/rooftop/photo2.jpg', 'collections/rooftop/photo3.jpg']
),
(
  gen_random_uuid(),
  'VIP Behind The Scenes',
  'Ultimate exclusive behind-the-scenes content with extended access and bonus materials.',
  89.99,
  5400, -- 90 minutes
  'collections/vip/video.mp4',
  'collections/vip/thumbnail.jpg',
  ARRAY['collections/vip/photo1.jpg', 'collections/vip/photo2.jpg', 'collections/vip/photo3.jpg', 'collections/vip/photo4.jpg', 'collections/vip/photo5.jpg']
);

-- Verify all collections were inserted
SELECT count(*) as total_collections FROM collections;
SELECT title, price, duration/60 as duration_minutes FROM collections ORDER BY created_at; 