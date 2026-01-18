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
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const retryRef = useRef<boolean>(false);

  async function fetchSignedUrl(retry = false) {
    if (!collectionId || !path) return;

    // CRITICAL: credentials: "include" ensures cookies are sent with the request
    // Without this, Supabase auth cookies won't be included and the server
    // will return 401 even if the user is logged in
    // cache: "no-store" prevents browser caching of the auth request
    const res = await fetch("/api/media/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // This ensures cookies are sent
      cache: "no-store", // Prevent caching auth requests
      body: JSON.stringify({ collectionId, path }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
      const status = res.status;

      if (status === 401 && !retry && !retryRef.current) {
        retryRef.current = true;
        // Retry once after 500ms for Safari auth hydration
        await new Promise((resolve) => setTimeout(resolve, 500));
        retryRef.current = false;
        return fetchSignedUrl(true);
      }

      if (status === 401) {
        setError("Session expired — please refresh or sign in again.");
      } else {
        setError(errorData.error || `Failed to sign URL (${status})`);
      }
      return;
    }

    const data = await res.json();
    setSignedUrl(data?.signedUrl ?? null);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setSignedUrl(null);
      setError(null);
      await fetchSignedUrl();

      if (cancelled) return;

      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => fetchSignedUrl(), refreshEveryMs);
    }

    if (collectionId && path) start();

    return () => {
      cancelled = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [collectionId, path, refreshEveryMs]);

  return { signedUrl, error };
}
