import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking user ID format...')

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'contact.exclusivelex@gmail.com' }
    })

    if (user) {
      console.log('User ID:', user.id)
      console.log('User ID type:', typeof user.id)
      console.log('User ID length:', user.id.length)
      console.log('User ID format check (UUID):', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id))
      console.log('User ID format check (alphanumeric):', /^[a-zA-Z0-9]+$/.test(user.id))
      
      // Try to create a collection with this user ID
      console.log('\n🧪 Testing collection creation with actual user ID...')
      try {
        const collection = await prisma.collection.create({
          data: {
            id: 'test-collection-with-user-id',
            name: 'Test Collection with User ID',
            userId: user.id,
          },
        })
        console.log('✅ Collection created with user ID:', collection.id)
      } catch (error) {
        console.log('❌ Failed to create collection with user ID:', error.message)
      }
    } else {
      console.log('User not found')
    }

  } catch (error) {
    console.error('❌ Error:', error)
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