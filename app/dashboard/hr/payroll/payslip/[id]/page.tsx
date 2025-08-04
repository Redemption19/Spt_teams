'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { PayrollService, Payslip } from '@/lib/payroll-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { ViewPayslipPage } from '@/components/payroll/ViewPayslipPage';
import { downloadPayslipPDF } from '@/lib/utils/payslip-pdf-generator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function PayslipViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const payslipId = params.id as string;

  useEffect(() => {
    const loadPayslip = async () => {
      if (!payslipId) {
        setError('Payslip ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const payslipData = await PayrollService.getPayslip(payslipId);
        
        if (!payslipData) {
          setError('Payslip not found');
          setLoading(false);
          return;
        }

        setPayslip(payslipData);
      } catch (err) {
        console.error('Error loading payslip:', err);
        setError('Failed to load payslip');
      } finally {
        setLoading(false);
      }
    };

    loadPayslip();
  }, [payslipId]);

  const handleDownload = async () => {
    if (!payslip) return;

    try {
      // Get actual workspace details
      let companyInfo = {
        name: 'Company Name',
        address: 'Business Address',
        city: 'City',
        state: 'State',
        zipCode: '12345',
        phone: '+1 (555) 123-4567',
        email: 'info@company.com',
        website: 'www.company.com'
      };
      
      try {
        const workspace = await WorkspaceService.getWorkspace(payslip.workspaceId);
        if (workspace) {
          companyInfo = {
            name: workspace.name || 'Company Name',
            address: workspace.description || 'Business Address',
            city: 'City',
            state: 'State',
            zipCode: '12345',
            phone: '+1 (555) 123-4567',
            email: 'info@company.com',
            website: 'www.company.com'
          };
        }
      } catch (error) {
        console.error('Error fetching workspace details:', error);
        // Use fallback data if workspace fetch fails
      }
      
      downloadPayslipPDF(payslip, companyInfo);
      toast({
        title: 'Success',
        description: 'Payslip downloaded successfully.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast({
        title: 'Error',
        description: 'Failed to download payslip. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleSend = async () => {
    if (!payslip) return;

    try {
      await PayrollService.sendPayslip(payslip.id);
      toast({
        title: 'Success',
        description: 'Payslip sent successfully.',
        variant: 'default'
      });
      // Reload payslip to update status
      const updatedPayslip = await PayrollService.getPayslip(payslip.id);
      if (updatedPayslip) {
        setPayslip(updatedPayslip);
      }
    } catch (error) {
      console.error('Error sending payslip:', error);
      toast({
        title: 'Error',
        description: 'Failed to send payslip. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !payslip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="card-enhanced max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Payslip</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'Payslip not found'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
              <Button
                onClick={() => router.push('/dashboard/hr/payroll')}
              >
                Go to Payroll
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ViewPayslipPage
      payslip={payslip}
      onDownload={handleDownload}
      onSend={handleSend}
    />
  );
} 