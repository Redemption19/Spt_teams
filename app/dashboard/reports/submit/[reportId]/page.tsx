'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { ReportService } from '@/lib/report-service';
import { EnhancedReport } from '@/lib/types';

export default function SubmitReportPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const reportId = params.reportId as string;
  const [report, setReport] = useState<EnhancedReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReportData = useCallback(async () => {
    if (!currentWorkspace?.id || !reportId) return;

    try {
      setLoading(true);
      const reportData = await ReportService.getReport(currentWorkspace.id, reportId);
      
      if (!reportData) {
        toast({
          title: 'Error',
          description: 'Report not found.',
          variant: 'destructive',
        });
        router.push('/dashboard/reports');
        return;
      }

      // Check if user can submit this report
      if (reportData.authorId !== user?.uid) {
        toast({
          title: 'Access Denied',
          description: 'You can only submit your own reports.',
          variant: 'destructive',
        });
        router.push('/dashboard/reports');
        return;
      }

      setReport(reportData);
    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, reportId, router, toast, user?.uid]);

  useEffect(() => {
    loadReportData();
  }, [reportId, currentWorkspace?.id, loadReportData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => router.push('/dashboard/calendar')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Calendar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Submit Report</h1>
          <p className="text-muted-foreground">Complete and submit your report</p>
        </div>
      </div>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{report.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Submit form would be displayed here. Redirecting to existing reports page...</p>
            <Button 
              className="mt-4" 
              onClick={() => router.push('/dashboard/reports')}
            >
              Go to Reports Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 