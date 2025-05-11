'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { VideoPlayer } from '@/components/video-player'
import { Button } from '@/components/ui/button'
import { useCart } from '@/context/cart-context'
import { Loader2 } from 'lucide-react'

interface Video {
  id: string
  title: string
  description: string
  price: number
  type: 'monthly' | 'yearly'
  thumbnailKey: string
  createdAt: string
  creator: {
    name: string
    image: string
  }
  hasAccess: boolean
  expiresAt: string | null
}

export default function WatchPage() {
  const params = useParams()
  const { addItem } = useCart()
  const [video, setVideo] = useState<Video | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const videoId = (params as any)?.videoId;
        if (!videoId) {
          throw new Error('Missing videoId parameter');
        }

        const response = await fetch(`/api/videos/${videoId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch video')
        }

        const data = await response.json()
        setVideo(data)
      } catch (error) {
        console.error('Error fetching video:', error)
        setError('Failed to load video')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideo()
  }, [(params as any)?.videoId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error || 'Video not found'}</div>
      </div>
    )
  }

  if (!video.hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-[#4A7A4A] mb-4">
            Purchase Required
          </h1>
          <p className="text-[#4A7A4A] mb-8">
            You need to purchase this video to watch it.
          </p>
          <Button
            onClick={() => addItem(video)}
            className="bg-[#2E4A2E] text-[#F2E8D5] hover:bg-[#4A7A4A]"
          >
            Add to Cart
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <VideoPlayer
        videoId={video.id}
        title={video.title}
        description={video.description}
        username={video.creator.name}
      />
    </div>
  )
} 