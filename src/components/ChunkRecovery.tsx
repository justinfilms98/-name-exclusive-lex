"use client";

import { useEffect } from "react";

export default function ChunkRecovery() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldRecover = (text?: string) => {
      if (!text) return false;
      const t = String(text);
      return (
        t.includes("ChunkLoadError") ||
        t.includes("Loading chunk") ||
        t.includes("Failed to fetch dynamically imported module") ||
        t.includes("Importing a module script failed")
      );
    };

    const recoverOnce = () => {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get("__r") === "1") return;
        url.searchParams.set("__r", "1");
        window.location.replace(url.toString());
      } catch {
        // fallback: normal reload
        window.location.reload();
      }
    };

    const onError = (e: ErrorEvent) => {
      if (shouldRecover(e?.message)) recoverOnce();
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const reason: any = e?.reason;
      const msg = reason?.message || reason?.toString?.();
      if (shouldRecover(msg)) recoverOnce();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
