"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Clock, Image as ImageIcon, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

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
}: CollectionCardProps) {
  const photoCount = collection.photo_paths?.length || 0;
  const hasLongDescription = collection.description && collection.description.length > 120;
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAdd = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onAddToCart(collection);
  };

  return (
    <div className="group flex flex-col bg-blanc border border-mushroom/30 rounded-xl shadow-soft overflow-hidden h-[420px] max-w-full">
      <Link href={`/collections/${collection.id}`} className="relative overflow-hidden block">
        <div className="relative w-full aspect-[4/5] bg-black/5 overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={collection.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
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
                <p className={`opacity-80 mb-2 transition-all ${isExpanded ? '' : 'line-clamp-3'}`}>
                  {collection.description}
                </p>
                {hasLongDescription && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="flex items-center gap-1.5 text-blanc/80 hover:text-blanc transition-colors text-xs font-medium"
                  >
                    <span>{isExpanded ? 'Read less' : 'Read more'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-blanket/80 mb-4 opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 delay-200">
                <div className="flex items-center space-x-3">
                  {collection.video_duration && collection.video_duration > 0 && (
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>Video: {formatVideoDuration(collection.video_duration)}</span>
                    </div>
                  )}
                  {photoCount > 0 && (
                    <div className="flex items-center">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      {photoCount} photos
                    </div>
                  )}
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

      <div className="p-4 flex flex-col flex-1 bg-blanc min-w-0">
          <div className="mb-2 flex-shrink-0">
            <h3 className="font-semibold text-earth text-lg mb-1 line-clamp-1 break-words">
              {collection.title}
            </h3>
            <div className="mb-2">
              <span className="font-bold text-base text-earth">${formatPrice(collection.price)}</span>
            </div>
          </div>
          
          <div className="mb-2 flex-1 min-h-0">
            <p className={`text-sage text-sm opacity-80 leading-relaxed break-words transition-all ${
              isExpanded ? '' : 'line-clamp-2'
            }`}>
              {collection.description}
            </p>
            {hasLongDescription && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="flex items-center gap-1 mt-2 text-sage/70 hover:text-khaki transition-colors text-xs font-medium"
              >
                <span>{isExpanded ? 'Read less' : 'Read more'}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
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

