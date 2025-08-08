'use client';

import { useState } from 'react';
import { useVideoCallAnalytics } from '@/hooks/use-video-call-data';
import { AnalyticsDashboard } from '@/components/video-call/analytics-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Calendar, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VideoCallAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const { toast } = useToast();
  const { analytics, loading } = useVideoCallAnalytics(timeRange);

  const handleExportPDF = () => {
    toast({
      title: 'Export Started',
      description: 'Generating PDF report...'
    });
    // In a real implementation, this would generate and download a PDF
  };

  const handleExportCSV = () => {
    toast({
      title: 'Export Started',
      description: 'Generating CSV report...'
    });
    // In a real implementation, this would generate and download a CSV
  };

  const handleExportExcel = () => {
    toast({
      title: 'Export Started',
      description: 'Generating Excel report...'
    });
    // In a real implementation, this would generate and download an Excel file
  };

  const handleScheduleReport = () => {
    toast({
      title: 'Schedule Report',
      description: 'Report scheduling feature coming soon!'
    });
    // In a real implementation, this would open a scheduling dialog
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Video Call Analytics</h1>
          <p className="text-muted-foreground">
            Track your video call usage, quality, and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        analytics={analytics}
        loading={loading}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Analytics
          </CardTitle>
          <CardDescription>
            Download detailed analytics reports in various formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export as PDF
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export as CSV
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Export as Excel
            </Button>
            <Button variant="outline" onClick={handleScheduleReport}>
              <Zap className="h-4 w-4 mr-2" />
              Schedule Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}