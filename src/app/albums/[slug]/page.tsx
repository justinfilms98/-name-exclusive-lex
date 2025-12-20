"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase, getAlbumBySlug, getCollectionsByAlbum, getSignedUrl } from "@/lib/supabase";
import { CollectionCardData } from "@/components/CollectionCard";
import { Image as ImageIcon, ShoppingCart, ArrowRight } from "lucide-react";

interface Album {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = useMemo(() => (Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string)), [params]);

  const [album, setAlbum] = useState<Album | null>(null);
  const [collections, setCollections] = useState<CollectionCardData[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [userPurchases, setUserPurchases] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;

      // Session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // Album
      const { data: albumData } = await getAlbumBySlug(slug);
      if (!albumData) {
        router.push("/albums");
        return;
      }
      setAlbum(albumData as Album);

      // Collections for album
      const { data: albumCollections } = await getCollectionsByAlbum(albumData.id);
      if (albumCollections) {
        setCollections(albumCollections as CollectionCardData[]);
        await loadThumbnails(albumCollections as CollectionCardData[]);
      }

      // Purchases
      if (session?.user) {
        const { data: purchases } = await supabase
          .from("purchases")
          .select("collection_id")
          .eq("user_id", session.user.id);
        if (purchases) {
          setUserPurchases(purchases.map((p) => p.collection_id));
        }
      }

      setLoading(false);
    };

    load();
  }, [slug, router]);

  const loadThumbnails = async (items: CollectionCardData[]) => {
    const promises = items.map(async (collection) => {
      if (collection.thumbnail_path) {
        const { data, error } = await getSignedUrl("media", collection.thumbnail_path, 3600);
        if (!error && data) {
          return { id: collection.id, url: data.signedUrl };
        }
      }
      return { id: collection.id, url: "" };
    });

    const results = await Promise.all(promises);
    const map: Record<string, string> = {};
    results.forEach((r) => {
      if (r.url) map[r.id] = r.url;
    });
    setThumbnailUrls(map);
  };

  const toggleDescription = (collectionId: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [collectionId]: !prev[collectionId],
    }));
  };

  const showToast = (message: string, type: "success" | "error") => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const addToCart = async (collection: CollectionCardData) => {
    if (userPurchases.includes(collection.id)) {
      router.push(`/collections/${collection.id}/watch`);
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    setAddingToCart(collection.id);
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const isAlreadyInCart = cart.some((item: any) => item.id === collection.id);

    if (!isAlreadyInCart) {
      cart.push(collection);
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cartUpdated"));
      showToast(`"${collection.title}" added to your cart!`, "success");
    } else {
      showToast(`"${collection.title}" is already in your cart!`, "error");
    }

    setTimeout(() => setAddingToCart(null), 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-almond pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-sage text-lg">Loading album...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-almond pt-20">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`max-w-sm p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
              toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="ml-4 text-white hover:text-gray-200 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="heading-1 mb-2">{album?.name}</h1>
            <p className="text-sage max-w-2xl">{album?.description || "Curated collection album."}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/albums" className="btn-secondary">
              Back to albums
            </Link>
          </div>
        </div>

        {collections.length === 0 ? (
          <div className="text-center py-16 card-glass">
            <ImageIcon className="w-12 h-12 text-sage mx-auto mb-4" />
            <p className="text-earth font-medium">No collections in this album yet.</p>
            <p className="text-sage text-sm">Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {collections.map((collection) => {
              const thumbnailUrl = thumbnailUrls[collection.id];
              const isPurchased = userPurchases.includes(collection.id);
              const isAdding = addingToCart === collection.id;
              const photoCount = collection.photo_paths?.length || 0;
              
              const formatVideoDuration = (seconds: number): string => {
                const minutes = Math.floor(seconds / 60);
                return `${minutes} min`;
              };
              
              const formatPrice = (price: number): string => {
                return (price / 100).toFixed(2);
              };

              return (
                <div
                  key={collection.id}
                  className="group bg-blanc border border-mushroom/30 rounded-2xl shadow-soft overflow-hidden hover:shadow-elegant transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="aspect-square relative overflow-hidden rounded-t-2xl">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={collection.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-gradient-to-br from-mushroom to-blanket flex items-center justify-center ${thumbnailUrl ? "hidden" : ""}`}>
                      <ImageIcon className="w-20 h-20 text-sage/60" />
                    </div>
                    {isPurchased && (
                      <div className="absolute top-3 right-3 bg-sage text-blanc px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        Owned
                      </div>
                    )}
                    {isAdding && (
                      <div className="absolute inset-0 bg-sage/20 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-sage text-blanc px-4 py-2 rounded-lg flex items-center space-x-2">
                          <div className="w-4 h-4 spinner"></div>
                          <span>Adding to cart...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-serif text-earth mb-2">{collection.title}</h3>
                    <p className="text-sage text-sm mb-4 leading-relaxed">
                      {collection.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-sage mb-4">
                      <div className="flex items-center space-x-4">
                        <span>Video: {formatVideoDuration(collection.video_duration || 300)}</span>
                        <span>{photoCount} photos</span>
                      </div>
                      <span className="text-earth font-bold text-lg">${formatPrice(collection.price)}</span>
                    </div>
                    <button
                      onClick={() => addToCart(collection)}
                      disabled={isAdding}
                      className="w-full bg-sage text-blanc px-4 py-3 rounded-lg font-medium hover:bg-khaki transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isAdding ? (
                        <>
                          <div className="w-4 h-4 spinner"></div>
                          <span>Adding...</span>
                        </>
                      ) : isPurchased ? (
                        <>
                          <span>Watch Now</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          <span>Purchase to unlock</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

