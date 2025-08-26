'use client';

import { useState, useEffect } from 'react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { 
  Calendar,
  Stethoscope,
  Pill,
  Syringe,
  Clipboard,
  Eye,
  AlertTriangle,
  Plus,
  Filter,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import HealthEventForm from './health-event-form';

interface HealthEvent {
  id: string;
  type: 'VACCINATION' | 'TREATMENT' | 'CHECKUP' | 'SURGERY' | 'MEDICATION' | 'OBSERVATION';
  date: string;
  description: string;
  veterinarianName?: string;
  medication?: string;
  dosage?: string;
  notes?: string;
  nextDueDate?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  cost?: number;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface HealthEventListProps {
  animalId: string;
  animalName?: string;
}

const eventTypeConfig = {
  VACCINATION: { icon: Syringe, label: 'Vaccination', color: 'bg-green-100 text-green-800' },
  TREATMENT: { icon: Stethoscope, label: 'Treatment', color: 'bg-blue-100 text-blue-800' },
  CHECKUP: { icon: Clipboard, label: 'Health Checkup', color: 'bg-purple-100 text-purple-800' },
  SURGERY: { icon: Stethoscope, label: 'Surgery', color: 'bg-red-100 text-red-800' },
  MEDICATION: { icon: Pill, label: 'Medication', color: 'bg-orange-100 text-orange-800' },
  OBSERVATION: { icon: Eye, label: 'Observation', color: 'bg-gray-100 text-gray-800' },
};

const statusConfig = {
  SCHEDULED: { label: 'Scheduled', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

export default function HealthEventList({ animalId, animalName }: HealthEventListProps) {
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Load health events
  const loadHealthEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (typeFilter !== 'ALL') {
        params.append('type', typeFilter);
      }
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/animals/${animalId}/health?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch health events');
      }

      const result = await response.json();
      setHealthEvents(result.data || []);
    } catch (error) {
      console.error('Error loading health events:', error);
      alert('Failed to load health events');
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or filters change
  useEffect(() => {
    loadHealthEvents();
  }, [animalId, typeFilter, statusFilter]);

  // Filter events by search query
  const filteredEvents = healthEvents.filter(event =>
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.veterinarianName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.medication?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle form success
  const handleFormSuccess = (newEvent: HealthEvent) => {
    setHealthEvents(prev => [newEvent, ...prev]);
    setShowForm(false);
  };

  // Check if event is overdue
  const isOverdue = (event: HealthEvent) => {
    if (event.status !== 'SCHEDULED' || !event.nextDueDate) return false;
    return isBefore(new Date(event.nextDueDate), new Date());
  };

  // Check if event is due soon (within 7 days)
  const isDueSoon = (event: HealthEvent) => {
    if (event.status !== 'SCHEDULED' || !event.nextDueDate) return false;
    const dueDate = new Date(event.nextDueDate);
    const sevenDaysFromNow = addDays(new Date(), 7);
    return isAfter(dueDate, new Date()) && isBefore(dueDate, sevenDaysFromNow);
  };

  // Render event card
  const renderEventCard = (event: HealthEvent) => {
    const typeConfig = eventTypeConfig[event.type];
    const IconComponent = typeConfig.icon;
    const isEventOverdue = isOverdue(event);
    const isEventDueSoon = isDueSoon(event);

    return (
      <Card key={event.id} className={`${isEventOverdue ? 'border-red-300' : isEventDueSoon ? 'border-yellow-300' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="h-5 w-5 text-gray-600" />
              <div>
                <CardTitle className="text-base">{event.description}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={typeConfig.color}>
                    {typeConfig.label}
                  </Badge>
                  <Badge className={statusConfig[event.status].color}>
                    {statusConfig[event.status].label}
                  </Badge>
                  {isEventOverdue && (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                  {isEventDueSoon && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Due Soon
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(event.date), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {event.veterinarianName && (
              <div>
                <span className="font-medium">Veterinarian:</span>
                <p className="text-gray-600">{event.veterinarianName}</p>
              </div>
            )}
            
            {event.medication && (
              <div>
                <span className="font-medium">Medication:</span>
                <p className="text-gray-600">
                  {event.medication}
                  {event.dosage && ` (${event.dosage})`}
                </p>
              </div>
            )}
            
            {event.nextDueDate && (
              <div>
                <span className="font-medium">Next Due:</span>
                <p className="text-gray-600">
                  {format(new Date(event.nextDueDate), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
            
            {event.cost && (
              <div>
                <span className="font-medium">Cost:</span>
                <p className="text-gray-600">
                  IDR {event.cost.toLocaleString()}
                </p>
              </div>
            )}
          </div>
          
          {event.notes && (
            <div className="mt-4 pt-4 border-t">
              <span className="font-medium text-sm">Notes:</span>
              <p className="text-gray-600 text-sm mt-1">{event.notes}</p>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t text-xs text-gray-500">
            Added by {event.createdBy.name} on {format(new Date(event.createdAt), 'MMM dd, yyyy')}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Health Events</h3>
          {animalName && (
            <p className="text-sm text-gray-600">for {animalName}</p>
          )}
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Health Event
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {Object.entries(eventTypeConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-8">
          <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No health events found</h3>
          <p className="text-gray-600">
            {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try adjusting your search or filters'
              : 'Start by adding the first health event for this animal'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map(renderEventCard)}
        </div>
      )}

      {/* Health Event Form Modal */}
      <HealthEventForm
        animalId={animalId}
        animalName={animalName}
        isOpen={showForm}
        onSuccess={handleFormSuccess}
        onCancel={() => setShowForm(false)}
      />
    </div>
  );
}
