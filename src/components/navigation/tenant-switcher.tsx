"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TenantInfo {
  id: string
  name: string
  plan: string
  companies: CompanyInfo[]
}

interface CompanyInfo {
  id: string
  name: string
  location?: string
  farms: FarmInfo[]
}

interface FarmInfo {
  id: string
  name: string
  location?: string
  animalCount: number
}

interface TenantSwitcherProps {
  currentTenant?: string
  currentCompany?: string
  currentFarm?: string
  onContextChange?: (context: {
    tenantId: string
    companyId?: string
    farmId?: string
  }) => void
}

export function TenantSwitcher({
  currentTenant,
  currentCompany,
  currentFarm,
  onContextChange
}: TenantSwitcherProps) {
  const [tenants, setTenants] = useState<TenantInfo[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>(currentTenant || "")
  const [selectedCompany, setSelectedCompany] = useState<string>(currentCompany || "")
  const [selectedFarm, setSelectedFarm] = useState<string>(currentFarm || "")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchTenantData()
  }, [])

  const fetchTenantData = async () => {
    try {
      const response = await fetch("/api/tenants/context")
      if (response.ok) {
        const data = await response.json()
        setTenants(data.tenants)
        
        // Set defaults if not provided
        if (!selectedTenant && data.tenants.length > 0) {
          setSelectedTenant(data.tenants[0].id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch tenant data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentTenant = () => {
    return tenants.find(t => t.id === selectedTenant)
  }

  const getCurrentCompany = () => {
    const tenant = getCurrentTenant()
    return tenant?.companies.find(c => c.id === selectedCompany)
  }

  const getCurrentFarm = () => {
    const company = getCurrentCompany()
    return company?.farms.find(f => f.id === selectedFarm)
  }

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId)
    setSelectedCompany("")
    setSelectedFarm("")
    onContextChange?.({ tenantId })
  }

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId)
    setSelectedFarm("")
    onContextChange?.({ 
      tenantId: selectedTenant, 
      companyId 
    })
  }

  const handleFarmChange = (farmId: string) => {
    setSelectedFarm(farmId)
    onContextChange?.({ 
      tenantId: selectedTenant, 
      companyId: selectedCompany, 
      farmId 
    })
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-48"></div>
      </div>
    )
  }

  const currentTenantData = getCurrentTenant()
  const currentCompanyData = getCurrentCompany()
  const currentFarmData = getCurrentFarm()

  return (
    <div className="space-y-4">
      {/* Context Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span className="font-medium text-gray-900">Current Context:</span>
        <div className="flex items-center space-x-1">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            🏢 {currentTenantData?.name || "Select Tenant"}
          </Badge>
          {currentCompanyData && (
            <>
              <span>→</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                🏭 {currentCompanyData.name}
              </Badge>
            </>
          )}
          {currentFarmData && (
            <>
              <span>→</span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                🏡 {currentFarmData.name}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Switcher Controls */}
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔄</span>
            <span>Switch Organization Context</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tenant Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tenant Organization</label>
              <Select value={selectedTenant} onValueChange={handleTenantChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      <div className="flex items-center space-x-2">
                        <span>🏢</span>
                        <span>{tenant.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {tenant.plan}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Company</label>
              <Select 
                value={selectedCompany} 
                onValueChange={handleCompanyChange}
                disabled={!selectedTenant}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company..." />
                </SelectTrigger>
                <SelectContent>
                  {currentTenantData?.companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      <div className="flex items-center space-x-2">
                        <span>🏭</span>
                        <span>{company.name}</span>
                        {company.location && (
                          <Badge variant="outline" className="ml-2">
                            📍 {company.location}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Farm Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Farm</label>
              <Select 
                value={selectedFarm} 
                onValueChange={handleFarmChange}
                disabled={!selectedCompany}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select farm..." />
                </SelectTrigger>
                <SelectContent>
                  {currentCompanyData?.farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id}>
                      <div className="flex items-center space-x-2">
                        <span>🏡</span>
                        <span>{farm.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {farm.animalCount} animals
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Context Summary */}
          {currentFarmData && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Current Selection Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Tenant:</span>
                  <div className="font-medium">{currentTenantData?.name}</div>
                  <div className="text-xs text-gray-500">{currentTenantData?.plan} plan</div>
                </div>
                <div>
                  <span className="text-gray-600">Company:</span>
                  <div className="font-medium">{currentCompanyData?.name}</div>
                  <div className="text-xs text-gray-500">{currentCompanyData?.location}</div>
                </div>
                <div>
                  <span className="text-gray-600">Farm:</span>
                  <div className="font-medium">{currentFarmData.name}</div>
                  <div className="text-xs text-gray-500">{currentFarmData.animalCount} animals managed</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push("/dashboard")}
                disabled={!selectedTenant}
              >
                📊 Dashboard
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push("/animals")}
                disabled={!selectedFarm}
              >
                🐄 Animals
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push("/analytics")}
                disabled={!selectedCompany}
              >
                📈 Analytics
              </Button>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              variant="ghost" 
              size="sm"
            >
              🔄 Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
