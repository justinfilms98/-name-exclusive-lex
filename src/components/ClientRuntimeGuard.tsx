"use client";

import { useEffect } from "react";

export default function ClientRuntimeGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldRecover = (text?: string) => {
      if (!text) return false;
      const t = String(text).toLowerCase();
      return (
        t.includes("chunkloaderror") ||
        t.includes("loading chunk") ||
        t.includes("failed to fetch dynamically imported module") ||
        t.includes("importing a module script failed")
      );
    };

    const recover = () => {
      const currentPath = window.location.pathname;
      window.location.href = currentPath + "?v=" + Date.now();
    };

    const handleError = (event: ErrorEvent) => {
      const errorMsg = event.message || event.filename || String(event.error || "");
      console.error("[runtime-guard] Error detected:", errorMsg);
      if (shouldRecover(errorMsg)) {
        console.warn("[runtime-guard] Chunk error detected, forcing reload...");
        recover();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason: any = event.reason;
      const msg = reason?.message || reason?.toString?.() || String(reason);
      console.error("[runtime-guard] Unhandled rejection:", msg);
      if (shouldRecover(msg)) {
        console.warn("[runtime-guard] Chunk rejection detected, forcing reload...");
        recover();
      }
    };

    window.addEventListener("error", handleError, true);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
