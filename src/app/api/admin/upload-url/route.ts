import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateUploadThingUrl } from '@/lib/services/uploadService';

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const urlData = await generateUploadThingUrl();
    return Response.json(urlData);
  } catch (err: any) {
    return new Response(`Failed to generate upload URL: ${err.message}`, {
      status: 500,
    });
  }
} 