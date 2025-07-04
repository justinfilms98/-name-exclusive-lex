// Only keep UploadThing logic. All supabase logic and functions are removed.

/**
 * Server-side: Generate a presigned upload URL using UploadThing
 * @param { filePath: string, fileType: string }
 * @returns { url: string, key: string, error?: string }
 */
export async function generateUploadThingUrl() {
  const response = await fetch('https://uploadthing.com/api/presign', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPLOADTHING_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: [
        {
          name: 'video.mp4',
          type: 'video/mp4',
        },
      ],
      appId: process.env.UPLOADTHING_APP_ID,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get UploadThing URL');
  }

  const data = await response.json();
  return data;
} 