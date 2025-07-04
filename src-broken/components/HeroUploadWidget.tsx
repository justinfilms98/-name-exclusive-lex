"use client";

import { useState } from "react";

interface HeroUploadWidgetProps {
  onUploadComplete?: (videoUrl: string) => void;
  onError?: (error: string) => void;
}

export default function HeroUploadWidget({ onUploadComplete, onError }: HeroUploadWidgetProps) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="w-full">
      {/* TODO: Integrate UploadThing upload button here if needed. */}
    </div>
  );
} 