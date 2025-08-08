'use client';

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { RESPONSIVE_PATTERNS } from '@/lib/responsive-utils';
import EmployeeOverviewCard from './EmployeeOverviewCard';
import AttendanceOverviewCard from './AttendanceOverviewCard';
import LeaveOverviewCard from './LeaveOverviewCard';
import PayrollOverviewCard from './PayrollOverviewCard';
import RecruitmentOverviewCard from './RecruitmentOverviewCard';
import HROverviewLoadingSkeleton from './HROverviewLoadingSkeleton';

interface HROverviewProps {
  shouldShowCrossWorkspace?: boolean;
  allWorkspaces?: any[];
  loading?: boolean;
}

export default function HROverview({ 
  shouldShowCrossWorkspace = false, 
  allWorkspaces = [], 
  loading = false 
}: HROverviewProps) {
  const { currentWorkspace } = useWorkspace();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Show skeleton for initial load
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentWorkspace?.id]);

  if (isInitialLoading || loading) {
    return <HROverviewLoadingSkeleton />;
  }

  return (
    <div className={RESPONSIVE_PATTERNS.statsGrid}>
      <EmployeeOverviewCard 
        shouldShowCrossWorkspace={shouldShowCrossWorkspace}
        allWorkspaces={allWorkspaces}
      />
      <AttendanceOverviewCard 
        shouldShowCrossWorkspace={shouldShowCrossWorkspace}
        allWorkspaces={allWorkspaces}
      />
      <LeaveOverviewCard 
        shouldShowCrossWorkspace={shouldShowCrossWorkspace}
        allWorkspaces={allWorkspaces}
      />
      <PayrollOverviewCard 
        shouldShowCrossWorkspace={shouldShowCrossWorkspace}
        allWorkspaces={allWorkspaces}
      />
      <RecruitmentOverviewCard 
        shouldShowCrossWorkspace={shouldShowCrossWorkspace}
        allWorkspaces={allWorkspaces}
      />
    </div>
  );
}