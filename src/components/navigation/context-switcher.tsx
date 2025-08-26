'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  MapPin, 
  Users, 
  ChevronRight,
  Home,
  Globe
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  companies: Company[];
}

interface Company {
  id: string;
  name: string;
  description: string;
  farms: Farm[];
}

interface Farm {
  id: string;
  name: string;
  location: string;
  animalCount: number;
}

interface ContextSwitcherProps {
  onContextChange?: (context: {
    tenantId?: string;
    companyId?: string;
    farmId?: string;
  }) => void;
}

export function ContextSwitcher({ onContextChange }: ContextSwitcherProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Mock data for development - replace with actual API calls
  useEffect(() => {
    const mockData: Tenant[] = [
      {
        id: 'tenant-1',
        name: 'AllCattle Enterprise',
        slug: 'allcattle',
        companies: [
          {
            id: 'company-1',
            name: 'Central Livestock Co.',
            description: 'Main livestock operations',
            farms: [
              {
                id: 'farm-1',
                name: 'North Farm',
                location: 'Jakarta, Indonesia',
                animalCount: 245
              },
              {
                id: 'farm-2',
                name: 'South Farm',
                location: 'Bogor, Indonesia',
                animalCount: 189
              }
            ]
          },
          {
            id: 'company-2',
            name: 'Dairy Operations Ltd.',
            description: 'Specialized dairy production',
            farms: [
              {
                id: 'farm-3',
                name: 'Dairy Farm Alpha',
                location: 'Bandung, Indonesia',
                animalCount: 156
              }
            ]
          }
        ]
      }
    ];

    setTimeout(() => {
      setTenants(mockData);
      // Auto-select first tenant if available
      if (mockData.length > 0) {
        setSelectedTenant(mockData[0].id);
        if (mockData[0].companies.length > 0) {
          setSelectedCompany(mockData[0].companies[0].id);
          if (mockData[0].companies[0].farms.length > 0) {
            setSelectedFarm(mockData[0].companies[0].farms[0].id);
          }
        }
      }
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (onContextChange) {
      onContextChange({
        tenantId: selectedTenant || undefined,
        companyId: selectedCompany || undefined,
        farmId: selectedFarm || undefined,
      });
    }
  }, [selectedTenant, selectedCompany, selectedFarm, onContextChange]);

  const currentTenant = tenants.find(t => t.id === selectedTenant);
  const currentCompany = currentTenant?.companies.find(c => c.id === selectedCompany);
  const currentFarm = currentCompany?.farms.find(f => f.id === selectedFarm);

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId);
    setSelectedCompany('');
    setSelectedFarm('');
    
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant && tenant.companies.length > 0) {
      setSelectedCompany(tenant.companies[0].id);
      if (tenant.companies[0].farms.length > 0) {
        setSelectedFarm(tenant.companies[0].farms[0].id);
      }
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId);
    setSelectedFarm('');
    
    const company = currentTenant?.companies.find(c => c.id === companyId);
    if (company && company.farms.length > 0) {
      setSelectedFarm(company.farms[0].id);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Context Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Context Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tenant Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization</label>
            <Select value={selectedTenant} onValueChange={handleTenantChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {tenant.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company Selection */}
          {currentTenant && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Select value={selectedCompany} onValueChange={handleCompanyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {currentTenant.companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <div>
                          <div>{company.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {company.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Farm Selection */}
          {currentCompany && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Farm</label>
              <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select farm" />
                </SelectTrigger>
                <SelectContent>
                  {currentCompany.farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id}>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        <div>
                          <div>{farm.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {farm.location}
                            <span className="mx-1">•</span>
                            <Users className="h-3 w-3" />
                            {farm.animalCount} animals
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Context Summary */}
      {currentFarm && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-xs">Current Context</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Organization:</span>
                  <span className="font-medium">{currentTenant?.name}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{currentCompany?.name}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Home className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Farm:</span>
                  <span className="font-medium">{currentFarm?.name}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{currentFarm?.location}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Animals:</span>
                  <Badge variant="secondary">{currentFarm?.animalCount}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="text-sm font-medium mb-3">Quick Actions</div>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" className="justify-start">
                View Animals
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                Add New Animal
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                Health Records
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                Production Reports
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
