"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Clock, Image as ImageIcon, ArrowRight, X, ChevronDown } from "lucide-react";
import Portal from "./Portal";

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
  onAddToCart,
}: CollectionCardProps) {
  const photoCount = collection.photo_paths?.length || 0;
  const hasLongDescription = collection.description && collection.description.length > 120;
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!showDetails) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowDetails(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showDetails]);

  const openDetails = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowDetails(true);
  };

  const closeDetails = () => setShowDetails(false);

  const handleAdd = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onAddToCart(collection);
  };

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
                <p className="line-clamp-3 opacity-80 mb-2">
                  {collection.description}
                </p>
                {hasLongDescription && (
                  <button
                    type="button"
                    onClick={openDetails}
                    className="flex items-center gap-1.5 text-blanc/80 hover:text-blanc transition-colors text-xs font-medium"
                  >
                    <span>View details</span>
                    <ChevronDown className="w-3.5 h-3.5" />
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
          <div className="mb-3 flex-shrink-0">
            <h3 className="font-serif text-earth text-lg sm:text-xl mb-1.5 line-clamp-2 break-words">
              {collection.title}
            </h3>
            <div className="flex items-center gap-2 text-[15px] sm:text-base text-earth flex-wrap">
              <span className="font-bold whitespace-nowrap">${formatPrice(collection.price)}</span>
              <span className="text-sage">•</span>
              <span className="text-sage text-sm sm:text-[15px] whitespace-nowrap">Video {formatVideoDuration(collection.video_duration || 300)}</span>
            </div>
          </div>
          
          <div className="mb-2 sm:mb-3 flex-1 min-h-0">
            {hasLongDescription ? (
              <button
                type="button"
                onClick={openDetails}
                className="w-full text-left group relative"
              >
                <div className="relative">
                  <p className="text-sage text-sm sm:text-[15px] opacity-80 line-clamp-2 sm:line-clamp-3 leading-relaxed break-words">
                    {collection.description}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-sage/70 group-hover:text-khaki transition-colors">
                    <span className="text-xs font-medium">View details</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            ) : (
              <p className="text-sage text-sm sm:text-[15px] opacity-80 leading-relaxed break-words">
                {collection.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-sage mb-3 flex-shrink-0">
            <span>{photoCount} photos</span>
            <span>Permanent access</span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="w-full bg-sage text-blanc px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-medium hover:bg-khaki transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 text-base sm:text-lg mt-auto flex-shrink-0"
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

      {showDetails && (
        <Portal>
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-150" onClick={closeDetails} />
            <div className="relative w-full h-[80vh] md:h-auto md:max-w-[560px] bg-[#C9BBA8] text-earth rounded-t-3xl md:rounded-2xl shadow-xl overflow-hidden transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] animate-quickview flex flex-col border border-earth/20">
              {/* Mobile drag handle */}
              <div className="md:hidden flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-sage/30 rounded-full" />
              </div>

              {/* Close button - more prominent on mobile */}
              <button
                onClick={closeDetails}
                className="absolute top-4 right-4 bg-[#F8F6F1]/95 backdrop-blur-sm text-earth p-2.5 rounded-full shadow-lg hover:bg-[#F8F6F1] transition-colors z-10 md:top-3 md:right-3"
                aria-label="Close details"
              >
                <X className="w-5 h-5 md:w-5 md:h-5" />
              </button>

              {/* Thumbnail */}
              <div className="relative aspect-[4/5] w-full flex-shrink-0 overflow-hidden">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={collection.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-mushroom to-blanket flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-sage/60" />
                  </div>
                )}
              </div>

              {/* Content wrapper - enables sticky buttons */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-6 space-y-5">
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl sm:text-3xl leading-snug pr-10">{collection.title}</h3>
                    <div className="flex items-center gap-2 text-[15px] sm:text-base text-earth flex-wrap">
                      <span className="font-semibold">${formatPrice(collection.price)}</span>
                      <span className="text-sage">•</span>
                      <span className="text-sage whitespace-nowrap">Video {formatVideoDuration(collection.video_duration || 300)}</span>
                      <span className="text-sage">•</span>
                      <span className="text-sage whitespace-nowrap">{photoCount} photos</span>
                      <span className="text-sage hidden sm:inline">• Permanent access</span>
                    </div>
                  </div>

                  <div className="border-t border-sage/20 pt-4">
                    <p className="text-earth opacity-80 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                      {collection.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[15px] text-sage flex-wrap pt-2">
                    <span>Permanent access</span>
                  </div>
                </div>

                {/* Action buttons - informational only, purchase stays in card */}
                <div className="flex-shrink-0 border-t border-earth/20 bg-[#C9BBA8] p-5 sm:p-6 md:p-6 pt-4">
                  <button
                    onClick={closeDetails}
                    className="w-full bg-[#F8F6F1] text-earth border border-earth/20 px-6 py-3 rounded-lg font-medium hover:bg-[#F2E0CF] transition-colors text-center"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

