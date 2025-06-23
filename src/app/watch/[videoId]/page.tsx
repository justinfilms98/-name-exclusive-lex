import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Lock } from 'lucide-react';

async function verifyPurchase(userId: string, videoId: string): Promise<boolean> {
  // Check if a purchase record exists for this user and this specific media item.
  const purchase = await prisma.purchase.findFirst({
    where: {
      userId: userId,
      mediaId: videoId,
    },
  });
  return !!purchase;
}

export default async function WatchPage({ params }: { params: { videoId: string } }) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const hasAccess = await verifyPurchase(user.id, params.videoId);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-stone-900 text-white flex flex-col items-center justify-center text-center p-4">
        <Lock className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-serif mb-4">Access Denied</h1>
        <p className="text-stone-400 mb-8">You have not purchased this item.</p>
        <Link href="/collections">
          <button className="bg-emerald-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-emerald-700 transition-colors">
            Explore Content
          </button>
        </Link>
      </div>
    );
  }

  // Fetch the media item details. The model is CollectionMedia.
  const mediaItem = await prisma.collectionMedia.findUnique({
    where: { id: params.videoId },
  });

  if (!mediaItem || !mediaItem.videoUrl) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-full max-w-6xl aspect-video bg-black">
        <video
          src={mediaItem.videoUrl}
          controls
          autoPlay
          className="w-full h-full"
          playsInline // Important for mobile browsers
        />
      </div>
      <div className="text-white text-center p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl lg:text-4xl font-serif mb-2">{mediaItem.title}</h1>
        {mediaItem.description && (
          <p className="text-stone-300 text-base lg:text-lg">{mediaItem.description}</p>
        )}
      </div>
    </div>
  );
} 