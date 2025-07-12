"use client";

import { useState } from "react";
import { UploadButton } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";

interface HeroUploadWidgetProps {
  onUploadComplete?: (videoUrl: string) => void;
  onError?: (error: string) => void;
}

export default function HeroUploadWidget({ onUploadComplete, onError }: HeroUploadWidgetProps) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="w-full">
      <UploadButton<OurFileRouter, "videoUploader">
        endpoint="videoUploader"
        onUploadBegin={() => {
          setIsUploading(true);
        }}
        onClientUploadComplete={(res) => {
          setIsUploading(false);
          if (res && res[0]) {
            onUploadComplete?.(res[0].url);
          }
        }}
        onUploadError={(error: Error) => {
          setIsUploading(false);
          onError?.(error.message);
        }}
        className="ut-button:bg-stone-800 ut-button:hover:bg-stone-900 ut-button:text-white ut-button:rounded-md ut-button:px-4 ut-button:py-2 ut-button:font-medium ut-button:transition-colors"
      />
      
      {isUploading && (
        <div className="mt-4 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-stone-800"></div>
          <span className="text-sm text-stone-600">Uploading video...</span>
        </div>
      )}
    </div>
  );
} 