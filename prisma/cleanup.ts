import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Starting database cleanup...')

  try {
    // Delete in reverse order of dependencies to avoid foreign key constraints
    
    // 1. Delete test videos
    const deletedVideos = await prisma.video.deleteMany({
      where: {
        title: {
          contains: 'Test'
        }
      }
    })
    console.log(`✅ Deleted ${deletedVideos.count} test videos`)

    // 2. Delete test collection videos
    const deletedCollectionVideos = await prisma.collectionVideo.deleteMany({
      where: {
        title: {
          contains: 'Test'
        }
      }
    })
    console.log(`✅ Deleted ${deletedCollectionVideos.count} test collection videos`)

    // 3. Delete test hero videos
    const deletedHeroVideos = await prisma.heroVideo.deleteMany({
      where: {
        title: {
          contains: 'Test'
        }
      }
    })
    console.log(`✅ Deleted ${deletedHeroVideos.count} test hero videos`)

    // 4. Delete test media items
    const deletedMediaItems = await prisma.mediaItem.deleteMany({
      where: {
        description: {
          contains: 'test'
        }
      }
    })
    console.log(`✅ Deleted ${deletedMediaItems.count} test media items`)

    // 5. Delete test collections
    const deletedCollections = await prisma.collection.deleteMany({
      where: {
        name: {
          contains: 'Test'
        }
      }
    })
    console.log(`✅ Deleted ${deletedCollections.count} test collections`)

    // 6. Delete test admin user (optional - uncomment if needed)
    // const deletedUsers = await prisma.user.deleteMany({
    //   where: {
    //     email: 'contact.exclusivelex@gmail.com'
    //   }
    // })
    // console.log(`✅ Deleted ${deletedUsers.count} test users`)

    console.log('🎉 Database cleanup completed successfully!')
    console.log('\n📊 Cleanup Summary:')
    console.log(`- Videos: ${deletedVideos.count}`)
    console.log(`- Collection Videos: ${deletedCollectionVideos.count}`)
    console.log(`- Hero Videos: ${deletedHeroVideos.count}`)
    console.log(`- Media Items: ${deletedMediaItems.count}`)
    console.log(`- Collections: ${deletedCollections.count}`)
    // console.log(`- Users: ${deletedUsers.count}`)

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 