'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Heart, 
  Baby, 
  Milk, 
  Scale,
  AlertTriangle,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface KPISummaryData {
  totalAnimals: number;
  activeAnimals: number;
  femaleAnimals: number;
  pregnantAnimals: number;
  dairyAnimals: number;
  avgDailyMilk: number;
  healthEvents: {
    total: number;
    overdue: number;
  };
  trends: {
    animalGrowth: number;
    milkProduction: number;
    healthCompliance: number;
  };
}

interface KPISummaryProps {
  farmId?: string;
  companyId?: string;
  className?: string;
}

export function KPISummary({ farmId, companyId, className }: KPISummaryProps) {
  const [data, setData] = useState<KPISummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ period: '30' });
      if (farmId) params.append('farmId', farmId);
      if (companyId) params.append('companyId', companyId);

      const response = await fetch(`/api/analytics?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch KPI data');
      }

      // Transform analytics data into KPI summary format
      const analyticsData = result.data;
      const kpiData: KPISummaryData = {
        totalAnimals: analyticsData.overview.totalAnimals,
        activeAnimals: analyticsData.overview.animalsByStatus.find((s: any) => s.status === 'ACTIVE')?.count || 0,
        femaleAnimals: analyticsData.overview.femaleAnimals,
        pregnantAnimals: analyticsData.reproduction.pregnantAnimals,
        dairyAnimals: analyticsData.production.dairyAnimals,
        avgDailyMilk: parseFloat(analyticsData.production.avgDailyYield),
        healthEvents: {
          total: analyticsData.health.totalEvents,
          overdue: analyticsData.health.overdueEvents,
        },
        trends: {
          animalGrowth: 5.2, // Mock trend data
          milkProduction: -2.1,
          healthCompliance: 8.7,
        },
      };

      setData(kpiData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIData();
  }, [farmId, companyId]);

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[80px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchKPIData} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const kpiCards = [
    {
      title: "Total Animals",
      value: data.totalAnimals,
      subtitle: `${data.activeAnimals} active`,
      icon: Users,
      trend: data.trends.animalGrowth > 0 ? {
        value: data.trends.animalGrowth,
        positive: true,
        label: "vs last month"
      } : undefined,
    },
    {
      title: "Health Events",
      value: data.healthEvents.total,
      subtitle: data.healthEvents.overdue > 0 ? `${data.healthEvents.overdue} overdue` : "All up to date",
      icon: Heart,
      alert: data.healthEvents.overdue > 0,
    },
    {
      title: "Pregnancy Rate",
      value: data.femaleAnimals > 0 ? `${((data.pregnantAnimals / data.femaleAnimals) * 100).toFixed(1)}%` : "0%",
      subtitle: `${data.pregnantAnimals}/${data.femaleAnimals} females`,
      icon: Baby,
    },
    {
      title: "Avg. Daily Milk",
      value: `${data.avgDailyMilk.toFixed(1)}L`,
      subtitle: `${data.dairyAnimals} dairy animals`,
      icon: Milk,
      trend: data.trends.milkProduction !== 0 ? {
        value: Math.abs(data.trends.milkProduction),
        positive: data.trends.milkProduction > 0,
        label: "vs last month"
      } : undefined,
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Farm Overview</h2>
          <p className="text-muted-foreground">Key performance indicators for the last 30 days</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchKPIData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className={card.alert ? "border-orange-500" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.alert ? 'text-orange-500' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className={`text-xs ${card.alert ? 'text-orange-600' : 'text-muted-foreground'}`}>
                  {card.subtitle}
                </p>
                {card.trend && (
                  <div className="flex items-center gap-1 mt-2">
                    {card.trend.positive ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <Badge 
                      variant={card.trend.positive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {card.trend.positive ? '+' : '-'}{card.trend.value}%
                    </Badge>
                    <span className="text-xs text-muted-foreground">{card.trend.label}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Compliance Rate</span>
                <Badge variant="default">{data.trends.healthCompliance.toFixed(1)}%</Badge>
              </div>
              {data.healthEvents.overdue > 0 && (
                <div className="text-xs text-orange-600">
                  {data.healthEvents.overdue} events need attention
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reproduction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pregnant</span>
                <Badge variant="secondary">{data.pregnantAnimals}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {data.femaleAnimals > 0 ? 
                  `${((data.pregnantAnimals / data.femaleAnimals) * 100).toFixed(1)}% of breeding females` :
                  'No breeding females'
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Daily Average</span>
                <Badge variant="outline">{data.avgDailyMilk.toFixed(1)}L</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Per animal: {data.dairyAnimals > 0 ? (data.avgDailyMilk / data.dairyAnimals).toFixed(1) : '0'}L
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
