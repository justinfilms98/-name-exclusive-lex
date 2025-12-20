"use client";

import Link from "next/link";
import { ShoppingCart, Clock, Image as ImageIcon, ArrowRight } from "lucide-react";

export interface CollectionCardData {
  id: string;
  title: string;
  description: string;
  price: number;
  video_duration: number;
  photo_paths: string[];
  thumbnail_path?: string | null;
}

interface CollectionCardProps {
  collection: CollectionCardData;
  isPurchased: boolean;
  thumbnailUrl?: string;
  isAdding: boolean;
  isExpanded: boolean;
  onToggleDescription: (id: string) => void;
  onAddToCart: (collection: CollectionCardData) => void;
}

const formatVideoDuration = (seconds: number): string => {
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
  isExpanded,
  onToggleDescription,
  onAddToCart,
}: CollectionCardProps) {
  const photoCount = collection.photo_paths?.length || 0;
  const needsExpansion = collection.description && collection.description.length > 120;

  return (
    <div className="group flex flex-col bg-blanc border border-mushroom/30 rounded-xl shadow-soft overflow-hidden h-full max-w-full">
      <Link href={`/collections/${collection.id}`} className="relative overflow-hidden block">
        <div className="relative aspect-[4/5] overflow-hidden w-full">
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
            <ImageIcon className="w-16 h-16 text-sage/60" />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-earth via-earth/80 to-transparent opacity-0 md:group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm hidden md:block">
            <div className="absolute bottom-0 left-0 right-0 p-6 text-blanc transform translate-y-4 md:group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="text-xl font-serif mb-2 line-clamp-2">
                {collection.title}
              </h3>
              <div className="text-blanket/90 text-sm mb-3 opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 delay-100">
                <p className={`${isExpanded ? "" : "line-clamp-3"} opacity-80`}>
                  {collection.description}
                </p>
                {collection.description.length > 150 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleDescription(collection.id);
                    }}
                    className="text-blanc/80 hover:text-blanc text-xs mt-1 underline"
                  >
                    {isExpanded ? "Hide" : "Read more"}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-blanket/80 mb-4 opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 delay-200">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Video: {formatVideoDuration(collection.video_duration || 300)}</span>
                  </div>
                  <div className="flex items-center">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    {photoCount} photos
                  </div>
                </div>
                <div className="text-lg font-bold text-blanket">
                  ${formatPrice(collection.price)}
                </div>
              </div>

              <button
                onClick={() => onAddToCart(collection)}
                disabled={isAdding}
                className="w-full bg-sage text-blanc px-4 py-3 rounded-lg font-medium hover:bg-khaki transition-all duration-300 flex items-center justify-center space-x-2 opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 delay-300 disabled:opacity-50"
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

      <div className="p-3 sm:p-4 flex flex-col flex-1 bg-blanc min-w-0">
          <div className="mb-2 flex-shrink-0">
            <h3 className="font-serif text-earth text-base sm:text-lg mb-1.5 line-clamp-2 break-words">
              {collection.title}
            </h3>
            <div className="flex items-center gap-2 text-sm sm:text-base text-earth">
              <span className="font-bold whitespace-nowrap">${formatPrice(collection.price)}</span>
              <span className="text-sage">•</span>
              <span className="text-sage text-xs sm:text-sm whitespace-nowrap">Video {formatVideoDuration(collection.video_duration || 300)}</span>
            </div>
          </div>
          
          <div className="mb-2 sm:mb-3 flex-1 min-h-0">
            {isExpanded ? (
              <p className="text-sage text-sm opacity-80 leading-relaxed break-words">{collection.description}</p>
            ) : (
              <p className="text-sage text-sm opacity-80 line-clamp-2 sm:line-clamp-3 leading-relaxed break-words">
                {collection.description}
              </p>
            )}
            {needsExpansion && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleDescription(collection.id);
                }}
                className="text-khaki text-sm font-medium underline mt-1 hover:text-earth transition-colors"
              >
                {isExpanded ? "Hide" : "Read more"}
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-sage mb-3 flex-shrink-0">
            <span>{photoCount} photos</span>
            <span>Permanent access</span>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(collection);
            }}
            disabled={isAdding}
            className="w-full bg-sage text-blanc px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-medium hover:bg-khaki transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base mt-auto flex-shrink-0"
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

