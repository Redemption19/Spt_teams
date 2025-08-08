'use client';

import EmployeeOverviewCard from './EmployeeOverviewCard';
import AttendanceOverviewCard from './AttendanceOverviewCard';
import LeaveOverviewCard from './LeaveOverviewCard';
import PayrollOverviewCard from './PayrollOverviewCard';
import RecruitmentOverviewCard from './RecruitmentOverviewCard';

export default function HROverview() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      <EmployeeOverviewCard />
      <AttendanceOverviewCard />
      <LeaveOverviewCard />
      <PayrollOverviewCard />
      <RecruitmentOverviewCard />
    </div>
  );
}