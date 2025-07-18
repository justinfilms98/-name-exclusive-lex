const { PrismaClient } = require('@prisma/client');

async function resetDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting database reset...');
    
    // Delete all existing data
    console.log('Deleting all existing data...');
    await prisma.purchase.deleteMany();
    await prisma.collectionVideo.deleteMany();
    await prisma.collection.deleteMany();
    await prisma.heroVideo.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('Database cleared successfully!');
    
    // Run the seed script
    console.log('Running seed script...');
    const { exec } = require('child_process');
    
    exec('npx prisma db seed', (error, stdout, stderr) => {
      if (error) {
        console.error('Error running seed:', error);
        return;
      }
      console.log('Seed output:', stdout);
      console.log('Database reset and seeded successfully!');
    });
    
  } catch (error) {
    console.error('Error during reset:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase(); 