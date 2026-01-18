"use client";

import React, { forwardRef } from "react";
import { useSignedUrl } from "@/hooks/useSignedUrl";

type ProtectedVideoProps = React.PropsWithChildren<
  Omit<React.VideoHTMLAttributes<HTMLVideoElement>, "src"> & {
    collectionId: string;
    videoPath: string | null;
    loadingFallback?: React.ReactNode;
  }
>;

const ProtectedVideo = forwardRef<HTMLVideoElement, ProtectedVideoProps>(
  ({ collectionId, videoPath, loadingFallback, children, ...videoProps }, ref) => {
    const signedUrl = useSignedUrl(collectionId, videoPath);

    if (!signedUrl) {
      return loadingFallback ? (
        <>{loadingFallback}</>
      ) : (
        <div className="text-sm opacity-70">Loading...</div>
      );
    }

    return (
      <video ref={ref} {...videoProps} src={signedUrl}>
        {children}
      </video>
    );
  }
);

ProtectedVideo.displayName = "ProtectedVideo";

export default ProtectedVideo;
