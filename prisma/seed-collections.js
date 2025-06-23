require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding placeholder collections...');
  
  for (let i = 1; i <= 8; i++) {
    const collectionId = `placeholder-${i}`;
    const collectionName = `Placeholder Collection ${i}`;
    
    const existingCollection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!existingCollection) {
      await prisma.collection.create({
        data: {
          id: collectionId,
          name: collectionName,
          userId: null, 
        },
      });
      console.log(`Created: ${collectionName}`);
    } else {
      console.log(`Skipped (already exists): ${collectionName}`);
    }
  }
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 