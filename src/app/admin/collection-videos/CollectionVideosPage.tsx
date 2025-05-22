import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';

// Dummy data structure for now
interface CollectionVideo {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number; // in minutes
  thumbnail: string;
  videoUrl: string;
}

export default function CollectionVideosPage() {
  const [videos, setVideos] = useState<CollectionVideo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: 0,
    duration: 0,
    thumbnail: '',
    videoUrl: '',
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // TODO: Fetch videos from your backend/API
  useEffect(() => {
    // fetch('/api/collection-videos').then(...)
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setThumbnailFile(files[0]);
      setForm(prev => ({ ...prev, thumbnail: URL.createObjectURL(files[0]) }));
    }
  };

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setVideoFile(files[0]);
      setForm(prev => ({ ...prev, videoUrl: URL.createObjectURL(files[0]) }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // In a real app, upload files and get URLs, then save to DB
    const newVideo: CollectionVideo = {
      id: Math.random().toString(36).substr(2, 9),
      title: form.title,
      description: form.description,
      price: Number(form.price),
      duration: Number(form.duration),
      thumbnail: form.thumbnail,
      videoUrl: form.videoUrl,
    };
    setVideos(prev => [...prev, newVideo]);
    setShowModal(false);
    setForm({ title: '', description: '', price: 0, duration: 0, thumbnail: '', videoUrl: '' });
    setThumbnailFile(null);
    setVideoFile(null);
  };

  return (
    <div>
      <h2>Manage Collection Videos</h2>
      <button onClick={() => setShowModal(true)}>Add Video</button>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 24 }}>
        {videos.map((video: CollectionVideo) => (
          <div key={video.id} style={{ border: '1px solid #ccc', padding: 16, width: 300 }}>
            <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
            <h3>{video.title}</h3>
            <p>{video.description}</p>
            <p><b>Price:</b> ${video.price}</p>
            <p><b>Duration:</b> {video.duration} min</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button>Edit</button>
              <button>Delete</button>
              <button>Pricing</button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 320 }}>
            <h3>Add Collection Video</h3>
            <div>
              <label>Title</label>
              <input name="title" value={form.title} onChange={handleInputChange} required style={{ width: '100%' }} />
            </div>
            <div>
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleInputChange} required style={{ width: '100%' }} />
            </div>
            <div>
              <label>Price ($)</label>
              <input name="price" type="number" value={form.price} onChange={handleInputChange} required min={0} style={{ width: '100%' }} />
            </div>
            <div>
              <label>Duration (minutes)</label>
              <input name="duration" type="number" value={form.duration} onChange={handleInputChange} required min={1} style={{ width: '100%' }} />
            </div>
            <div>
              <label>Thumbnail</label>
              <input type="file" accept="image/*" onChange={handleThumbnailChange} required />
              {form.thumbnail && <img src={form.thumbnail} alt="thumbnail preview" style={{ width: 80, marginTop: 8 }} />}
            </div>
            <div>
              <label>Video File</label>
              <input type="file" accept="video/*" onChange={handleVideoChange} required />
              {form.videoUrl && <video src={form.videoUrl} controls style={{ width: 120, marginTop: 8 }} />}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button type="submit">Save</button>
              <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 