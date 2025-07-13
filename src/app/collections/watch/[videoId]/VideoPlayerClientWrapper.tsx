"use client";
import VideoPlayer from "./VideoPlayer";

export default function VideoPlayerClientWrapper(props: { src: string; title: string; expiresAt?: string }) {
  return <VideoPlayer {...props} />;
} 