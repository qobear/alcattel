"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MeasurementForm from "@/components/measurements/measurement-form"
import HealthEventList from "@/components/health/health-event-list"
import USGList from "@/components/reproduction/usg-list"
import MilkYieldList from "@/components/milk/milk-yield-list"
import { MediaUpload } from "@/components/media/media-upload"
import { 
  ArrowLeft, 
  Edit, 
  Camera, 
  Scale, 
  Heart, 
  Baby, 
  Milk,
  Calendar,
  MapPin,
  Tag
} from "lucide-react"

interface Animal {
  id: string
  tagNumber: string
  species: string
  breed: string
  sex: "MALE" | "FEMALE"
  status: "ACTIVE" | "SOLD" | "DECEASED" | "TRANSFERRED"
  birthDateEstimated?: string
  notes?: string
  createdAt: string
  farm: {
    id: string
    name: string
    company: {
      id: string
      name: string
      tenant: {
        id: string
        name: string
      }
    }
  }
  measurements: Array<{
    id: string
    weightKg?: number
    heightCm?: number
    bodyLengthCm?: number
    scrotalCircumferenceCm?: number
    measuredAt: string
  }>
  media: Array<{
    id: string
    kind: string
    pose: string
    url: string
    takenAt: string
  }>
  healthEvents: Array<{
    id: string
    type: string
    date: string
    notes?: string
  }>
  reproductionUSG: Array<{
    id: string
    date: string
    result: string
    fetusAgeWeeks?: number
    operator?: string
  }>
  milkYield: Array<{
    id: string
    date: string
    liters: number
    session: string
  }>
}

const SPECIES_MAP = {
  CATTLE: "Sapi",
  SHEEP: "Domba", 
  GOAT: "Kambing",
  BUFFALO: "Kerbau",
  HORSE: "Kuda",
  CAMEL: "Unta",
  LLAMA: "Llama",
}

const STATUS_MAP = {
  ACTIVE: { label: "Aktif", color: "bg-green-100 text-green-800" },
  SOLD: { label: "Terjual", color: "bg-blue-100 text-blue-800" },
  DECEASED: { label: "Mati", color: "bg-red-100 text-red-800" },
  TRANSFERRED: { label: "Dipindah", color: "bg-yellow-100 text-yellow-800" },
}

export default function AnimalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const animalId = params.animalId as string

  useEffect(() => {
    loadAnimalDetail()
  }, [animalId])

  const loadAnimalDetail = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/animals/${animalId}`)
      if (response.ok) {
        const data = await response.json()
        setAnimal(data)
      } else {
        setError("Failed to load animal details")
      }
    } catch (error) {
      console.error("Error loading animal:", error)
      setError("Error loading animal details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/animals/${animalId}/edit`)
  }

  const handleAddMeasurement = () => {
    router.push(`/animals/${animalId}/measurements/add`)
  }

  const handleAddMedia = () => {
    router.push(`/animals/${animalId}/media/add`)
  }

  const fetchAnimal = () => {
    loadAnimalDetail()
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

  const getLatestMeasurement = () => {
    if (!animal?.measurements.length) return null
    return animal.measurements[0]
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !animal) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">{error || "Animal not found"}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const latestMeasurement = getLatestMeasurement()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Tag className="h-6 w-6" />
              #{animal.tagNumber}
            </h1>
            <p className="text-muted-foreground">
              {SPECIES_MAP[animal.species as keyof typeof SPECIES_MAP]} • {animal.breed}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button onClick={handleAddMeasurement}>
            <Scale className="h-4 w-4 mr-2" />
            Tambah Pengukuran
          </Button>
        </div>
      </div>

      {/* Basic Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={STATUS_MAP[animal.status as keyof typeof STATUS_MAP].color}>
                {STATUS_MAP[animal.status as keyof typeof STATUS_MAP].label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Status</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="font-semibold">{calculateAge(animal.birthDateEstimated)}</span>
            </div>
            <p className="text-sm text-muted-foreground">Umur</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-4 w-4" />
              <span className="font-semibold">
                {latestMeasurement?.weightKg ? `${latestMeasurement.weightKg} kg` : "-"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Berat Terakhir</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4" />
              <span className="font-semibold">{animal.farm.name}</span>
            </div>
            <p className="text-sm text-muted-foreground">Farm</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="measurements">Pengukuran</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="health">Kesehatan</TabsTrigger>
          {animal.sex === "FEMALE" && (
            <TabsTrigger value="reproduction">Reproduksi</TabsTrigger>
          )}
          {(animal.species === "CATTLE" || animal.species === "GOAT") && (
            <TabsTrigger value="milk">Produksi Susu</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nomor Tag:</span>
                  <span className="font-semibold">#{animal.tagNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spesies:</span>
                  <span>{SPECIES_MAP[animal.species as keyof typeof SPECIES_MAP]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Breed:</span>
                  <span>{animal.breed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jenis Kelamin:</span>
                  <span>{animal.sex === "MALE" ? "Jantan" : "Betina"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal Lahir:</span>
                  <span>
                    {animal.birthDateEstimated 
                      ? new Date(animal.birthDateEstimated).toLocaleDateString("id-ID")
                      : "-"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={STATUS_MAP[animal.status as keyof typeof STATUS_MAP].color}>
                    {STATUS_MAP[animal.status as keyof typeof STATUS_MAP].label}
                  </Badge>
                </div>
                {animal.notes && (
                  <div>
                    <span className="text-muted-foreground">Catatan:</span>
                    <p className="mt-1 text-sm">{animal.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lokasi & Hirarki</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenant:</span>
                  <span>{animal.farm.company.tenant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Perusahaan:</span>
                  <span>{animal.farm.company.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Farm:</span>
                  <span className="font-semibold">{animal.farm.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Didaftarkan:</span>
                  <span>{new Date(animal.createdAt).toLocaleDateString("id-ID")}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="measurements">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Riwayat Pengukuran</CardTitle>
              <Button onClick={handleAddMeasurement}>
                <Scale className="h-4 w-4 mr-2" />
                Tambah Pengukuran
              </Button>
            </CardHeader>
            <CardContent>
              {animal.measurements.length > 0 ? (
                <div className="space-y-4">
                  {animal.measurements.map((measurement) => (
                    <div key={measurement.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold">
                          {new Date(measurement.measuredAt).toLocaleDateString("id-ID")}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(measurement.measuredAt).toLocaleTimeString("id-ID")}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {measurement.weightKg && (
                          <div>
                            <span className="text-muted-foreground">Berat:</span>
                            <p className="font-semibold">{measurement.weightKg} kg</p>
                          </div>
                        )}
                        {measurement.heightCm && (
                          <div>
                            <span className="text-muted-foreground">Tinggi:</span>
                            <p className="font-semibold">{measurement.heightCm} cm</p>
                          </div>
                        )}
                        {measurement.bodyLengthCm && (
                          <div>
                            <span className="text-muted-foreground">Panjang:</span>
                            <p className="font-semibold">{measurement.bodyLengthCm} cm</p>
                          </div>
                        )}
                        {measurement.scrotalCircumferenceCm && (
                          <div>
                            <span className="text-muted-foreground">Lingkar Testis:</span>
                            <p className="font-semibold">{measurement.scrotalCircumferenceCm} cm</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Belum ada pengukuran</h3>
                  <p className="text-muted-foreground mb-4">
                    Mulai dengan menambahkan pengukuran pertama
                  </p>
                  <Button onClick={handleAddMeasurement}>
                    <Scale className="h-4 w-4 mr-2" />
                    Tambah Pengukuran
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Media Hewan</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaUpload 
                animalId={animal.id}
                onUploadComplete={() => {
                  // Refresh animal data to show new media
                  fetchAnimal()
                }}
              />
              
              {animal.media.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-4">Media yang sudah diupload</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {animal.media.map((media) => (
                      <div key={media.id} className="space-y-2">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          {media.kind === "PHOTO" ? (
                            <img
                              src={media.url}
                              alt={`${media.pose} view`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={media.url}
                              className="w-full h-full object-cover"
                              controls
                            />
                          )}
                        </div>
                        <div className="text-center">
                          <Badge variant="secondary" className="text-xs">
                            {media.pose}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(media.takenAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <HealthEventList animalId={animal.id} animalName={`${animal.tagNumber}`} />
        </TabsContent>

        {animal.sex === "FEMALE" && (
          <TabsContent value="reproduction">
            <USGList 
              animalId={animal.id} 
              animalName={`${animal.tagNumber}`}
              animalTag={animal.tagNumber}
            />
          </TabsContent>
        )}

        {(animal.species === "CATTLE" || animal.species === "GOAT") && (
          <TabsContent value="milk">
            <MilkYieldList 
              animalId={animal.id}
              animalName={`${animal.tagNumber}`}
              animalTag={animal.tagNumber}
              animalSpecies={animal.species}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
