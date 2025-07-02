import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting step-by-step seed test...')

  try {
    // Step 1: Create admin user
    console.log('\n📝 Step 1: Creating admin user...')
    const adminUserId = randomUUID()
    console.log('Admin user ID:', adminUserId)
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'contact.exclusivelex@gmail.com' },
      update: {},
      create: {
        id: adminUserId,
        email: 'contact.exclusivelex@gmail.com',
        name: 'Admin User',
        updatedAt: new Date(),
      },
    })
    console.log('✅ Admin user created:', adminUser.email)
    console.log('Admin user ID in database:', adminUser.id)

    // Step 2: Create collection
    console.log('\n📝 Step 2: Creating collection...')
    const collection = await prisma.collection.create({
      data: {
        title: 'Step-by-Step Test Collection',
        description: 'A test collection for seeding.',
      },
    })
    console.log('✅ Collection created:', collection.title)
    console.log('Collection ID in database:', collection.id)

    // Step 3: Create collection video
    console.log('\n📝 Step 3: Creating collection video...')
    const collectionVideo = await prisma.collectionVideo.create({
      data: {
        title: 'Test Video',
        description: 'A test video for the collection.',
        thumbnail: 'https://placehold.co/600x400',
        videoUrl: 'https://www.example.com/video.mp4',
        order: 1,
        price: 10,
        collection: { connect: { id: collection.id } },
      },
    })
    console.log('✅ Collection video created:', collectionVideo.title)

  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message)
      if (error.message.includes('P2023')) {
        console.log('UUID format error detected')
      }
    } else {
      console.error('❌ Error:', error)
    }
  }
}

main()
  .catch((e) => {
    if (e instanceof Error) {
      console.error('❌ Error:', e.message)
    } else {
      console.error('❌ Error:', e)
    }
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 