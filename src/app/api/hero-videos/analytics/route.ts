import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId, event, data } = await req.json();

    if (!videoId || !event) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the current date in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Find or create analytics record for today
    let analytics = await prisma.videoAnalytics.findFirst({
      where: {
        videoId,
        date: today
      }
    });

    if (!analytics) {
      analytics = await prisma.videoAnalytics.create({
        data: {
          videoId,
          date: today,
          views: 0,
          uniqueViews: 0,
          watchTime: 0,
          likes: 0,
          shares: 0,
          comments: 0,
          revenue: 0,
          country: data?.country,
          device: data?.device,
          referrer: data?.referrer
        }
      });
    }

    // Update analytics based on event type
    switch (event) {
      case 'view':
        await prisma.videoAnalytics.update({
          where: { id: analytics.id },
          data: {
            views: { increment: 1 },
            uniqueViews: data?.isUnique ? { increment: 1 } : undefined,
            country: data?.country || analytics.country,
            device: data?.device || analytics.device,
            referrer: data?.referrer || analytics.referrer
          }
        });
        break;

      case 'watch_time':
        await prisma.videoAnalytics.update({
          where: { id: analytics.id },
          data: {
            watchTime: { increment: data?.seconds || 0 }
          }
        });
        break;

      case 'like':
        await prisma.videoAnalytics.update({
          where: { id: analytics.id },
          data: {
            likes: { increment: 1 }
          }
        });
        break;

      case 'share':
        await prisma.videoAnalytics.update({
          where: { id: analytics.id },
          data: {
            shares: { increment: 1 }
          }
        });
        break;

      case 'comment':
        await prisma.videoAnalytics.update({
          where: { id: analytics.id },
          data: {
            comments: { increment: 1 }
          }
        });
        break;

      case 'purchase':
        await prisma.videoAnalytics.update({
          where: { id: analytics.id },
          data: {
            revenue: { increment: data?.amount || 0 }
          }
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const days = searchParams.get('days');

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId parameter' }, { status: 400 });
    }

    let dateFilter = {};
    if (days) {
      const daysNum = parseInt(days, 10);
      if (!isNaN(daysNum) && daysNum > 0) {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - daysNum);
        dateFilter = { gte: start, lte: now };
      }
    } else if (startDate && endDate) {
      dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const where = {
      videoId: parseInt(videoId),
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
    };

    const analytics = await prisma.videoAnalytics.findMany({
      where,
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate aggregated metrics
    const aggregated = analytics.reduce((acc, curr) => ({
      totalViews: acc.totalViews + curr.views,
      totalUniqueViews: acc.totalUniqueViews + curr.uniqueViews,
      totalWatchTime: acc.totalWatchTime + curr.watchTime,
      totalLikes: acc.totalLikes + curr.likes,
      totalShares: acc.totalShares + curr.shares,
      totalComments: acc.totalComments + curr.comments,
      totalRevenue: acc.totalRevenue + curr.revenue
    }), {
      totalViews: 0,
      totalUniqueViews: 0,
      totalWatchTime: 0,
      totalLikes: 0,
      totalShares: 0,
      totalComments: 0,
      totalRevenue: 0
    });

    return NextResponse.json({
      analytics,
      aggregated,
      timeRange: {
        start: startDate ? new Date(startDate) : null,
        end: endDate ? new Date(endDate) : null
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 