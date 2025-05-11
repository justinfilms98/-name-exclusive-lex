import { NextResponse } from 'next/server'

// Mock data for development
const heroVideos = [
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

export async function GET() {
  return NextResponse.json(heroVideos)
} 