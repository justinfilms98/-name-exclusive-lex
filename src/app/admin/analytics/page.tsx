'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Download, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { format } from 'date-fns'
import { DateRangePicker } from '@/components/ui/date-range-picker'

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

const COLORS = ['#2E4A2E', '#4A7C4A', '#6BAE6B', '#8CDE8C']

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  })

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange, dateRange])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (dateRange) {
        params.append('startDate', dateRange.from.toISOString())
        params.append('endDate', dateRange.to.toISOString())
      } else {
        params.append('range', timeRange)
      }
      const response = await fetch(`/api/admin/analytics?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!analytics) return

    const headers = [
      'Metric',
      'Current Period',
      'Previous Period',
      'Change'
    ]

    const rows = [
      ['Total Views', analytics.totalViews, analytics.previousPeriodComparison.views],
      ['Total Revenue', analytics.totalRevenue, analytics.previousPeriodComparison.revenue],
      ['Total Purchases', analytics.totalPurchases, analytics.previousPeriodComparison.purchases],
      ['Average Watch Time', analytics.averageWatchTime, analytics.previousPeriodComparison.watchTime]
    ]

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 100
    return ((current - previous) / previous) * 100
  }

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <div className="flex flex-col md:flex-row gap-4">
            <DateRangePicker
              value={dateRange}
              onChange={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({ from: range.from, to: range.to })
                } else {
                  setDateRange(null)
                }
              }}
            />
            <Button
              variant="outline"
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              onClick={() => {
                setDateRange({
                  from: new Date(new Date().setDate(new Date().getDate() - 30)),
                  to: new Date()
                })
              }}
            >
              Last 30 Days
            </Button>
            <Button onClick={exportToCSV} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Views</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold mt-2">{analytics.totalViews}</p>
              {calculateChange(analytics.totalViews, analytics.previousPeriodComparison.views) > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold mt-2">${analytics.totalRevenue}</p>
              {calculateChange(analytics.totalRevenue, analytics.previousPeriodComparison.revenue) > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Purchases</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold mt-2">{analytics.totalPurchases}</p>
              {calculateChange(analytics.totalPurchases, analytics.previousPeriodComparison.purchases) > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Avg. Watch Time</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold mt-2">
                {Math.round(analytics.averageWatchTime)} min
              </p>
              {calculateChange(analytics.averageWatchTime, analytics.previousPeriodComparison.watchTime) > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Views Over Time</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.viewsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#2E4A2E"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#2E4A2E" />
                  <Bar dataKey="subscriptionRevenue" fill="#4A7C4A" />
                  <Bar dataKey="oneTimeRevenue" fill="#6BAE6B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Viewer Demographics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Device Types</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.viewerDemographics.deviceTypes}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {analytics.viewerDemographics.deviceTypes.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Top Countries</h4>
                <div className="space-y-2">
                  {analytics.viewerDemographics.countries
                    .sort((a: any, b: any) => b.count - a.count)
                    .slice(0, 5)
                    .map((country: any) => (
                      <div key={country.country} className="flex justify-between items-center">
                        <span>{country.country}</span>
                        <span className="font-medium">{country.count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Subscription', value: analytics.revenueBreakdown.subscription },
                      { name: 'One-time', value: analytics.revenueBreakdown.oneTime },
                      { name: 'Refunded', value: analytics.revenueBreakdown.refunded }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performing Videos</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Title</th>
                  <th className="text-right py-2">Views</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">Completion Rate</th>
                  <th className="text-right py-2">Revenue/View</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topVideos.map((video: any) => (
                  <tr key={video.id} className="border-b">
                    <td className="py-2">{video.title}</td>
                    <td className="text-right py-2">{video.views}</td>
                    <td className="text-right py-2">${video.revenue}</td>
                    <td className="text-right py-2">{video.completionRate.toFixed(1)}%</td>
                    <td className="text-right py-2">${video.revenuePerView.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Peak Viewing Times</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.peakViewingTimes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#2E4A2E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
} 