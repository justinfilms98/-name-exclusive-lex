"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Save, X, Upload, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { supabase, getAlbums, updateAlbum, uploadFile, getSignedUrl, getCollections, getCollectionsByAlbum, updateCollection } from "@/lib/supabase";
import { isAdmin } from "@/lib/auth";

interface Album {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  thumbnail_path?: string | null;
  created_at: string;
}

interface Collection {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail_path?: string | null;
  album_id?: string | null;
}

export default function AdminAlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = useMemo(() => (Array.isArray(params?.id) ? params.id[0] : (params?.id as string)), [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [album, setAlbum] = useState<Album | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  
  const [addingCollection, setAddingCollection] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      if (!albumId) {
        router.push("/admin/albums");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !isAdmin(session.user.email || "")) {
        router.push("/");
        return;
      }

      await loadAlbum();
      await loadCollections();
      await loadAllCollections();
      setLoading(false);
    };

    init();
  }, [albumId, router]);

  const loadAlbum = async () => {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('id', albumId)
      .single();

    if (error || !data) {
      console.error('Failed to load album:', error);
      router.push("/admin/albums");
      return;
    }

    setAlbum(data as Album);
    setEditName(data.name);
    setEditDescription(data.description || "");
    setEditSlug(data.slug);

    if (data.thumbnail_path) {
      const { data: urlData } = await getSignedUrl('media', data.thumbnail_path, 3600);
      if (urlData) {
        setThumbnailUrl(urlData.signedUrl);
      }
    }
  };

  const loadCollections = async () => {
    const { data } = await getCollectionsByAlbum(albumId);
    if (data) {
      setCollections(data as Collection[]);
    }
  };

  const loadAllCollections = async () => {
    const { data } = await getCollections();
    if (data) {
      setAllCollections(data as Collection[]);
    }
  };

  const handleSave = async () => {
    if (!album || !editName.trim()) return;
    setSaving(true);

    try {
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
        setAlbum(data[0] as Album);
        setEditing(false);
        setEditThumbnailFile(null);
        await loadAlbum();
      }
    } catch (err) {
      console.error("Album update error:", err);
      alert("Failed to update album. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCollection = async () => {
    if (!selectedCollectionId) return;
    setAddingCollection(true);

    try {
      const { error } = await updateCollection(selectedCollectionId, {
        album_id: albumId,
      });

      if (error) throw new Error(error.message);
      await loadCollections();
      await loadAllCollections();
      setSelectedCollectionId("");
      setAddingCollection(false);
    } catch (err) {
      console.error("Failed to add collection:", err);
      alert("Failed to add collection to album.");
      setAddingCollection(false);
    }
  };

  const handleRemoveCollection = async (collectionId: string) => {
    if (!confirm("Remove this collection from the album?")) return;

    try {
      const { error } = await updateCollection(collectionId, {
        album_id: null,
      });

      if (error) throw new Error(error.message);
      await loadCollections();
    } catch (err) {
      console.error("Failed to remove collection:", err);
      alert("Failed to remove collection from album.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-almond flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-sage text-lg">Loading album...</p>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-almond flex items-center justify-center">
        <div className="text-center">
          <p className="text-sage text-lg">Album not found</p>
          <Link href="/admin/albums" className="btn-secondary mt-4">Back to Albums</Link>
        </div>
      </div>
    );
  }

  const availableCollections = allCollections.filter(c => c.album_id !== albumId);

  return (
    <div className="min-h-screen bg-almond p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Link href="/admin/albums" className="inline-flex items-center text-sage hover:text-earth text-sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to albums
            </Link>
            <h1 className="heading-1">Edit Album</h1>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Album</span>
            </button>
          )}
        </div>

        {editing ? (
          <div className="card-glass p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-earth font-medium">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-earth font-medium">Slug</label>
                <input
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="input"
                  disabled={saving}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm text-earth font-medium">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="input h-24 resize-none"
                  disabled={saving}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm text-earth font-medium">Thumbnail Image</label>
                <div className="flex items-center space-x-4">
                  {thumbnailUrl && (
                    <div className="w-32 h-32 rounded-lg overflow-hidden border border-mushroom/30">
                      <img src={thumbnailUrl} alt={album.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditThumbnailFile(e.target.files?.[0] || null)}
                      className="hidden"
                      disabled={saving}
                    />
                    <div className="btn-secondary inline-flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>{editThumbnailFile ? editThumbnailFile.name : "Change thumbnail"}</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSave}
                disabled={saving || !editName.trim()}
                className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50"
              >
                {saving ? (
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
                onClick={() => {
                  setEditing(false);
                  setEditName(album.name);
                  setEditDescription(album.description || "");
                  setEditSlug(album.slug);
                  setEditThumbnailFile(null);
                }}
                disabled={saving}
                className="btn-secondary inline-flex items-center space-x-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="card-glass p-6">
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
              <div className="flex-1">
                <h2 className="text-2xl font-serif text-earth mb-2">{album.name}</h2>
                <p className="text-sm text-sage mb-2">Slug: {album.slug}</p>
                <p className="text-earth">{album.description || "No description"}</p>
              </div>
            </div>
          </div>
        )}

        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-3">Collections in Album ({collections.length})</h2>
            {availableCollections.length > 0 && (
              <div className="flex items-center space-x-2">
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="input"
                  disabled={addingCollection}
                >
                  <option value="">Select collection...</option>
                  {availableCollections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddCollection}
                  disabled={!selectedCollectionId || addingCollection}
                  className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50"
                >
                  {addingCollection ? (
                    <>
                      <div className="w-4 h-4 spinner" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {collections.length === 0 ? (
            <p className="text-sage text-sm">No collections in this album yet.</p>
          ) : (
            <div className="space-y-3">
              {collections.map((collection) => (
                <div key={collection.id} className="flex items-center justify-between bg-blanket/70 p-4 rounded-lg">
                  <div>
                    <p className="text-earth font-semibold">{collection.title}</p>
                    <p className="text-xs text-sage">${(collection.price / 100).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/collections/${collection.id}/edit`}
                      className="p-2 text-sage hover:text-earth transition-colors"
                      title="Edit collection"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleRemoveCollection(collection.id)}
                      className="p-2 text-sage hover:text-red-600 transition-colors"
                      title="Remove from album"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

