"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

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

    // Get the session and access token from Supabase
    // Since Supabase client stores sessions in localStorage (not cookies),
    // we need to send the access token in the Authorization header
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      setError("Session expired — please refresh or sign in again.");
      return;
    }

    const res = await fetch("/api/media/signed-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`, // Send access token in header
      },
      credentials: "include", // Still include cookies (for future cookie-based auth)
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
