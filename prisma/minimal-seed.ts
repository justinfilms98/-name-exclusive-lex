import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting minimal seed test...')

  try {
    // Generate UUID and log it
    const collectionId = randomUUID()
    console.log('Generated collection ID:', collectionId)
    
    // Create collection
    const testCollection = await prisma.collection.create({
      data: {
        id: collectionId,
        name: 'Minimal Test Collection',
      },
    })

    console.log('✅ Collection created:', testCollection.name)
    console.log('✅ Collection ID:', testCollection.id)

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