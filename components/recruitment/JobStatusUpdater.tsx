'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { JobPosting, RecruitmentService } from '@/lib/recruitment-service';
import { useToast } from '@/hooks/use-toast';

interface JobStatusUpdaterProps {
  jobPostings: JobPosting[];
  onJobUpdated: () => void;
}

export default function JobStatusUpdater({ jobPostings, onJobUpdated }: JobStatusUpdaterProps) {
  const { toast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);

  const draftJobs = jobPostings.filter(job => job.status === 'draft');
  const activeJobs = jobPostings.filter(job => job.status === 'active');

  const handleUpdateStatus = async (jobId: string, newStatus: 'draft' | 'active') => {
    setUpdating(jobId);
    try {
      await RecruitmentService.updateJobPosting(jobId, { status: newStatus });
      toast({
        title: 'Status Updated',
        description: `Job status updated to ${newStatus === 'active' ? 'Active (Public)' : 'Draft'}`,
      });
      onJobUpdated();
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update job status. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUpdating(null);
    }
  };

  if (draftJobs.length === 0) {
    return null;
  }

  return (
    <Card className="card-enhanced border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/20 dark:border-yellow-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="w-5 h-5" />
          Draft Jobs Found
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
          You have {draftJobs.length} job posting(s) saved as draft. Draft jobs are not visible on the public careers page.
        </p>
        
        <div className="space-y-3">
          {draftJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-3 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-white dark:bg-gray-900">
              <div className="flex-1">
                <h4 className="font-medium">{job.title}</h4>
                <p className="text-sm text-muted-foreground">{job.department} • {job.location}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                    <Clock className="w-3 h-3 mr-1" />
                    Draft
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Not visible on careers page
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus(job.id, 'active')}
                  disabled={updating === job.id}
                  className="text-green-700 border-green-300 hover:bg-green-50"
                >
                  {updating === job.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-1" />
                  )}
                  Make Public
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Active Jobs: {activeJobs.length}</span>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Active jobs are visible on the public careers page at /careers
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 