const { PrismaClient } = require('@prisma/client');

async function cleanupOrphanedRecords() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧹 Cleaning up orphaned database records...\n');
    
    // Delete purchases for non-existent collection videos
    const orphanedPurchases = await prisma.purchase.deleteMany({
      where: {
        CollectionVideo: null
      }
    });
    console.log(`✅ Deleted ${orphanedPurchases.count} orphaned purchases`);
    
    // Delete collection videos without collections
    const orphanedVideos = await prisma.collectionVideo.deleteMany({
      where: {
        collection: null
      }
    });
    console.log(`✅ Deleted ${orphanedVideos.count} orphaned collection videos`);
    
    // Find and delete empty collections (collections with no videos)
    const collectionsWithVideos = await prisma.collection.findMany({
      include: {
        videos: true
      }
    });
    
    let deletedCollections = 0;
    for (const collection of collectionsWithVideos) {
      if (collection.videos.length === 0) {
        await prisma.collection.delete({
          where: { id: collection.id }
        });
        deletedCollections++;
        console.log(`🗑️  Deleted empty collection: ${collection.title}`);
      }
    }
    
    console.log(`✅ Deleted ${deletedCollections} empty collections`);
    
    // Get final counts
    const finalCounts = {
      heroVideos: await prisma.heroVideo.count(),
      collections: await prisma.collection.count(),
      collectionVideos: await prisma.collectionVideo.count(),
      purchases: await prisma.purchase.count(),
      users: await prisma.user.count()
    };
    
    console.log('\n📊 Final database state:');
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`);
    });
    
    console.log('\n🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if called directly
if (require.main === module) {
  cleanupOrphanedRecords()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { cleanupOrphanedRecords }; 