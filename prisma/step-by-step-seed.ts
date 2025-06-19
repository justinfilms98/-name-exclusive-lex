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
      },
    })
    console.log('✅ Admin user created:', adminUser.email)
    console.log('Admin user ID in database:', adminUser.id)

    // Step 2: Create collection
    console.log('\n📝 Step 2: Creating collection...')
    const collectionId = randomUUID()
    console.log('Collection ID:', collectionId)
    
    const testCollection = await prisma.collection.create({
      data: {
        id: collectionId,
        name: 'Step-by-Step Test Collection',
        userId: adminUser.id,
      },
    })
    console.log('✅ Collection created:', testCollection.name)
    console.log('Collection ID in database:', testCollection.id)

  } catch (error) {
    console.error('❌ Error:', error)
    if (error.code === 'P2023') {
      console.log('UUID format error detected')
    }
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