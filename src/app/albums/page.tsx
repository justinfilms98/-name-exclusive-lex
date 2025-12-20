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
          <div className="flex flex-col items-center gap-6 max-h-[calc(100vh-280px)] overflow-y-auto px-2">
            {albums.map((album) => {
              const thumbnailUrl = thumbnailUrls[album.id];
              return (
                <Link
                  key={album.id}
                  href={`/albums/${album.slug}`}
                  className="w-full max-w-md group"
                >
                  <div className="bg-blanc border border-mushroom/30 rounded-2xl shadow-soft overflow-hidden hover:shadow-elegant transition-all duration-300 hover:scale-[1.02]">
                    <div className="aspect-square relative overflow-hidden rounded-t-2xl">
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
                        <Images className="w-20 h-20 text-sage/60" />
                      </div>
                      <div className="absolute top-3 right-3 bg-blanc/90 backdrop-blur-sm text-earth px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        {album.collections?.[0]?.count ?? 0} collections
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-2xl font-serif text-earth mb-2">{album.name}</h3>
                      {album.description && (
                        <p className="text-sage text-sm line-clamp-2 mb-3">
                          {album.description}
                        </p>
                      )}
                      <div className="text-xs text-sage">
                        Updated {new Date(album.created_at).toLocaleDateString()}
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

