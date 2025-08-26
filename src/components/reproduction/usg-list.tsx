'use client';

import { useState, useEffect } from 'react';
import { format, differenceInDays, addWeeks } from 'date-fns';
import { 
  Baby,
  Calendar,
  User,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  Heart,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import USGForm from './usg-form';

interface USGRecord {
  id: string;
  date: string;
  result: 'PREGNANT' | 'EMPTY' | 'UNCLEAR';
  fetusAgeWeeks?: number;
  operator: string;
  notes?: string;
  nextCheckDate?: string;
  cost?: number;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface USGSummary {
  currentStatus: 'PREGNANT' | 'EMPTY';
  estimatedDueDate?: string;
  lastCheckDate?: string;
  nextCheckDate?: string;
}

interface USGListProps {
  animalId: string;
  animalName?: string;
  animalTag?: string;
}

const resultConfig = {
  PREGNANT: { label: 'Pregnant', color: 'bg-green-100 text-green-800', icon: Baby },
  EMPTY: { label: 'Empty', color: 'bg-gray-100 text-gray-800', icon: Heart },
  UNCLEAR: { label: 'Unclear', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
};

export default function USGList({ animalId, animalName, animalTag }: USGListProps) {
  const [usgRecords, setUSGRecords] = useState<USGRecord[]>([]);
  const [summary, setSummary] = useState<USGSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [resultFilter, setResultFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Load USG records
  const loadUSGRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (resultFilter !== 'ALL') {
        params.append('result', resultFilter);
      }

      const response = await fetch(`/api/animals/${animalId}/reproduction/usg?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch USG records');
      }

      const result = await response.json();
      setUSGRecords(result.data || []);
      setSummary(result.summary || null);
    } catch (error) {
      console.error('Error loading USG records:', error);
      alert('Failed to load USG records');
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or filters change
  useEffect(() => {
    loadUSGRecords();
  }, [animalId, resultFilter]);

  // Filter records by search query
  const filteredRecords = usgRecords.filter(record =>
    record.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle form success
  const handleFormSuccess = (newRecord: USGRecord) => {
    setUSGRecords(prev => [newRecord, ...prev]);
    setShowForm(false);
    // Reload to get updated summary
    loadUSGRecords();
  };

  // Calculate pregnancy information
  const calculatePregnancyInfo = (record: USGRecord) => {
    if (record.result !== 'PREGNANT' || !record.fetusAgeWeeks) return null;

    const usgDate = new Date(record.date);
    const currentGestationWeeks = record.fetusAgeWeeks + Math.floor(differenceInDays(new Date(), usgDate) / 7);
    const estimatedDueDate = addWeeks(usgDate, 40 - record.fetusAgeWeeks);
    const daysUntilDue = differenceInDays(estimatedDueDate, new Date());
    const trimester = currentGestationWeeks <= 13 ? 1 : currentGestationWeeks <= 26 ? 2 : 3;

    return {
      currentGestationWeeks,
      estimatedDueDate,
      daysUntilDue,
      trimester,
    };
  };

  // Render USG record card
  const renderUSGCard = (record: USGRecord) => {
    const config = resultConfig[record.result];
    const IconComponent = config.icon;
    const pregnancyInfo = calculatePregnancyInfo(record);
    const isOverdue = pregnancyInfo && pregnancyInfo.daysUntilDue < 0;
    const isDueSoon = pregnancyInfo && pregnancyInfo.daysUntilDue >= 0 && pregnancyInfo.daysUntilDue <= 14;

    return (
      <Card key={record.id} className={`${isOverdue ? 'border-red-300' : isDueSoon ? 'border-orange-300' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="h-5 w-5 text-gray-600" />
              <div>
                <CardTitle className="text-base">USG Examination</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={config.color}>
                    {config.label}
                  </Badge>
                  {isOverdue && (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                  {isDueSoon && (
                    <Badge className="bg-orange-100 text-orange-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Due Soon
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(record.date), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Operator:</span>
              <p className="text-gray-600">{record.operator}</p>
            </div>
            
            {record.fetusAgeWeeks && (
              <div>
                <span className="font-medium">Fetus Age:</span>
                <p className="text-gray-600">{record.fetusAgeWeeks} weeks</p>
              </div>
            )}
            
            {pregnancyInfo && (
              <>
                <div>
                  <span className="font-medium">Current Gestation:</span>
                  <p className="text-gray-600">
                    {pregnancyInfo.currentGestationWeeks} weeks (Trimester {pregnancyInfo.trimester})
                  </p>
                </div>
                
                <div>
                  <span className="font-medium">Due Date:</span>
                  <p className="text-gray-600">
                    {format(pregnancyInfo.estimatedDueDate, 'MMM dd, yyyy')}
                    {pregnancyInfo.daysUntilDue >= 0 
                      ? ` (${pregnancyInfo.daysUntilDue} days)` 
                      : ` (${Math.abs(pregnancyInfo.daysUntilDue)} days overdue)`
                    }
                  </p>
                </div>
              </>
            )}
            
            {record.nextCheckDate && (
              <div>
                <span className="font-medium">Next Check:</span>
                <p className="text-gray-600">
                  {format(new Date(record.nextCheckDate), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
            
            {record.cost && (
              <div>
                <span className="font-medium">Cost:</span>
                <p className="text-gray-600">
                  IDR {record.cost.toLocaleString()}
                </p>
              </div>
            )}
          </div>
          
          {record.notes && (
            <div className="mt-4 pt-4 border-t">
              <span className="font-medium text-sm">Notes:</span>
              <p className="text-gray-600 text-sm mt-1">{record.notes}</p>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t text-xs text-gray-500">
            Added by {record.createdBy.name} on {format(new Date(record.createdAt), 'MMM dd, yyyy')}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {summary && (
        <Card className="bg-gradient-to-r from-pink-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5 text-pink-500" />
              Reproduction Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Current Status:</span>
                <div className="mt-1">
                  <Badge className={resultConfig[summary.currentStatus].color}>
                    {resultConfig[summary.currentStatus].label}
                  </Badge>
                </div>
              </div>
              
              {summary.estimatedDueDate && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Estimated Due Date:</span>
                  <p className="mt-1 font-semibold">
                    {format(new Date(summary.estimatedDueDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
              
              {summary.lastCheckDate && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Last Check:</span>
                  <p className="mt-1">
                    {format(new Date(summary.lastCheckDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">USG Records</h3>
          {animalName && (
            <p className="text-sm text-gray-600">
              for {animalName} {animalTag && `(#${animalTag})`}
            </p>
          )}
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add USG Record
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by operator or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Results</SelectItem>
            {Object.entries(resultConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* USG Records List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-8">
          <Baby className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No USG records found</h3>
          <p className="text-gray-600">
            {searchQuery || resultFilter !== 'ALL'
              ? 'Try adjusting your search or filters'
              : 'Start by adding the first USG examination for this female animal'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map(renderUSGCard)}
        </div>
      )}

      {/* USG Form Modal */}
      <USGForm
        animalId={animalId}
        animalName={animalName}
        animalTag={animalTag}
        isOpen={showForm}
        onSuccess={handleFormSuccess}
        onCancel={() => setShowForm(false)}
      />
    </div>
  );
}
