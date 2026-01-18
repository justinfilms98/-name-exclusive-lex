"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useSignedUrl(collectionId: string, path: string | null) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!collectionId || !path) return;

    let cancelled = false;

    async function run(retry = false) {
      setSignedUrl(null);
      if (!retry) setError(null);

      // Get the session and access token from Supabase
      // Since Supabase client stores sessions in localStorage (not cookies),
      // we need to send the access token in the Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        if (!cancelled) {
          setError("Session expired — please refresh or sign in again.");
        }
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
