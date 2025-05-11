'use client'

import { useEffect, useState } from 'react'
import { VideoPlayer } from './video-player'

interface HeroVideo {
  id: string
  title: string
  description: string
  username: string
}

export function HeroSection() {
  const [videos, setVideos] = useState<HeroVideo[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHeroVideos = async () => {
      try {
        const response = await fetch('/api/hero-videos')
        if (!response.ok) throw new Error('Failed to fetch hero videos')
        const data = await response.json()
        setVideos(data)
      } catch (error) {
        console.error('Error fetching hero videos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHeroVideos()
  }, [])

  useEffect(() => {
    if (videos.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length)
    }, 30000) // Rotate every 30 seconds

    return () => clearInterval(interval)
  }, [videos])

  if (isLoading) {
    return (
      <div className="fixed top-0 left-0 w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading hero section...</div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="fixed top-0 left-0 w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">No hero videos available</div>
      </div>
    )
  }

  const currentVideo = videos[currentIndex]

  return (
    <div className="fixed top-0 left-0 w-full h-screen z-10">
      <VideoPlayer
        videoId={currentVideo.id}
        title={currentVideo.title}
        description={currentVideo.description}
        username={currentVideo.username}
      />
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center space-x-2 z-20">
        {videos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
            aria-label={`Go to video ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
} 