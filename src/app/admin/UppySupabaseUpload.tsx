"use client";

import React, { useRef, useEffect, useState } from 'react';
import Uppy from '@uppy/core';
import type { Uppy as UppyType } from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import Tus from '@uppy/tus';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import { createClient } from '@supabase/supabase-js';

// You may want to move these to your env config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BUCKET = 'videos'; // You may want to make this configurable

export default function UppySupabaseUpload() {
  const uppyRef = useRef<UppyType | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    collection: '',
  });

  useEffect(() => {
    if (uppyRef.current) return;
    const uppy = new Uppy({
      restrictions: {
        maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
        maxNumberOfFiles: 1,
        allowedFileTypes: ['video/*'],
      },
      autoProceed: false,
    })
      .use(Dashboard, {
        inline: true,
        target: '#uppy-dashboard',
        showProgressDetails: true,
        proudlyDisplayPoweredByUppy: false,
        height: 350,
      })
      .use(Tus, {
        endpoint: 'https://upload.tus.io/files/', // Placeholder, we'll override upload logic
        chunkSize: 5 * 1024 * 1024, // 5MB
        async onBeforeRequest(req, file) {
          // We'll handle upload manually
        },
      });

    uppy.on('file-added', () => setError(null));
    uppy.on('upload', () => setUploading(true));
    uppy.on('upload-progress', (file, progress) => {
      if (progress.bytesTotal && progress.bytesTotal > 0) {
        setProgress(progress.bytesUploaded / progress.bytesTotal * 100);
      }
    });
    uppy.on('complete', (result) => {
      setUploading(false);
      setProgress(100);
      if (result.successful && result.successful.length > 0) {
        setVideoUrl(result.successful[0].uploadURL || null);
      }
    });
    uppy.on('error', (err) => {
      setError(err.message || 'Upload failed');
      setUploading(false);
    });

    uppyRef.current = uppy;
    return () => {
      uppy.cancelAll();
      uppy.uninstall();
    };
  }, []);

  // Custom upload handler for Supabase Storage
  const handleUpload = async () => {
    setError(null);
    setUploading(true);
    setProgress(0);
    const uppy = uppyRef.current;
    if (!uppy) return;
    const files = uppy.getFiles();
    if (files.length === 0) {
      setError('Please select a video file to upload.');
      setUploading(false);
      return;
    }
    const file = files[0].data;
    const fileName = `${Date.now()}-${files[0].name}`;
    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: files[0].type,
    });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    // Get public URL (or signed URL in future step)
    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    setVideoUrl(publicUrlData.publicUrl);
    setUploading(false);
    setProgress(100);
    // TODO: Save video metadata to your backend/database
  };

  return (
    <div>
      <form
        className="mb-6 grid grid-cols-1 gap-4"
        onSubmit={e => {
          e.preventDefault();
          handleUpload();
        }}
      >
        <input
          className="border rounded px-3 py-2"
          placeholder="Title"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          required
        />
        <textarea
          className="border rounded px-3 py-2"
          placeholder="Description"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Price (USD)"
          type="number"
          value={form.price}
          onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Collection (optional)"
          value={form.collection}
          onChange={e => setForm(f => ({ ...f, collection: e.target.value }))}
        />
        <div id="uppy-dashboard" className="mb-4" />
        {uploading && (
          <div className="w-full bg-stone-200 rounded h-2 mb-2">
            <div
              className="bg-emerald-500 h-2 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <button
          type="submit"
          className="bg-emerald-600 text-white px-6 py-2 rounded font-semibold hover:bg-emerald-700 transition-colors"
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>
      {videoUrl && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Uploaded Video Preview:</h3>
          <video src={videoUrl} controls className="w-full max-w-lg rounded shadow" />
          <div className="text-stone-500 text-xs mt-2">{videoUrl}</div>
        </div>
      )}
    </div>
  );
} 