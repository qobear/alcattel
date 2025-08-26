'use client';

import { useState, useEffect } from 'react';
import { 
  Heart,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Activity,
  Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface HealthSummary {
  totalAnimals: number;
  healthyAnimals: number;
  animalsNeedingAttention: number;
  upcomingVaccinations: number;
  overdueEvents: number;
  recentHealthEvents: {
    id: string;
    animalId: string;
    animalTag: string;
    type: string;
    description: string;
    date: string;
    status: string;
  }[];
}

interface HealthDashboardProps {
  farmId?: string;
  companyId?: string;
  tenantId?: string;
}

export default function HealthDashboard({ farmId, companyId, tenantId }: HealthDashboardProps) {
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Load health summary data
  const loadHealthSummary = async () => {
    try {
      setLoading(true);
      
      // Mock data untuk sementara - nanti ini akan ambil dari API
      const mockData: HealthSummary = {
        totalAnimals: 45,
        healthyAnimals: 41,
        animalsNeedingAttention: 4,
        upcomingVaccinations: 8,
        overdueEvents: 2,
        recentHealthEvents: [
          {
            id: '1',
            animalId: '1',
            animalTag: 'C001',
            type: 'VACCINATION',
            description: 'Vaksin FMD',
            date: new Date().toISOString(),
            status: 'COMPLETED'
          },
          {
            id: '2',
            animalId: '2',
            animalTag: 'C002',
            type: 'CHECKUP',
            description: 'Pemeriksaan rutin',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'COMPLETED'
          },
          {
            id: '3',
            animalId: '3',
            animalTag: 'C003',
            type: 'TREATMENT',
            description: 'Pengobatan mastitis',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'SCHEDULED'
          }
        ]
      };
      
      setHealthSummary(mockData);
    } catch (error) {
      console.error('Error loading health summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthSummary();
  }, [farmId, companyId, tenantId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!healthSummary) {
    return (
      <div className="text-center py-8">
        <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Health data unavailable</h3>
        <p className="text-gray-600">Unable to load health summary at this time</p>
      </div>
    );
  }

  const healthPercentage = Math.round((healthSummary.healthyAnimals / healthSummary.totalAnimals) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          Health Overview
        </h2>
        <Button variant="outline" size="sm">
          <Stethoscope className="h-4 w-4 mr-2" />
          Health Reports
        </Button>
      </div>

      {/* Health Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Health</p>
                <p className="text-2xl font-bold text-green-600">{healthPercentage}%</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {healthSummary.healthyAnimals} of {healthSummary.totalAnimals} animals healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Need Attention</p>
                <p className="text-2xl font-bold text-orange-600">{healthSummary.animalsNeedingAttention}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Animals requiring medical attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Vaccines</p>
                <p className="text-2xl font-bold text-blue-600">{healthSummary.upcomingVaccinations}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Scheduled in next 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Events</p>
                <p className="text-2xl font-bold text-red-600">{healthSummary.overdueEvents}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Events past due date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Health Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Health Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthSummary.recentHealthEvents.length > 0 ? (
            <div className="space-y-3">
              {healthSummary.recentHealthEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">#{event.animalTag} - {event.description}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(event.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={
                        event.type === 'VACCINATION' ? 'bg-green-100 text-green-800' :
                        event.type === 'TREATMENT' ? 'bg-blue-100 text-blue-800' :
                        event.type === 'CHECKUP' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {event.type}
                    </Badge>
                    <Badge 
                      className={
                        event.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        event.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }
                    >
                      {event.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No recent health activities</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
