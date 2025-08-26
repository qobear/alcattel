"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, X, Scale } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { z } from "zod"

const measurementFormSchema = z.object({
  weightKg: z.number().min(0).max(2000).optional(),
  heightCm: z.number().min(0).max(300).optional(),
  bodyLengthCm: z.number().min(0).max(400).optional(),
  scrotalCircumferenceCm: z.number().min(0).max(60).optional(),
  measuredAt: z.date(),
})

type MeasurementFormData = z.infer<typeof measurementFormSchema>

interface MeasurementFormProps {
  animalId: string
  animalSex: "MALE" | "FEMALE"
  animalSpecies: string
  onSubmit: (data: MeasurementFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function MeasurementForm({ 
  animalId,
  animalSex,
  animalSpecies,
  onSubmit, 
  onCancel, 
  isLoading = false 
}: MeasurementFormProps) {
  const [measuredAt, setMeasuredAt] = useState<Date>(new Date())

  const form = useForm<MeasurementFormData>({
    resolver: zodResolver(measurementFormSchema),
    defaultValues: {
      measuredAt: new Date(),
    },
  })

  const handleSubmit = async (data: MeasurementFormData) => {
    try {
      // Convert string inputs to numbers
      const processedData = {
        ...data,
        weightKg: data.weightKg ? Number(data.weightKg) : undefined,
        heightCm: data.heightCm ? Number(data.heightCm) : undefined,
        bodyLengthCm: data.bodyLengthCm ? Number(data.bodyLengthCm) : undefined,
        scrotalCircumferenceCm: data.scrotalCircumferenceCm ? Number(data.scrotalCircumferenceCm) : undefined,
        measuredAt,
      }
      
      await onSubmit(processedData)
    } catch (error) {
      console.error("Error submitting measurement:", error)
    }
  }

  const showScrotalCircumference = animalSex === "MALE" && 
    ["CATTLE", "SHEEP", "GOAT", "BUFFALO"].includes(animalSpecies)

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Tambah Pengukuran
          </span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Date and Time */}
          <div className="space-y-2">
            <Label>Tanggal & Waktu Pengukuran *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {measuredAt ? (
                    format(measuredAt, "PPP", { locale: id })
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={measuredAt}
                  onSelect={(date) => date && setMeasuredAt(date)}
                  initialFocus
                  disabled={(date) =>
                    date > new Date() || date < new Date("2020-01-01")
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Measurements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weightKg">Berat (kg)</Label>
              <Input
                id="weightKg"
                type="number"
                step="0.1"
                min="0"
                max="2000"
                placeholder="Contoh: 450.5"
                disabled={isLoading}
                {...form.register("weightKg", { 
                  setValueAs: v => v === "" ? undefined : parseFloat(v) 
                })}
              />
              {form.formState.errors.weightKg && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.weightKg.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="heightCm">Tinggi (cm)</Label>
              <Input
                id="heightCm"
                type="number"
                step="0.1"
                min="0"
                max="300"
                placeholder="Contoh: 140.5"
                disabled={isLoading}
                {...form.register("heightCm", { 
                  setValueAs: v => v === "" ? undefined : parseFloat(v) 
                })}
              />
              {form.formState.errors.heightCm && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.heightCm.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyLengthCm">Panjang Badan (cm)</Label>
              <Input
                id="bodyLengthCm"
                type="number"
                step="0.1"
                min="0"
                max="400"
                placeholder="Contoh: 180.0"
                disabled={isLoading}
                {...form.register("bodyLengthCm", { 
                  setValueAs: v => v === "" ? undefined : parseFloat(v) 
                })}
              />
              {form.formState.errors.bodyLengthCm && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.bodyLengthCm.message}
                </p>
              )}
            </div>

            {showScrotalCircumference && (
              <div className="space-y-2">
                <Label htmlFor="scrotalCircumferenceCm">Lingkar Testis (cm)</Label>
                <Input
                  id="scrotalCircumferenceCm"
                  type="number"
                  step="0.1"
                  min="0"
                  max="60"
                  placeholder="Contoh: 35.0"
                  disabled={isLoading}
                  {...form.register("scrotalCircumferenceCm", { 
                    setValueAs: v => v === "" ? undefined : parseFloat(v) 
                  })}
                />
                {form.formState.errors.scrotalCircumferenceCm && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.scrotalCircumferenceCm.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Tips Pengukuran:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Timbang hewan pada waktu yang sama setiap kali</li>
              <li>• Ukur tinggi dari tanah ke puncak punggung (withers)</li>
              <li>• Panjang badan diukur dari dada sampai pantat</li>
              {showScrotalCircumference && (
                <li>• Lingkar testis diukur pada bagian terlebar</li>
              )}
              <li>• Pastikan hewan dalam posisi tenang dan tegak</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex items-center gap-2 flex-1"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Menyimpan..." : "Simpan Pengukuran"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default MeasurementForm
