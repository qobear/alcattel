"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TenantSwitcher } from "@/components/navigation/tenant-switcher"
import { AnimalList } from "@/components/animals/animal-list"
import { AnimalForm } from "@/components/animals/animal-form"

interface Animal {
  id: string
  tagNumber: string
  species: string
  breed: string
  sex: string
  status: string
  ageMonths?: number
  weight?: number
  location?: string
  healthStatus?: string
  milkProduction?: number
  pregnancyStatus?: string
  lastHealthCheck?: string
}

export default function AnimalsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [currentContext, setCurrentContext] = useState({
    tenantId: "",
    companyId: "",
    farmId: ""
  })
  const [filters, setFilters] = useState({
    species: "",
    sex: "",
    status: "",
    search: ""
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (currentContext.farmId) {
      fetchAnimals()
    }
  }, [currentContext, filters])

  const fetchAnimals = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        farmId: currentContext.farmId,
        ...filters
      })
      
      const response = await fetch(`/api/animals?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnimals(data.animals || [])
      }
    } catch (error) {
      console.error("Failed to fetch animals:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleContextChange = (context: any) => {
    setCurrentContext(context)
  }

  const handleAddAnimal = async (animalData: any) => {
    try {
      const response = await fetch('/api/animals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...animalData,
          farmId: currentContext.farmId
        }),
      })

      if (response.ok) {
        await fetchAnimals()
        setShowAddForm(false)
      }
    } catch (error) {
      console.error("Failed to add animal:", error)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600">Loading Animal Management...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🐄</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Animal Management</h1>
                  <p className="text-sm text-gray-500">Manage your livestock and track their health</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Dashboard</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/health")}
                className="flex items-center space-x-2"
              >
                <span>🏥</span>
                <span>Health</span>
              </Button>
              {currentContext.farmId && (
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Add Animal</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Context Switcher */}
        <div className="mb-8">
          <TenantSwitcher
            currentTenant={currentContext.tenantId}
            currentCompany={currentContext.companyId}
            currentFarm={currentContext.farmId}
            onContextChange={handleContextChange}
          />
        </div>

        {!currentContext.farmId ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-4xl">
              🐄
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a Farm to Manage Animals</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Please select a tenant, company, and farm from the context switcher above to view and manage your animals.
            </p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Animals</CardTitle>
                  <div className="text-2xl">🐄</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{animals.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {animals.filter(a => a.status === 'ACTIVE').length} active
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cattle</CardTitle>
                  <div className="text-2xl">🐂</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {animals.filter(a => a.species === 'CATTLE').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Bovine livestock</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Female</CardTitle>
                  <div className="text-2xl">🐄</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-pink-600">
                    {animals.filter(a => a.sex === 'FEMALE').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Dairy cows & heifers</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Male</CardTitle>
                  <div className="text-2xl">🐂</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {animals.filter(a => a.sex === 'MALE').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Bulls & steers</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🔍</span>
                  <span>Filter Animals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Species</label>
                    <select
                      value={filters.species}
                      onChange={(e) => setFilters(prev => ({ ...prev, species: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">All Species</option>
                      <option value="CATTLE">Cattle</option>
                      <option value="SHEEP">Sheep</option>
                      <option value="GOAT">Goat</option>
                      <option value="BUFFALO">Buffalo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
                    <select
                      value={filters.sex}
                      onChange={(e) => setFilters(prev => ({ ...prev, sex: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">All</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">All Status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="SOLD">Sold</option>
                      <option value="DIED">Died</option>
                      <option value="TRANSFERRED">Transferred</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Tag number or breed..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Animal List */}
            <AnimalList 
              animals={animals} 
              loading={loading}
              onRefresh={fetchAnimals}
            />

            {/* Add Animal Form Modal */}
            {showAddForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Add New Animal</h2>
                      <Button
                        variant="ghost"
                        onClick={() => setShowAddForm(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </Button>
                    </div>
                    <AnimalForm
                      onSubmit={handleAddAnimal}
                      onCancel={() => setShowAddForm(false)}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
