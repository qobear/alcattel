"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, X } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { z } from "zod"

const animalFormSchema = z.object({
  tagNumber: z.string().min(1, "Nomor tag harus diisi"),
  species: z.enum(["CATTLE", "SHEEP", "GOAT", "BUFFALO", "HORSE", "CAMEL", "LLAMA"]),
  breed: z.string().min(1, "Breed harus diisi"),
  sex: z.enum(["MALE", "FEMALE"]),
  birthDateEstimated: z.date().optional(),
  status: z.enum(["ACTIVE", "SOLD", "DECEASED", "TRANSFERRED"]).default("ACTIVE"),
  notes: z.string().optional(),
})

type AnimalFormData = z.infer<typeof animalFormSchema>

interface AnimalFormProps {
  initialData?: Partial<AnimalFormData>
  onSubmit: (data: AnimalFormData) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
  isLoading?: boolean
}

const SPECIES_OPTIONS = [
  { value: "CATTLE", label: "Sapi" },
  { value: "SHEEP", label: "Domba" },
  { value: "GOAT", label: "Kambing" },
  { value: "BUFFALO", label: "Kerbau" },
  { value: "HORSE", label: "Kuda" },
  { value: "CAMEL", label: "Unta" },
  { value: "LLAMA", label: "Llama" },
]

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "SOLD", label: "Terjual" },
  { value: "DECEASED", label: "Mati" },
  { value: "TRANSFERRED", label: "Dipindah" },
]

export function AnimalForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isEditing = false,
  isLoading = false 
}: AnimalFormProps) {
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    initialData?.birthDateEstimated ? new Date(initialData.birthDateEstimated) : undefined
  )

  const form = useForm<AnimalFormData>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      tagNumber: initialData?.tagNumber || "",
      species: initialData?.species || "CATTLE",
      breed: initialData?.breed || "",
      sex: initialData?.sex || "FEMALE",
      status: initialData?.status || "ACTIVE",
      notes: initialData?.notes || "",
      birthDateEstimated: initialData?.birthDateEstimated 
        ? new Date(initialData.birthDateEstimated) 
        : undefined,
    },
  })

  const handleSubmit = async (data: AnimalFormData) => {
    try {
      await onSubmit({
        ...data,
        birthDateEstimated: birthDate,
      })
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{isEditing ? "Edit Hewan" : "Tambah Hewan Baru"}</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tagNumber">Nomor Tag *</Label>
              <Input
                id="tagNumber"
                {...form.register("tagNumber")}
                placeholder="Contoh: 001, A123"
                disabled={isLoading}
              />
              {form.formState.errors.tagNumber && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.tagNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="species">Spesies *</Label>
              <Select
                value={form.watch("species")}
                onValueChange={(value) => form.setValue("species", value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih spesies" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIES_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.species && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.species.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breed">Breed/Ras *</Label>
              <Input
                id="breed"
                {...form.register("breed")}
                placeholder="Contoh: Simmental, Brahman"
                disabled={isLoading}
              />
              {form.formState.errors.breed && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.breed.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Jenis Kelamin *</Label>
              <Select
                value={form.watch("sex")}
                onValueChange={(value) => form.setValue("sex", value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Jantan</SelectItem>
                  <SelectItem value="FEMALE">Betina</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.sex && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.sex.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Lahir (Estimasi)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? (
                      format(birthDate, "PPP", { locale: id })
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    initialFocus
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Catatan tambahan tentang hewan ini..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex items-center gap-2 flex-1"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Menyimpan..." : (isEditing ? "Update" : "Simpan")}
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
