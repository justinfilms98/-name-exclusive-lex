"use client";

import { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

export default function ConstructionBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Check if user has previously minimized the banner
  useEffect(() => {
    const bannerMinimized = localStorage.getItem('construction-banner-minimized');
    if (bannerMinimized === 'true') {
      setIsMinimized(true);
    }
  }, []);

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    localStorage.setItem('construction-banner-minimized', (!isMinimized).toString());
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('construction-banner-dismissed', 'true');
  };

  // Check if user has dismissed the banner
  useEffect(() => {
    const bannerDismissed = localStorage.getItem('construction-banner-dismissed');
    if (bannerDismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`bg-yellow-200 text-yellow-900 text-sm py-2 px-4 text-center fixed top-0 left-0 right-0 z-[60] shadow-md transition-all duration-300 ${
      isMinimized ? 'h-8 overflow-hidden' : 'h-auto'
    }`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex-1 text-center">
          {!isMinimized && (
            <span>
              🚧 <strong>Heads up:</strong> This site is new and while we start up, please be aware of bugs that we may not be aware of yet. 
              If you encounter any issues, please let us know!
            </span>
          )}
          {isMinimized && (
            <span className="font-medium">
              🚧 Site Notice - Click to expand
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleMinimize}
            className="p-1 hover:bg-yellow-300 rounded transition-colors"
            title={isMinimized ? "Expand banner" : "Minimize banner"}
          >
            {isMinimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-yellow-300 rounded transition-colors"
            title="Dismiss banner"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
} 