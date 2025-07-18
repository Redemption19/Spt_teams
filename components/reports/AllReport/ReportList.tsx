import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { EnhancedReport, ReportTemplate, User } from '@/lib/types';
import { ReportCard } from './ReportCard';
import Link from 'next/link';

interface ReportListProps {
  reports: EnhancedReport[];
  templates: ReportTemplate[];
  users: User[];
  departments: any[];
  onViewReport: (report: EnhancedReport) => void;
  loading: boolean;
  canManageReports?: boolean;
  onComment?: (report: EnhancedReport) => void;
  onDelete?: (report: EnhancedReport) => void;
  onArchive?: (report: EnhancedReport) => void;
}

export function ReportList({
  reports,
  templates,
  users,
  departments,
  onViewReport,
  loading,
  canManageReports,
  onComment,
  onDelete,
  onArchive,
}: ReportListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="border border-border/50 h-full">
            <CardContent className="p-4 sm:p-6">
              <div className="animate-pulse space-y-4">
                {/* Header skeleton */}
                <div className="space-y-2">
                  <div className="h-5 sm:h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
                
                {/* Content skeleton */}
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                
                {/* Button skeleton */}
                <div className="h-11 sm:h-10 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card className="border border-border/50">
        <CardContent className="text-center py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-md mx-auto space-y-4 sm:space-y-6">
            <div className="flex justify-center">
              <div className="p-4 sm:p-6 bg-muted/50 rounded-full">
                <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                No reports found
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                No reports match your current filter criteria. Try adjusting your filters or create a new report.
              </p>
            </div>
            
            <div className="pt-2 sm:pt-4">
              <Link href="/dashboard/reports?view=submit-report">
                <Button 
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white min-h-[44px] sm:min-h-[40px] px-6 sm:px-8 touch-manipulation font-medium"
                >
                  <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                  Create New Report
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Results count - Mobile-friendly */}
      <div className="flex items-center justify-between px-1">
        <div className="text-sm sm:text-base text-muted-foreground">
          {reports.length} report{reports.length !== 1 ? 's' : ''} found
        </div>
        
        {/* Optional: Sort dropdown could go here */}
      </div>
      
      {/* Reports Grid - Enhanced Mobile-First Layout */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            templates={templates}
            users={users}
            departments={departments}
            onView={onViewReport}
            canManageReports={canManageReports}
            onComment={onComment}
            onDelete={onDelete}
            onArchive={onArchive}
          />
        ))}
      </div>
      
      {/* Load more section if needed */}
      {reports.length >= 20 && (
        <div className="flex justify-center pt-4 sm:pt-6">
          <div className="text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full">
            Showing {reports.length} reports
          </div>
        </div>
      )}
    </div>
  );
}