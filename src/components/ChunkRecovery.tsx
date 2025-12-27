"use client";

import { useEffect } from "react";

export default function ChunkRecovery() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldRecover = (text?: string) => {
      if (!text) return false;
      const t = String(text).toLowerCase();
      return (
        t.includes("chunkloaderror") ||
        t.includes("loading chunk") ||
        t.includes("failed to fetch dynamically imported module") ||
        t.includes("importing a module script failed") ||
        t.includes("failed to load") ||
        t.includes("loading failed") ||
        t.includes("networkerror") ||
        t.includes("network error")
      );
    };

    const recoverOnce = () => {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get("__r") === "1") {
          // Already tried recovery, clear the param and do a hard reload
          url.searchParams.delete("__r");
          window.location.replace(url.toString() + "?__hard=1");
          return;
        }
        url.searchParams.set("__r", "1");
        window.location.replace(url.toString());
      } catch {
        // fallback: hard reload
        window.location.reload();
      }
    };

    const onError = (e: ErrorEvent) => {
      const errorText = e?.message || e?.error?.message || e?.error?.toString() || "";
      if (shouldRecover(errorText)) {
        console.error("[ChunkRecovery] Detected chunk error:", errorText);
        recoverOnce();
      }
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const reason: any = e?.reason;
      const msg = reason?.message || reason?.toString?.() || String(reason);
      if (shouldRecover(msg)) {
        console.error("[ChunkRecovery] Detected chunk rejection:", msg);
        recoverOnce();
      }
    };

    // Check if page content is loaded after a delay
    const checkPageLoad = () => {
      setTimeout(() => {
        // Check if React has hydrated by looking for common elements
        const hasContent = document.body && (
          document.body.children.length > 0 ||
          document.querySelector('[data-reactroot]') ||
          document.querySelector('#__next')?.children.length > 0
        );
        
        // If no content and we haven't already tried recovery, try it
        if (!hasContent && !window.location.search.includes("__r")) {
          console.warn("[ChunkRecovery] Page appears blank, attempting recovery...");
          recoverOnce();
        }
      }, 3000); // Wait 3 seconds for page to load
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    checkPageLoad();
    
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
