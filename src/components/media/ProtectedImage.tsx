"use client";

import React from "react";
import { useSignedUrl } from "@/hooks/useSignedUrl";

type ProtectedImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  collectionId: string;
  imagePath: string | null;
  loadingFallback?: React.ReactNode;
};

export default function ProtectedImage({
  collectionId,
  imagePath,
  loadingFallback,
  ...imgProps
}: ProtectedImageProps) {
  const { signedUrl, error } = useSignedUrl(collectionId, imagePath);

  if (error) {
    return <div className="text-sm text-red-400">{error}</div>;
  }

  if (!signedUrl) {
    return loadingFallback ? <>{loadingFallback}</> : null;
  }

  return <img {...imgProps} src={signedUrl} />;
}
