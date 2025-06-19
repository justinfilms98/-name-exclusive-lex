import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Debugging UUID generation and collection creation...')

  try {
    // Test 1: Generate UUID and log it
    const uuid = randomUUID()
    console.log('Generated UUID:', uuid)
    console.log('UUID type:', typeof uuid)
    console.log('UUID length:', uuid.length)
    console.log('UUID format check:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid))

    // Test 2: Try to create collection with the same UUID
    console.log('\n🧪 Creating collection with UUID:', uuid)
    const collection = await prisma.collection.create({
      data: {
        id: uuid,
        name: 'Debug Test Collection',
      },
    })
    console.log('✅ Collection created successfully:', collection.id)

    // Test 3: Check if the collection exists
    const foundCollection = await prisma.collection.findUnique({
      where: { id: uuid }
    })
    console.log('✅ Collection found in database:', foundCollection?.name)

  } catch (error) {
    console.error('❌ Error:', error)
    if (error.code === 'P2023') {
      console.log('This is a UUID format error')
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