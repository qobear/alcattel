"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TenantSwitcher } from "@/components/navigation/tenant-switcher"

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

  useEffect(() => {
    if (currentContext.farmId) {
      fetchAnalytics()
      // Set up real-time updates every 30 seconds
      intervalRef.current = setInterval(fetchAnalytics, 30000)
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [currentContext, timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Mock data for demonstration - replace with actual API call
      const mockData: AnalyticsData = {
        productivity: {
          milkProduction: { current: 1250, trend: 12.5, chartData: [] },
          animalHealth: { healthy: 142, total: 150, trend: 3.2 },
          reproductionRate: { current: 85.5, trend: -1.8 },
          feedEfficiency: { current: 1.42, trend: 5.7 }
        },
        insights: {
          topPerformers: [
            { tagNumber: "C001", breed: "Holstein", milkYield: 45 },
            { tagNumber: "C023", breed: "Jersey", milkYield: 42 },
            { tagNumber: "C067", breed: "Holstein", milkYield: 38 }
          ],
          healthAlerts: [
            { tagNumber: "C045", condition: "Mastitis suspected" },
            { tagNumber: "C089", condition: "Low milk production" }
          ],
          milkTrends: [],
          reproductionInsights: []
        },
        comparisons: {
          monthlyComparison: [],
          farmComparison: [],
          industryBenchmark: []
        }
      }
      
      setAnalyticsData(mockData)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleContextChange = (context: any) => {
    setCurrentContext(context)
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return "📈"
    if (trend < 0) return "📉"
    return "➡️"
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-green-600"
    if (trend < 0) return "text-red-600"
    return "text-gray-600"
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600">Loading Analytics Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
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
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
                  <p className="text-sm text-gray-500">Real-time insights and predictive analytics</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
              <Button 
                variant="outline" 
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2"
              >
                <span>🏠</span>
                <span>Dashboard</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/reports")}
                className="flex items-center space-x-2"
              >
                <span>📑</span>
                <span>Reports</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Context Switcher */}
        <div className="mb-8">
          <TenantSwitcher
            currentTenant={currentContext.tenantId}
            currentCompany={currentContext.companyId}
            currentFarm={currentContext.farmId}
            onContextChange={handleContextChange}
          />
        </div>

        {!currentContext.farmId ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-4xl">
              📊
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a Farm for Analytics</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Please select a tenant, company, and farm from the context switcher above to view detailed analytics and insights.
            </p>
          </div>
        ) : (
          <>
            {loading && !analyticsData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="space-y-0 pb-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4 mt-2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : analyticsData ? (
              <>
                {/* Real-time Status Indicator */}
                <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-800 font-medium">Real-time Analytics Active</span>
                        <Badge variant="outline" className="bg-green-100 text-green-700">
                          Live Data
                        </Badge>
                      </div>
                      <div className="text-sm text-green-600">
                        Last updated: {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Performance Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Milk Production */}
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Milk Production</CardTitle>
                      <div className="text-2xl">🥛</div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        {analyticsData.productivity.milkProduction.current}L
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className={getTrendColor(analyticsData.productivity.milkProduction.trend)}>
                          {getTrendIcon(analyticsData.productivity.milkProduction.trend)}
                          {Math.abs(analyticsData.productivity.milkProduction.trend)}%
                        </span>
                        <span className="text-muted-foreground">vs last period</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Animal Health Score */}
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                      <div className="text-2xl">💚</div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {Math.round((analyticsData.productivity.animalHealth.healthy / analyticsData.productivity.animalHealth.total) * 100)}%
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className={getTrendColor(analyticsData.productivity.animalHealth.trend)}>
                          {getTrendIcon(analyticsData.productivity.animalHealth.trend)}
                          {Math.abs(analyticsData.productivity.animalHealth.trend)}%
                        </span>
                        <span className="text-muted-foreground">
                          {analyticsData.productivity.animalHealth.healthy}/{analyticsData.productivity.animalHealth.total} healthy
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reproduction Rate */}
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Reproduction Rate</CardTitle>
                      <div className="text-2xl">🤰</div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">
                        {analyticsData.productivity.reproductionRate.current}%
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className={getTrendColor(analyticsData.productivity.reproductionRate.trend)}>
                          {getTrendIcon(analyticsData.productivity.reproductionRate.trend)}
                          {Math.abs(analyticsData.productivity.reproductionRate.trend)}%
                        </span>
                        <span className="text-muted-foreground">conception rate</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Feed Efficiency */}
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Feed Efficiency</CardTitle>
                      <div className="text-2xl">🌾</div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">
                        {analyticsData.productivity.feedEfficiency.current}
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className={getTrendColor(analyticsData.productivity.feedEfficiency.trend)}>
                          {getTrendIcon(analyticsData.productivity.feedEfficiency.trend)}
                          {Math.abs(analyticsData.productivity.feedEfficiency.trend)}%
                        </span>
                        <span className="text-muted-foreground">kg milk/kg feed</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Insights and Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Top Performers */}
                  <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span>🏆</span>
                        <span>Top Performers</span>
                      </CardTitle>
                      <CardDescription>Animals with exceptional productivity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.insights.topPerformers.map((animal, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium">Tag: {animal.tagNumber}</div>
                                <div className="text-sm text-gray-600">{animal.breed}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">{animal.milkYield}L</div>
                              <div className="text-xs text-gray-500">daily avg</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Health Alerts */}
                  <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span>🚨</span>
                        <span>Health Alerts</span>
                        {analyticsData.insights.healthAlerts.length > 0 && (
                          <Badge variant="destructive">
                            {analyticsData.insights.healthAlerts.length}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>Animals requiring immediate attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analyticsData.insights.healthAlerts.length > 0 ? (
                        <div className="space-y-4">
                          {analyticsData.insights.healthAlerts.map((alert, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-xl">
                                  🚨
                                </div>
                                <div>
                                  <div className="font-medium">Tag: {alert.tagNumber}</div>
                                  <div className="text-sm text-red-600">{alert.condition}</div>
                                </div>
                              </div>
                              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                                Take Action
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-4xl mb-2">✅</div>
                          <p>No health alerts - all animals are healthy!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Advanced Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Milk Production Trends */}
                  <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span>📈</span>
                        <span>Milk Production Trends</span>
                      </CardTitle>
                      <CardDescription>Daily milk production over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <div className="text-4xl mb-2">📊</div>
                          <p>Interactive chart visualization</p>
                          <p className="text-sm">Real-time milk production data</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reproduction Insights */}
                  <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span>🔄</span>
                        <span>Reproduction Insights</span>
                      </CardTitle>
                      <CardDescription>Breeding performance and projections</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {analyticsData.productivity.reproductionRate.current}%
                            </div>
                            <div className="text-sm text-purple-700">Conception Rate</div>
                          </div>
                          <div className="text-center p-4 bg-pink-50 rounded-lg">
                            <div className="text-2xl font-bold text-pink-600">12</div>
                            <div className="text-sm text-pink-700">Expected Births</div>
                          </div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">Breeding Recommendations</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Optimal breeding window: Next 2 weeks</li>
                            <li>• Consider AI for top performers</li>
                            <li>• Monitor estrus cycles closely</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
