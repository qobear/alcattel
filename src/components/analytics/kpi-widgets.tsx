'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, className }: KPICardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <Badge 
              variant={trend.positive ? "default" : "secondary"}
              className="text-xs"
            >
              {trend.positive ? '+' : ''}{trend.value}%
            </Badge>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function MetricCard({ title, description, children, className }: MetricCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

interface MetricItemProps {
  label: string;
  value: string | number;
  badge?: {
    value: string | number;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  className?: string;
}

export function MetricItem({ label, value, badge, className }: MetricItemProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {badge ? (
          <Badge variant={badge.variant || "secondary"}>
            {badge.value}
          </Badge>
        ) : (
          <span className="text-sm font-medium">{value}</span>
        )}
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  description?: string;
  data: any[];
  renderChart: (data: any[]) => React.ReactNode;
  fallbackMessage?: string;
  className?: string;
}

export function ChartCard({ 
  title, 
  description, 
  data, 
  renderChart, 
  fallbackMessage = "No data available",
  className 
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          renderChart(data)
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {fallbackMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
