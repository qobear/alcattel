'use client';

import { useState, useEffect } from 'react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { 
  Milk,
  Calendar,
  TrendingUp,
  TrendingDown,
  Plus,
  Filter,
  Search,
  BarChart3,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MilkYieldForm from './milk-yield-form';

interface MilkYieldRecord {
  id: string;
  date: string;
  session: 'MORNING' | 'EVENING';
  liters: number;
  quality?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  notes?: string;
  milkerName?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface MilkStatistics {
  totalRecords: number;
  totalLiters: number;
  averageDaily: number;
  recentAverage: number;
  trend: number;
}

interface MilkYieldListProps {
  animalId: string;
  animalName?: string;
  animalTag?: string;
  animalSpecies?: string;
}

const sessionConfig = {
  MORNING: { label: 'Morning', color: 'bg-yellow-100 text-yellow-800', icon: Sun },
  EVENING: { label: 'Evening', color: 'bg-blue-100 text-blue-800', icon: Moon },
};

const qualityConfig = {
  EXCELLENT: { label: 'Excellent', color: 'bg-green-100 text-green-800' },
  GOOD: { label: 'Good', color: 'bg-blue-100 text-blue-800' },
  FAIR: { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' },
  POOR: { label: 'Poor', color: 'bg-red-100 text-red-800' },
};

export default function MilkYieldList({ 
  animalId, 
  animalName, 
  animalTag, 
  animalSpecies 
}: MilkYieldListProps) {
  const [milkRecords, setMilkRecords] = useState<MilkYieldRecord[]>([]);
  const [statistics, setStatistics] = useState<MilkStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<string>('7'); // days
  const [searchQuery, setSearchQuery] = useState('');

  // Load milk yield records
  const loadMilkRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (sessionFilter !== 'ALL') {
        params.append('session', sessionFilter);
      }

      // Add date range filter
      if (dateRange !== 'ALL') {
        const days = parseInt(dateRange);
        const fromDate = subDays(new Date(), days);
        params.append('from', fromDate.toISOString());
      }

      const response = await fetch(`/api/animals/${animalId}/milk?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch milk yield records');
      }

      const result = await response.json();
      setMilkRecords(result.data || []);
      setStatistics(result.statistics || null);
    } catch (error) {
      console.error('Error loading milk yield records:', error);
      alert('Failed to load milk yield records');
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or filters change
  useEffect(() => {
    loadMilkRecords();
  }, [animalId, sessionFilter, dateRange]);

  // Filter records by search query
  const filteredRecords = milkRecords.filter(record =>
    record.milkerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group records by date for better visualization
  const groupedRecords = filteredRecords.reduce((groups, record) => {
    const date = format(new Date(record.date), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(record);
    return groups;
  }, {} as Record<string, MilkYieldRecord[]>);

  // Handle form success
  const handleFormSuccess = (newRecord: MilkYieldRecord) => {
    setMilkRecords(prev => [newRecord, ...prev]);
    setShowForm(false);
    // Reload to get updated statistics
    loadMilkRecords();
  };

  // Calculate daily total for a group of records
  const calculateDailyTotal = (records: MilkYieldRecord[]) => {
    return records.reduce((sum, record) => sum + record.liters, 0);
  };

  // Render daily milk production card
  const renderDailyCard = (date: string, records: MilkYieldRecord[]) => {
    const dailyTotal = calculateDailyTotal(records);
    const hasMorning = records.some(r => r.session === 'MORNING');
    const hasEvening = records.some(r => r.session === 'EVENING');

    return (
      <Card key={date}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">
                {format(new Date(date), 'EEEE, MMM dd, yyyy')}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-blue-100 text-blue-800">
                  {dailyTotal.toFixed(1)} L total
                </Badge>
                {hasMorning && (
                  <Badge className={sessionConfig.MORNING.color}>
                    <Sun className="h-3 w-3 mr-1" />
                    Morning
                  </Badge>
                )}
                {hasEvening && (
                  <Badge className={sessionConfig.EVENING.color}>
                    <Moon className="h-3 w-3 mr-1" />
                    Evening
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {records.map((record) => {
              const sessionConfig_local = sessionConfig[record.session];
              const IconComponent = sessionConfig_local.icon;
              
              return (
                <div key={record.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <span className="font-medium">{record.liters.toFixed(1)} L</span>
                      <Badge className={sessionConfig_local.color}>
                        {sessionConfig_local.label}
                      </Badge>
                    </div>
                    {record.quality && (
                      <Badge className={qualityConfig[record.quality].color}>
                        {qualityConfig[record.quality].label}
                      </Badge>
                    )}
                  </div>
                  
                  {(record.milkerName || record.notes) && (
                    <div className="text-sm text-gray-600 space-y-1">
                      {record.milkerName && (
                        <p><strong>Milker:</strong> {record.milkerName}</p>
                      )}
                      {record.notes && (
                        <p><strong>Notes:</strong> {record.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Production</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.totalLiters.toFixed(1)}L</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Milk className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                From {statistics.totalRecords} records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Daily Average</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.averageDaily.toFixed(1)}L</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Per day average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Average</p>
                  <p className="text-2xl font-bold text-purple-600">{statistics.recentAverage.toFixed(1)}L</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Trend</p>
                  <p className={`text-2xl font-bold ${statistics.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {statistics.trend > 0 ? '+' : ''}{statistics.trend.toFixed(1)}%
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  statistics.trend >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {statistics.trend >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                vs previous 7 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Milk Production Records</h3>
          {animalName && (
            <p className="text-sm text-gray-600">
              for {animalName} {animalTag && `(#${animalTag})`}
            </p>
          )}
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Milk Production
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by milker or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={sessionFilter} onValueChange={setSessionFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Session" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Sessions</SelectItem>
            <SelectItem value="MORNING">Morning</SelectItem>
            <SelectItem value="EVENING">Evening</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="ALL">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Milk Records List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : Object.keys(groupedRecords).length === 0 ? (
        <div className="text-center py-8">
          <Milk className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No milk production records found</h3>
          <p className="text-gray-600">
            {searchQuery || sessionFilter !== 'ALL'
              ? 'Try adjusting your search or filters'
              : 'Start by recording the first milk production for this dairy animal'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRecords)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, records]) => renderDailyCard(date, records))
          }
        </div>
      )}

      {/* Milk Yield Form Modal */}
      <MilkYieldForm
        animalId={animalId}
        animalName={animalName}
        animalTag={animalTag}
        animalSpecies={animalSpecies}
        isOpen={showForm}
        onSuccess={handleFormSuccess}
        onCancel={() => setShowForm(false)}
      />
    </div>
  );
}
