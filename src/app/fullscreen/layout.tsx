"use client";

import { useEffect } from "react";

export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Hide header by adding class to body and html
    document.body.classList.add('fullscreen-mode');
    document.documentElement.classList.add('fullscreen-mode');
    // Prevent scroll
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.documentElement.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.classList.remove('fullscreen-mode');
      document.documentElement.classList.remove('fullscreen-mode');
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.height = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      {children}
    </div>
  );
}

