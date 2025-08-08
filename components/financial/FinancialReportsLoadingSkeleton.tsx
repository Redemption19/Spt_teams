'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function FinancialReportsLoadingSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <Skeleton className="h-6 sm:h-8 w-40 sm:w-48" />
          <Skeleton className="h-3 sm:h-4 w-64 sm:w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 sm:h-10 w-28 sm:w-32" />
          <Skeleton className="h-9 sm:h-10 w-32 sm:w-36" />
        </div>
      </div>

      {/* Quick Insights Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
              <Skeleton className="h-3 sm:h-4 w-3 sm:w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 mb-1.5 sm:mb-2" />
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Skeleton className="h-2.5 sm:h-3 w-6 sm:w-8" />
                <Skeleton className="h-2.5 sm:h-3 w-20 sm:w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-8 sm:h-9 w-16 sm:w-20" />
          ))}
        </div>

        {/* Tab Content Skeleton */}
        <div className="space-y-3 sm:space-y-4">
          {/* Filters Card Skeleton */}
          <Card className="card-enhanced">
            <CardHeader>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Skeleton className="h-4 sm:h-5 w-4 sm:w-5" />
                <Skeleton className="h-5 sm:h-6 w-28 sm:w-32" />
              </div>
              <Skeleton className="h-3 sm:h-4 w-56 sm:w-64" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-1.5 sm:space-y-2">
                    <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                    <Skeleton className="h-9 sm:h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Most Used Reports Skeleton */}
          <Card className="card-enhanced">
            <CardHeader>
              <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
              <Skeleton className="h-3 sm:h-4 w-60 sm:w-72" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5 sm:space-y-2 flex-1">
                        <Skeleton className="h-4 sm:h-5 w-40 sm:w-48" />
                        <Skeleton className="h-3 sm:h-4 w-full" />
                        <Skeleton className="h-3 sm:h-4 w-3/4" />
                      </div>
                      <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20" />
                      <Skeleton className="h-2.5 sm:h-3 w-20 sm:w-24" />
                    </div>
                    
                    <Skeleton className="h-8 sm:h-9 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function ReportTemplatesLoadingSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <Skeleton className="h-6 sm:h-8 w-40 sm:w-48" />
          <Skeleton className="h-3 sm:h-4 w-64 sm:w-80" />
        </div>
        <Skeleton className="h-9 sm:h-10 w-32 sm:w-36" />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-7 sm:h-8 w-20 sm:w-24" />
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 9 }).map((_, index) => (
          <Card key={index} className="card-enhanced">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 sm:space-y-2 flex-1">
                  <Skeleton className="h-5 sm:h-6 w-40 sm:w-48" />
                  <Skeleton className="h-3 sm:h-4 w-full" />
                  <Skeleton className="h-3 sm:h-4 w-3/4" />
                </div>
                <Skeleton className="h-5 sm:h-6 w-14 sm:w-16" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20" />
                  <Skeleton className="h-2.5 sm:h-3 w-20 sm:w-24" />
                  <Skeleton className="h-2.5 sm:h-3 w-12 sm:w-16" />
                </div>
                
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {Array.from({ length: 3 }).map((_, tagIndex) => (
                    <Skeleton key={tagIndex} className="h-5 sm:h-6 w-14 sm:w-16" />
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Skeleton className="h-8 sm:h-9 flex-1" />
                  <Skeleton className="h-8 sm:h-9 w-16 sm:w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ReportHistoryLoadingSkeleton() {
  return (
    <Card className="card-enhanced">
      <CardHeader>
        <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
        <Skeleton className="h-3 sm:h-4 w-64 sm:w-80" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <Skeleton className="h-3 sm:h-4 w-14 sm:w-16 mb-1.5 sm:mb-2" />
              <Skeleton className="h-9 sm:h-10 w-full" />
            </div>
            <div className="w-full sm:w-48">
              <Skeleton className="h-3 sm:h-4 w-16 sm:w-20 mb-1.5 sm:mb-2" />
              <Skeleton className="h-9 sm:h-10 w-full" />
            </div>
            <div className="w-full sm:w-32">
              <Skeleton className="h-3 sm:h-4 w-14 sm:w-16 mb-1.5 sm:mb-2" />
              <Skeleton className="h-9 sm:h-10 w-full" />
            </div>
          </div>

          {/* Report List */}
          <div className="space-y-2.5 sm:space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="border rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <Skeleton className="h-8 sm:h-10 w-8 sm:w-10 rounded" />
                    <div className="space-y-1.5 sm:space-y-2 flex-1">
                      <Skeleton className="h-4 sm:h-5 w-48 sm:w-64" />
                      <div className="flex items-center gap-3 sm:gap-4">
                        <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20" />
                        <Skeleton className="h-2.5 sm:h-3 w-20 sm:w-24" />
                        <Skeleton className="h-2.5 sm:h-3 w-12 sm:w-16" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Skeleton className="h-5 sm:h-6 w-14 sm:w-16" />
                    <Skeleton className="h-7 sm:h-8 w-7 sm:w-8 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t">
            <Skeleton className="h-3 sm:h-4 w-28 sm:w-32" />
            <div className="flex gap-1.5 sm:gap-2">
              <Skeleton className="h-7 sm:h-8 w-16 sm:w-20" />
              <Skeleton className="h-7 sm:h-8 w-7 sm:w-8" />
              <Skeleton className="h-7 sm:h-8 w-7 sm:w-8" />
              <Skeleton className="h-7 sm:h-8 w-7 sm:w-8" />
              <Skeleton className="h-7 sm:h-8 w-16 sm:w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}