'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useContentProtection, useScreenRecordingProtection, useUserVerification, useCodeProtection } from '@/lib/security'

const videos = [
  {
    id: 1,
    src: '/videos/hero-1.mp4',
    title: 'Unlock Your Secret Desires',
    subtitle: 'Discover exclusive content tailored for you'
  },
  {
    id: 2,
    src: '/videos/hero-2.mp4',
    title: 'Indulge in Private Content',
    subtitle: 'Premium videos for your viewing pleasure'
  },
  {
    id: 3,
    src: '/videos/hero-3.mp4',
    title: 'Premium Video Experience',
    subtitle: 'Secure, adult-only content at your fingertips'
  }
]

export function VideoShowcase() {
  const [currentVideo, setCurrentVideo] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // Implement security measures
  useContentProtection()
  useScreenRecordingProtection()
  useUserVerification()
  useCodeProtection()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % videos.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentVideo}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 -z-10"
        >
          <video
            src={videos[currentVideo].src}
            autoPlay
            muted
            loop
            playsInline
            className={`w-full h-full object-cover ${!isVisible ? 'blur-md' : ''}`}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-screen flex flex-col items-center justify-center text-center px-4">
        <motion.div
          key={currentVideo}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-serif font-bold text-4xl sm:text-6xl text-[#2E4A2E]">
            {videos[currentVideo].title}
          </h1>
          <p className="font-sans text-lg sm:text-2xl text-[#3C2F2F] mt-2">
            {videos[currentVideo].subtitle}
          </p>
          <Link href="/collections" className="inline-block mt-6">
            <Button 
              size="lg" 
              className="bg-[#F2E8D5] text-[#3C2F2F] hover:bg-[#E8D4C6] py-3 px-6 rounded-lg transition"
            >
              Browse Now
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
} 