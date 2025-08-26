"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TenantSwitcher } from "@/components/navigation/tenant-switcher"
import { AdvancedAnalyticsDashboard } from "@/components/analytics/advanced-analytics-dashboard"
import { BarChart3, TrendingUp, Activity, Brain } from "lucide-react"

interface AnalyticsData {
  productivity: {
    milkProduction: { current: number; trend: number; chartData: any[] }
    animalHealth: { healthy: number; total: number; trend: number }
    reproductionRate: { current: number; trend: number }
    feedEfficiency: { current: number; trend: number }
  }
  insights: {
    topPerformers: any[]
    healthAlerts: any[]
    milkTrends: any[]
    reproductionInsights: any[]
  }
  comparisons: {
    monthlyComparison: any[]
    farmComparison: any[]
    industryBenchmark: any[]
  }
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentContext, setCurrentContext] = useState({
    tenantId: "",
    companyId: "",
    farmId: ""
  })
  const [timeRange, setTimeRange] = useState("30d")
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const fetchAnalytics = async () => {
    if (!currentContext.tenantId || !currentContext.farmId) {
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        tenantId: currentContext.tenantId,
        companyId: currentContext.companyId,
        farmId: currentContext.farmId,
        timeRange
      })

      const response = await fetch(`/api/analytics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleContextChange = (context: any) => {
    setCurrentContext(context)
  }

  useEffect(() => {
    if (currentContext.tenantId && currentContext.farmId) {
      fetchAnalytics()
      
      // Set up periodic refresh
      intervalRef.current = setInterval(fetchAnalytics, 30000) // 30 seconds
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [currentContext, timeRange])

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return "📈"
    if (trend < 0) return "📉"
    return "➡️"
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">AI-Powered Analytics</h1>
                  <p className="text-gray-600">Advanced insights and predictions for your farm</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <TenantSwitcher onContextChange={handleContextChange} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="advanced" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="advanced" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>AI Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="traditional" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Traditional Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="advanced">
            <AdvancedAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="traditional">
            {/* Traditional Analytics Content */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : analyticsData ? (
              <div className="space-y-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">Milk Production</p>
                          <p className="text-3xl font-bold">
                            {analyticsData.productivity.milkProduction.current}L
                          </p>
                          <p className="text-blue-100 text-sm mt-1">
                            {getTrendIcon(analyticsData.productivity.milkProduction.trend)} 
                            {Math.abs(analyticsData.productivity.milkProduction.trend)}% vs last month
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium">Animal Health</p>
                          <p className="text-3xl font-bold">
                            {Math.round((analyticsData.productivity.animalHealth.healthy / analyticsData.productivity.animalHealth.total) * 100)}%
                          </p>
                          <p className="text-green-100 text-sm mt-1">
                            {analyticsData.productivity.animalHealth.healthy}/{analyticsData.productivity.animalHealth.total} animals healthy
                          </p>
                        </div>
                        <Activity className="h-8 w-8 text-green-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm font-medium">Reproduction Rate</p>
                          <p className="text-3xl font-bold">
                            {analyticsData.productivity.reproductionRate.current}%
                          </p>
                          <p className="text-purple-100 text-sm mt-1">
                            {getTrendIcon(analyticsData.productivity.reproductionRate.trend)} 
                            {Math.abs(analyticsData.productivity.reproductionRate.trend)}% vs last period
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm font-medium">Feed Efficiency</p>
                          <p className="text-3xl font-bold">
                            {analyticsData.productivity.feedEfficiency.current}
                          </p>
                          <p className="text-orange-100 text-sm mt-1">
                            {getTrendIcon(analyticsData.productivity.feedEfficiency.trend)} 
                            {Math.abs(analyticsData.productivity.feedEfficiency.trend)}% vs target
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-orange-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional traditional analytics content would go here */}
                <Card>
                  <CardHeader>
                    <CardTitle>Traditional Farm Analytics</CardTitle>
                    <CardDescription>
                      Historical data analysis and basic reporting metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Traditional analytics features including historical charts, 
                      basic reports, and standard farm metrics will be displayed here.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
                  <p className="text-gray-500 mb-4">Unable to load analytics data</p>
                  <Button onClick={fetchAnalytics}>Retry</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
