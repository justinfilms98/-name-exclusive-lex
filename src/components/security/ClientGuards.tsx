"use client";

import { useEffect } from "react";

export default function ClientGuards({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onContextMenu = (e: Event) => e.preventDefault();
    const onDragStart = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      const blocked =
        (ctrlOrCmd && (key === "s" || key === "p" || key === "u")) ||
        (ctrlOrCmd && e.shiftKey && (key === "i" || key === "j" || key === "c")) ||
        key === "f12";

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("contextmenu", onContextMenu, { capture: true });
    document.addEventListener("dragstart", onDragStart, { capture: true });
    document.addEventListener("drop", onDrop, { capture: true });
    document.addEventListener("keydown", onKeyDown, { capture: true });

    return () => {
      document.removeEventListener("contextmenu", onContextMenu, {
        capture: true,
      } as any);
      document.removeEventListener("dragstart", onDragStart, {
        capture: true,
      } as any);
      document.removeEventListener("drop", onDrop, {
        capture: true,
      } as any);
      document.removeEventListener("keydown", onKeyDown, {
        capture: true,
      } as any);
    };
  }, []);

  return (
    <div
      className="select-none"
      style={{ WebkitUserSelect: "none", userSelect: "none" } as any}
    >
      {children}
    </div>
  );
}
