'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loader2, Search, ShoppingCart, Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/cart-context'

interface Video {
  id: string
  title: string
  description: string
  thumbnailKey: string
  price: number
  type: 'monthly' | 'yearly'
  creator: {
    name: string
    image: string
  }
  createdAt: string
  hasAccess: boolean
  expiresAt: string | null
}

type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high'
type FilterOption = 'all' | 'monthly' | 'yearly'

// Simulate a logged-in creator for now (replace with real session check after login is fixed)
const isCreator = false // set to true to test editing

export default function CollectionsPage() {
  const router = useRouter()
  const { addItem } = useCart()
  const [videos, setVideos] = useState<Video[]>([])
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/videos')
        if (!response.ok) {
          throw new Error('Failed to fetch videos')
        }
        const data = await response.json()
        setVideos(data)
        setFilteredVideos(data)
      } catch (error) {
        console.error('Error fetching videos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideos()
  }, [])

  useEffect(() => {
    filterAndSortVideos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos, searchQuery, sortBy, filterBy])

  const filterAndSortVideos = () => {
    let filtered = [...videos]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        video =>
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(video => video.type === filterBy)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        default:
          return 0
      }
    })

    setFilteredVideos(filtered)
  }

  const handleAddToCart = (video: Video) => {
    addItem(video)
    setTimeout(() => {
      router.push('/cart')
    }, 100)
  }

  const handleTitleChange = (id: string, newTitle: string) => {
    setVideos(videos => videos.map(v => v.id === id ? { ...v, title: newTitle } : v))
    setFilteredVideos(filteredVideos => filteredVideos.map(v => v.id === id ? { ...v, title: newTitle } : v))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#4A7A4A]">Collections</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-transparent border-[#F2E8D5] text-[#4A7A4A] placeholder-[#4A7A4A]/50"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#4A7A4A]" />
          </div>
          <Select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="bg-transparent border-[#F2E8D5] text-[#4A7A4A]"
          >
            <option value="all">All Types</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent border-[#F2E8D5] text-[#4A7A4A]"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredVideos.map((video: Video) => (
          <div
            key={video.id}
            className="aspect-[9/16] bg-transparent rounded-lg overflow-hidden relative group cursor-pointer border border-[#F2E8D5]/20 hover:border-[#4A7A4A]/50 transition-colors"
          >
            <Link href={`/watch/${video.id}`}>
              <div className="absolute inset-0">
                <Image
                  src={`/api/thumbnails/${video.thumbnailKey}`}
                  alt={video.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
              </div>
            </Link>
            {/* Timer tag */}
            {video.hasAccess && video.expiresAt && (
              <div className="absolute left-2 top-8 flex items-center bg-[#F2E8D5] bg-opacity-80 rounded px-2 py-1 text-xs text-[#2E4A2E] shadow">
                <Clock className="w-4 h-4 mr-1 text-[#2E4A2E]" />
                {new Date(video.expiresAt).toLocaleDateString()}
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F2E8D5]/90 to-transparent flex flex-col justify-end h-32">
              {/* Editable title for creator */}
              {isCreator ? (
                <input
                  className="text-[#4A7A4A] font-medium bg-transparent border-b border-[#4A7A4A] mb-1"
                  value={video.title}
                  onChange={e => handleTitleChange(video.id, e.target.value)}
                />
              ) : (
                <h3 className="text-[#4A7A4A] font-medium">{video.title}</h3>
              )}
              <p className="text-[#4A7A4A] text-sm">by {video.creator.name}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[#4A7A4A] font-medium">${video.price} per unlock</span>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddToCart(video)
                  }}
                  className="bg-[#2E4A2E] text-[#F2E8D5] hover:bg-[#4A7A4A]"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
              <div className="mt-2" />
            </div>
          </div>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#4A7A4A]">No videos found</p>
        </div>
      )}
    </div>
  )
} 