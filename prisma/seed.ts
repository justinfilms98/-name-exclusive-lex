import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('Starting database seed...');

  // Create a fresh Prisma client
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    // Test connection
    await prisma.$connect();
    console.log('Connected to database');

    // Seed Hero Videos (skip if they exist)
    const heroVideos = [
      {
        title: 'Hero Video 1',
        description: 'First hero video',
        thumbnail: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        order: 1,
        status: 'published',
        moderated: true,
        ageRating: 'PG',
        category: 'lifestyle',
        tags: ['sample'],
        price: 0,
        updatedAt: new Date(),
      },
      {
        title: 'Hero Video 2',
        description: 'Second hero video',
        thumbnail: 'https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        order: 2,
        status: 'published',
        moderated: true,
        ageRating: 'PG',
        category: 'lifestyle',
        tags: ['sample'],
        price: 0,
        updatedAt: new Date(),
      },
      {
        title: 'Hero Video 3',
        description: 'Third hero video',
        thumbnail: 'https://images.pexels.com/photos/3952236/pexels-photo-3952236.jpeg',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        order: 3,
        status: 'published',
        moderated: true,
        ageRating: 'PG',
        category: 'lifestyle',
        tags: ['sample'],
        price: 0,
        updatedAt: new Date(),
      },
    ];

    for (const video of heroVideos) {
      try {
        await prisma.heroVideo.create({ data: video });
        console.log(`Created hero video: ${video.title}`);
      } catch (error) {
        console.log(`Hero video ${video.title} already exists, skipping...`);
      }
    }

    // Seed Collections and Collection Videos
    const thumbnails = [
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2',
      'https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg',
      'https://images.pexels.com/photos/3952236/pexels-photo-3952236.jpeg',
      'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0',
      'https://images.pexels.com/photos/2104258/pexels-photo-2104258.jpeg',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f',
      'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf',
      'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d',
    ];

    const videoUrls = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    ];

    const prices = [10, 15, 20, 25, 30, 35, 40, 50];
    const durations = [5, 7, 10, 12, 14, 16, 18, 20];

    for (let i = 1; i <= 8; i++) {
      try {
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
      } catch (error) {
        console.log(`Collection ${i} already exists, skipping...`);
      }
    }

    console.log('Seeding completed successfully');

  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 