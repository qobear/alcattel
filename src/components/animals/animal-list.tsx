"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Search, Plus, Filter } from "lucide-react"

interface Animal {
  id: string
  tagNumber: string
  species: string
  breed: string
  sex: "MALE" | "FEMALE"
  status: "ACTIVE" | "SOLD" | "DECEASED" | "TRANSFERRED"
  birthDateEstimated?: string
  createdAt: string
  farm: {
    name: string
  }
  measurements: Array<{
    id: string
    weightKg?: number
    measuredAt: string
  }>
  media: Array<{
    id: string
    url: string
    pose: string
  }>
}

interface AnimalListProps {
  animals: Animal[]
  onAddAnimal: () => void
  onEditAnimal: (animalId: string) => void
  onViewAnimal: (animalId: string) => void
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
  { value: "ACTIVE", label: "Aktif", color: "bg-green-100 text-green-800" },
  { value: "SOLD", label: "Terjual", color: "bg-blue-100 text-blue-800" },
  { value: "DECEASED", label: "Mati", color: "bg-red-100 text-red-800" },
  { value: "TRANSFERRED", label: "Dipindah", color: "bg-yellow-100 text-yellow-800" },
]

export function AnimalList({ 
  animals, 
  onAddAnimal, 
  onEditAnimal, 
  onViewAnimal,
  isLoading = false 
}: AnimalListProps) {
  const [search, setSearch] = useState("")
  const [speciesFilter, setSpeciesFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sexFilter, setSexFilter] = useState("")

  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = search === "" || 
      animal.tagNumber.toLowerCase().includes(search.toLowerCase()) ||
      animal.breed.toLowerCase().includes(search.toLowerCase())
    
    const matchesSpecies = speciesFilter === "" || animal.species === speciesFilter
    const matchesStatus = statusFilter === "" || animal.status === statusFilter
    const matchesSex = sexFilter === "" || animal.sex === sexFilter

    return matchesSearch && matchesSpecies && matchesStatus && matchesSex
  })

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status)
    return statusOption ? (
      <Badge className={statusOption.color}>
        {statusOption.label}
      </Badge>
    ) : status
  }

  const getLatestWeight = (measurements: Animal["measurements"]) => {
    if (measurements.length === 0) return "-"
    const latest = measurements[0]
    return latest.weightKg ? `${latest.weightKg} kg` : "-"
  }

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return "-"
    const birth = new Date(birthDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - birth.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) return `${diffDays} hari`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan`
    return `${Math.floor(diffDays / 365)} tahun`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Hewan</h2>
          <p className="text-muted-foreground">
            Kelola data hewan ternak di farm ini
          </p>
        </div>
        <Button onClick={onAddAnimal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Hewan
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari tag atau breed..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Spesies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Spesies</SelectItem>
                {SPECIES_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sexFilter} onValueChange={setSexFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Jenis Kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Jenis Kelamin</SelectItem>
                <SelectItem value="MALE">Jantan</SelectItem>
                <SelectItem value="FEMALE">Betina</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Status</SelectItem>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearch("")
                setSpeciesFilter("")
                setStatusFilter("")
                setSexFilter("")
              }}
            >
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Animal Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnimals.map((animal) => (
            <Card key={animal.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header with photo and basic info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {animal.media.length > 0 ? (
                        <img
                          src={animal.media[0].url}
                          alt={`Animal ${animal.tagNumber}`}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">No Photo</span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">#{animal.tagNumber}</h3>
                        <p className="text-sm text-muted-foreground">
                          {SPECIES_OPTIONS.find(s => s.value === animal.species)?.label}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(animal.status)}
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Breed:</span>
                      <span>{animal.breed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Jenis Kelamin:</span>
                      <span>{animal.sex === "MALE" ? "Jantan" : "Betina"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Umur:</span>
                      <span>{calculateAge(animal.birthDateEstimated)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Berat Terakhir:</span>
                      <span>{getLatestWeight(animal.measurements)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onViewAnimal(animal.id)}
                      className="flex-1"
                    >
                      Detail
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEditAnimal(animal.id)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredAnimals.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              {animals.length === 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Belum ada hewan</h3>
                  <p className="mb-4">Mulai dengan menambahkan hewan pertama Anda</p>
                  <Button onClick={onAddAnimal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Hewan Pertama
                  </Button>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tidak ada hasil</h3>
                  <p>Coba ubah filter atau kata kunci pencarian</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
