import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Search, Filter } from 'lucide-react';
import { ReportCard } from '@/components/reports/MemberReport/ReportCard'; // Import ReportCard
import { EnhancedReport, ReportTemplate } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { StatusFilter } from '@/components/reports/MemberReport/my-reports'; // Adjust path based on your file structure

interface ReportListProps {
  reports: EnhancedReport[];
  templates: ReportTemplate[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  onViewReport: (report: EnhancedReport) => void;
  onEditReport: (report: EnhancedReport) => void;
  onResubmitReport: (report: EnhancedReport) => void;
  onDeleteReport: (report: EnhancedReport) => void;
  canEditReport: (report: EnhancedReport) => boolean;
  canDeleteReport: (report: EnhancedReport) => boolean;
  canResubmitReport: (report: EnhancedReport) => boolean;
  isDeleting: string | null;
  loading?: boolean;
}

// Skeleton loading components
const ReportCardSkeleton = () => (
  <Card className="card-interactive">
    <CardContent className="p-4 sm:p-6">
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        {/* Button skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const FilterSkeleton = () => (
  <div className="flex flex-col sm:flex-row gap-4">
    <div className="flex-1">
      <Skeleton className="h-10 w-full" />
    </div>
    <Skeleton className="h-10 w-[180px]" />
  </div>
);

export function ReportList({
  reports,
  templates,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onViewReport,
  onEditReport,
  onResubmitReport,
  onDeleteReport,
  canEditReport,
  canDeleteReport,
  canResubmitReport,
  isDeleting,
  loading,
}: ReportListProps) {
  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search reports by title or template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Reports" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reports</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="space-y-6">
          <FilterSkeleton />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ReportCardSkeleton key={index} />
            ))}
          </div>
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No reports found' : 'No reports yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by creating your first report.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link href="/dashboard/reports?view=submit-report">
                <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Report
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              templates={templates}
              onView={onViewReport}
              onEdit={onEditReport}
              onResubmit={onResubmitReport}
              onDelete={onDeleteReport}
              canEditReport={canEditReport}
              canDeleteReport={canDeleteReport}
              canResubmitReport={canResubmitReport}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </>
  );
}