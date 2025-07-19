import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateHeroVideos() {
  console.log('Updating hero video URLs...');

  try {
    // Working video URLs that should load properly
    const workingVideoUrls = [
      'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
      'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      'https://file-examples.com/storage/fe68c009e7aedc85da39129/2017/10/file_example_MP4_640_3MG.mp4',
    ];

    const updatedTitles = [
      'Welcome to Exclusive Lex',
      'Exclusive Collections',
      'Premium Content'
    ];

    const updatedDescriptions = [
      'Premium lifestyle content',
      'Curated video experiences',
      'High-quality exclusive videos'
    ];

    // Get existing hero videos
    const existingVideos = await prisma.heroVideo.findMany({
      orderBy: { order: 'asc' },
      take: 3
    });

    console.log(`Found ${existingVideos.length} hero videos to update`);

    // Update each video with working URLs
    for (let i = 0; i < existingVideos.length && i < workingVideoUrls.length; i++) {
      const video = existingVideos[i];
      await prisma.heroVideo.update({
        where: { id: video.id },
        data: {
          title: updatedTitles[i],
          description: updatedDescriptions[i],
          videoUrl: workingVideoUrls[i],
          status: 'published',
          moderated: true,
        }
      });
      console.log(`Updated video ${video.id}: ${updatedTitles[i]}`);
    }

    console.log('✅ Hero videos updated successfully!');
  } catch (error) {
    console.error('Error updating hero videos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateHeroVideos(); 