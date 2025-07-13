"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const videoSamples = [
  'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
  'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_5mb.mp4',
  'https://coverr.co/s3/mp4/coverr-lake-birds-2386.mp4',
  'https://coverr.co/s3/mp4/coverr-mountain-pines-8373.mp4',
  'https://coverr.co/s3/mp4/coverr-slow-canyon-pan-8687.mp4',
  'https://coverr.co/s3/mp4/coverr-rain-on-window-2826.mp4',
  'https://coverr.co/s3/mp4/coverr-beach-glide-2973.mp4',
  'https://coverr.co/s3/mp4/coverr-lighthouse-pathway-9793.mp4'
];
const thumbnailSamples = [
  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2',
  'https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg',
  'https://images.pexels.com/photos/3952236/pexels-photo-3952236.jpeg',
  'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0',
  'https://images.pexels.com/photos/2104258/pexels-photo-2104258.jpeg',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f',
  'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf',
  'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d'
];

export default function AdminPage() {
  const [tab, setTab] = useState<'hero' | 'collection'>('hero');
  const [collectionVideos, setCollectionVideos] = useState<any[]>([]);
  const { data: session } = useSession();

  // Fetch collection videos for preview grid
  useEffect(() => {
    fetch("/api/collection-videos")
      .then((res) => res.json())
      .then((data) => setCollectionVideos(data));
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 p-8 pt-28">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>
        <div className="flex justify-center mb-8">
          <button
            className={`px-6 py-2 rounded-l-lg font-semibold border ${tab === 'hero' ? 'bg-stone-800 text-white' : 'bg-white text-stone-800'}`}
            onClick={() => setTab('hero')}
          >
            Upload Hero Video
          </button>
          <button
            className={`px-6 py-2 rounded-r-lg font-semibold border -ml-px ${tab === 'collection' ? 'bg-stone-800 text-white' : 'bg-white text-stone-800'}`}
            onClick={() => setTab('collection')}
          >
            Upload Collection Video
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-8 mb-12">
          {tab === 'hero' ? <HeroVideoForm /> : <CollectionVideoForm />}
        </div>
        <h2 className="text-2xl font-bold mb-4 text-center">Collection Videos Preview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {collectionVideos.map((video) => (
            <div key={video.id} className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
              <img src={video.thumbnail} alt={video.title} className="w-full h-40 object-cover rounded mb-2" />
              <h3 className="font-semibold text-lg mb-1 text-center">{video.title}</h3>
              <p className="text-stone-500 text-sm mb-2 text-center">{video.description}</p>
              <div className="flex items-center space-x-2 text-stone-700 text-sm mb-2">
                <span>${video.price}</span>
                <span>·</span>
                <span>{video.durationMinutes} min</span>
              </div>
              <video src={video.videoUrl} controls className="w-full rounded mb-2" />
              <button className="w-full bg-emerald-600 text-white px-4 py-2 rounded font-semibold hover:bg-emerald-700 transition-colors mt-2">
                Purchase to Unlock
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroVideoForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    // TODO: Implement upload logic
    setMessage("(Demo) Hero video uploaded!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-semibold mb-1">Title</label>
        <input className="w-full border rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div>
        <label className="block font-semibold mb-1">Description</label>
        <textarea className="w-full border rounded px-3 py-2" value={description} onChange={e => setDescription(e.target.value)} required />
      </div>
      <div>
        <label className="block font-semibold mb-1">Video Upload</label>
        <input type="file" accept="video/*" onChange={e => setVideo(e.target.files?.[0] || null)} required />
      </div>
      <button type="submit" className="bg-stone-800 text-white px-6 py-2 rounded font-semibold hover:bg-stone-900 transition-colors">Upload Hero Video</button>
      {message && <div className="text-green-600 mt-2">{message}</div>}
    </form>
  );
}

function CollectionVideoForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    // TODO: Implement upload logic
    setMessage("(Demo) Collection video uploaded!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-semibold mb-1">Title</label>
        <input className="w-full border rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div>
        <label className="block font-semibold mb-1">Description</label>
        <textarea className="w-full border rounded px-3 py-2" value={description} onChange={e => setDescription(e.target.value)} required />
      </div>
      <div>
        <label className="block font-semibold mb-1">Price (USD)</label>
        <input type="number" className="w-full border rounded px-3 py-2" value={price} onChange={e => setPrice(e.target.value)} required min={1} />
      </div>
      <div>
        <label className="block font-semibold mb-1">Duration (minutes)</label>
        <input type="number" className="w-full border rounded px-3 py-2" value={duration} onChange={e => setDuration(e.target.value)} required min={1} />
      </div>
      <div>
        <label className="block font-semibold mb-1">Thumbnail Upload</label>
        <input type="file" accept="image/*" onChange={e => setThumbnail(e.target.files?.[0] || null)} required />
      </div>
      <div>
        <label className="block font-semibold mb-1">Video Upload</label>
        <input type="file" accept="video/*" onChange={e => setVideo(e.target.files?.[0] || null)} required />
      </div>
      <button type="submit" className="bg-stone-800 text-white px-6 py-2 rounded font-semibold hover:bg-stone-900 transition-colors">Upload Collection Video</button>
      {message && <div className="text-green-600 mt-2">{message}</div>}
    </form>
  );
} 