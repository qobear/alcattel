"use client"

import { useState, useEffect } from "react"
import { AnimalList } from "@/components/animals/animal-list"
import { AnimalForm } from "@/components/animals/animal-form"

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

export default function AnimalsPage() {
  const [animals, setAnimals] = useState<Animal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null)
  const [currentFarmId] = useState("farm-1") // This should come from context/session

  useEffect(() => {
    loadAnimals()
  }, [currentFarmId])

  const loadAnimals = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/animals?farmId=${currentFarmId}`)
      if (response.ok) {
        const data = await response.json()
        setAnimals(data.animals || [])
      } else {
        console.error("Failed to load animals")
      }
    } catch (error) {
      console.error("Error loading animals:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAnimal = () => {
    setEditingAnimal(null)
    setShowForm(true)
  }

  const handleEditAnimal = (animalId: string) => {
    const animal = animals.find(a => a.id === animalId)
    if (animal) {
      setEditingAnimal(animal)
      setShowForm(true)
    }
  }

  const handleViewAnimal = (animalId: string) => {
    // Navigate to animal detail page
    window.location.href = `/animals/${animalId}`
  }

  const handleFormSubmit = async (data: any) => {
    try {
      const url = editingAnimal 
        ? `/api/animals/${editingAnimal.id}`
        : `/api/animals`
      
      const method = editingAnimal ? "PUT" : "POST"
      
      const payload = {
        ...data,
        farmId: currentFarmId,
        birthDateEstimated: data.birthDateEstimated?.toISOString(),
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setShowForm(false)
        setEditingAnimal(null)
        await loadAnimals()
      } else {
        const error = await response.json()
        console.error("Failed to save animal:", error)
        alert(error.error || "Failed to save animal")
      }
    } catch (error) {
      console.error("Error saving animal:", error)
      alert("Error saving animal")
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingAnimal(null)
  }

  if (showForm) {
    return (
      <div className="container mx-auto p-6">
        <AnimalForm
          initialData={editingAnimal ? {
            species: editingAnimal.species as any,
            breed: editingAnimal.breed,
            sex: editingAnimal.sex as any,
            tagNumber: editingAnimal.tagNumber,
            birthDateEstimated: editingAnimal.birthDateEstimated ? new Date(editingAnimal.birthDateEstimated) : undefined,
            notes: editingAnimal.notes || undefined,
            status: editingAnimal.status as any,
          } : undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isEditing={!!editingAnimal}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <AnimalList
        animals={animals}
        onAddAnimal={handleAddAnimal}
        onEditAnimal={handleEditAnimal}
        onViewAnimal={handleViewAnimal}
        isLoading={isLoading}
      />
    </div>
  )
}
