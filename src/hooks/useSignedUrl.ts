"use client";

import { useEffect, useState } from "react";

export function useSignedUrl(collectionId: string, path: string | null) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!collectionId || !path) return;

    let cancelled = false;

    async function run() {
      setSignedUrl(null);
      setError(null);

      const res = await fetch("/api/media/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, path }),
      });

      if (!res.ok) {
        setError(`Failed to sign URL (${res.status})`);
        return;
      }

      const data = await res.json();
      if (!cancelled) setSignedUrl(data?.signedUrl ?? null);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [collectionId, path]);

  return { signedUrl, error };
}
