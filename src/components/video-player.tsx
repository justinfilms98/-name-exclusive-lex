'use client'

import React, { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

interface VideoPlayerProps {
  videoId: string
  title: string
  description: string
  username: string
}

export function VideoPlayer({ videoId, title, description, username }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const fetchStreamUrl = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/stream?videoId=${videoId}`)
        
        if (!response.ok) {
          const error = await response.text()
          throw new Error(error)
        }

        const { url } = await response.json()
        setStreamUrl(url)
      } catch (error) {
        console.error('Error fetching stream URL:', error)
        setError(error instanceof Error ? error.message : 'Failed to load video')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStreamUrl()
  }, [videoId])

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return

    // Initialize HLS
    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          xhr.withCredentials = false
        }
      })
      
      hls.loadSource(streamUrl)
      hls.attachMedia(videoRef.current)
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (videoRef.current) {
          videoRef.current.play().catch(console.error)
        }
      })

      return () => {
        hls.destroy()
      }
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari
      videoRef.current.src = streamUrl
    }
  }, [streamUrl])

  // Prevent right-click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu)
      return () => container.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  // Add watermark
  useEffect(() => {
    if (!videoRef.current || !containerRef.current) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawWatermark = () => {
      if (!videoRef.current || !ctx) return

      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight

      // Draw video frame
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

      // Add watermark
      ctx.font = '24px Arial'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.fillText(`${username} - ${new Date().toLocaleDateString()}`, 20, canvas.height - 20)

      // Update video source
      videoRef.current.srcObject = canvas.captureStream()
    }

    const interval = setInterval(drawWatermark, 1000)
    return () => clearInterval(interval)
  }, [username])

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading video...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full" ref={containerRef}>
      <video
        ref={videoRef}
        controls
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="absolute bottom-24 left-0 right-0 p-8">
          <h1 className="font-serif text-4xl font-bold text-white mb-4">
            {title}
          </h1>
          <p className="text-white/90 text-lg max-w-2xl">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
} 