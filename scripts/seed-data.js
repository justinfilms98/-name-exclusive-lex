#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleHeroVideos = [
  {
    title: "Exclusive Interview: Behind the Scenes",
    description: "An intimate look at the creative process behind our most popular content.",
    thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=450&fit=crop",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    order: 1,
    price: 9.99,
    status: "approved",
    ageRating: "PG",
    category: "entertainment",
    tags: ["interview", "behind-the-scenes", "exclusive"]
  },
  {
    title: "Premium Documentary: The Art of Storytelling",
    description: "Explore the techniques used by master storytellers in modern media.",
    thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
    order: 2,
    price: 14.99,
    status: "approved",
    ageRating: "PG-13",
    category: "documentary",
    tags: ["documentary", "storytelling", "art"]
  },
  {
    title: "VIP Access: Exclusive Performance",
    description: "A rare performance available only to our premium subscribers.",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4",
    order: 3,
    price: 19.99,
    status: "approved",
    ageRating: "PG",
    category: "performance",
    tags: ["performance", "exclusive", "vip"]
  }
];

const sampleCollectionVideos = [
  // Collection: "Cinema Classics"
  {
    collection: "Cinema Classics",
    title: "The Golden Age of Hollywood",
    description: "A comprehensive look at the most influential films of the 1930s and 1940s.",
    thumbnail: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    price: 12.99,
    order: 1,
    duration: 120,
    category: "cinema",
    ageRating: "PG",
    tags: ["classic", "hollywood", "cinema"]
  },
  {
    collection: "Cinema Classics",
    title: "Film Noir: Shadows and Light",
    description: "Exploring the dark and mysterious world of film noir.",
    thumbnail: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&h=450&fit=crop",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
    price: 9.99,
    order: 2,
    duration: 95,
    category: "cinema",
    ageRating: "PG-13",
    tags: ["noir", "mystery", "classic"]
  },
  {
    collection: "Cinema Classics",
    title: "The Western Genre",
    description: "From John Wayne to Clint Eastwood, the evolution of the western.",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4",
    price: 11.99,
    order: 3,
    duration: 110,
    category: "cinema",
    ageRating: "PG",
    tags: ["western", "john-wayne", "classic"]
  },
  
  // Collection: "Modern Masterpieces"
  {
    collection: "Modern Masterpieces",
    title: "Contemporary Art Movements",
    description: "Understanding the major art movements of the 21st century.",
    thumbnail: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=450&fit=crop",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    price: 15.99,
    order: 1,
    duration: 85,
    category: "art",
    ageRating: "PG",
    tags: ["contemporary", "art", "modern"]
  },
  {
    collection: "Modern Masterpieces",
    title: "Digital Art Revolution",
    description: "How technology is transforming the art world.",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
    price: 13.99,
    order: 2,
    duration: 75,
    category: "art",
    ageRating: "PG",
    tags: ["digital", "technology", "art"]
  },
  {
    collection: "Modern Masterpieces",
    title: "Street Art and Urban Expression",
    description: "The rise of street art as a legitimate art form.",
    thumbnail: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=450&fit=crop",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4",
    price: 10.99,
    order: 3,
    duration: 90,
    category: "art",
    ageRating: "PG-13",
    tags: ["street-art", "urban", "contemporary"]
  },
  
  // Collection: "Documentary Series"
  {
    collection: "Documentary Series",
    title: "Planet Earth: Hidden Wonders",
    description: "Discover the most incredible natural phenomena on our planet.",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    price: 16.99,
    order: 1,
    duration: 150,
    category: "documentary",
    ageRating: "G",
    tags: ["nature", "planet-earth", "documentary"]
  },
  {
    collection: "Documentary Series",
    title: "Human Civilization: Ancient Empires",
    description: "The rise and fall of the world's greatest ancient civilizations.",
    thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
    price: 14.99,
    order: 2,
    duration: 120,
    category: "documentary",
    ageRating: "PG",
    tags: ["history", "civilization", "ancient"]
  },
  {
    collection: "Documentary Series",
    title: "Space Exploration: Beyond Our Solar System",
    description: "The latest discoveries in deep space exploration.",
    thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=450&fit=crop",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4",
    price: 18.99,
    order: 3,
    duration: 135,
    category: "documentary",
    ageRating: "PG",
    tags: ["space", "exploration", "science"]
  }
];

const sampleUsers = [
  {
    email: "testuser1@example.com",
    name: "Test User 1",
    role: "user"
  },
  {
    email: "testuser2@example.com",
    name: "Test User 2",
    role: "user"
  },
  {
    email: "admin@exclusivelex.com",
    name: "Admin User",
    role: "admin"
  }
];

async function seedHeroVideos() {
  console.log('🌟 Seeding hero videos...');
  
  for (const video of sampleHeroVideos) {
    try {
      const existing = await prisma.heroVideo.findFirst({
        where: { order: video.order }
      });
      
      if (!existing) {
        await prisma.heroVideo.create({
          data: video
        });
        console.log(`✅ Created hero video: ${video.title}`);
      } else {
        console.log(`⏭️  Hero video slot ${video.order} already taken, skipping`);
      }
    } catch (error) {
      console.error(`❌ Error creating hero video ${video.title}:`, error.message);
    }
  }
}

async function seedCollectionVideos() {
  console.log('📚 Seeding collection videos...');
  
  for (const video of sampleCollectionVideos) {
    try {
      const existing = await prisma.collectionVideo.findFirst({
        where: { 
          collection: video.collection,
          order: video.order
        }
      });
      
      if (!existing) {
        await prisma.collectionVideo.create({
          data: video
        });
        console.log(`✅ Created collection video: ${video.title} (${video.collection})`);
      } else {
        console.log(`⏭️  Collection video slot ${video.order} in ${video.collection} already taken, skipping`);
      }
    } catch (error) {
      console.error(`❌ Error creating collection video ${video.title}:`, error.message);
    }
  }
}

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  for (const user of sampleUsers) {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: user.email }
      });
      
      if (!existing) {
        await prisma.user.create({
          data: user
        });
        console.log(`✅ Created user: ${user.email} (${user.role})`);
      } else {
        console.log(`⏭️  User ${user.email} already exists, skipping`);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error.message);
    }
  }
}

async function seedSamplePurchases() {
  console.log('🛒 Seeding sample purchases...');
  
  try {
    // Get a test user and some videos
    const user = await prisma.user.findFirst({
      where: { email: "testuser1@example.com" }
    });
    
    const videos = await prisma.collectionVideo.findMany({
      take: 3
    });
    
    if (!user || videos.length === 0) {
      console.log('⏭️  No users or videos found for sample purchases');
      return;
    }
    
    for (let i = 0; i < Math.min(3, videos.length); i++) {
      const video = videos[i];
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      
      const existing = await prisma.purchase.findFirst({
        where: {
          userId: user.id,
          videoId: video.id
        }
      });
      
      if (!existing) {
        await prisma.purchase.create({
          data: {
            userId: user.id,
            videoId: video.id,
            expiresAt
          }
        });
        console.log(`✅ Created purchase: ${user.email} -> ${video.title}`);
      } else {
        console.log(`⏭️  Purchase already exists for ${user.email} -> ${video.title}`);
      }
    }
  } catch (error) {
    console.error('❌ Error creating sample purchases:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting database seeding...\n');
  
  try {
    await seedUsers();
    console.log('');
    
    await seedHeroVideos();
    console.log('');
    
    await seedCollectionVideos();
    console.log('');
    
    await seedSamplePurchases();
    console.log('');
    
    console.log('✅ Database seeding completed successfully!');
    
    // Display summary
    const heroCount = await prisma.heroVideo.count();
    const collectionCount = await prisma.collectionVideo.count();
    const userCount = await prisma.user.count();
    const purchaseCount = await prisma.purchase.count();
    
    console.log('\n📊 Seeding Summary:');
    console.log(`   Hero Videos: ${heroCount}`);
    console.log(`   Collection Videos: ${collectionCount}`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Purchases: ${purchaseCount}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle command line arguments
const command = process.argv[2];

if (command === '--help' || command === '-h') {
  console.log(`
🌱 Database Seeding Script

Usage: node scripts/seed-data.js [command]

Commands:
  (no command)     Run full seeding process
  --help, -h       Show this help message
  --hero-only      Seed only hero videos
  --collections-only Seed only collection videos
  --users-only     Seed only users
  --purchases-only Seed only sample purchases

Examples:
  node scripts/seed-data.js
  node scripts/seed-data.js --hero-only
  node scripts/seed-data.js --collections-only
`);
  process.exit(0);
}

if (command === '--hero-only') {
  main().then(() => {
    seedHeroVideos().then(() => process.exit(0));
  });
} else if (command === '--collections-only') {
  main().then(() => {
    seedCollectionVideos().then(() => process.exit(0));
  });
} else if (command === '--users-only') {
  main().then(() => {
    seedUsers().then(() => process.exit(0));
  });
} else if (command === '--purchases-only') {
  main().then(() => {
    seedSamplePurchases().then(() => process.exit(0));
  });
} else {
  main();
} 