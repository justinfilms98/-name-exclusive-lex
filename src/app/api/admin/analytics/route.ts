import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { format, subDays } from 'date-fns'

interface Analytics {
  totalViews: number
  totalRevenue: number
  totalPurchases: number
  averageWatchTime: number
  completionRate: number
  viewsByDay: {
    date: string
    views: number
  }[]
  revenueByDay: {
    date: string
    revenue: number
    subscriptionRevenue: number
    oneTimeRevenue: number
  }[]
  topVideos: {
    id: string
    title: string
    views: number
    revenue: number
    completionRate: number
    revenuePerView: number
  }[]
  viewerDemographics: {
    deviceTypes: { type: string; count: number }[]
    countries: { country: string; count: number }[]
  }
  revenueBreakdown: {
    subscription: number
    oneTime: number
    refunded: number
  }
  peakViewingTimes: {
    hour: number
    views: number
  }[]
  previousPeriodComparison: {
    views: number
    revenue: number
    purchases: number
    watchTime: number
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const range = searchParams.get('range')

    let dateRange: { start: Date; end: Date }
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      }
    } else {
      const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
      dateRange = {
        start: subDays(new Date(), days),
        end: new Date()
      }
    }

    // Get total purchases
    const purchases = await prisma.purchase.findMany({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      include: {
        video: true
      }
    })

    const totalRevenue = purchases.reduce((sum: number, purchase: any) => sum + purchase.video.price, 0)
    const totalPurchases = purchases.length

    // Get purchases by day
    const purchasesByDay = await prisma.purchase.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      _count: true
    })

    // Get top videos
    const topVideos = await prisma.video.findMany({
      include: {
        _count: {
          select: {
            purchases: true
          }
        }
      },
      orderBy: {
        purchases: {
          _count: 'desc'
        }
      },
      take: 10
    })

    // Get viewer demographics (mock data for now)
    const viewerDemographics = {
      deviceTypes: [
        { type: 'Desktop', count: Math.floor(Math.random() * 1000) },
        { type: 'Mobile', count: Math.floor(Math.random() * 1000) },
        { type: 'Tablet', count: Math.floor(Math.random() * 100) }
      ],
      countries: [
        { country: 'US', count: Math.floor(Math.random() * 1000) },
        { country: 'UK', count: Math.floor(Math.random() * 500) },
        { country: 'CA', count: Math.floor(Math.random() * 300) }
      ]
    }

    // Get revenue breakdown (mock data for now)
    const revenueBreakdown = {
      subscription: Math.floor(Math.random() * 10000),
      oneTime: Math.floor(Math.random() * 5000),
      refunded: Math.floor(Math.random() * 1000)
    }

    // Get peak viewing times (mock data for now)
    const peakViewingTimes = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      views: Math.floor(Math.random() * 1000)
    }))

    // Get previous period comparison (mock data for now)
    const previousPeriodComparison = {
      views: Math.floor(Math.random() * 10000),
      revenue: Math.floor(Math.random() * 5000),
      purchases: Math.floor(Math.random() * 1000),
      watchTime: Math.floor(Math.random() * 100)
    }

    const analytics: Analytics = {
      totalViews: Math.floor(Math.random() * 10000), // Mock data for now
      totalRevenue,
      totalPurchases,
      averageWatchTime: 45,
      completionRate: 75,
      viewsByDay: purchasesByDay.map((day: any) => ({
        date: format(day.createdAt, 'yyyy-MM-dd'),
        views: day._count
      })),
      revenueByDay: purchasesByDay.map((day: any) => ({
        date: format(day.createdAt, 'yyyy-MM-dd'),
        revenue: Math.floor(Math.random() * 1000),
        subscriptionRevenue: Math.floor(Math.random() * 1000),
        oneTimeRevenue: Math.floor(Math.random() * 500)
      })),
      topVideos: topVideos.map((video: any) => ({
        id: video.id,
        title: video.title,
        views: Math.floor(Math.random() * 1000), // Mock data for now
        revenue: video._count.purchases * video.price,
        completionRate: Math.floor(Math.random() * 100),
        revenuePerView: video._count.purchases * video.price / (Math.floor(Math.random() * 1000) || 1)
      })),
      viewerDemographics,
      revenueBreakdown,
      peakViewingTimes,
      previousPeriodComparison
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 