"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useRotatingSignedUrl } from "@/hooks/useRotatingSignedUrl";

type RotatingProtectedVideoProps = React.PropsWithChildren<
  Omit<React.VideoHTMLAttributes<HTMLVideoElement>, "src"> & {
    collectionId: string;
    videoPath: string | null;
    loadingFallback?: React.ReactNode;
  }
>;

const RotatingProtectedVideo = forwardRef<
  HTMLVideoElement,
  RotatingProtectedVideoProps
>(({ collectionId, videoPath, loadingFallback, children, ...videoProps }, ref) => {
  const signedUrl = useRotatingSignedUrl({
    collectionId,
    path: videoPath,
    refreshEveryMs: 45_000,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !signedUrl) return;

    const currentTime = vid.currentTime;
    const wasPlaying = !vid.paused;

    if (vid.src !== signedUrl) {
      vid.src = signedUrl;
    }
    vid.load();

    vid.onloadedmetadata = () => {
      vid.currentTime = currentTime;
      if (wasPlaying) {
        vid.play().catch(() => {});
      }
    };
  }, [signedUrl]);

  if (!signedUrl) {
    return loadingFallback ? (
      <>{loadingFallback}</>
    ) : (
      <div className="text-sm opacity-70">Loading...</div>
    );
  }

  return (
    <video
      ref={videoRef}
      {...videoProps}
    >
      {children}
    </video>
  );
});

RotatingProtectedVideo.displayName = "RotatingProtectedVideo";

export default RotatingProtectedVideo;
