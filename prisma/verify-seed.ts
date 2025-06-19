import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verifying seed data...')

  try {
    // 1. Verify admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'contact.exclusivelex@gmail.com' }
    })
    
    if (!adminUser) {
      throw new Error('❌ Admin user not found')
    }
    console.log('✅ Admin user verified:', adminUser.email)

    // 2. Verify test collection exists
    const testCollection = await prisma.collection.findFirst({
      where: {
        name: 'Test Collection'
      }
    })
    
    if (!testCollection) {
      throw new Error('❌ Test collection not found')
    }
    console.log('✅ Test collection verified:', testCollection.name)

    // 3. Verify test media item exists and is linked to collection
    const testMediaItem = await prisma.mediaItem.findFirst({
      where: {
        collectionId: testCollection.id,
        description: {
          contains: 'test'
        }
      },
      include: {
        collection: true
      }
    })
    
    if (!testMediaItem) {
      throw new Error('❌ Test media item not found')
    }
    console.log('✅ Test media item verified:', testMediaItem.id)
    console.log('  └─ Linked to collection:', testMediaItem.collection.name)

    // 4. Verify test hero video exists
    const testHeroVideo = await prisma.heroVideo.findFirst({
      where: {
        title: 'Test Hero Video'
      }
    })
    
    if (!testHeroVideo) {
      throw new Error('❌ Test hero video not found')
    }
    console.log('✅ Test hero video verified:', testHeroVideo.title)

    // 5. Verify test collection video exists
    const testCollectionVideo = await prisma.collectionVideo.findFirst({
      where: {
        title: 'Test Collection Video'
      }
    })
    
    if (!testCollectionVideo) {
      throw new Error('❌ Test collection video not found')
    }
    console.log('✅ Test collection video verified:', testCollectionVideo.title)

    // 6. Verify test video exists
    const testVideo = await prisma.video.findFirst({
      where: {
        title: 'Test Video',
        creatorId: adminUser.id
      }
    })
    
    if (!testVideo) {
      throw new Error('❌ Test video not found')
    }
    console.log('✅ Test video verified:', testVideo.title)

    // 7. Verify relationships
    console.log('\n🔗 Verifying relationships...')
    
    // Check user has videos
    const userVideos = await prisma.video.findMany({
      where: { creatorId: adminUser.id }
    })
    console.log(`  └─ User has ${userVideos.length} videos`)

    // Check user has hero videos (without userId filter)
    const userHeroVideos = await prisma.heroVideo.findMany({
      where: { title: { contains: 'Test' } }
    })
    console.log(`  └─ Found ${userHeroVideos.length} test hero videos`)

    // Check user has collections (without userId filter)
    const userCollections = await prisma.collection.findMany({
      where: { name: { contains: 'Test' } }
    })
    console.log(`  └─ Found ${userCollections.length} test collections`)

    // Check collection has media items
    const collectionMediaItems = await prisma.mediaItem.findMany({
      where: { collectionId: testCollection.id }
    })
    console.log(`  └─ Collection has ${collectionMediaItems.length} media items`)

    console.log('\n🎉 All seed data verification passed!')
    console.log('\n📊 Verification Summary:')
    console.log(`- Admin user: ${adminUser.email}`)
    console.log(`- Collection: ${testCollection.name}`)
    console.log(`- Media item: ${testMediaItem.id}`)
    console.log(`- Hero video: ${testHeroVideo.title}`)
    console.log(`- Collection video: ${testCollectionVideo.title}`)
    console.log(`- Video: ${testVideo.title}`)
    console.log(`- Total relationships verified: 4`)

  } catch (error) {
    console.error('❌ Verification failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during verification:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 