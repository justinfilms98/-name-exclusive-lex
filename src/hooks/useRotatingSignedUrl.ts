"use client";

import { useEffect, useRef, useState } from "react";

export function useRotatingSignedUrl(params: {
  collectionId: string;
  path: string | null;
  refreshEveryMs?: number;
}) {
  const { collectionId, path } = params;
  const refreshEveryMs = params.refreshEveryMs ?? 45_000;

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  async function fetchSignedUrl() {
    if (!collectionId || !path) return;

    const res = await fetch("/api/media/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId, path }),
    });

    if (!res.ok) return;

    const data = await res.json();
    setSignedUrl(data?.signedUrl ?? null);
  }

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setSignedUrl(null);
      await fetchSignedUrl();

      if (cancelled) return;

      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(fetchSignedUrl, refreshEveryMs);
    }

    if (collectionId && path) start();

    return () => {
      cancelled = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [collectionId, path, refreshEveryMs]);

  return signedUrl;
}
