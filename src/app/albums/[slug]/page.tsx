"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase, getAlbumBySlug, getCollectionsByAlbum, getSignedUrl } from "@/lib/supabase";
import CollectionCard, { CollectionCardData } from "@/components/CollectionCard";
import { Image as ImageIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
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
    const cart = JSON.parse(localStorage.getItem("cart") || "[]") as CollectionCardData[];
    const isAlreadyInCart = cart.some((item: CollectionCardData) => item.id === collection.id);

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
      <div className="min-h-screen bg-almond flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-sage text-lg">Loading album...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-almond">
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

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col items-center text-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col items-center">
            <h1 className="heading-1 mb-1 sm:mb-2">{album?.name}</h1>
            <p className="text-sage text-sm sm:text-base max-w-2xl">{album?.description || "Curated collection album."}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/albums" className="btn-secondary text-sm sm:text-base">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {collections.map((collection) => {
              const thumbnailUrl = thumbnailUrls[collection.id];
              const isPurchased = userPurchases.includes(collection.id);
              const isAdding = addingToCart === collection.id;

              return (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  isPurchased={isPurchased}
                  thumbnailUrl={thumbnailUrl}
                  isAdding={isAdding}
                  onAddToCart={() => addToCart(collection)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

