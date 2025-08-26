"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TenantSwitcher } from "@/components/navigation/tenant-switcher"
import { NotificationSystem } from "@/components/notifications/notification-system"

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
  }, [currentContext.farmId])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard stats
      const statsResponse = await fetch(`/api/analytics/dashboard?farmId=${currentContext.farmId}`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch recent activity
      const activityResponse = await fetch(`/api/analytics/activity?farmId=${currentContext.farmId}`)
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData.activities || [])
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-3xl">🐄</span>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  AllCattle Farm
                </h1>
              </div>
            </div>
            
            {/* Tenant Switcher */}
            <div className="flex items-center space-x-4">
              <NotificationSystem />
              <TenantSwitcher 
                currentContext={currentContext}
                onContextChange={setCurrentContext}
              />
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Welcome, {session.user?.name || session.user?.email}
                </span>
                <Button variant="outline" onClick={() => router.push("/api/auth/signout")}>
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {!currentContext.farmId ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏢</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to AllCattle Farm Management
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Select a tenant, company, and farm from the switcher above to start managing your livestock operations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="text-center p-6">
                  <div className="text-4xl mb-3">🏢</div>
                  <h3 className="font-semibold mb-2">Multi-Tenant</h3>
                  <p className="text-sm text-gray-600">Manage multiple organizations</p>
                </Card>
                <Card className="text-center p-6">
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="font-semibold mb-2">Analytics</h3>
                  <p className="text-sm text-gray-600">Real-time farm insights</p>
                </Card>
                <Card className="text-center p-6">
                  <div className="text-4xl mb-3">🐄</div>
                  <h3 className="font-semibold mb-2">Livestock</h3>
                  <p className="text-sm text-gray-600">Complete animal management</p>
                </Card>
              </div>
            </div>
          ) : (
            <>
              {/* Quick Stats Cards */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  {[1,2,3,4].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">Total Animals</p>
                          <p className="text-3xl font-bold">{stats.totalAnimals}</p>
                        </div>
                        <div className="text-4xl opacity-80">🐄</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium">Healthy Animals</p>
                          <p className="text-3xl font-bold">{stats.healthyAnimals}</p>
                        </div>
                        <div className="text-4xl opacity-80">💚</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm font-medium">Pregnant</p>
                          <p className="text-3xl font-bold">{stats.pregnantAnimals}</p>
                        </div>
                        <div className="text-4xl opacity-80">🤱</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm font-medium">Today's Milk</p>
                          <p className="text-3xl font-bold">{stats.totalMilkProduction.toFixed(0)}L</p>
                        </div>
                        <div className="text-4xl opacity-80">🥛</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Management Cards */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                
                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center text-blue-700">
                      🐄 Animal Management
                    </CardTitle>
                    <CardDescription>
                      View and manage your animal records
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700" 
                      onClick={() => router.push("/animals")}
                    >
                      Manage Animals
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-700">
                      🏥 Health Management
                    </CardTitle>
                    <CardDescription>
                      Track animal health and medical records
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Health Records
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center text-purple-700">
                      📊 Analytics
                    </CardTitle>
                    <CardDescription>
                      View detailed analytics and reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => router.push("/analytics")}
                    >
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
                  <CardHeader>
                    <CardTitle className="flex items-center text-orange-700">
                      🥛 Milk Production
                    </CardTitle>
                    <CardDescription>
                      Record and track milk production
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      Milk Records
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-pink-500">
                  <CardHeader>
                    <CardTitle className="flex items-center text-pink-700">
                      🤱 Reproduction
                    </CardTitle>
                    <CardDescription>
                      Track breeding and pregnancy status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-pink-600 hover:bg-pink-700">
                      Breeding Records
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-teal-500">
                  <CardHeader>
                    <CardTitle className="flex items-center text-teal-700">
                      📝 Reports
                    </CardTitle>
                    <CardDescription>
                      Generate comprehensive reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      onClick={() => router.push("/reports")}
                    >
                      View Reports
                    </Button>
                  </CardContent>
                </Card>

              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest updates from your farm
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0">
                            {activity.type === 'health' && (
                              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-red-600">🏥</span>
                              </div>
                            )}
                            {activity.type === 'milk' && (
                              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600">🥛</span>
                              </div>
                            )}
                            {activity.type === 'reproduction' && (
                              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600">🤱</span>
                              </div>
                            )}
                            {activity.type === 'measurement' && (
                              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                <span className="text-yellow-600">📏</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.message}
                            </p>
                            <p className="text-sm text-gray-500">
                              {activity.animalTag && `Animal: ${activity.animalTag} • `}
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <Badge 
                              variant={
                                activity.type === 'health' ? 'destructive' :
                                activity.type === 'milk' ? 'default' :
                                activity.type === 'reproduction' ? 'secondary' : 'outline'
                              }
                            >
                              {activity.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">📝</div>
                      <p>No recent activity found.</p>
                      <p className="text-sm">Start by adding animals or recording data.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

            </>
          )}
        </div>
      </main>
    </div>
  )
}
