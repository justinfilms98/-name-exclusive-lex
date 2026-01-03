"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getAlbums, getSignedUrl, supabase } from "@/lib/supabase";
import { Images } from "lucide-react";
import ClientErrorBoundary from '@/components/ClientErrorBoundary';

interface Album {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  thumbnail_path?: string | null;
  created_at: string;
  collections?: { count: number }[];
}

export default function AlbumsPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnailUrls, setThumbnailUrls] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const load = async () => {
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }

      const { data } = await getAlbums();
      if (data) {
        setAlbums(data);
        await loadThumbnails(data);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const loadThumbnails = async (albums: Album[]) => {
    const thumbnailPromises = albums.map(async (album) => {
      if (album.thumbnail_path) {
        try {
          const { data, error } = await getSignedUrl('media', album.thumbnail_path, 3600);
          if (!error && data) {
            return { id: album.id, url: data.signedUrl };
          }
        } catch (error) {
          console.error('Failed to load thumbnail for', album.id, error);
        }
      }
      return { id: album.id, url: null };
    });

    const results = await Promise.all(thumbnailPromises);
    const urlMap: {[key: string]: string} = {};
    results.forEach(result => {
      if (result.url) {
        urlMap[result.id] = result.url;
      }
    });
    setThumbnailUrls(urlMap);
  };

  return (
    <ClientErrorBoundary>
      <div className="min-h-screen bg-almond">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col items-center text-center gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col items-center">
            <h1 className="heading-1 text-center">Albums</h1>
            <p className="text-earth opacity-75 mt-1 sm:mt-2 text-base sm:text-lg text-center">
              Browse curated groups of collections.
            </p>
          </div>
          <Link href="/collections" className="btn-secondary inline-flex self-center">
            View all collections
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 spinner" />
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-16 card-glass">
            <Images className="w-12 h-12 text-sage mx-auto mb-4" />
            <p className="text-earth font-medium">No albums yet.</p>
            <p className="text-sage text-sm">Collections are coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 items-stretch">
            {albums.map((album) => {
              const thumbnailUrl = thumbnailUrls[album.id];
              return (
                <Link
                  key={album.id}
                  href={`/albums/${album.slug}`}
                  className="group h-full block"
                >
                  <div className="relative h-full w-full aspect-[4/5] rounded-2xl overflow-hidden border border-mushroom/30 shadow-soft">
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={album.name}
                        fill
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#F2E0CF] to-[#C9BBA8]" />
                    )}
                    
                    {/* Bottom gradient overlay for text readability */}
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    {/* Title overlay */}
                    <h3 className="absolute bottom-4 left-4 right-4 text-white/90 font-serif text-xl md:text-2xl leading-tight drop-shadow line-clamp-2">
                      {album.name}
                    </h3>
                    
                    {/* Count pill */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-earth px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                      {album.collections?.[0]?.count ?? 0}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </ClientErrorBoundary>
  );
}

