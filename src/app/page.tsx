'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const heroContent = [
  {
    video: '/videos/hero-1.mp4',
    title: 'Unlock Your Secret Desires',
    subtitle: 'Secure, adult-only video experiences tailored for you'
  },
  {
    video: '/videos/hero-2.mp4',
    title: 'Experience Pure Intimacy',
    subtitle: 'Curated collection of authentic, passionate moments'
  },
  {
    video: '/videos/hero-3.mp4',
    title: 'Your Private Sanctuary',
    subtitle: 'Exclusive content that ignites your deepest fantasies'
  }
]

interface HeroVideo {
  video: string
  title: string
  subtitle: string
}

export default function Home() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [heroVideo, setHeroVideo] = useState<HeroVideo | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Security measures
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)

    // Disable keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'u')) ||
        (e.key === 'F12') ||
        (e.altKey && e.key === 'F4')
      ) {
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    // Disable dev tools
    const handleDevTools = () => {
      if (window.innerWidth - window.outerWidth > 200 || window.innerHeight - window.outerHeight > 200) {
        document.body.innerHTML = 'Dev tools are disabled'
      }
    }
    window.addEventListener('resize', handleDevTools)

    // Add screen capture protection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // When tab is not visible, blur the video
        if (videoRef.current) {
          videoRef.current.style.filter = 'blur(10px)'
        }
      } else {
        // When tab becomes visible again, remove blur
        if (videoRef.current) {
          videoRef.current.style.filter = 'none'
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleDevTools)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroContent.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setHeroVideo(heroContent[currentIndex])
  }, [currentIndex])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('Error playing video:', error)
      })
    }
  }, [heroVideo])

  return (
    <div className="relative min-h-screen">
      {/* Hero Video */}
      {heroVideo && (
        <video
          ref={videoRef}
          key={heroVideo.video}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
        >
          <source src={heroVideo.video} type="video/mp4" />
        </video>
      )}

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 className="font-serif text-5xl md:text-6xl font-bold text-white mb-4">
          {heroVideo?.title}
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-8">
          {heroVideo?.subtitle}
        </p>
        <Link href="/collections">
          <Button className="bg-[#2E4A2E] text-[#F2E8D5] hover:bg-[#3C2F2F] text-lg px-8 py-6">
            Explore Collections
          </Button>
        </Link>
      </div>
    </div>
  )
} 