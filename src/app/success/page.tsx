"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function SuccessPage() {
  const { data: session } = useSession();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPurchase() {
      if (!session?.user?.email) return;
      // Fetch latest purchase for this user
      const res = await fetch(`/api/user-purchases?email=${session.user.email}`);
      const data = await res.json();
      if (data && data.videoId) {
        setVideo(data.video);
        // Get signed video URL
        const urlRes = await fetch(`/api/secure-video?videoId=${data.videoId}&email=${session.user.email}`);
        const urlData = await urlRes.json();
        setSignedUrl(urlData.signedUrl);
      }
      setLoading(false);
    }
    fetchPurchase();
  }, [session]);

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  if (!video) return <div className="flex justify-center items-center min-h-screen">No recent purchase found.</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
      <h1 className="text-4xl font-bold mb-4 text-green-700">Thank you for your purchase!</h1>
      <p className="mb-2 text-lg">You have unlocked: <span className="font-semibold">{video.title}</span></p>
      <p className="mb-6 text-md">Your access duration: <span className="font-semibold">{video.duration} minutes</span></p>
      {signedUrl && (
        <a
          href={signedUrl}
          className="bg-green-900 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg text-lg transition-all duration-200"
        >
          Watch Now
        </a>
      )}
    </div>
  );
} 