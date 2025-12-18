"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase, getAlbumBySlug, getCollectionsByAlbum, getSignedUrl } from "@/lib/supabase";
import CollectionCard, { CollectionCardData } from "@/components/CollectionCard";
import { Image as ImageIcon } from "lucide-react";

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
            <Link href="/collections" className="btn-primary">
              View all collections
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
          <div className="grid grid-cols-2 max-[430px]:grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 sm:gap-6 lg:gap-8">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                isPurchased={userPurchases.includes(collection.id)}
                thumbnailUrl={thumbnailUrls[collection.id]}
                isAdding={addingToCart === collection.id}
                isExpanded={!!expandedDescriptions[collection.id]}
                onToggleDescription={toggleDescription}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

