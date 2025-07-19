import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('Starting database seed...');

  // Use the default Prisma client that reads from environment
  const prisma = new PrismaClient();

  try {
    // Test connection
    await prisma.$connect();
    console.log('Connected to database');

    // Check if data already exists to prevent duplicates
    const existingHeroVideos = await prisma.heroVideo.count();
    const existingCollections = await prisma.collection.count();

    if (existingHeroVideos > 0 || existingCollections > 0) {
      console.log('Database already has data. Skipping seed to prevent duplicates.');
      console.log(`Hero videos: ${existingHeroVideos}, Collections: ${existingCollections}`);
      return;
    }

    // Seed Hero Videos with working video URLs
    const heroVideos = [
      {
        title: 'Welcome to Exclusive Lex',
        description: 'Premium lifestyle content',
        thumbnail: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1920&h=1080&fit=crop',
        videoUrl: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        order: 1,
        status: 'published',
        moderated: true,
        ageRating: 'PG',
        category: 'lifestyle',
        tags: ['welcome', 'premium'],
        price: 0,
        updatedAt: new Date(),
      },
      {
        title: 'Exclusive Collections',
        description: 'Curated video experiences',
        thumbnail: 'https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg?w=1920&h=1080&fit=crop',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        order: 2,
        status: 'published',
        moderated: true,
        ageRating: 'PG',
        category: 'lifestyle',
        tags: ['collections', 'premium'],
        price: 0,
        updatedAt: new Date(),
      },
      {
        title: 'Premium Content',
        description: 'High-quality exclusive videos',
        thumbnail: 'https://images.pexels.com/photos/3952236/pexels-photo-3952236.jpeg?w=1920&h=1080&fit=crop',
        videoUrl: 'https://file-examples.com/storage/fe68c009e7aedc85da39129/2017/10/file_example_MP4_1280_10MG.mp4',
        order: 3,
        status: 'published',
        moderated: true,
        ageRating: 'PG',
        category: 'lifestyle',
        tags: ['premium', 'exclusive'],
        price: 0,
        updatedAt: new Date(),
      },
    ];

    for (const video of heroVideos) {
      await prisma.heroVideo.create({ data: video });
      console.log(`Created hero video: ${video.title}`);
    }

    // Seed Collections and Collection Videos with working URLs
    const thumbnails = [
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg?w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/3952236/pexels-photo-3952236.jpeg?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/2104258/pexels-photo-2104258.jpeg?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=800&h=600&fit=crop',
    ];

    // Use smaller, more reliable video URLs for collection videos
    const videoUrls = [
      'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
      'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      'https://file-examples.com/storage/fe68c009e7aedc85da39129/2017/10/file_example_MP4_640_3MG.mp4',
      'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
      'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      'https://file-examples.com/storage/fe68c009e7aedc85da39129/2017/10/file_example_MP4_480_1_5MG.mp4',
      'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
      'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    ];

    const prices = [10, 15, 20, 25, 30, 35, 40, 50];
    const durations = [5, 7, 10, 12, 14, 16, 18, 20];

    for (let i = 1; i <= 8; i++) {
      const collection = await prisma.collection.create({
        data: {
          title: `Sample Collection ${i}`,
          description: 'Preview of content in this collection.',
        },
      });

      await prisma.collectionVideo.create({
        data: {
          title: `Sample Collection Video ${i}`,
          description: 'Preview of content in this collection.',
          thumbnail: thumbnails[i - 1],
          videoUrl: videoUrls[i - 1],
          price: prices[i - 1],
          durationMinutes: durations[i - 1],
          order: i,
          collectionId: collection.id,
        },
      });
      console.log(`Created collection ${i} and video`);
    }

    console.log('Seeding completed successfully');

  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if called directly (not imported)
if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
} 