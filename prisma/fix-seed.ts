import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting fixed database seed...')

  try {
    // 1. Create admin user
    const adminUserId = randomUUID()
    const adminUser = await prisma.user.upsert({
      where: { email: 'contact.exclusivelex@gmail.com' },
      update: {},
      create: {
        id: adminUserId,
        email: 'contact.exclusivelex@gmail.com',
        name: 'Admin User',
      },
    })

    console.log('✅ Admin user created:', adminUser.email)
    console.log('Admin user ID:', adminUser.id)

    // 2. Create a test collection (without userId for now)
    const collectionId = randomUUID()
    const testCollection = await prisma.collection.create({
      data: {
        id: collectionId,
        name: 'Test Collection',
        // userId: adminUser.id, // Commented out to test
      },
    })

    console.log('✅ Test collection created:', testCollection.name)

    // 3. Create a test media item
    const mediaItemId = randomUUID()
    const testMediaItem = await prisma.mediaItem.create({
      data: {
        id: mediaItemId,
        mediaType: 'video',
        filePath: 'https://example.com/media-item.mp4',
        thumbnailPath: 'https://example.com/media-thumbnail.jpg',
        collectionId: testCollection.id,
        description: 'A test media item for production',
        price: 0.0,
        duration: 120,
        // userId: adminUser.id, // Commented out to test
      },
    })

    console.log('✅ Test media item created:', testMediaItem.id)

    // 4. Create a test hero video
    const testHeroVideo = await prisma.heroVideo.create({
      data: {
        title: 'Test Hero Video',
        description: 'A test hero video for production',
        thumbnail: 'https://example.com/hero-thumbnail.jpg',
        videoUrl: 'https://example.com/hero-video.mp4',
        order: 1,
        // userId: adminUser.id, // Commented out to test
        ageRating: 'PG',
        category: 'entertainment',
        price: 0.0,
        status: 'draft',
        tags: ['test', 'hero'],
        moderated: false,
      },
    })

    console.log('✅ Test hero video created:', testHeroVideo.title)

    // 5. Create a test collection video
    const testCollectionVideo = await prisma.collectionVideo.create({
      data: {
        collection: testCollection.name,
        title: 'Test Collection Video',
        description: 'A test video in a collection',
        thumbnail: 'https://example.com/collection-video-thumbnail.jpg',
        videoUrl: 'https://example.com/collection-video.mp4',
        order: 1,
        // userId: adminUser.id, // Commented out to test
        price: 0.0,
      },
    })

    console.log('✅ Test collection video created:', testCollectionVideo.title)

    // 6. Create a test video
    const videoId = randomUUID()
    const testVideo = await prisma.video.create({
      data: {
        id: videoId,
        title: 'Test Video',
        description: 'A test video for production',
        price: 0.0,
        type: 'monthly',
        videoKey: 'test-video-key',
        thumbnailKey: 'test-thumbnail-key',
        creatorId: adminUser.id,
      },
    })

    console.log('✅ Test video created:', testVideo.title)

    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`- Admin user: ${adminUser.email}`)
    console.log(`- Collection: ${testCollection.name}`)
    console.log(`- Media item: ${testMediaItem.id}`)
    console.log(`- Hero video: ${testHeroVideo.title}`)
    console.log(`- Collection video: ${testCollectionVideo.title}`)
    console.log(`- Video: ${testVideo.title}`)

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 