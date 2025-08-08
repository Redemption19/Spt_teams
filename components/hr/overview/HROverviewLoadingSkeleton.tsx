'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HROverviewLoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Employee Card Skeleton */}
      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 w-20 bg-muted-foreground/20 rounded animate-pulse"></div>
          </CardTitle>
          <div className="h-4 w-4 bg-muted-foreground/20 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-muted-foreground/20 rounded animate-pulse mb-2"></div>
          <div className="h-3 w-24 bg-muted-foreground/20 rounded animate-pulse mb-4"></div>
          <div className="flex gap-2">
            <div className="h-6 w-12 bg-muted-foreground/20 rounded animate-pulse"></div>
            <div className="h-6 w-16 bg-muted-foreground/20 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Card Skeleton */}
      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 w-20 bg-muted-foreground/20 rounded animate-pulse"></div>
          </CardTitle>
          <div className="h-4 w-4 bg-muted-foreground/20 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-muted-foreground/20 rounded animate-pulse mb-2"></div>
          <div className="h-3 w-24 bg-muted-foreground/20 rounded animate-pulse mb-4"></div>
          <div className="flex gap-2">
            <div className="h-6 w-14 bg-muted-foreground/20 rounded animate-pulse"></div>
            <div className="h-6 w-12 bg-muted-foreground/20 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Card Skeleton */}
      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 w-16 bg-muted-foreground/20 rounded animate-pulse"></div>
          </CardTitle>
          <div className="h-4 w-4 bg-muted-foreground/20 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-12 bg-muted-foreground/20 rounded animate-pulse mb-2"></div>
          <div className="h-3 w-28 bg-muted-foreground/20 rounded animate-pulse mb-4"></div>
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-muted-foreground/20 rounded animate-pulse"></div>
            <div className="h-6 w-18 bg-muted-foreground/20 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Card Skeleton */}
      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 w-16 bg-muted-foreground/20 rounded animate-pulse"></div>
          </CardTitle>
          <div className="h-4 w-4 bg-muted-foreground/20 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 bg-muted-foreground/20 rounded animate-pulse mb-2"></div>
          <div className="h-3 w-24 bg-muted-foreground/20 rounded animate-pulse mb-4"></div>
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-muted-foreground/20 rounded animate-pulse"></div>
            <div className="h-6 w-14 bg-muted-foreground/20 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* Recruitment Card Skeleton */}
      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 w-24 bg-muted-foreground/20 rounded animate-pulse"></div>
          </CardTitle>
          <div className="h-4 w-4 bg-muted-foreground/20 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-12 bg-muted-foreground/20 rounded animate-pulse mb-2"></div>
          <div className="h-3 w-32 bg-muted-foreground/20 rounded animate-pulse mb-4"></div>
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-muted-foreground/20 rounded animate-pulse"></div>
            <div className="h-6 w-18 bg-muted-foreground/20 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}