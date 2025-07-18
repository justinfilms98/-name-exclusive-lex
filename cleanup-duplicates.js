const { PrismaClient } = require('@prisma/client');

async function cleanupDuplicates() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting cleanup of duplicate data...');
    
    // Clean up hero videos - keep only the first 3
    const heroVideos = await prisma.heroVideo.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${heroVideos.length} hero videos`);
    
    if (heroVideos.length > 3) {
      const toDelete = heroVideos.slice(3);
      console.log(`Deleting ${toDelete.length} duplicate hero videos...`);
      
      for (const video of toDelete) {
        await prisma.heroVideo.delete({
          where: { id: video.id }
        });
        console.log(`Deleted hero video: ${video.title}`);
      }
    }
    
    // Clean up collection videos - keep only the first 8
    const collectionVideos = await prisma.collectionVideo.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${collectionVideos.length} collection videos`);
    
    if (collectionVideos.length > 8) {
      const toDelete = collectionVideos.slice(8);
      console.log(`Deleting ${toDelete.length} duplicate collection videos...`);
      
      for (const video of toDelete) {
        await prisma.collectionVideo.delete({
          where: { id: video.id }
        });
        console.log(`Deleted collection video: ${video.title}`);
      }
    }
    
    // Clean up empty collections
    const collections = await prisma.collection.findMany({
      include: {
        videos: true
      }
    });
    
    for (const collection of collections) {
      if (collection.videos.length === 0) {
        await prisma.collection.delete({
          where: { id: collection.id }
        });
        console.log(`Deleted empty collection: ${collection.title}`);
      }
    }
    
    console.log('Cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicates(); 