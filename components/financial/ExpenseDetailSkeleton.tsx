import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ExpenseDetailSkeleton() {
  return (
    <div className="space-y-6 container mx-auto py-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 bg-muted rounded animate-pulse" />
          <div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="h-6 w-24 bg-blue-100 rounded animate-pulse" />
            </div>
            <div className="h-4 w-40 bg-muted/70 rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <Tabs value="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details" className="h-8 w-24 bg-muted rounded animate-pulse" />
          <TabsTrigger value="history" className="h-8 w-24 bg-muted rounded animate-pulse" />
        </TabsList>
        <TabsContent value="details" className="space-y-6">
          {/* Amount Card Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="h-4 w-24 bg-muted/70 rounded animate-pulse mb-2" />
                  <div className="h-8 w-32 bg-muted rounded animate-pulse" />
                </div>
                <div>
                  <div className="h-4 w-24 bg-muted/70 rounded animate-pulse mb-2" />
                  <div className="h-8 w-32 bg-green-100 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted/50 rounded animate-pulse mt-2" />
                </div>
                <div>
                  <div className="h-4 w-24 bg-muted/70 rounded animate-pulse mb-2" />
                  <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-20 bg-muted/50 rounded animate-pulse mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information Card Skeleton */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 w-32 bg-muted/70 rounded animate-pulse" />
                <div className="h-4 w-40 bg-muted/70 rounded animate-pulse" />
                <div className="h-4 w-32 bg-muted/70 rounded animate-pulse" />
                <div className="h-4 w-40 bg-muted/70 rounded animate-pulse" />
              </CardContent>
            </Card>
            {/* Properties & Tags Card Skeleton */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                <div className="h-6 w-24 bg-muted/70 rounded animate-pulse" />
                <div className="h-6 w-20 bg-muted/50 rounded animate-pulse" />
              </div>
                <div className="h-4 w-32 bg-muted/70 rounded animate-pulse" />
                <div className="flex gap-2 flex-wrap">
                  <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />
                </div>
                <div className="h-4 w-32 bg-muted/70 rounded animate-pulse" />
                <div className="h-4 w-32 bg-muted/70 rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>

          {/* Receipt Card Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle className="h-5 w-32 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-40 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="h-5 w-32 bg-muted rounded animate-pulse" />
              <CardDescription className="h-4 w-40 bg-muted/70 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 pb-4 border-b">
                    <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-3 w-40 bg-muted/70 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
