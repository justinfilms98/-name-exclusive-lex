"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session_id = searchParams.get("session_id");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session_id) return;
    fetch(`/api/verify-purchase?session_id=${session_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        // Redirect to the secure watch page
        router.replace(`/watch/${data.videoId}`);
      })
      .catch(() => setError("SERVER_ERROR"));
  }, [session_id, router]);

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Purchase Verification Failed</h1>
        <p>{error === "VIDEO_NOT_FOUND" ? "Video not found." : "Something went wrong."}</p>
        <button onClick={() => router.push("/")}>Go Home</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Verifying Purchase…</h1>
      <p>Please wait while we prepare your video.</p>
    </div>
  );
} 