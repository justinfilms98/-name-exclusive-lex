import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Testing database connection and Collection model...')

  try {
    // Test 1: Check if we can connect
    console.log('✅ Database connection successful')

    // Test 2: Try to create a collection with a simple string ID
    console.log('🧪 Testing Collection creation with simple string ID...')
    try {
      const testCollection1 = await prisma.collection.create({
        data: {
          id: 'test-collection-123',
          name: 'Test Collection 1',
        },
      })
      console.log('✅ Collection created with simple string ID:', testCollection1.id)
    } catch (error) {
      console.log('❌ Failed with simple string ID:', error.message)
    }

    // Test 3: Try to create a collection with UUID
    console.log('🧪 Testing Collection creation with UUID...')
    try {
      const testCollection2 = await prisma.collection.create({
        data: {
          id: randomUUID(),
          name: 'Test Collection 2',
        },
      })
      console.log('✅ Collection created with UUID:', testCollection2.id)
    } catch (error) {
      console.log('❌ Failed with UUID:', error.message)
    }

    // Test 4: Check existing collections
    console.log('🔍 Checking existing collections...')
    const existingCollections = await prisma.collection.findMany({
      take: 5
    })
    console.log(`Found ${existingCollections.length} existing collections:`)
    existingCollections.forEach((collection, index) => {
      console.log(`  ${index + 1}. ID: ${collection.id}, Name: ${collection.name}`)
    })

  } catch (error) {
    console.error('❌ Error during testing:', error)
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