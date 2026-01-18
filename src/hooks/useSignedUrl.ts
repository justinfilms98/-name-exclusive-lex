"use client";

import { useEffect, useState } from "react";

export function useSignedUrl(collectionId: string, path: string | null) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!collectionId || !path) return;

    let cancelled = false;

    async function run(retry = false) {
      setSignedUrl(null);
      if (!retry) setError(null);

      const res = await fetch("/api/media/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, path }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        const status = res.status;

        if (status === 401 && !retry) {
          // Retry once after 500ms for Safari auth hydration
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (!cancelled) {
            return run(true);
          }
        }

        if (!cancelled) {
          if (status === 401) {
            setError("Session expired — please refresh or sign in again.");
          } else {
            setError(errorData.error || `Failed to sign URL (${status})`);
          }
        }
        return;
      }

      const data = await res.json();
      if (!cancelled) {
        setSignedUrl(data?.signedUrl ?? null);
        setError(null);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [collectionId, path]);

  return { signedUrl, error };
}
