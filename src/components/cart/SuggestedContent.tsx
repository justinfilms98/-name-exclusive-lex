"use client";

import { useState, useEffect } from 'react';
import { getSignedUrl } from '@/lib/supabase';
import { Plus, Clock, Image as ImageIcon, Video } from 'lucide-react';
import Link from 'next/link';

interface SuggestedCollection {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail_path: string | null;
  video_duration: number;
  photo_count: number;
  has_video: boolean;
}

interface SuggestedContentProps {
  cartIds: string[];
  onAddToCart: (collection: SuggestedCollection) => void;
}

export default function SuggestedContent({ cartIds, onAddToCart }: SuggestedContentProps) {
  const [suggestions, setSuggestions] = useState<SuggestedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnailUrls, setThumbnailUrls] = useState<{[key: string]: string}>({});
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSuggestions();
  }, [cartIds]);

  useEffect(() => {
    if (suggestions.length > 0) {
      loadThumbnails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions.length]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cart/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartIds }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching suggestions:', data.error);
        setSuggestions([]);
      } else {
        // Filter out any items that might have been added to cart since fetch
        const filtered = (data.suggestions || []).filter(
          (s: SuggestedCollection) => !cartIds.includes(s.id)
        );
        setSuggestions(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadThumbnails = async () => {
    const results = await Promise.all(
      suggestions.map(async (collection) => {
        if (collection.thumbnail_path) {
          try {
            const { data, error } = await getSignedUrl('media', collection.thumbnail_path, 3600);
            if (!error && data) {
              return { id: collection.id, url: data.signedUrl };
            }
          } catch (error) {
            console.error('Error loading thumbnail for', collection.id, error);
          }
        }
        return { id: collection.id, url: null };
      })
    );

    const urlMap: {[key: string]: string} = {};
    results.forEach(result => {
      if (result.url) {
        urlMap[result.id] = result.url;
      }
    });
    setThumbnailUrls(urlMap);
  };

  const handleAddToCart = (collection: SuggestedCollection) => {
    setAddingItems(prev => new Set(prev).add(collection.id));
    onAddToCart(collection);
    
    // Remove from suggestions after adding
    setSuggestions(prev => prev.filter(s => s.id !== collection.id));
    
    setTimeout(() => {
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(collection.id);
        return newSet;
      });
    }, 1000);
  };

  const formatVideoDuration = (seconds: number): string => {
    if (seconds === 0) return '';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-serif text-brand-pine mb-2">Suggested Content</h3>
        <p className="text-xs text-brand-earth mb-4">Add another set to your order.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-glass p-4 animate-pulse">
              <div className="aspect-[4/5] bg-brand-almond rounded-lg mb-3"></div>
              <div className="h-4 bg-brand-almond rounded mb-2"></div>
              <div className="h-3 bg-brand-almond rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-serif text-brand-pine mb-2">Suggested Content</h3>
      <p className="text-xs text-brand-earth mb-4">Add another set to your order.</p>
      
      {/* Mobile: horizontal scroll */}
      <div className="md:hidden overflow-x-auto -mx-4 px-4 pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex space-x-4" style={{ width: 'max-content' }}>
          {suggestions.map((collection) => {
            const thumbnailUrl = thumbnailUrls[collection.id];
            const isAdding = addingItems.has(collection.id);
            
            return (
              <div
                key={collection.id}
                className="card-glass p-4 w-48 flex-shrink-0 snap-start"
              >
                <Link href={`/collections/${collection.id}`}>
                  <div className="aspect-[4/5] relative overflow-hidden rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={collection.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-sage bg-brand-almond">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                </Link>
                
                <Link href={`/collections/${collection.id}`}>
                  <h4 className="text-sm font-serif text-brand-pine mb-1 line-clamp-2 hover:text-brand-khaki transition-colors cursor-pointer">
                    {collection.title}
                  </h4>
                </Link>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-brand-sage">
                    {collection.has_video && collection.video_duration > 0 && (
                      <div className="flex items-center">
                        <Video className="w-3 h-3 mr-1" />
                        <span>{formatVideoDuration(collection.video_duration)}</span>
                      </div>
                    )}
                    {collection.photo_count > 0 && (
                      <div className="flex items-center mt-1">
                        <ImageIcon className="w-3 h-3 mr-1" />
                        <span>{collection.photo_count} photos</span>
                      </div>
                    )}
                    {!collection.has_video && collection.photo_count === 0 && (
                      <span className="text-brand-sage">Photos</span>
                    )}
                  </div>
                  <div className="text-lg font-bold text-brand-tan">
                    ${(collection.price / 100).toFixed(2)}
                  </div>
                </div>
                
                <button
                  onClick={() => handleAddToCart(collection)}
                  disabled={isAdding}
                  className="w-full btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50 text-xs py-2"
                >
                  {isAdding ? (
                    <>
                      <div className="w-3 h-3 spinner"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop: grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {suggestions.map((collection) => {
          const thumbnailUrl = thumbnailUrls[collection.id];
          const isAdding = addingItems.has(collection.id);
          
          return (
            <div key={collection.id} className="card-glass p-4">
              <Link href={`/collections/${collection.id}`}>
                <div className="aspect-[4/5] relative overflow-hidden rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={collection.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-sage bg-brand-almond">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
              </Link>
              
              <Link href={`/collections/${collection.id}`}>
                <h4 className="text-sm font-serif text-brand-pine mb-1 line-clamp-2 hover:text-brand-khaki transition-colors cursor-pointer">
                  {collection.title}
                </h4>
              </Link>
              
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-brand-sage">
                  {collection.has_video && collection.video_duration > 0 && (
                    <div className="flex items-center">
                      <Video className="w-3 h-3 mr-1" />
                      <span>{formatVideoDuration(collection.video_duration)}</span>
                    </div>
                  )}
                  {collection.photo_count > 0 && (
                    <div className="flex items-center mt-1">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      <span>{collection.photo_count} photos</span>
                    </div>
                  )}
                  {!collection.has_video && collection.photo_count === 0 && (
                    <span className="text-brand-sage">Photos</span>
                  )}
                </div>
                <div className="text-lg font-bold text-brand-tan">
                  ${(collection.price / 100).toFixed(2)}
                </div>
              </div>
              
              <button
                onClick={() => handleAddToCart(collection)}
                disabled={isAdding}
                className="w-full btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50 text-xs py-2"
              >
                {isAdding ? (
                  <>
                    <div className="w-3 h-3 spinner"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
