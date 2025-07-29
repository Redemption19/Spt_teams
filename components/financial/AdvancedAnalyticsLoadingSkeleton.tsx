import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdvancedAnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-end gap-2 mb-4">
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        <div className="h-10 w-28 bg-muted rounded animate-pulse" />
      </div>
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-muted/70 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-20 bg-muted/70 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Pie Chart 1 Skeleton */}
        <Card>
          <CardHeader className="flex-row items-start space-y-0 pb-0 justify-between">
            <div className="grid gap-1">
              <CardTitle>
                <div className="h-5 w-40 bg-muted rounded animate-pulse mb-2" />
              </CardTitle>
              <CardDescription>
                <div className="h-4 w-32 bg-muted/70 rounded animate-pulse" />
              </CardDescription>
            </div>
            <div className="ml-auto">
              <div className="h-8 w-36 bg-muted rounded animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 justify-center pb-0">
            <div className="mx-auto aspect-square w-full max-w-[300px] flex items-center justify-center">
              <div className="h-48 w-48 rounded-full bg-muted animate-pulse" />
            </div>
          </CardContent>
        </Card>
        {/* Pie Chart 2 Skeleton */}
        <Card>
          <CardHeader className="flex-row items-start space-y-0 pb-0 justify-between">
            <div className="grid gap-1">
              <CardTitle>
                <div className="h-5 w-40 bg-muted rounded animate-pulse mb-2" />
              </CardTitle>
              <CardDescription>
                <div className="h-4 w-32 bg-muted/70 rounded animate-pulse" />
              </CardDescription>
            </div>
            <div className="ml-auto">
              <div className="h-8 w-36 bg-muted rounded animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 justify-center pb-0">
            <div className="mx-auto aspect-square w-full max-w-[300px] flex items-center justify-center">
              <div className="h-48 w-48 rounded-full bg-muted animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Bar Chart Skeleton */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="h-5 w-48 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-muted/70 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-40 w-full bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 