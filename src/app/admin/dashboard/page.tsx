'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

interface ContentItem {
  id: string
  title: string
  description: string
  isPublished: boolean
  isFeatured: boolean
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [content, setContent] = useState<ContentItem[]>([])
  const [newContent, setNewContent] = useState<Partial<ContentItem>>({
    title: '',
    description: '',
    isPublished: false,
    isFeatured: false,
  })

  useEffect(() => {
    setIsClient(true)
    // Load content from API
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/admin/content')
      if (response.ok) {
        const data = await response.json()
        setContent(data)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    }
  }

  const handlePublishToggle = async (id: string, checked: boolean) => {
    try {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: checked }),
      })

      if (response.ok) {
        setContent(content.map(item => 
          item.id === id ? { ...item, isPublished: checked } : item
        ))
      }
    } catch (error) {
      console.error('Error updating content:', error)
    }
  }

  const handleFeatureToggle = async (id: string, checked: boolean) => {
    try {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: checked }),
      })

      if (response.ok) {
        setContent(content.map(item => 
          item.id === id ? { ...item, isFeatured: checked } : item
        ))
      }
    } catch (error) {
      console.error('Error updating content:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContent),
      })

      if (response.ok) {
        const newItem = await response.json()
        setContent([...content, newItem])
        setNewContent({
          title: '',
          description: '',
          isPublished: false,
          isFeatured: false,
        })
      }
    } catch (error) {
      console.error('Error creating content:', error)
    }
  }

  if (!isClient) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Admin Dashboard
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Manage your content and settings
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Content Management */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Add New Content
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newContent.description}
                  onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="publish"
                  checked={newContent.isPublished}
                  onCheckedChange={(checked: boolean) => setNewContent({ ...newContent, isPublished: checked })}
                />
                <Label htmlFor="publish">Publish immediately</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="feature"
                  checked={newContent.isFeatured}
                  onCheckedChange={(checked: boolean) => setNewContent({ ...newContent, isFeatured: checked })}
                />
                <Label htmlFor="feature">Feature this content</Label>
              </div>
              <Button type="submit" className="w-full">
                Add Content
              </Button>
            </form>
          </Card>

          {/* Content List */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Manage Content
            </h2>
            <div className="space-y-4">
              {content.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  <div className="mt-4 flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`publish-${item.id}`}
                        checked={item.isPublished}
                        onCheckedChange={(checked: boolean) => handlePublishToggle(item.id, checked)}
                      />
                      <Label htmlFor={`publish-${item.id}`}>Published</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`feature-${item.id}`}
                        checked={item.isFeatured}
                        onCheckedChange={(checked: boolean) => handleFeatureToggle(item.id, checked)}
                      />
                      <Label htmlFor={`feature-${item.id}`}>Featured</Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 