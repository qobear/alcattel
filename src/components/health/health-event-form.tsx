'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

// Schema validation untuk health event
const healthEventSchema = z.object({
  type: z.enum(['VACCINATION', 'TREATMENT', 'CHECKUP', 'SURGERY', 'MEDICATION', 'OBSERVATION'], {
    required_error: 'Please select event type',
  }),
  date: z.date({
    required_error: 'Event date is required',
  }),
  description: z.string().min(1, 'Description is required'),
  veterinarianName: z.string().optional(),
  medication: z.string().optional(),
  dosage: z.string().optional(),
  notes: z.string().optional(),
  nextDueDate: z.date().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).default('COMPLETED'),
  cost: z.number().min(0, 'Cost must be positive').optional(),
});

type HealthEventFormData = z.infer<typeof healthEventSchema>;

interface HealthEventFormProps {
  animalId: string;
  animalName?: string;
  onSuccess?: (healthEvent: any) => void;
  onCancel?: () => void;
  isOpen?: boolean;
}

const eventTypeOptions = [
  { value: 'VACCINATION', label: 'Vaccination', color: 'bg-green-100 text-green-800' },
  { value: 'TREATMENT', label: 'Treatment', color: 'bg-blue-100 text-blue-800' },
  { value: 'CHECKUP', label: 'Health Checkup', color: 'bg-purple-100 text-purple-800' },
  { value: 'SURGERY', label: 'Surgery', color: 'bg-red-100 text-red-800' },
  { value: 'MEDICATION', label: 'Medication', color: 'bg-orange-100 text-orange-800' },
  { value: 'OBSERVATION', label: 'Observation', color: 'bg-gray-100 text-gray-800' },
];

const statusOptions = [
  { value: 'SCHEDULED', label: 'Scheduled', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

export default function HealthEventForm({
  animalId,
  animalName,
  onSuccess,
  onCancel,
  isOpen = false,
}: HealthEventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dueDatePickerOpen, setDueDatePickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<HealthEventFormData>({
    resolver: zodResolver(healthEventSchema),
    defaultValues: {
      status: 'COMPLETED',
      date: new Date(),
    },
  });

  const watchedType = watch('type');
  const watchedStatus = watch('status');
  const watchedDate = watch('date');
  const watchedDueDate = watch('nextDueDate');

  const handleFormSubmit = async (data: HealthEventFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...data,
        date: data.date.toISOString(),
        nextDueDate: data.nextDueDate?.toISOString(),
        cost: data.cost ? Number(data.cost) : undefined,
      };

      const response = await fetch(`/api/animals/${animalId}/health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create health event');
      }

      const result = await response.json();
      onSuccess?.(result.data);
      reset();
    } catch (error) {
      console.error('Error creating health event:', error);
      alert(error instanceof Error ? error.message : 'Failed to create health event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Add Health Event</h2>
            {animalName && (
              <p className="text-sm text-gray-600">for {animalName}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Event Type *</Label>
            <Select
              value={watchedType}
              onValueChange={(value) => setValue('type', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={option.color}>
                        {option.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Event Date */}
          <div className="space-y-2">
            <Label>Event Date *</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watchedDate ? format(watchedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watchedDate}
                  onSelect={(date) => {
                    setValue('date', date || new Date());
                    setDatePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watchedStatus}
              onValueChange={(value) => setValue('status', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={option.color}>
                        {option.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe the health event..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Veterinarian Name */}
          <div className="space-y-2">
            <Label htmlFor="veterinarianName">Veterinarian Name</Label>
            <Input
              id="veterinarianName"
              {...register('veterinarianName')}
              placeholder="Name of the veterinarian"
            />
          </div>

          {/* Medication and Dosage */}
          {(watchedType === 'MEDICATION' || watchedType === 'TREATMENT') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medication">Medication</Label>
                <Input
                  id="medication"
                  {...register('medication')}
                  placeholder="Medication name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  {...register('dosage')}
                  placeholder="e.g., 10ml, 2 tablets"
                />
              </div>
            </div>
          )}

          {/* Next Due Date - untuk vaccination dan treatment */}
          {(watchedType === 'VACCINATION' || watchedType === 'TREATMENT') && (
            <div className="space-y-2">
              <Label>Next Due Date</Label>
              <Popover open={dueDatePickerOpen} onOpenChange={setDueDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedDueDate ? format(watchedDueDate, 'PPP') : 'Pick next due date (optional)'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watchedDueDate}
                    onSelect={(date) => {
                      setValue('nextDueDate', date);
                      setDueDatePickerOpen(false);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Cost */}
          <div className="space-y-2">
            <Label htmlFor="cost">Cost (IDR)</Label>
            <Input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              {...register('cost', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.cost && (
              <p className="text-sm text-red-600">{errors.cost.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Health Event
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
