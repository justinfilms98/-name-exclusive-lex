"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Clock, Image as ImageIcon, ArrowRight, X } from "lucide-react";
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
  const needsExpansion = collection.description && collection.description.length > 120;
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Lock scroll when quick view is open
  useEffect(() => {
    if (isQuickViewOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isQuickViewOpen]);

  // Close on ESC
  useEffect(() => {
    if (!isQuickViewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsQuickViewOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isQuickViewOpen]);

  // Focus close on open
  useEffect(() => {
    if (isQuickViewOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 10);
    }
  }, [isQuickViewOpen]);

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  const handleClose = () => setIsQuickViewOpen(false);

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
                <p className="opacity-80 line-clamp-3">
                  {collection.description}
                </p>
                {collection.description.length > 150 && (
                  <button
                    onClick={handleViewDetails}
                    className="text-blanc/80 hover:text-blanc text-xs mt-1 underline active:scale-[0.98] transition-transform"
                  >
                    View details
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
            <p className="text-sage text-sm opacity-80 line-clamp-2 sm:line-clamp-3 leading-relaxed break-words">
              {collection.description}
            </p>
            {needsExpansion && (
              <button
                onClick={handleViewDetails}
                className="text-khaki text-sm font-medium underline mt-1 hover:text-earth transition-colors active:scale-[0.98]"
              >
                View details
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-sage mb-3 flex-shrink-0">
            <span>{photoCount} photos</span>
            <span>Permanent access</span>
          </div>

          <button
            onClick={handleAdd}
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

      {isQuickViewOpen && (
        <Portal>
          <div className="fixed inset-0 z-[1000]">
            <div
              className="absolute inset-0 bg-[rgba(43,43,43,0.35)] backdrop-blur-md transition-opacity duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              onClick={handleClose}
            />

            {/* Desktop modal */}
            <div className="hidden sm:flex fixed inset-0 items-center justify-center p-6">
              <div
                className="w-full max-w-[520px] max-h-[78vh] rounded-2xl bg-[#C9BBA8] border border-[#D4C7B4]/50 shadow-[0_18px_60px_rgba(43,43,43,0.20)] text-[#654C37] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-blanket px-5 py-4 flex items-start justify-between border-b border-[#D4C7B4]/30">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-black/70">Collection</p>
                    <h3 className="text-xl font-serif text-[#654C37] leading-tight">{collection.title}</h3>
                  </div>
                  <button
                    ref={closeButtonRef}
                    onClick={handleClose}
                    className="p-2 rounded-full text-[#654C37] hover:bg-blanket/60 transition-colors"
                    aria-label="Close details"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto max-h-[78vh]">
                  <div className="rounded-2xl border border-[#D4C7B4]/50 overflow-hidden aspect-[4/5] max-h-[240px]">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={collection.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-mushroom to-blanket flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-sage/60" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-black/70">
                    <span className="font-semibold text-[#654C37] text-base">
                      ${formatPrice(collection.price)}
                    </span>
                    <span>•</span>
                    <span>Video {formatVideoDuration(collection.video_duration || 300)}</span>
                    <span>•</span>
                    <span>{photoCount} photos</span>
                    <span>•</span>
                    <span>Permanent access</span>
                  </div>

                  <div className="relative text-sm text-black/70 leading-relaxed space-y-2">
                    <p>{collection.description}</p>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#C9BBA8] to-transparent" />
                  </div>
                </div>

                <div className="mt-auto border-t border-[#D4C7B4]/40 bg-blanket/60 px-5 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <button
                      onClick={handleClose}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#D4C7B4]/50 text-[#654C37] hover:bg-blanket/60 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleAdd}
                      disabled={isAdding}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#8F907E] text-[#F8F6F1] hover:brightness-95 transition-all duration-200 shadow-sm disabled:opacity-60"
                    >
                      {isAdding ? (
                        <>
                          <div className="w-4 h-4 spinner" />
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
            </div>

            {/* Mobile bottom sheet */}
            <div className="sm:hidden fixed inset-x-0 bottom-0 z-[1001]">
              <div
                className="w-full rounded-t-3xl bg-[#C9BBA8] border border-[#D4C7B4]/50 shadow-[0_18px_60px_rgba(43,43,43,0.20)] text-[#654C37] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center pt-3 pb-2">
                  <div className="h-1.5 w-12 rounded-full bg-black/15" />
                </div>

                <div className="px-5 pt-1 pb-24 max-h-[78vh] min-h-[40vh] overflow-y-auto space-y-4 relative">
                  <div className="rounded-2xl border border-[#D4C7B4]/50 overflow-hidden aspect-[4/5] max-h-[240px]">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={collection.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-mushroom to-blanket flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-sage/60" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-black/70">Collection</p>
                    <h3 className="text-xl font-serif text-[#654C37] leading-tight">{collection.title}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-black/70">
                    <span className="font-semibold text-[#654C37] text-base">
                      ${formatPrice(collection.price)}
                    </span>
                    <span>•</span>
                    <span>Video {formatVideoDuration(collection.video_duration || 300)}</span>
                    <span>•</span>
                    <span>{photoCount} photos</span>
                    <span>•</span>
                    <span>Permanent access</span>
                  </div>

                  <div className="relative text-sm text-black/70 leading-relaxed space-y-2">
                    <p>{collection.description}</p>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#C9BBA8] to-transparent" />
                  </div>
                </div>

                <div className="sticky bottom-0 border-t border-[#D4C7B4]/40 bg-[#C9BBA8] px-5 py-4 space-y-3">
                  <button
                    onClick={handleClose}
                    className="w-full px-4 py-3 rounded-xl border border-[#D4C7B4]/50 text-[#654C37] hover:bg-blanket/60 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={isAdding}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#8F907E] text-[#F8F6F1] hover:brightness-95 transition-all duration-200 shadow-sm disabled:opacity-60"
                  >
                    {isAdding ? (
                      <>
                        <div className="w-4 h-4 spinner" />
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
          </div>
        </Portal>
      )}
    </div>
  );
}

