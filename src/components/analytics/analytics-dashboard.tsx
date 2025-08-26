'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Heart, 
  Baby, 
  Milk, 
  Scale,
  AlertTriangle,
  Info,
  Calendar,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalAnimals: number;
    femaleAnimals: number;
    dairyAnimals: number;
    pregnantAnimals: number;
    animalsBySpecies: { species: string; count: number }[];
    animalsBySex: { sex: string; count: number }[];
    animalsByStatus: { status: string; count: number }[];
  };
  health: {
    totalEvents: number;
    overdueEvents: number;
    eventsByType: { type: string; count: number }[];
    eventsByStatus: { status: string; count: number }[];
  };
  reproduction: {
    femaleAnimals: number;
    pregnantAnimals: number;
    pregnancyRate: string;
    usgResults: { result: string; count: number }[];
  };
  production: {
    dairyAnimals: number;
    totalRecords: number;
    avgDailyYield: string;
    totalProduction: string;
    trend: { date: string; totalYield: string }[];
  };
  measurements: {
    totalRecords: number;
    avgWeight: string;
    avgHeight: string;
    avgBodyLength: string;
    weightTrend: any[];
  };
  recentActivity: {
    healthEvents: any[];
    measurements: any[];
  };
  alerts: {
    type: string;
    category: string;
    message: string;
    count?: number;
    details?: string;
  }[];
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

interface AnalyticsDashboardProps {
  farmId?: string;
  companyId?: string;
}

export function AnalyticsDashboard({ farmId, companyId }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ period });
      if (farmId) params.append('farmId', farmId);
      if (companyId) params.append('companyId', companyId);

      const response = await fetch(`/api/analytics?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      setData(result.data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, farmId, companyId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchAnalytics} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const getSpeciesIcon = (species: string) => {
    switch (species) {
      case 'CATTLE': return '🐄';
      case 'GOAT': return '🐐';
      case 'SHEEP': return '🐑';
      case 'BUFFALO': return '🐃';
      default: return '🐄';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getAlertBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'warning': return 'outline';
      case 'error': return 'destructive';
      case 'info': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive farm analytics and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.alerts.map((alert, index) => (
            <Card key={index} className="border-l-4 border-l-orange-500">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getAlertBadgeVariant(alert.type)} className="text-xs">
                        {alert.category}
                      </Badge>
                      {alert.count && (
                        <Badge variant="outline" className="text-xs">
                          {alert.count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    {alert.details && (
                      <p className="text-xs text-muted-foreground mt-1">{alert.details}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Animals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalAnimals}</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.femaleAnimals} females, {data.overview.totalAnimals - data.overview.femaleAnimals} males
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Events</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.health.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {data.health.overdueEvents > 0 && (
                <span className="text-orange-600">{data.health.overdueEvents} overdue</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pregnancy Rate</CardTitle>
            <Baby className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.reproduction.pregnancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.reproduction.pregnantAnimals}/{data.reproduction.femaleAnimals} females
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Milk</CardTitle>
            <Milk className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.production.avgDailyYield}L</div>
            <p className="text-xs text-muted-foreground">
              {data.production.dairyAnimals} dairy animals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="reproduction">Reproduction</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Animals by Species</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.overview.animalsBySpecies.map((item) => (
                    <div key={item.species} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getSpeciesIcon(item.species)}</span>
                        <span className="text-sm capitalize">{item.species.toLowerCase()}</span>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sex Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.overview.animalsBySex.map((item) => (
                    <div key={item.sex} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{item.sex.toLowerCase()}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.overview.animalsByStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{item.status.toLowerCase()}</span>
                      <Badge 
                        variant={item.status === 'ACTIVE' ? 'default' : 'secondary'}
                      >
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Events by Type</CardTitle>
                <CardDescription>Health events in the last {data.period.days} days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.health.eventsByType.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{item.type.toLowerCase()}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Events by Status</CardTitle>
                <CardDescription>Current status of all health events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.health.eventsByStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{item.status.toLowerCase()}</span>
                      <Badge 
                        variant={item.status === 'COMPLETED' ? 'default' : 
                                item.status === 'SCHEDULED' ? 'secondary' : 'outline'}
                      >
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reproduction" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pregnancy Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pregnancy Rate</span>
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {data.reproduction.pregnancyRate}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Pregnant Animals</span>
                    <span>{data.reproduction.pregnantAnimals}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Total Females</span>
                    <span>{data.reproduction.femaleAnimals}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">USG Results</CardTitle>
                <CardDescription>Results from the last {data.period.days} days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.reproduction.usgResults.map((item) => (
                    <div key={item.result} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{item.result.toLowerCase()}</span>
                      <Badge 
                        variant={item.result === 'PREGNANT' ? 'default' : 
                                item.result === 'EMPTY' ? 'secondary' : 'outline'}
                      >
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Production Summary</CardTitle>
                <CardDescription>Last {data.period.days} days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-2xl font-bold">{data.production.totalProduction}L</div>
                    <p className="text-xs text-muted-foreground">Total production</p>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{data.production.avgDailyYield}L</div>
                    <p className="text-xs text-muted-foreground">Average daily yield</p>
                  </div>
                  <div>
                    <div className="text-base">{data.production.totalRecords}</div>
                    <p className="text-xs text-muted-foreground">Total records</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Daily Production Trend</CardTitle>
                <CardDescription>Last 7 days milk production</CardDescription>
              </CardHeader>
              <CardContent>
                {data.production.trend.length > 0 ? (
                  <div className="space-y-2">
                    {data.production.trend.map((day, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{new Date(day.date).toLocaleDateString()}</span>
                        <Badge variant="outline">{day.totalYield}L</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No production data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Measurement Summary</CardTitle>
                <CardDescription>Average measurements from last {data.period.days} days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Weight</span>
                    <Badge variant="outline">{data.measurements.avgWeight} kg</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Height</span>
                    <Badge variant="outline">{data.measurements.avgHeight} cm</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Body Length</span>
                    <Badge variant="outline">{data.measurements.avgBodyLength} cm</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Records</span>
                    <Badge variant="secondary">{data.measurements.totalRecords}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weight Trend</CardTitle>
                <CardDescription>Monthly weight progression</CardDescription>
              </CardHeader>
              <CardContent>
                {data.measurements.weightTrend.length > 0 ? (
                  <div className="space-y-2">
                    {data.measurements.weightTrend.map((month: any, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{new Date(month.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        <Badge variant="outline">{parseFloat(month.avg_weight).toFixed(1)} kg</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No weight trend data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Health Events</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {data.recentActivity.healthEvents.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentActivity.healthEvents.map((event: any) => (
                      <div key={event.id} className="flex items-start gap-3 p-2 bg-muted/50 rounded">
                        <Heart className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {event.animal.tagNumber}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {event.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent health events</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Measurements</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {data.recentActivity.measurements.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentActivity.measurements.map((measurement: any) => (
                      <div key={measurement.id} className="flex items-start gap-3 p-2 bg-muted/50 rounded">
                        <Scale className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {measurement.animal.tagNumber}
                            </Badge>
                            {measurement.weight && (
                              <Badge variant="secondary" className="text-xs">
                                {measurement.weight} kg
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(measurement.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent measurements</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
