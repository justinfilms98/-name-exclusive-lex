'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import prisma from '@/lib/prisma'

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    price: '',
    type: 'monthly',
    thumbnail: null as File | null,
    video: null as File | null
  })
  const [videos, setVideos] = useState<any[]>([])
  const [editingVideo, setEditingVideo] = useState<any | null>(null)

  useEffect(() => {
    if (session?.user?.role !== 'CREATOR') {
      router.push('/')
      return
    }

    async function fetchVideos() {
      const res = await fetch('/api/admin/videos')
      const data = await res.json()
      setVideos(data)
    }
    fetchVideos()
  }, [session, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'video') => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoData(prev => ({ ...prev, [type]: file }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Get presigned URL for video upload
      const videoResponse = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: videoData.video?.name,
          fileType: videoData.video?.type
        })
      })

      const { uploadUrl, videoKey } = await videoResponse.json()

      // Upload video to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: videoData.video,
        headers: { 'Content-Type': videoData.video?.type || '' }
      })

      setUploadProgress(50)

      // Get presigned URL for thumbnail
      const thumbnailResponse = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: videoData.thumbnail?.name,
          fileType: videoData.thumbnail?.type
        })
      })

      const { uploadUrl: thumbnailUrl, videoKey: thumbnailKey } = await thumbnailResponse.json()

      // Upload thumbnail to S3
      await fetch(thumbnailUrl, {
        method: 'PUT',
        body: videoData.thumbnail,
        headers: { 'Content-Type': videoData.thumbnail?.type || '' }
      })

      setUploadProgress(75)

      // Save video metadata
      await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoData.title,
          description: videoData.description,
          price: parseFloat(videoData.price),
          type: videoData.type,
          videoKey,
          thumbnailKey
        })
      })

      setUploadProgress(100)
      router.refresh()
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-4xl font-bold text-[#2E4A2E] mb-8">
        Admin Dashboard
      </h1>

      {/* List all videos */}
      <div className="mb-8">
        <h2 className="font-serif text-2xl mb-4">All Videos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="bg-white p-4 rounded shadow">
              <h3 className="font-bold text-lg">{video.title}</h3>
              <p>{video.description}</p>
              <p>Price: ${video.price}</p>
              <p>Type: {video.type}</p>
              <Button onClick={() => setEditingVideo(video)} className="mt-2">Edit</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit form modal/inline */}
      {editingVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-lg w-full max-w-lg">
            <h2 className="font-bold text-xl mb-4">Edit Video</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await fetch(`/api/admin/videos/${editingVideo.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editingVideo),
                });
                setEditingVideo(null);
                router.refresh();
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingVideo.title}
                  onChange={e => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingVideo.description}
                  onChange={e => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editingVideo.price}
                  onChange={e => setEditingVideo({ ...editingVideo, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <select
                  id="edit-type"
                  value={editingVideo.type}
                  onChange={e => setEditingVideo({ ...editingVideo, type: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <Button type="submit" className="w-full bg-[#2E4A2E] text-[#F2E8D5] hover:bg-[#3C2F2F]">Save Changes</Button>
              <Button type="button" onClick={() => setEditingVideo(null)} className="w-full mt-2">Cancel</Button>
            </form>
          </div>
        </div>
      )}

      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-serif text-2xl text-[#2E4A2E]">
            Upload New Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={videoData.title}
                  onChange={(e) => setVideoData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={videoData.description}
                  onChange={(e) => setVideoData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={videoData.price}
                  onChange={(e) => setVideoData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={videoData.type}
                  onChange={(e) => setVideoData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <Label htmlFor="thumbnail">Thumbnail</Label>
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'thumbnail')}
                  required
                />
              </div>

              <div>
                <Label htmlFor="video">Video</Label>
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, 'video')}
                  required
                />
              </div>
            </div>

            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-[#2E4A2E] h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#2E4A2E] text-[#F2E8D5] hover:bg-[#3C2F2F]"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 