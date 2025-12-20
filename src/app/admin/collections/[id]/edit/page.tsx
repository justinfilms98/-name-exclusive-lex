"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FolderPlus, Image as ImageIcon, Save, Trash2, Video } from "lucide-react";
import { supabase, getCollection, updateCollection, uploadFile, getAlbums, createAlbum } from "@/lib/supabase";
import { isAdmin } from "@/lib/auth";

interface Album {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export default function EditCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = useMemo(() => (Array.isArray(params?.id) ? params.id[0] : (params?.id as string)), [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0); // dollars
  const [originalPrice, setOriginalPrice] = useState<number>(0); // cents
  const [videoDuration, setVideoDuration] = useState<number>(300);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  const [existingVideoPath, setExistingVideoPath] = useState<string | null>(null);
  const [existingThumbnailPath, setExistingThumbnailPath] = useState<string | null>(null);
  const [existingPhotoPaths, setExistingPhotoPaths] = useState<string[]>([]);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);

  const [albums, setAlbums] = useState<Album[]>([]);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDescription, setNewAlbumDescription] = useState("");
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!collectionId) {
        setServerError("Missing collection id");
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || !isAdmin(session.user.email || "")) {
        router.push("/login");
        return;
      }

      const [albumsRes, collectionRes] = await Promise.all([getAlbums(), getCollection(collectionId)]);

      if (albumsRes.data) {
        setAlbums(albumsRes.data);
      }

      if (collectionRes.data) {
        const data = collectionRes.data;
        setTitle(data.title || "");
        setDescription(data.description || "");
        setPrice((data.price || 0) / 100);
        setOriginalPrice(data.price || 0);
        setVideoDuration(data.video_duration || 300);
        setSelectedAlbumId(data.album_id || null);
        setExistingVideoPath(data.media_filename || data.video_path || null);
        setExistingThumbnailPath(data.thumbnail_path || null);
        setExistingPhotoPaths(Array.isArray(data.photo_paths) ? data.photo_paths : []);
      } else {
        setServerError(collectionRes.error?.message || "Collection not found");
      }

      setLoading(false);
    };

    init();
  }, [collectionId, router]);

  const validate = () => {
    const issues: string[] = [];
    if (!title.trim()) issues.push("Title is required");
    if (!description.trim()) issues.push("Description is required");
    if (price <= 0) issues.push("Price must be greater than 0");
    if (videoDuration <= 0) issues.push("Video duration must be greater than 0");
    setErrors(issues);
    return issues.length === 0;
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;
    setCreatingAlbum(true);
    try {
      const slug = newAlbumName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const { data, error } = await createAlbum({
        name: newAlbumName.trim(),
        slug,
        description: newAlbumDescription.trim() || null,
      });

      if (error) throw new Error(error.message);

      if (data && data[0]) {
        setAlbums((prev) => [data[0], ...prev]);
        setSelectedAlbumId(data[0].id);
        setNewAlbumName("");
        setNewAlbumDescription("");
      }
    } catch (err) {
      console.error("Failed to create album", err);
      setServerError("Unable to create album. Please try again.");
    } finally {
      setCreatingAlbum(false);
    }
  };

  const handleSave = async () => {
    if (!collectionId) return;
    if (!validate()) return;

    setSaving(true);
    setServerError(null);
    try {
      const timestamp = Date.now();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "_");

      let videoPath = existingVideoPath || "";
      if (videoFile) {
        const path = `collections/${slug}_${timestamp}/video.${videoFile.name.split(".").pop()}`;
        const { error } = await uploadFile(videoFile, "media", path);
        if (error) throw new Error(`Video upload failed: ${error.message}`);
        videoPath = path;
      }

      let thumbnailPath = existingThumbnailPath || "";
      if (thumbnailFile) {
        const path = `collections/${slug}_${timestamp}/thumbnail.${thumbnailFile.name.split(".").pop()}`;
        const { error } = await uploadFile(thumbnailFile, "media", path);
        if (error) throw new Error(`Thumbnail upload failed: ${error.message}`);
        thumbnailPath = path;
      }

      const photos = [...existingPhotoPaths];
      if (photoFiles && photoFiles.length > 0) {
        for (let i = 0; i < photoFiles.length; i++) {
          const file = photoFiles[i];
          const path = `collections/${slug}_${timestamp}/photo_${i}.${file.name.split(".").pop()}`;
          const { error } = await uploadFile(file, "media", path);
          if (error) throw new Error(`Photo upload failed: ${error.message}`);
          photos.push(path);
        }
      }

      const updates: any = {
        title: title.trim(),
        description: description.trim(),
        price: Math.round(price * 100),
        video_duration: videoDuration,
        album_id: selectedAlbumId,
        photo_paths: photos,
      };

      if (videoPath) {
        updates.video_path = videoPath;
        updates.media_filename = videoPath;
      }
      if (thumbnailPath) {
        updates.thumbnail_path = thumbnailPath;
      }

      const { error } = await updateCollection(collectionId, updates);
      if (error) throw new Error(error.message);

      if (updates.price !== originalPrice) {
        const stripePriceRes = await fetch("/api/create-stripe-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_name: title.trim(),
            amount: updates.price,
            collection_id: collectionId,
          }),
        });

        if (stripePriceRes.ok) {
          const { price_id } = await stripePriceRes.json();
          await updateCollection(collectionId, { stripe_price_id: price_id });
        }
      }

      alert("Collection updated successfully!");
      router.push("/admin/collections");
    } catch (err: any) {
      console.error("Update error:", err);
      setServerError(err?.message || "Failed to update collection");
    } finally {
      setSaving(false);
    }
  };

  const removeExistingPhoto = (path: string) => {
    setExistingPhotoPaths((prev) => prev.filter((p) => p !== path));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-almond flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-sage text-lg">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (serverError) {
    return (
      <div className="min-h-screen bg-almond flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-earth font-semibold">{serverError}</p>
          <Link href="/admin/collections" className="btn-primary inline-flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to collections</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-almond p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Link href="/admin/collections" className="inline-flex items-center text-sage hover:text-earth text-sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to collections
            </Link>
            <h1 className="heading-1">Edit Collection</h1>
            <p className="text-sage">Update metadata or media without re-uploading everything.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
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
                <span>Save changes</span>
              </>
            )}
          </button>
        </div>

        {errors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-semibold mb-2">Please fix the following:</p>
            <ul className="text-red-600 text-sm space-y-1">
              {errors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="card-glass p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-earth text-sm font-medium">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="Collection title"
                disabled={saving}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-earth text-sm font-medium">Price (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="input"
                disabled={saving}
              />
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="block text-earth text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input h-28 resize-none"
                placeholder="Detailed description"
                disabled={saving}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-earth text-sm font-medium">Video Duration (minutes)</label>
              <input
                type="number"
                min="1"
                value={Math.max(1, Math.round(videoDuration / 60))}
                onChange={(e) => setVideoDuration((parseInt(e.target.value) || 1) * 60)}
                className="input"
                disabled={saving}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-earth text-sm font-medium">Album</label>
              <select
                value={selectedAlbumId || ""}
                onChange={(e) => setSelectedAlbumId(e.target.value || null)}
                className="input"
                disabled={saving}
              >
                <option value="">No album</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-sage">Organize collections for the public albums pages.</p>
            </div>

            <div className="md:col-span-2 grid md:grid-cols-2 gap-4 bg-blanket/50 p-4 rounded-lg border border-mushroom/30">
              <div className="space-y-2">
                <label className="block text-earth text-sm font-medium">Quick create album</label>
                <input
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="Album name"
                  className="input"
                  disabled={creatingAlbum || saving}
                />
                <textarea
                  value={newAlbumDescription}
                  onChange={(e) => setNewAlbumDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="input h-20 resize-none"
                  disabled={creatingAlbum || saving}
                />
              </div>
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={handleCreateAlbum}
                  disabled={creatingAlbum || !newAlbumName.trim()}
                  className="btn-secondary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {creatingAlbum ? (
                    <>
                      <div className="w-4 h-4 spinner" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4" />
                      <span>Create & select</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-earth text-sm font-medium">Replace video (optional)</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sage file:text-blanc hover:file:bg-khaki"
                disabled={saving}
              />
              <p className="text-xs text-sage">
                Current video kept unless a new file is uploaded. Max 2GB.
              </p>
              {existingVideoPath && (
                <div className="text-xs text-earth bg-blanket/60 rounded p-3">
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4" />
                    <span className="font-medium">Existing video path:</span>
                  </div>
                  <p className="mt-1 break-all text-sage">{existingVideoPath}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-earth text-sm font-medium">Replace thumbnail (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sage file:text-blanc hover:file:bg-khaki"
                disabled={saving}
              />
              <p className="text-xs text-sage">Current thumbnail kept unless a new image is uploaded.</p>
              {existingThumbnailPath && (
                <div className="text-xs text-earth bg-blanket/60 rounded p-3">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4" />
                    <span className="font-medium">Existing thumbnail path:</span>
                  </div>
                  <p className="mt-1 break-all text-sage">{existingThumbnailPath}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-earth font-semibold">Existing photos</h3>
                <p className="text-xs text-sage">Remove photos you no longer want to keep.</p>
              </div>
              <div className="text-xs text-sage">{existingPhotoPaths.length} photos</div>
            </div>
            {existingPhotoPaths.length === 0 ? (
              <p className="text-sage text-sm">No photos attached.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {existingPhotoPaths.map((path) => (
                  <div key={path} className="flex items-center justify-between bg-blanket/60 px-3 py-2 rounded-lg text-sm text-earth">
                    <span className="truncate max-w-[75%]">{path}</span>
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(path)}
                      className="p-2 text-sage hover:text-khaki"
                      aria-label="Remove photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-earth text-sm font-medium">Add additional photos (optional)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotoFiles(e.target.files)}
              className="input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blanket file:text-earth hover:file:bg-mushroom"
              disabled={saving}
            />
            {photoFiles && (
              <p className="text-xs text-sage">Selected {photoFiles.length} new photos to upload.</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
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
                  <span>Save changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

