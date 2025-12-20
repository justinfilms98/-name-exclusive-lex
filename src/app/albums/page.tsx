"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAlbums, getSignedUrl } from "@/lib/supabase";
import { Images } from "lucide-react";

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
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnailUrls, setThumbnailUrls] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const load = async () => {
      const { data } = await getAlbums();
      if (data) {
        setAlbums(data);
        await loadThumbnails(data);
      }
      setLoading(false);
    };
    load();
  }, []);

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
    <div className="min-h-screen bg-almond pt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="heading-1">Albums</h1>
            <p className="text-sage mt-2">Browse curated groups of collections.</p>
          </div>
          <Link href="/collections" className="btn-secondary">
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
          <div className="grid grid-cols-2 max-[430px]:grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 sm:gap-6 lg:gap-8">
            {albums.map((album) => {
              const thumbnailUrl = thumbnailUrls[album.id];
              return (
                <Link
                  key={album.id}
                  href={`/albums/${album.slug}`}
                  className="group"
                >
                  <div className="flex flex-col bg-blanc border border-mushroom/30 rounded-xl shadow-soft overflow-hidden h-full">
                    <div className="relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4] overflow-hidden">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={album.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-gradient-to-br from-mushroom to-blanket flex items-center justify-center ${thumbnailUrl ? "hidden" : ""}`}>
                        <Images className="w-16 h-16 text-sage/60" />
                      </div>
                      <div className="absolute top-3 right-3 bg-blanc/90 backdrop-blur-sm text-earth px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        {album.collections?.[0]?.count ?? 0}
                      </div>
                    </div>
                    <div className="p-4 space-y-2 bg-blanc">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif text-earth text-lg mb-1 line-clamp-2">
                            {album.name}
                          </h3>
                          {album.description && (
                            <p className="text-sage text-sm line-clamp-2">
                              {album.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-sage">
                        <span>{album.collections?.[0]?.count ?? 0} collections</span>
                        <span>{new Date(album.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

