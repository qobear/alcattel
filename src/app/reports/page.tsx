import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { ReportsGenerator } from '@/components/analytics/reports-generator';

export default function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Analytics Dashboard</TabsTrigger>
          <TabsTrigger value="reports">Generate Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <AnalyticsDashboard />
        </TabsContent>
        
        <TabsContent value="reports">
          <ReportsGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const metadata = {
  title: 'Reports & Analytics | AllCattle Farm',
  description: 'Generate comprehensive reports and view analytics for livestock management',
};
