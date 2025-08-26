'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  BarChart3, 
  Calendar as CalendarIcon,
  Filter,
  TrendingUp,
  PieChart,
  Activity
} from 'lucide-react';
import { format } from "date-fns";

interface ReportConfig {
  type: string;
  title: string;
  description: string;
  fields: string[];
  filters: string[];
  exportFormats: string[];
}

const REPORT_TEMPLATES: Record<string, ReportConfig> = {
  population: {
    type: 'population',
    title: 'Population Report',
    description: 'Animal population distribution and demographics',
    fields: ['species', 'sex', 'age', 'status', 'farm', 'registration_date'],
    filters: ['species', 'sex', 'status', 'farm', 'date_range'],
    exportFormats: ['PDF', 'Excel', 'CSV']
  },
  health: {
    type: 'health',
    title: 'Health Management Report',
    description: 'Health events, vaccinations, and treatments',
    fields: ['animal_id', 'event_type', 'date', 'status', 'operator', 'cost'],
    filters: ['event_type', 'status', 'animal', 'date_range'],
    exportFormats: ['PDF', 'Excel', 'CSV']
  },
  reproduction: {
    type: 'reproduction',
    title: 'Reproduction Report',
    description: 'USG results, pregnancy status, and breeding performance',
    fields: ['animal_id', 'usg_date', 'result', 'fetus_age', 'due_date', 'operator'],
    filters: ['result', 'animal', 'date_range'],
    exportFormats: ['PDF', 'Excel', 'CSV']
  },
  production: {
    type: 'production',
    title: 'Milk Production Report',
    description: 'Daily milk yields and production trends',
    fields: ['animal_id', 'date', 'morning_yield', 'evening_yield', 'total_yield', 'quality'],
    filters: ['animal', 'date_range', 'quality'],
    exportFormats: ['PDF', 'Excel', 'CSV']
  },
  growth: {
    type: 'growth',
    title: 'Growth Performance Report',
    description: 'Weight measurements and growth trends',
    fields: ['animal_id', 'date', 'weight', 'height', 'body_length', 'adg'],
    filters: ['animal', 'date_range'],
    exportFormats: ['PDF', 'Excel', 'CSV']
  },
  financial: {
    type: 'financial',
    title: 'Financial Summary Report',
    description: 'Costs, revenue, and financial performance',
    fields: ['category', 'description', 'amount', 'date', 'animal_id'],
    filters: ['category', 'date_range'],
    exportFormats: ['PDF', 'Excel']
  }
};

export function ReportsGenerator() {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleGenerateReport = async (format: string) => {
    if (!selectedReport) return;

    setIsGenerating(true);
    try {
      const params = new URLSearchParams({
        type: selectedReport,
        format: format.toLowerCase(),
        ...filters,
        ...(dateRange.from && { start_date: dateRange.from.toISOString() }),
        ...(dateRange.to && { end_date: dateRange.to.toISOString() }),
      });

      const response = await fetch(`/api/reports/generate?${params}`, {
        method: 'POST',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReport}_report_${format.toLowerCase()}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      // TODO: Show error notification
    } finally {
      setIsGenerating(false);
    }
  };

  const currentTemplate = selectedReport ? REPORT_TEMPLATES[selectedReport] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports Generator</h1>
        <p className="text-muted-foreground">
          Generate comprehensive reports for farm analytics and compliance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Templates</CardTitle>
              <CardDescription>Select a report template to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(REPORT_TEMPLATES).map(([key, template]) => (
                <div
                  key={key}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedReport === key 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedReport(key)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {template.type === 'population' && <BarChart3 className="h-4 w-4" />}
                      {template.type === 'health' && <Activity className="h-4 w-4" />}
                      {template.type === 'reproduction' && <TrendingUp className="h-4 w-4" />}
                      {template.type === 'production' && <PieChart className="h-4 w-4" />}
                      {template.type === 'growth' && <TrendingUp className="h-4 w-4" />}
                      {template.type === 'financial' && <FileText className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{template.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-4">
          {currentTemplate ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{currentTemplate.title}</CardTitle>
                  <CardDescription>{currentTemplate.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="filters" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="filters">Filters</TabsTrigger>
                      <TabsTrigger value="fields">Fields</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>

                    <TabsContent value="filters" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Date Range */}
                        <div className="space-y-2">
                          <Label>Date Range</Label>
                          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange.from ? (
                                  dateRange.to ? (
                                    <>
                                      {format(dateRange.from, "LLL dd, y")} -{" "}
                                      {format(dateRange.to, "LLL dd, y")}
                                    </>
                                  ) : (
                                    format(dateRange.from, "LLL dd, y")
                                  )
                                ) : (
                                  <span>Pick a date range</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Dynamic Filters */}
                        {currentTemplate.filters.includes('species') && (
                          <div className="space-y-2">
                            <Label>Species</Label>
                            <Select 
                              value={filters.species || ''} 
                              onValueChange={(value) => setFilters({...filters, species: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All species" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">All species</SelectItem>
                                <SelectItem value="CATTLE">Cattle</SelectItem>
                                <SelectItem value="GOAT">Goat</SelectItem>
                                <SelectItem value="SHEEP">Sheep</SelectItem>
                                <SelectItem value="BUFFALO">Buffalo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {currentTemplate.filters.includes('sex') && (
                          <div className="space-y-2">
                            <Label>Sex</Label>
                            <Select 
                              value={filters.sex || ''} 
                              onValueChange={(value) => setFilters({...filters, sex: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">All</SelectItem>
                                <SelectItem value="MALE">Male</SelectItem>
                                <SelectItem value="FEMALE">Female</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {currentTemplate.filters.includes('status') && (
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select 
                              value={filters.status || ''} 
                              onValueChange={(value) => setFilters({...filters, status: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All statuses" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">All statuses</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="SOLD">Sold</SelectItem>
                                <SelectItem value="DECEASED">Deceased</SelectItem>
                                <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Animal ID Filter */}
                        {currentTemplate.filters.includes('animal') && (
                          <div className="space-y-2">
                            <Label>Animal ID</Label>
                            <Input
                              placeholder="Enter tag number"
                              value={filters.animalId || ''}
                              onChange={(e) => setFilters({...filters, animalId: e.target.value})}
                            />
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="fields" className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-3">Included Fields</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {currentTemplate.fields.map((field) => (
                            <Badge key={field} variant="secondary" className="justify-center">
                              {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="preview" className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Report Configuration</h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>Type:</strong> {currentTemplate.title}</div>
                          <div><strong>Date Range:</strong> {
                            dateRange.from && dateRange.to 
                              ? `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`
                              : 'All time'
                          }</div>
                          <div><strong>Filters:</strong> {
                            Object.entries(filters).filter(([_, value]) => value).length > 0
                              ? Object.entries(filters).filter(([_, value]) => value).map(([key, value]) => `${key}: ${value}`).join(', ')
                              : 'None'
                          }</div>
                          <div><strong>Fields:</strong> {currentTemplate.fields.length} columns</div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export Options</CardTitle>
                  <CardDescription>Choose your preferred export format</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {currentTemplate.exportFormats.map((format) => (
                      <Button
                        key={format}
                        onClick={() => handleGenerateReport(format)}
                        disabled={isGenerating}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export as {format}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a report template to get started</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
