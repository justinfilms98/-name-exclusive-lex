"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { UploadButton } from "../../uploadthing.config";

interface HeroUploadWidgetProps {
  onUploadComplete?: (videoUrl: string) => void;
  onError?: (error: string) => void;
}

export default function HeroUploadWidget({ onUploadComplete, onError }: HeroUploadWidgetProps) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="w-full">
      <UploadButton
        endpoint="videoUploader"
        onClientUploadComplete={async (res) => {
          setIsUploading(false);
          const url = res?.[0]?.url;
          if (!url) return onError?.("No file URL");
          // Guard: Max 3 hero videos
          const { data: existing } = await supabase.from("hero_videos").select("*");
          if (existing && existing.length >= 3) {
            onError?.("Max 3 hero videos allowed");
            return;
          }
          const { error } = await supabase.from("hero_videos").insert({
            title: "New Hero Video",
            subtitle: "Uploaded via UploadThing",
            video_url: url,
            display_order: 1,
          });
          if (error) {
            onError?.(`Database error: ${error.message}`);
            return;
          }
          onUploadComplete?.(url);
        }}
        onUploadError={(error) => {
          setIsUploading(false);
          onError?.(`Upload error: ${error.message}`);
          console.error("Upload failed", error);
        }}
        className="ut-button:bg-blue-600 ut-button:hover:bg-blue-700 ut-button:ut-readying:bg-blue-400 ut-button:ut-uploading:bg-blue-500"
      />
      {isUploading && (
        <div className="mt-2 text-sm text-gray-600 text-center">
          Uploading video...
        </div>
      )}
    </div>
  );
} 