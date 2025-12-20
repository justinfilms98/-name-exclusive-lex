"use client";

import { useMemo, useEffect } from "react";
import { ShoppingCart, Clock, Image as ImageIcon, ArrowRight, X } from "lucide-react";

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
  const showMobileDetails = useMemo(() => isExpanded, [isExpanded]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showMobileDetails) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showMobileDetails]);

  return (
    <div className="group flex flex-col bg-blanc border border-mushroom/30 rounded-xl shadow-soft overflow-hidden h-full max-h-[480px] sm:max-h-[520px] md:max-h-none">
      <div className="relative overflow-hidden">
        <div className="relative aspect-[4/5] overflow-hidden">
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
                <p className={`${isExpanded ? "" : "line-clamp-3"}`}>
                  {collection.description}
                </p>
                {collection.description.length > 150 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDescription(collection.id);
                    }}
                    className="text-blanc/80 hover:text-blanc text-xs mt-1 underline"
                  >
                    {isExpanded ? "Show Less" : "Read More"}
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

        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 bg-blanc">
          <div className="mb-2">
            <h3 className="font-serif text-earth text-base sm:text-lg mb-1 line-clamp-2">
              {collection.title}
            </h3>
            <div className="flex items-center gap-2 text-sm sm:text-base text-earth">
              <span className="font-bold">${formatPrice(collection.price)}</span>
              <span className="text-sage">•</span>
              <span className="text-sage text-xs sm:text-sm">Video {formatVideoDuration(collection.video_duration || 300)}</span>
            </div>
          </div>
          <p className="text-sage text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 leading-relaxed">
            {collection.description}
          </p>
          <div className="flex items-center justify-between text-xs text-sage">
            <span>{photoCount} photos</span>
            <span>Permanent access</span>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => onToggleDescription(collection.id)}
              className="text-khaki text-sm font-medium underline"
            >
              {isExpanded ? "Hide details" : "Tap for details"}
            </button>

            {showMobileDetails && (
              <div 
                className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
                style={{ 
                  paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))',
                  paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))',
                  overflow: 'hidden',
                  touchAction: 'none'
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    onToggleDescription(collection.id);
                  }
                }}
              >
                <div 
                  className="bg-blanc rounded-2xl w-full max-w-lg shadow-elegant flex flex-col"
                  style={{
                    maxHeight: 'calc(100dvh - max(2rem, env(safe-area-inset-top, 1rem) + env(safe-area-inset-bottom, 1rem)))'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between p-4 border-b border-mushroom/40 flex-shrink-0">
                    <div className="space-y-1 flex-1 pr-2">
                      <p className="text-xs uppercase text-sage">Collection details</p>
                      <h3 className="text-lg sm:text-xl font-serif text-earth line-clamp-2">{collection.title}</h3>
                      <div className="flex items-center gap-2 text-base sm:text-lg text-earth">
                        <span className="font-semibold">${formatPrice(collection.price)}</span>
                        <span className="text-sage">•</span>
                        <span className="text-sage text-sm">Video {formatVideoDuration(collection.video_duration || 300)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleDescription(collection.id)}
                      className="p-2 text-sage hover:text-earth rounded-full hover:bg-blanket/60 flex-shrink-0"
                      aria-label="Close details"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0 overscroll-contain">
                    <p className="text-earth leading-relaxed text-sm sm:text-base whitespace-pre-wrap break-words">{collection.description}</p>
                    <div className="flex items-center justify-between text-sm text-sage pt-2 border-t border-mushroom/20">
                      <span>{photoCount} photos</span>
                      <span>Permanent access</span>
                    </div>
                  </div>
                  <div 
                    className="p-4 border-t border-mushroom/40 space-y-2 flex-shrink-0 bg-blanc"
                    style={{
                      paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))'
                    }}
                  >
                    <button
                      onClick={() => onAddToCart(collection)}
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
                    <button
                      onClick={() => onToggleDescription(collection.id)}
                      className="w-full text-sage text-sm font-medium py-2"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onAddToCart(collection)}
            disabled={isAdding}
            className="w-full bg-sage text-blanc px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-medium hover:bg-khaki transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base mt-auto"
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
    </div>
  );
}

