"use client";

import { useState } from 'react';

export default function QualityComparison() {
  const [activeTab, setActiveTab] = useState<'h265' | 'h264'>('h265');

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">🎬 Video Quality Comparison</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* H.265 Section */}
        <div className={`p-4 rounded-lg border-2 transition-all ${
          activeTab === 'h265' 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-blue-800">H.265 (HEVC) ⭐</h5>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Recommended</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>File Size:</span>
              <span className="font-medium text-green-600">30-50% smaller</span>
            </div>
            <div className="flex justify-between">
              <span>Quality:</span>
              <span className="font-medium text-green-600">Excellent</span>
            </div>
            <div className="flex justify-between">
              <span>30min Video:</span>
              <span className="font-medium">30-45MB</span>
            </div>
            <div className="flex justify-between">
              <span>15min Video:</span>
              <span className="font-medium">20-30MB</span>
            </div>
            <div className="flex justify-between">
              <span>5min Video:</span>
              <span className="font-medium">15-25MB</span>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-blue-700">
            <p>✅ Best compression ratio</p>
            <p>✅ Maintains high quality</p>
            <p>✅ Perfect for 50MB limit</p>
          </div>
        </div>

        {/* H.264 Section */}
        <div className={`p-4 rounded-lg border-2 transition-all ${
          activeTab === 'h264' 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-purple-800">H.264 (AVC)</h5>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Fallback</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>File Size:</span>
              <span className="font-medium text-orange-600">Larger files</span>
            </div>
            <div className="flex justify-between">
              <span>Quality:</span>
              <span className="font-medium text-green-600">Good</span>
            </div>
            <div className="flex justify-between">
              <span>30min Video:</span>
              <span className="font-medium">45-60MB</span>
            </div>
            <div className="flex justify-between">
              <span>15min Video:</span>
              <span className="font-medium">30-40MB</span>
            </div>
            <div className="flex justify-between">
              <span>5min Video:</span>
              <span className="font-medium">25-35MB</span>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-purple-700">
            <p>✅ Wide compatibility</p>
            <p>✅ Works on all devices</p>
            <p>⚠️ May need lower resolution</p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          <strong>💡 Pro Tip:</strong> Use H.265 for best quality within the 50MB limit. If you encounter playback issues, fall back to H.264 for wider compatibility.
        </p>
      </div>
    </div>
  );
} 