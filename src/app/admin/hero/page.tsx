"use client";

import { useState, useEffect } from 'react';
import { getHeroVideos, uploadFile, getSignedUrl, supabase } from '@/lib/supabase';
import { Video, Upload, Trash2, Edit, Save, X } from 'lucide-react';

interface HeroVideo {
  id: string;
  title: string;
  subtitle?: string;
  video_path: string;
  order_index: number;
  created_at: string;
}

export default function AdminHeroPage() {
  const [heroVideos, setHeroVideos] = useState<HeroVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadHeroVideos();
  }, []);

  const loadHeroVideos = async () => {
    try {
      const { data, error } = await getHeroVideos();
      if (!error && data) {
        setHeroVideos(data);
      }
    } catch (err) {
      console.error('Failed to load hero videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file');
        return;
      }
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert('Video file must be less than 100MB');
        return;
      }
      
      setVideoFile(file);
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !videoFile) {
      alert('Please fill in all required fields and select a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `hero-${timestamp}-${videoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `hero/${filename}`;

      // Upload video to Supabase storage
      const { data: uploadData, error: uploadError } = await uploadFile(
        videoFile,
        'media',
        filePath
      );

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get next order index
      const nextOrder = Math.max(...heroVideos.map(v => v.order_index), 0) + 1;

      // Insert hero video record
      const { data, error } = await supabase
        .from('hero_videos')
        .insert([
          {
            title: title.trim(),
            subtitle: subtitle.trim() || null,
            video_path: filePath,
            order_index: nextOrder,
          }
        ])
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Reset form
      setTitle('');
      setSubtitle('');
      setVideoFile(null);
      setUploadProgress(0);
      
      // Reload hero videos
      await loadHeroVideos();
      
      alert('Hero video uploaded successfully!');

    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async (heroVideo: HeroVideo) => {
    const newTitle = prompt('Enter new title:', heroVideo.title);
    const newSubtitle = prompt('Enter new subtitle (optional):', heroVideo.subtitle || '');
    
    if (newTitle === null) return; // User cancelled
    
    if (!newTitle.trim()) {
      alert('Title cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('hero_videos')
        .update({
          title: newTitle.trim(),
          subtitle: newSubtitle?.trim() || null,
        })
        .eq('id', heroVideo.id);

      if (error) {
        throw new Error(error.message);
      }

      await loadHeroVideos();
      alert('Hero video updated successfully!');

    } catch (error: any) {
      console.error('Update error:', error);
      alert(`Update failed: ${error.message}`);
    }
  };

  const handleDelete = async (heroVideo: HeroVideo) => {
    if (!confirm(`Are you sure you want to delete "${heroVideo.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('hero_videos')
        .delete()
        .eq('id', heroVideo.id);

      if (dbError) {
        throw new Error(dbError.message);
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([heroVideo.video_path]);

      if (storageError) {
        console.warn('Storage deletion warning:', storageError);
      }

      await loadHeroVideos();
      alert('Hero video deleted successfully!');

    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Delete failed: ${error.message}`);
    }
  };

  const moveUp = async (heroVideo: HeroVideo) => {
    const currentIndex = heroVideo.order_index;
    const targetVideo = heroVideos.find(v => v.order_index === currentIndex - 1);
    
    if (!targetVideo) return;

    try {
      // Swap order indexes
      await supabase.from('hero_videos').update({ order_index: currentIndex }).eq('id', targetVideo.id);
      await supabase.from('hero_videos').update({ order_index: currentIndex - 1 }).eq('id', heroVideo.id);
      
      await loadHeroVideos();
    } catch (error) {
      console.error('Reorder error:', error);
    }
  };

  const moveDown = async (heroVideo: HeroVideo) => {
    const currentIndex = heroVideo.order_index;
    const targetVideo = heroVideos.find(v => v.order_index === currentIndex + 1);
    
    if (!targetVideo) return;

    try {
      // Swap order indexes
      await supabase.from('hero_videos').update({ order_index: currentIndex }).eq('id', targetVideo.id);
      await supabase.from('hero_videos').update({ order_index: currentIndex + 1 }).eq('id', heroVideo.id);
      
      await loadHeroVideos();
    } catch (error) {
      console.error('Reorder error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center text-pearl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-salmon mx-auto mb-4"></div>
          <p className="text-green">Loading hero management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-pearl mb-2">Manage Hero Videos</h1>
          <p className="text-green">Upload and manage hero section videos (recommended: 3 videos max)</p>
        </div>

        {/* Upload Form */}
        <div className="bg-pearl bg-opacity-10 backdrop-blur-sm rounded-lg border border-pearl border-opacity-20 p-6 mb-8">
          <h2 className="text-xl font-semibold text-pearl mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload New Hero Video
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-green text-sm font-medium mb-2">
                Title (Required)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-sand border border-pearl border-opacity-30 rounded-lg text-pearl placeholder-green focus:outline-none focus:border-salmon"
                placeholder="Enter hero video title"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-green text-sm font-medium mb-2">
                Subtitle (Optional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3 py-2 bg-sand border border-pearl border-opacity-30 rounded-lg text-pearl placeholder-green focus:outline-none focus:border-salmon"
                placeholder="Enter subtitle (optional)"
                disabled={uploading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-green text-sm font-medium mb-2">
                Video File (Required - Max 100MB)
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 bg-sand border border-pearl border-opacity-30 rounded-lg text-pearl file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-salmon file:text-white hover:file:bg-cyan"
                disabled={uploading}
              />
              {videoFile && (
                <p className="mt-2 text-cyan text-sm">
                  Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </div>
          </div>

          {uploading && uploadProgress > 0 && (
            <div className="mt-4">
              <div className="bg-sand rounded-full h-2">
                <div 
                  className="bg-salmon h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-cyan text-sm mt-1">{uploadProgress}% uploaded</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || !title.trim() || !videoFile}
            className="mt-6 bg-salmon hover:bg-cyan text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Hero Video
              </>
            )}
          </button>
        </div>

        {/* Hero Videos List */}
        <div className="bg-pearl bg-opacity-10 backdrop-blur-sm rounded-lg border border-pearl border-opacity-20 p-6">
          <h2 className="text-xl font-semibold text-pearl mb-4 flex items-center">
            <Video className="w-5 h-5 mr-2" />
            Current Hero Videos ({heroVideos.length})
          </h2>

          {heroVideos.length === 0 ? (
            <div className="text-center py-8">
              <Video className="w-16 h-16 text-salmon mx-auto mb-4" />
              <p className="text-green">No hero videos uploaded yet.</p>
              <p className="text-cyan text-sm mt-2">Upload your first hero video above to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {heroVideos
                .sort((a, b) => a.order_index - b.order_index)
                .map((heroVideo, index) => (
                <div
                  key={heroVideo.id}
                  className="bg-sand bg-opacity-50 rounded-lg p-4 border border-pearl border-opacity-20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-salmon text-white text-xs px-2 py-1 rounded">
                          #{heroVideo.order_index}
                        </span>
                        <h3 className="text-lg font-semibold text-pearl">
                          {heroVideo.title}
                        </h3>
                      </div>
                      
                      {heroVideo.subtitle && (
                        <p className="text-green mb-2">{heroVideo.subtitle}</p>
                      )}
                      
                      <p className="text-cyan text-sm">
                        Path: {heroVideo.video_path}
                      </p>
                      <p className="text-cyan text-xs">
                        Created: {new Date(heroVideo.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {/* Reorder buttons */}
                      <button
                        onClick={() => moveUp(heroVideo)}
                        disabled={index === 0}
                        className="p-1 text-cyan hover:text-salmon disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveDown(heroVideo)}
                        disabled={index === heroVideos.length - 1}
                        className="p-1 text-cyan hover:text-salmon disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        ↓
                      </button>
                      
                      {/* Edit button */}
                      <button
                        onClick={() => handleEdit(heroVideo)}
                        className="p-2 text-cyan hover:text-salmon transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(heroVideo)}
                        className="p-2 text-salmon hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-8 bg-cyan bg-opacity-10 border border-cyan border-opacity-30 rounded-lg p-4">
          <h3 className="text-cyan font-semibold mb-2">Hero Video Tips:</h3>
          <ul className="text-green text-sm space-y-1">
            <li>• Recommended: 3 hero videos maximum for optimal performance</li>
            <li>• Videos auto-advance every 8 seconds with crossfade effect</li>
            <li>• Landscape orientation (16:9) works best for hero sections</li>
            <li>• Keep videos under 100MB for faster loading</li>
            <li>• Use compelling titles and subtitles to engage visitors</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 