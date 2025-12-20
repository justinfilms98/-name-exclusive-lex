"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, getCollections, getAlbums, getSignedUrl, updateAlbum, uploadFile } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import { Edit, Save, X, Upload, Image as ImageIcon, Plus, FolderPlus } from 'lucide-react';

interface Album {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  thumbnail_path?: string | null;
  created_at: string;
  collections?: { count: number }[];
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrls, setThumbnailUrls] = useState<{[key: string]: string}>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !isAdmin(session.user.email!)) {
        router.push('/');
        return;
      }

      setUser(session.user);
      await loadAlbums();
      setLoading(false);
    };

    checkAdminAccess();
  }, [router]);

  const loadAlbums = async () => {
    const { data } = await getAlbums();
    if (data) {
      setAlbums(data as Album[]);
      await loadThumbnails(data as Album[]);
    }
  };

  const loadThumbnails = async (albums: Album[]) => {
    const thumbnailPromises = albums.map(async (album) => {
      if (album.thumbnail_path) {
        try {
          const { data, error } = await getSignedUrl('media', album.thumbnail_path, 3600);
          if (!error && data) {
            return { id: album.id, url: data.signedUrl };
          }
        } catch (error) {
          console.error('Failed to load thumbnail for', album.id, error);
        }
      }
      return { id: album.id, url: null };
    });

    const results = await Promise.all(thumbnailPromises);
    const urlMap: {[key: string]: string} = {};
    results.forEach(result => {
      if (result.url) {
        urlMap[result.id] = result.url;
      }
    });
    setThumbnailUrls(urlMap);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      let thumbnailPath: string | null = null;
      if (thumbnailFile) {
        const timestamp = Date.now();
        const path = `albums/${slug}_${timestamp}/thumbnail.${thumbnailFile.name.split('.').pop()}`;
        const { error: uploadError } = await uploadFile(thumbnailFile, "media", path);
        if (uploadError) throw new Error(`Thumbnail upload failed: ${uploadError.message}`);
        thumbnailPath = path;
      }

      const { data, error } = await supabase
        .from('albums')
        .insert([{
          id: crypto.randomUUID() as string,
          name: name.trim(),
          slug,
          description: description.trim() || null,
          thumbnail_path: thumbnailPath,
        }])
        .select();

      if (error) throw new Error(error.message);
      if (data && data[0]) {
        await loadAlbums();
        setName("");
        setDescription("");
        setThumbnailFile(null);
      }
    } catch (err) {
      console.error("Album create error:", err);
      alert("Failed to create album. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (album: Album) => {
    setEditingId(album.id);
    setEditName(album.name);
    setEditDescription(album.description || "");
    setEditSlug(album.slug);
    setEditThumbnailFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
    setEditSlug("");
    setEditThumbnailFile(null);
  };

  const handleUpdate = async (albumId: string) => {
    if (!editName.trim()) return;
    setUpdatingId(albumId);
    try {
      const album = albums.find(a => a.id === albumId);
      if (!album) return;

      const slug = editSlug.trim() || editName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      let thumbnailPath = album.thumbnail_path || null;
      if (editThumbnailFile) {
        const timestamp = Date.now();
        const path = `albums/${slug}_${timestamp}/thumbnail.${editThumbnailFile.name.split('.').pop()}`;
        const { error: uploadError } = await uploadFile(editThumbnailFile, "media", path);
        if (uploadError) throw new Error(`Thumbnail upload failed: ${uploadError.message}`);
        thumbnailPath = path;
      }

      const { data, error } = await updateAlbum(albumId, {
        name: editName.trim(),
        slug,
        description: editDescription.trim() || null,
        thumbnail_path: thumbnailPath,
      });

      if (error) throw new Error(error.message);
      if (data && data[0]) {
        await loadAlbums();
        setEditingId(null);
        setEditName("");
        setEditDescription("");
        setEditSlug("");
        setEditThumbnailFile(null);
      }
    } catch (err) {
      console.error("Album update error:", err);
      alert("Failed to update album. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-almond pt-20 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="heading-1">Manage Albums</h1>
            <p className="text-sage">Organize collections into curated groups.</p>
          </div>
          <Link href="/admin/collections" className="btn-secondary">
            Manage Collections
          </Link>
        </div>

        <div className="card-glass p-6 space-y-4">
          <h2 className="heading-3 flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create album</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-earth font-medium">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="e.g., Europe Tour"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-earth font-medium">Slug</label>
              <input
                value={
                  name
                    ? name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, "")
                    : ""
                }
                disabled
                className="input bg-mushroom/30"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm text-earth font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input h-24 resize-none"
                placeholder="Optional album description"
                disabled={saving}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm text-earth font-medium">Thumbnail Image (Optional)</label>
              <div className="flex items-center space-x-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    className="hidden"
                    disabled={saving}
                  />
                  <div className="btn-secondary inline-flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>{thumbnailFile ? thumbnailFile.name : "Choose thumbnail"}</span>
                  </div>
                </label>
                {thumbnailFile && (
                  <span className="text-sm text-sage">✓ Selected: {thumbnailFile.name}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 spinner" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <FolderPlus className="w-4 h-4" />
                <span>Create album</span>
              </>
            )}
          </button>
        </div>

        <div className="card-glass p-6">
          <h2 className="heading-3 mb-4">Existing albums ({albums.length})</h2>
          {albums.length === 0 ? (
            <p className="text-sage text-sm">No albums yet. Create one to organize collections.</p>
          ) : (
            <div className="space-y-4">
              {albums.map((album) => {
                const isEditing = editingId === album.id;
                const thumbnailUrl = thumbnailUrls[album.id];
                return (
                  <div key={album.id} className="bg-blanket/70 p-6 rounded-xl border border-mushroom/30">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm text-earth font-medium">Name</label>
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="input"
                              disabled={updatingId === album.id}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm text-earth font-medium">Slug</label>
                            <input
                              value={editSlug}
                              onChange={(e) => setEditSlug(e.target.value)}
                              className="input"
                              disabled={updatingId === album.id}
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-sm text-earth font-medium">Description</label>
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="input h-24 resize-none"
                              disabled={updatingId === album.id}
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-sm text-earth font-medium">Thumbnail Image</label>
                            <div className="flex items-center space-x-4">
                              {thumbnailUrl && (
                                <div className="w-24 h-24 rounded-lg overflow-hidden border border-mushroom/30">
                                  <img src={thumbnailUrl} alt={album.name} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setEditThumbnailFile(e.target.files?.[0] || null)}
                                  className="hidden"
                                  disabled={updatingId === album.id}
                                />
                                <div className="btn-secondary inline-flex items-center space-x-2">
                                  <Upload className="w-4 h-4" />
                                  <span>{editThumbnailFile ? editThumbnailFile.name : "Change thumbnail"}</span>
                                </div>
                              </label>
                              {editThumbnailFile && (
                                <span className="text-sm text-sage">✓ New: {editThumbnailFile.name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdate(album.id)}
                            disabled={updatingId === album.id || !editName.trim()}
                            className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50"
                          >
                            {updatingId === album.id ? (
                              <>
                                <div className="w-4 h-4 spinner" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                <span>Save Changes</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={updatingId === album.id}
                            className="btn-secondary inline-flex items-center space-x-2 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-6">
                        <div className="w-32 h-32 rounded-xl overflow-hidden border border-mushroom/30 flex-shrink-0">
                          {thumbnailUrl ? (
                            <img src={thumbnailUrl} alt={album.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-mushroom to-blanket flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-sage/60" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <Link href={`/admin/albums/${album.id}`} className="text-earth font-semibold text-lg hover:text-khaki transition-colors">
                                {album.name}
                              </Link>
                              <p className="text-xs text-sage mt-1">Slug: {album.slug}</p>
                              <p className="text-sm text-earth mt-2">{album.description || "No description"}</p>
                            </div>
                            <button
                              onClick={() => startEdit(album)}
                              className="p-2 text-sage hover:text-earth hover:bg-blanket/60 rounded-lg transition-colors"
                              title="Edit album"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-sage">
                            <span>{album.collections?.[0]?.count ?? 0} collections</span>
                            <span>•</span>
                            <span>Added {new Date(album.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 