import { PrismaClient } from '@prisma/client';

async function setAdmin() {
  console.log('Setting admin user...');

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    await prisma.$connect();
    console.log('Connected to database');

    // Update user to admin role
    const user = await prisma.user.update({
      where: {
        email: 'contact.exclusivelex@gmail.com',
      },
      data: {
        role: 'admin',
      },
    });

    console.log(`Updated user ${user.email} to admin role`);

  } catch (error) {
    console.error('Error setting admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 