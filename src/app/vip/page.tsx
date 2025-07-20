"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VIPPage() {
  const router = useRouter();
  
  useEffect(() => {
    // VIP feature disabled for now, redirect to home
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
    </div>
  );
} 