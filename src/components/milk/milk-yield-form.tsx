'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, X, Milk } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

// Schema validation untuk milk yield
const milkYieldSchema = z.object({
  date: z.date({
    required_error: 'Date is required',
  }),
  session: z.enum(['MORNING', 'EVENING'], {
    required_error: 'Please select milking session',
  }),
  liters: z.number().min(0.1, 'Milk yield must be at least 0.1 liters').max(100, 'Milk yield seems unrealistically high'),
  quality: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).optional(),
  notes: z.string().optional(),
  milkerName: z.string().optional(),
});

type MilkYieldFormData = z.infer<typeof milkYieldSchema>;

interface MilkYieldFormProps {
  animalId: string;
  animalName?: string;
  animalTag?: string;
  animalSpecies?: string;
  onSuccess?: (milkRecord: any) => void;
  onCancel?: () => void;
  isOpen?: boolean;
}

const sessionOptions = [
  { value: 'MORNING', label: 'Morning (Pagi)', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'EVENING', label: 'Evening (Sore)', color: 'bg-blue-100 text-blue-800' },
];

const qualityOptions = [
  { value: 'EXCELLENT', label: 'Excellent', color: 'bg-green-100 text-green-800' },
  { value: 'GOOD', label: 'Good', color: 'bg-blue-100 text-blue-800' },
  { value: 'FAIR', label: 'Fair', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'POOR', label: 'Poor', color: 'bg-red-100 text-red-800' },
];

export default function MilkYieldForm({
  animalId,
  animalName,
  animalTag,
  animalSpecies,
  onSuccess,
  onCancel,
  isOpen = false,
}: MilkYieldFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MilkYieldFormData>({
    resolver: zodResolver(milkYieldSchema),
    defaultValues: {
      date: new Date(),
      session: 'MORNING',
    },
  });

  const watchedDate = watch('date');
  const watchedSession = watch('session');
  const watchedLiters = watch('liters');
  const watchedQuality = watch('quality');

  // Get typical production range based on species
  const getProductionRange = () => {
    if (animalSpecies === 'CATTLE') {
      return { min: 5, max: 30, unit: 'liters per session' };
    } else if (animalSpecies === 'GOAT') {
      return { min: 1, max: 5, unit: 'liters per session' };
    }
    return { min: 1, max: 10, unit: 'liters per session' };
  };

  const productionRange = getProductionRange();

  const handleFormSubmit = async (data: MilkYieldFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...data,
        date: data.date.toISOString(),
        liters: Number(data.liters),
      };

      const response = await fetch(`/api/animals/${animalId}/milk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create milk yield record');
      }

      const result = await response.json();
      onSuccess?.(result.data);
      reset();
    } catch (error) {
      console.error('Error creating milk yield record:', error);
      alert(error instanceof Error ? error.message : 'Failed to create milk yield record');
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
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Milk className="h-5 w-5 text-blue-500" />
              Record Milk Production
            </h2>
            {animalName && (
              <p className="text-sm text-gray-600">
                for {animalName} {animalTag && `(#${animalTag})`}
              </p>
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
          {/* Date */}
          <div className="space-y-2">
            <Label>Milking Date *</Label>
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
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Session */}
          <div className="space-y-2">
            <Label htmlFor="session">Milking Session *</Label>
            <Select
              value={watchedSession}
              onValueChange={(value) => setValue('session', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select milking session" />
              </SelectTrigger>
              <SelectContent>
                {sessionOptions.map((option) => (
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
            {errors.session && (
              <p className="text-sm text-red-600">{errors.session.message}</p>
            )}
          </div>

          {/* Milk Yield */}
          <div className="space-y-2">
            <Label htmlFor="liters">Milk Yield (Liters) *</Label>
            <Input
              id="liters"
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              {...register('liters', { valueAsNumber: true })}
              placeholder="Enter milk yield in liters"
            />
            {errors.liters && (
              <p className="text-sm text-red-600">{errors.liters.message}</p>
            )}
            
            {/* Production range info */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Typical range for {animalSpecies?.toLowerCase()}:</strong> {productionRange.min}-{productionRange.max} {productionRange.unit}
              </p>
              {watchedLiters && (
                <p className="text-xs text-blue-600 mt-1">
                  {watchedLiters < productionRange.min ? 'Below typical range' :
                   watchedLiters > productionRange.max ? 'Above typical range' :
                   'Within typical range'}
                </p>
              )}
            </div>
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <Label htmlFor="quality">Milk Quality (Optional)</Label>
            <Select
              value={watchedQuality}
              onValueChange={(value) => setValue('quality', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select milk quality (optional)" />
              </SelectTrigger>
              <SelectContent>
                {qualityOptions.map((option) => (
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
          </div>

          {/* Milker Name */}
          <div className="space-y-2">
            <Label htmlFor="milkerName">Milker Name</Label>
            <Input
              id="milkerName"
              {...register('milkerName')}
              placeholder="Name of the person doing the milking"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional observations (animal behavior, milk color, etc.)..."
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
                  Recording...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Milk Production
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
