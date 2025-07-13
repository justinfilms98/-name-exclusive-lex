-- SQL seed script for 8 collections and 8 collection_videos

INSERT INTO collection (id, title, description) VALUES
  (1, 'Sample Collection 1', 'Preview of content in this collection.'),
  (2, 'Sample Collection 2', 'Preview of content in this collection.'),
  (3, 'Sample Collection 3', 'Preview of content in this collection.'),
  (4, 'Sample Collection 4', 'Preview of content in this collection.'),
  (5, 'Sample Collection 5', 'Preview of content in this collection.'),
  (6, 'Sample Collection 6', 'Preview of content in this collection.'),
  (7, 'Sample Collection 7', 'Preview of content in this collection.'),
  (8, 'Sample Collection 8', 'Preview of content in this collection.');

INSERT INTO collection_video (id, collection_id, title, description, price, duration_minutes, thumbnail, video_url) VALUES
  (1, 1, 'Sample Collection Video 1', 'Preview of content in this collection.', 10, 5, 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2', 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'),
  (2, 2, 'Sample Collection Video 2', 'Preview of content in this collection.', 15, 7, 'https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg', 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_5mb.mp4'),
  (3, 3, 'Sample Collection Video 3', 'Preview of content in this collection.', 20, 10, 'https://images.pexels.com/photos/3952236/pexels-photo-3952236.jpeg', 'https://coverr.co/s3/mp4/coverr-lake-birds-2386.mp4'),
  (4, 4, 'Sample Collection Video 4', 'Preview of content in this collection.', 25, 12, 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0', 'https://coverr.co/s3/mp4/coverr-mountain-pines-8373.mp4'),
  (5, 5, 'Sample Collection Video 5', 'Preview of content in this collection.', 30, 14, 'https://images.pexels.com/photos/2104258/pexels-photo-2104258.jpeg', 'https://coverr.co/s3/mp4/coverr-slow-canyon-pan-8687.mp4'),
  (6, 6, 'Sample Collection Video 6', 'Preview of content in this collection.', 35, 16, 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f', 'https://coverr.co/s3/mp4/coverr-rain-on-window-2826.mp4'),
  (7, 7, 'Sample Collection Video 7', 'Preview of content in this collection.', 40, 18, 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf', 'https://coverr.co/s3/mp4/coverr-beach-glide-2973.mp4'),
  (8, 8, 'Sample Collection Video 8', 'Preview of content in this collection.', 50, 20, 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d', 'https://coverr.co/s3/mp4/coverr-lighthouse-pathway-9793.mp4'); 