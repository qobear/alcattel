'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Heart, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Bell,
  BarChart3,
  PieChart,
  Target
} from 'lucide-react'

interface AnalyticsData {
  healthPredictions: {
    animalId: string
    tagNumber: string
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    riskFactor: string
    prediction: string
    confidence: number
    recommendedAction: string
  }[]
  productionForecasts: {
    nextWeek: number
    nextMonth: number
    trend: 'INCREASING' | 'DECREASING' | 'STABLE'
    factors: string[]
  }
  breedingOptimization: {
    readyForBreeding: number
    pregnancyRate: number
    expectedCalving: {
      animalId: string
      tagNumber: string
      expectedDate: string
      daysRemaining: number
    }[]
    breedingRecommendations: {
      animalId: string
      tagNumber: string
      reason: string
      optimalWindow: string
    }[]
  }
  alerts: {
    id: string
    type: 'HEALTH' | 'BREEDING' | 'PRODUCTION' | 'MAINTENANCE'
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    message: string
    animalId?: string
    tagNumber?: string
    timestamp: string
    isRead: boolean
  }[]
}

export function AdvancedAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('predictions')

  useEffect(() => {
    fetchAdvancedAnalytics()
  }, [])

  const fetchAdvancedAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/analytics/advanced')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching advanced analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAlertAsRead = async (alertId: string) => {
    try {
      await fetch(`/api/analytics/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })
      fetchAdvancedAnalytics()
    } catch (error) {
      console.error('Error marking alert as read:', error)
    }
  }

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800' 
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to load analytics</h3>
          <p className="text-gray-500 mb-4">There was an error loading the advanced analytics data.</p>
          <Button onClick={fetchAdvancedAnalytics}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  const unreadAlerts = analytics.alerts.filter(alert => !alert.isRead)
  const criticalAlerts = analytics.alerts.filter(alert => alert.severity === 'CRITICAL')

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Health Predictions</p>
                <p className="text-2xl font-bold">
                  {analytics.healthPredictions.filter(p => p.riskLevel === 'HIGH').length}
                </p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              High-risk animals identified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Production Forecast</p>
                <p className="text-2xl font-bold flex items-center">
                  {analytics.productionForecasts.nextWeek}L
                  {analytics.productionForecasts.trend === 'INCREASING' ? (
                    <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
                  ) : analytics.productionForecasts.trend === 'DECREASING' ? (
                    <TrendingDown className="h-4 w-4 text-red-500 ml-1" />
                  ) : null}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Expected next week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Breeding Ready</p>
                <p className="text-2xl font-bold">
                  {analytics.breedingOptimization.readyForBreeding}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Animals ready for breeding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">
                  {unreadAlerts.length}
                </p>
              </div>
              <Bell className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {criticalAlerts.length} critical alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">
                {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''} Require Immediate Attention
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictions">Health Predictions</TabsTrigger>
          <TabsTrigger value="production">Production Forecast</TabsTrigger>
          <TabsTrigger value="breeding">Breeding Optimization</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Health Predictions</CardTitle>
              <CardDescription>
                Machine learning analysis of animal health patterns and risk factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.healthPredictions.map((prediction) => (
                  <div key={prediction.animalId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">#{prediction.tagNumber}</span>
                        <Badge className={getRiskBadgeColor(prediction.riskLevel)}>
                          {prediction.riskLevel} RISK
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {prediction.confidence}% confidence
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Risk Factor:</span> {prediction.riskFactor}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Prediction:</span> {prediction.prediction}
                      </p>
                      <p className="text-sm text-blue-600">
                        <span className="font-medium">Recommended Action:</span> {prediction.recommendedAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Milk Production Forecast</CardTitle>
                <CardDescription>Predicted production based on historical data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Next Week</span>
                    <span className="text-2xl font-bold">
                      {analytics.productionForecasts.nextWeek}L
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Next Month</span>
                    <span className="text-2xl font-bold">
                      {analytics.productionForecasts.nextMonth}L
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Trend</span>
                    <div className="flex items-center space-x-2">
                      <Badge className={
                        analytics.productionForecasts.trend === 'INCREASING' 
                          ? 'bg-green-100 text-green-800'
                          : analytics.productionForecasts.trend === 'DECREASING'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }>
                        {analytics.productionForecasts.trend}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contributing Factors</CardTitle>
                <CardDescription>Key factors affecting production forecast</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.productionForecasts.factors.map((factor, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{factor}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breeding" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Expected Calvings</CardTitle>
                <CardDescription>Upcoming births based on pregnancy tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.breedingOptimization.expectedCalving.map((calving) => (
                    <div key={calving.animalId} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <span className="font-medium">#{calving.tagNumber}</span>
                        <p className="text-sm text-gray-500">
                          Expected: {new Date(calving.expectedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {calving.daysRemaining} days
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Breeding Recommendations</CardTitle>
                <CardDescription>AI-optimized breeding suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.breedingOptimization.breedingRecommendations.map((rec) => (
                    <div key={rec.animalId} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">#{rec.tagNumber}</span>
                        <Badge className="bg-green-100 text-green-800">
                          {rec.optimalWindow}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{rec.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Alerts & Notifications</CardTitle>
              <CardDescription>
                System-generated alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`border rounded-lg p-4 ${alert.isRead ? 'bg-gray-50' : 'bg-white border-l-4 border-l-blue-500'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getSeverityBadgeColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">
                            {alert.type}
                          </Badge>
                          {alert.tagNumber && (
                            <span className="text-sm font-medium">#{alert.tagNumber}</span>
                          )}
                        </div>
                        <p className="text-sm mb-2">{alert.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!alert.isRead && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markAlertAsRead(alert.id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
