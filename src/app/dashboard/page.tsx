"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TenantSwitcher } from "@/components/navigation/tenant-switcher"

interface DashboardStats {
  totalAnimals: number
  healthyAnimals: number
  sickAnimals: number
  pregnantAnimals: number
  totalMilkProduction: number
  averageMilkPerAnimal: number
  recentHealthEvents: number
  upcomingVaccinations: number
}

interface RecentActivity {
  id: string
  type: 'health' | 'milk' | 'reproduction' | 'measurement'
  message: string
  timestamp: string
  animalId?: string
  animalTag?: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [currentContext, setCurrentContext] = useState({
    tenantId: "",
    companyId: "",
    farmId: ""
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (currentContext.farmId) {
      fetchDashboardData()
    }
  }, [currentContext])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard statistics
      const statsResponse = await fetch(`/api/analytics/dashboard?farmId=${currentContext.farmId}`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch recent activity
      const activityResponse = await fetch(`/api/analytics/activity?farmId=${currentContext.farmId}&limit=10`)
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData.activities)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleContextChange = (context: any) => {
    setCurrentContext(context)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600">Loading AllCattle Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const getHealthStatusColor = (percentage: number) => {
    if (percentage >= 95) return "text-green-600"
    if (percentage >= 80) return "text-yellow-600"
    return "text-red-600"
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'health': return '🏥'
      case 'milk': return '🥛'
      case 'reproduction': return '🐄'
      case 'measurement': return '📏'
      default: return '📊'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🐄</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">AllCattle Dashboard</h1>
                  <p className="text-sm text-gray-500">Real-time farm management & analytics</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.push("/reports")}
                className="flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Reports</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/analytics")}
                className="flex items-center space-x-2"
              >
                <span>📈</span>
                <span>Analytics</span>
              </Button>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  Welcome, {session.user.name}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
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
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-4xl">
              🏡
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a Farm to Continue</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Please select a tenant, company, and farm from the context switcher above to view your dashboard analytics.
            </p>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            {loading ? (
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
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Animals */}
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Animals</CardTitle>
                    <div className="text-2xl">🐄</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{stats.totalAnimals}</div>
                    <p className="text-xs text-muted-foreground">Active livestock</p>
                  </CardContent>
                </Card>

                {/* Health Status */}
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Health Status</CardTitle>
                    <div className="text-2xl">💚</div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${getHealthStatusColor((stats.healthyAnimals / stats.totalAnimals) * 100)}`}>
                      {stats.totalAnimals > 0 ? Math.round((stats.healthyAnimals / stats.totalAnimals) * 100) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.healthyAnimals} healthy, {stats.sickAnimals} need attention
                    </p>
                  </CardContent>
                </Card>

                {/* Milk Production */}
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Daily Milk</CardTitle>
                    <div className="text-2xl">🥛</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{stats.totalMilkProduction}L</div>
                    <p className="text-xs text-muted-foreground">
                      Avg: {stats.averageMilkPerAnimal}L per animal
                    </p>
                  </CardContent>
                </Card>

                {/* Pregnancy Status */}
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pregnancies</CardTitle>
                    <div className="text-2xl">🤰</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">{stats.pregnantAnimals}</div>
                    <p className="text-xs text-muted-foreground">Currently pregnant</p>
                  </CardContent>
                </Card>

                {/* Recent Health Events */}
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Health Events</CardTitle>
                    <div className="text-2xl">🏥</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">{stats.recentHealthEvents}</div>
                    <p className="text-xs text-muted-foreground">Last 7 days</p>
                  </CardContent>
                </Card>

                {/* Upcoming Vaccinations */}
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vaccinations Due</CardTitle>
                    <div className="text-2xl">💉</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{stats.upcomingVaccinations}</div>
                    <p className="text-xs text-muted-foreground">Next 30 days</p>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                    <div className="text-2xl">⚡</div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => router.push('/animals')}
                    >
                      Manage Animals
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push('/health')}
                    >
                      Health Records
                    </Button>
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card className="hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Status</CardTitle>
                    <div className="text-2xl">🟢</div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                        All Systems Operational
                      </Badge>
                      <p className="text-xs text-muted-foreground">Last sync: Just now</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Activity Feed */}
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>📊</span>
                    <span>Recent Activity</span>
                  </CardTitle>
                  <CardDescription>Latest farm operations and events</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                            {activity.animalTag && (
                              <Badge variant="outline" className="mt-1">
                                Tag: {activity.animalTag}
                              </Badge>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📋</div>
                      <p>No recent activity to display</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats & Actions */}
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>⚡</span>
                    <span>Quick Insights</span>
                  </CardTitle>
                  <CardDescription>Key metrics and actionable insights</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Health Alerts */}
                  {stats && stats.sickAnimals > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xl">🚨</span>
                        <h4 className="font-semibold text-red-800">Health Alert</h4>
                      </div>
                      <p className="text-sm text-red-700 mb-3">
                        {stats.sickAnimals} animal{stats.sickAnimals > 1 ? 's' : ''} need medical attention
                      </p>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        View Health Records
                      </Button>
                    </div>
                  )}

                  {/* Vaccination Reminders */}
                  {stats && stats.upcomingVaccinations > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xl">💉</span>
                        <h4 className="font-semibold text-yellow-800">Vaccination Due</h4>
                      </div>
                      <p className="text-sm text-yellow-700 mb-3">
                        {stats.upcomingVaccinations} animal{stats.upcomingVaccinations > 1 ? 's' : ''} need vaccination in the next 30 days
                      </p>
                      <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                        Schedule Vaccinations
                      </Button>
                    </div>
                  )}

                  {/* Productivity Insights */}
                  {stats && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xl">📈</span>
                        <h4 className="font-semibold text-blue-800">Productivity Insight</h4>
                      </div>
                      <p className="text-sm text-blue-700 mb-3">
                        Average milk production: {stats.averageMilkPerAnimal}L per animal per day
                      </p>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        View Detailed Analytics
                      </Button>
                    </div>
                  )}

                  {/* Farm Performance */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {stats ? Math.round((stats.healthyAnimals / stats.totalAnimals) * 100) : 0}%
                      </div>
                      <div className="text-xs text-green-700">Health Score</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats ? stats.pregnantAnimals : 0}
                      </div>
                      <div className="text-xs text-purple-700">Pregnancies</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
              </span>
              <Button variant="outline" onClick={() => router.push("/api/auth/signout")}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Tenant Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  🏢 Tenant Management
                </CardTitle>
                <CardDescription>
                  Manage your tenants and their configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Manage Tenants
                </Button>
              </CardContent>
            </Card>

            {/* Company Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  🏭 Company Management
                </CardTitle>
                <CardDescription>
                  Manage companies within your tenant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Manage Companies
                </Button>
              </CardContent>
            </Card>

            {/* Farm Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  🚜 Farm Management
                </CardTitle>
                <CardDescription>
                  Manage farms and their operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Manage Farms
                </Button>
              </CardContent>
            </Card>

            {/* Animal Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  🐄 Animal Management
                </CardTitle>
                <CardDescription>
                  Track and manage your livestock
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  View Animals
                </Button>
              </CardContent>
            </Card>

            {/* Health Records */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  🏥 Health Records
                </CardTitle>
                <CardDescription>
                  Monitor animal health and treatments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Health Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Production Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  📊 Production Analytics
                </CardTitle>
                <CardDescription>
                  Analyze farm production and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  View Analytics
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* Quick Stats */}
          <div className="mt-8">
            <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Overview
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">🐄</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Animals
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          248
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">🏥</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Health Alerts
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          3
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">🥛</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Daily Milk (L)
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          1,247
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">🚜</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Farms
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          12
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
