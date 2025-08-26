'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, X, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

// Schema validation untuk USG record
const usgSchema = z.object({
  date: z.date({
    required_error: 'USG date is required',
  }),
  result: z.enum(['PREGNANT', 'EMPTY', 'UNCLEAR'], {
    required_error: 'Please select USG result',
  }),
  fetusAgeWeeks: z.number().min(0).max(50).optional(),
  operator: z.string().min(1, 'Operator name is required'),
  notes: z.string().optional(),
  nextCheckDate: z.date().optional(),
  cost: z.number().min(0, 'Cost must be positive').optional(),
});

type USGFormData = z.infer<typeof usgSchema>;

interface USGFormProps {
  animalId: string;
  animalName?: string;
  animalTag?: string;
  onSuccess?: (usgRecord: any) => void;
  onCancel?: () => void;
  isOpen?: boolean;
}

const resultOptions = [
  { value: 'PREGNANT', label: 'Pregnant (Bunting)', color: 'bg-green-100 text-green-800' },
  { value: 'EMPTY', label: 'Empty (Kosong)', color: 'bg-gray-100 text-gray-800' },
  { value: 'UNCLEAR', label: 'Unclear (Tidak Jelas)', color: 'bg-yellow-100 text-yellow-800' },
];

export default function USGForm({
  animalId,
  animalName,
  animalTag,
  onSuccess,
  onCancel,
  isOpen = false,
}: USGFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [nextCheckPickerOpen, setNextCheckPickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<USGFormData>({
    resolver: zodResolver(usgSchema),
    defaultValues: {
      date: new Date(),
    },
  });

  const watchedResult = watch('result');
  const watchedDate = watch('date');
  const watchedNextCheckDate = watch('nextCheckDate');
  const watchedFetusAge = watch('fetusAgeWeeks');

  // Calculate estimated due date if pregnant
  const estimatedDueDate = watchedResult === 'PREGNANT' && watchedFetusAge && watchedDate
    ? new Date(watchedDate.getTime() + (40 - watchedFetusAge) * 7 * 24 * 60 * 60 * 1000)
    : null;

  const handleFormSubmit = async (data: USGFormData) => {
    try {
      setIsSubmitting(true);

      // Validasi business rule
      if (data.result === 'PREGNANT' && !data.fetusAgeWeeks) {
        alert('Fetus age is required when result is PREGNANT');
        return;
      }

      if (data.result !== 'PREGNANT' && data.fetusAgeWeeks) {
        alert('Fetus age should only be specified when result is PREGNANT');
        return;
      }

      const payload = {
        ...data,
        date: data.date.toISOString(),
        nextCheckDate: data.nextCheckDate?.toISOString(),
        cost: data.cost ? Number(data.cost) : undefined,
        fetusAgeWeeks: data.result === 'PREGNANT' ? data.fetusAgeWeeks : undefined,
      };

      const response = await fetch(`/api/animals/${animalId}/reproduction/usg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create USG record');
      }

      const result = await response.json();
      onSuccess?.(result.data);
      reset();
    } catch (error) {
      console.error('Error creating USG record:', error);
      alert(error instanceof Error ? error.message : 'Failed to create USG record');
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
              <Baby className="h-5 w-5 text-pink-500" />
              Add USG Record
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
          {/* USG Date */}
          <div className="space-y-2">
            <Label>USG Date *</Label>
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

          {/* USG Result */}
          <div className="space-y-2">
            <Label htmlFor="result">USG Result *</Label>
            <Select
              value={watchedResult}
              onValueChange={(value) => setValue('result', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select USG result" />
              </SelectTrigger>
              <SelectContent>
                {resultOptions.map((option) => (
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
            {errors.result && (
              <p className="text-sm text-red-600">{errors.result.message}</p>
            )}
          </div>

          {/* Fetus Age - hanya muncul jika pregnant */}
          {watchedResult === 'PREGNANT' && (
            <div className="space-y-2">
              <Label htmlFor="fetusAgeWeeks">Fetus Age (weeks) *</Label>
              <Input
                id="fetusAgeWeeks"
                type="number"
                min="0"
                max="50"
                step="0.1"
                {...register('fetusAgeWeeks', { valueAsNumber: true })}
                placeholder="Enter fetus age in weeks"
              />
              {errors.fetusAgeWeeks && (
                <p className="text-sm text-red-600">{errors.fetusAgeWeeks.message}</p>
              )}
              
              {/* Estimated due date calculation */}
              {estimatedDueDate && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    Estimated Due Date: {format(estimatedDueDate, 'PPP')}
                  </p>
                  <p className="text-xs text-green-600">
                    Approximately {Math.ceil((estimatedDueDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))} days from now
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Operator */}
          <div className="space-y-2">
            <Label htmlFor="operator">Operator/Veterinarian *</Label>
            <Input
              id="operator"
              {...register('operator')}
              placeholder="Name of the person performing USG"
            />
            {errors.operator && (
              <p className="text-sm text-red-600">{errors.operator.message}</p>
            )}
          </div>

          {/* Next Check Date */}
          <div className="space-y-2">
            <Label>Next Check Date (Optional)</Label>
            <Popover open={nextCheckPickerOpen} onOpenChange={setNextCheckPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watchedNextCheckDate ? format(watchedNextCheckDate, 'PPP') : 'Pick next check date (optional)'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watchedNextCheckDate}
                  onSelect={(date) => {
                    setValue('nextCheckDate', date);
                    setNextCheckPickerOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

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
              placeholder="Additional observations or notes..."
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
                  Create USG Record
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
