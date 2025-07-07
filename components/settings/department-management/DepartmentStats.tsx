import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, Crown } from 'lucide-react';

interface DepartmentStatsProps {
  stats: {
    totalDepartments: number;
    activeDepartments: number;
    totalMembers: number;
    departmentsWithHeads: number;
  };
}

export function DepartmentStats({ stats }: DepartmentStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Departments</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-xl sm:text-2xl font-bold">{stats.totalDepartments}</div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">Active Departments</CardTitle>
          <Building className="h-4 w-4 text-green-600 flex-shrink-0" />
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-xl sm:text-2xl font-bold">{stats.activeDepartments}</div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-xl sm:text-2xl font-bold">{stats.totalMembers}</div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">With Heads</CardTitle>
          <Crown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-xl sm:text-2xl font-bold">{stats.departmentsWithHeads}</div>
        </CardContent>
      </Card>
    </div>
  );
}