import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" disabled>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-6 w-24 bg-muted/70 rounded animate-pulse" />
                </div>
                <div className="h-4 w-40 bg-muted/70 rounded animate-pulse mt-2" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-32 bg-muted rounded animate-pulse" />
              <div className="h-10 w-28 bg-muted rounded animate-pulse" />
              <div className="h-10 w-20 bg-muted rounded animate-pulse" />
              <div className="h-10 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Details Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="h-4 w-20 bg-muted/70 rounded animate-pulse mb-2" />
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Description */}
              <div className="pt-4">
                <div className="h-4 w-20 bg-muted/70 rounded animate-pulse mb-2" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted/50 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted/50 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 pb-2 border-b">
                  <div className="col-span-6 h-4 bg-muted/70 rounded animate-pulse" />
                  <div className="col-span-2 h-4 bg-muted/70 rounded animate-pulse" />
                  <div className="col-span-2 h-4 bg-muted/70 rounded animate-pulse" />
                  <div className="col-span-2 h-4 bg-muted/70 rounded animate-pulse" />
                </div>
                
                {/* Table Rows */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 py-2">
                    <div className="col-span-6">
                      <div className="h-4 w-full bg-muted rounded animate-pulse mb-1" />
                      <div className="h-3 w-3/4 bg-muted/70 rounded animate-pulse" />
                    </div>
                    <div className="col-span-2 h-4 bg-muted rounded animate-pulse" />
                    <div className="col-span-2 h-4 bg-muted rounded animate-pulse" />
                    <div className="col-span-2 h-4 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          {/* Client Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                <div className="h-4 w-48 bg-muted/70 rounded animate-pulse" />
                <div className="h-4 w-36 bg-muted/70 rounded animate-pulse" />
                <div className="h-4 w-32 bg-muted/70 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>

          {/* Amount Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                <div className="h-5 w-28 bg-muted rounded animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 w-20 bg-muted/70 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                <div className="h-5 w-36 bg-muted rounded animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-4 w-24 bg-muted/70 rounded animate-pulse mb-1" />
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}