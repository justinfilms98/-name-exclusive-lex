"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Clock, Image as ImageIcon, ArrowRight } from "lucide-react";

export interface CollectionCardData {
  id: string;
  title: string;
  description: string;
  price: number;
  video_duration?: number | null;
  photo_paths: string[];
  thumbnail_path?: string | null;
}

interface CollectionCardProps {
  collection: CollectionCardData;
  isPurchased: boolean;
  thumbnailUrl?: string;
  isAdding: boolean;
  onAddToCart: (collection: CollectionCardData) => void;
  variant?: "default" | "featured";
  fromAlbum?: string; // Album slug for context-aware navigation
}

const formatVideoDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
};

const formatPrice = (price: number): string => {
  return (price / 100).toFixed(2);
};

export default function CollectionCard({
  collection,
  isPurchased,
  thumbnailUrl,
  isAdding,
  onAddToCart,
  variant = "default",
  fromAlbum,
}: CollectionCardProps) {
  const photoCount = collection.photo_paths?.length || 0;
  const isFeatured = variant === "featured";

  const handleAdd = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onAddToCart(collection);
  };

  // Build collection detail URL with optional fromAlbum query param
  const collectionUrl = fromAlbum 
    ? `/collections/${collection.id}?fromAlbum=${encodeURIComponent(fromAlbum)}`
    : `/collections/${collection.id}`;

  return (
    <div className="group h-full flex flex-col bg-blanc border border-mushroom/30 rounded-2xl shadow-soft overflow-hidden">
      <Link href={collectionUrl} className="relative overflow-hidden block">
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-mushroom">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={collection.title}
              fill
              className="object-cover object-center"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-mushroom to-almond flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-sage/60" />
            </div>
          )}

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
      </Link>

      <div className={`flex flex-col flex-1 bg-blanc min-w-0 ${isFeatured ? "p-6 sm:p-4" : "p-4"}`}>
          <h3 className={`font-semibold text-earth break-words ${isFeatured ? "text-xl mb-2 sm:text-lg sm:mb-1 sm:line-clamp-1" : "text-lg mb-1 line-clamp-1"}`}>
              {collection.title}
            </h3>
          
          {isFeatured ? (
            <div className="mb-3 sm:mb-2 flex flex-wrap items-center gap-x-2 text-base sm:text-sm">
              <span className="font-bold text-earth">${formatPrice(collection.price)}</span>
              {((collection.video_duration && collection.video_duration > 0) || photoCount > 0) && (
                <>
                  <span className="text-sage opacity-60 select-none">•</span>
                  {collection.video_duration && collection.video_duration > 0 && (
                    <>
                      <span className="text-sage">Video {formatVideoDuration(collection.video_duration)}</span>
                      {photoCount > 0 && (
                        <>
                          <span className="text-sage opacity-60 select-none">•</span>
                          <span className="text-sage">{photoCount} photos</span>
                        </>
                      )}
                    </>
                  )}
                  {(!collection.video_duration || collection.video_duration <= 0) && photoCount > 0 && (
                    <span className="text-sage">{photoCount} photos</span>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              <div className="mb-2">
                <span className={`font-bold text-earth ${isFeatured ? "text-lg sm:text-base" : "text-base"}`}>${formatPrice(collection.price)}</span>
          </div>
          {(collection.video_duration && collection.video_duration > 0) || photoCount > 0 ? (
                <div className="mb-3 flex flex-wrap items-center gap-y-1 text-xs text-sage gap-x-2 flex-shrink-0">
              {collection.video_duration && collection.video_duration > 0 && (
                <>
                  <span className="inline-flex items-center whitespace-nowrap leading-none">Video {formatVideoDuration(collection.video_duration)}</span>
                  {photoCount > 0 && (
                    <>
                          <span className="text-sage opacity-60 select-none leading-none">•</span>
                      <span className="inline-flex items-center whitespace-nowrap leading-none">{photoCount} photos</span>
                    </>
                  )}
                </>
              )}
              {(!collection.video_duration || collection.video_duration <= 0) && photoCount > 0 && (
                <span className="inline-flex items-center whitespace-nowrap leading-none">{photoCount} photos</span>
              )}
            </div>
          ) : null}
            </>
          )}
          
          <div className={`mb-2 ${isFeatured ? "mb-4 sm:mb-2" : ""}`}>
            <p className={`text-sage opacity-80 leading-relaxed break-words ${isFeatured ? "text-base line-clamp-2 sm:text-sm sm:line-clamp-2" : "text-sm line-clamp-2"}`}>
              {collection.description}
            </p>
            {collection.description.length > 100 && (
              <Link 
                href={collectionUrl}
                className={`inline-flex items-center gap-1 text-sage hover:text-earth mt-1 font-medium transition-colors ${isFeatured ? "text-sm sm:text-xs" : "text-xs"}`}
                onClick={(e) => e.stopPropagation()}
              >
                <span>View details</span>
                <ArrowRight className={isFeatured ? "w-4 h-4 sm:w-3 sm:h-3" : "w-3 h-3"} />
              </Link>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="w-full bg-sage text-blanc px-4 py-3 rounded-lg font-medium hover:bg-khaki transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 text-base mt-auto flex-shrink-0"
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
}

