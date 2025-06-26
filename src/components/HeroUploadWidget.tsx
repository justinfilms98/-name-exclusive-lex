"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";

interface HeroUploadWidgetProps {
  onUploadComplete?: (videoUrl: string) => void;
  onError?: (error: string) => void;
}

export default function HeroUploadWidget({ onUploadComplete, onError }: HeroUploadWidgetProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('files', file);

      // Upload to UploadThing
      const response = await fetch('/api/uploadthing/videoUploader', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const url = result.url;

      if (!url) {
        throw new Error('No file URL received');
      }

      // Save to Supabase hero_videos table
      const { error } = await supabase.from("hero_videos").insert({
        title: "New Hero Video",
        subtitle: "Uploaded via UploadThing",
        video_url: url,
        display_order: 1,
        moderated: false,
      });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      onUploadComplete?.(url);
    } catch (err) {
      onError?.(`Upload error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-center w-full">
        <label htmlFor="video-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">MP4, MOV, AVI (MAX. 1GB)</p>
          </div>
          <input 
            id="video-upload" 
            type="file" 
            className="hidden" 
            accept="video/*"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>
      {isUploading && (
        <div className="mt-2 text-sm text-gray-600 text-center">
          Uploading video...
        </div>
      )}
    </div>
  );
} 