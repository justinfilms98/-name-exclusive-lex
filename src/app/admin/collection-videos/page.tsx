"use client";
import { useEffect, useState } from "react";

interface Video {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  order: number;
  price: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCollectionVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/collection-videos/0", { method: "GET" });
      if (!res.ok) throw new Error("Failed to fetch videos");
      const data = await res.json();
      setVideos(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/collection-videos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete video");
      setVideos(videos => videos.filter(v => v.id !== id));
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 pt-28">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Admin: Collection Videos</h1>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center mb-4">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map(video => (
              <div key={video.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
                <img src={video.thumbnail} alt={video.title} className="w-full h-40 object-cover rounded mb-2" />
                <h2 className="text-xl font-semibold">{video.title}</h2>
                <p className="text-gray-600">{video.description}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                    // onClick={() => handleEdit(video.id)}
                    disabled
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                    onClick={() => handleDelete(video.id)}
                    disabled={deleting === video.id}
                  >
                    {deleting === video.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 