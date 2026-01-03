"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase, getCollection, getSignedUrl } from "@/lib/supabase";
import { Image as ImageIcon, ShoppingCart, ArrowRight, Clock } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

interface Collection {
  id: string;
  title: string;
  description: string;
  price: number;
  video_duration: number;
  thumbnail_path?: string | null;
  photo_paths: string[];
  albums?: { id: string; name: string; slug: string } | null;
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const fromAlbum = searchParams?.get("fromAlbum");

  const [collection, setCollection] = useState<Collection | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [userPurchases, setUserPurchases] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isInCart, setIsInCart] = useState(false);

  // Load cart state
  const loadCart = () => {
    if (typeof window === 'undefined' || !collection) return;
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]") as Collection[];
      setIsInCart(cart.some(item => item.id === collection.id));
    } catch (error) {
      console.error('Failed to load cart:', error);
      setIsInCart(false);
    }
  };

  // Load purchases from server - always check server for owned state
  const loadPurchases = async (userId: string) => {
    const { data: purchases } = await supabase
      .from("purchases")
      .select("collection_id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .eq("is_active", true);
    if (purchases) {
      setUserPurchases(purchases.map((p) => p.collection_id));
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      // Session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // Collection
      const { data: collectionData, error } = await getCollection(id);
      if (error || !collectionData) {
        router.push("/collections");
        return;
      }
      setCollection(collectionData as Collection);

      // Thumbnail
      if (collectionData.thumbnail_path) {
        const { data: signedUrlData } = await getSignedUrl("media", collectionData.thumbnail_path, 3600);
        if (signedUrlData) {
          setThumbnailUrl(signedUrlData.signedUrl);
        }
      }

      // Purchases - always from server
      if (session?.user) {
        await loadPurchases(session.user.id);
      }

      setLoading(false);
    };

    load();
  }, [id, router]);

  // Update cart state when collection changes
  useEffect(() => {
    if (collection) {
      loadCart();
    }
  }, [collection]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = async () => {
      loadCart();
      // Reload purchases when cart changes to ensure owned state is correct
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadPurchases(session.user.id);
      }
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [collection]);

  const showToast = (message: string, type: "success" | "error") => {
    const toastId = Date.now().toString();
    const newToast: Toast = { id: toastId, message, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 3000);
  };

  const addToCart = async () => {
    if (!collection) return;

    if (userPurchases.includes(collection.id)) {
      router.push(`/collections/${collection.id}/watch`);
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    setAddingToCart(true);
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const isAlreadyInCart = cart.some((item: Collection) => item.id === collection.id);

    if (!isAlreadyInCart) {
      cart.push(collection);
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cartUpdated"));
      showToast(`"${collection.title}" added to your cart!`, "success");
    } else {
      showToast(`"${collection.title}" is already in your cart!`, "error");
    }

    setTimeout(() => setAddingToCart(false), 800);
  };

  const formatVideoDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const formatPrice = (price: number): string => {
    return (price / 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-almond flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-sage text-lg">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-almond flex items-center justify-center">
        <div className="text-center">
          <p className="text-sage text-lg">Collection not found.</p>
          <Link href="/collections" className="btn-secondary mt-4 inline-block">
            Back to collections
          </Link>
        </div>
      </div>
    );
  }

  const isPurchased = userPurchases.includes(collection.id);
  const photoCount = collection.photo_paths?.length || 0;

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

      <div className="max-w-5xl lg:max-w-[720px] mx-auto px-4 py-4 sm:py-6 md:py-8 lg:px-5 lg:py-5">
        <div className="mb-4 sm:mb-6 lg:mb-5">
          {fromAlbum ? (
            <Link href={`/albums/${fromAlbum}`} className="btn-secondary inline-flex mb-4 lg:mb-3 text-sm lg:text-sm">
              ← Back to album
            </Link>
          ) : (
            <Link href="/collections" className="btn-secondary inline-flex mb-4 lg:mb-3 text-sm lg:text-sm">
              ← Back to collections
            </Link>
          )}
        </div>

        <div className="bg-blanc border border-mushroom/30 rounded-xl sm:rounded-2xl lg:rounded-xl shadow-soft overflow-hidden md:max-w-[75%] md:mx-auto">
          {/* 4:5 aspect ratio thumbnail - reduced height on desktop */}
          <div className="aspect-[4/5] lg:aspect-[5/6] relative overflow-hidden">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={collection.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div className={`w-full h-full bg-gradient-to-br from-mushroom to-blanket flex items-center justify-center ${thumbnailUrl ? "hidden" : ""}`}>
              <ImageIcon className="w-16 h-16 sm:w-20 sm:h-20 text-sage/60" />
            </div>
            {isPurchased && (
              <div className="absolute top-3 right-3 bg-sage text-blanc px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                Owned
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 md:p-8 lg:p-5">
            <div className="mb-4 sm:mb-6 lg:mb-3">
              <h1 className="heading-1 mb-2 sm:mb-3 lg:mb-2 md:!text-3xl lg:!text-3xl">{collection.title}</h1>
              <div className="flex items-center gap-3 text-lg sm:text-xl lg:text-sm text-earth mb-4 lg:mb-2 flex-wrap">
                <span className="font-bold">${formatPrice(collection.price)}</span>
                <span className="text-sage">•</span>
                <div className="flex items-center text-sage">
                  <Clock className="w-4 h-4 mr-1 lg:w-3 lg:h-3" />
                  <span className="text-base sm:text-lg lg:text-xs">Video {formatVideoDuration(collection.video_duration || 300)}</span>
                </div>
                <span className="text-sage">•</span>
                <span className="text-sage text-base sm:text-lg lg:text-xs">{photoCount} photos</span>
              </div>
            </div>

            <div className="mb-6 sm:mb-8 lg:mb-4">
              <h2 className="text-earth font-semibold mb-2 sm:mb-3 lg:mb-1 text-base sm:text-lg lg:text-sm">Description</h2>
              <p className="text-sage text-sm sm:text-base lg:text-xs leading-relaxed whitespace-pre-wrap break-words">
                {collection.description}
              </p>
            </div>

            <div className="flex items-center justify-between text-sm sm:text-base lg:text-xs text-sage mb-6 sm:mb-8 lg:mb-4 pb-4 sm:pb-6 lg:pb-3 border-b border-mushroom/30">
              <span>Permanent access</span>
              {collection.albums && (
                <Link
                  href={`/albums/${collection.albums.slug}`}
                  className="text-khaki hover:text-earth transition-colors"
                >
                  View in {collection.albums.name} album
                </Link>
              )}
            </div>

            <button
              onClick={addToCart}
              disabled={addingToCart || isInCart}
              className="w-full bg-sage text-blanc px-6 py-3 sm:py-4 lg:py-2.5 rounded-lg font-medium hover:bg-khaki transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 text-base sm:text-lg lg:text-sm"
            >
              {addingToCart ? (
                <>
                  <div className="w-5 h-5 spinner"></div>
                  <span>Adding...</span>
                </>
              ) : isPurchased ? (
                <>
                  <span>Watch Now</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : isInCart ? (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Added to cart</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Purchase to unlock</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

