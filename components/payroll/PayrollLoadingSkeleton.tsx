'use client';

import { Card, CardContent } from '@/components/ui/card';

export default function PayrollLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filters Skeleton */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 h-10 bg-muted rounded animate-pulse" />
            <div className="h-10 w-[180px] bg-muted rounded animate-pulse" />
            <div className="h-10 w-[140px] bg-muted rounded animate-pulse" />
            <div className="h-10 w-[160px] bg-muted rounded animate-pulse" />
            <div className="h-10 w-[100px] bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>

      {/* Results count skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        <div className="h-6 w-24 bg-muted rounded animate-pulse" />
      </div>

      {/* Employee cards skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="card-enhanced">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                    <div>
                      <div className="h-6 w-48 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                    <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>

                {/* Content grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left column */}
                  <div className="space-y-3">
                    <div>
                      <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    </div>
                    <div>
                      <div className="h-4 w-20 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-6 w-28 bg-muted rounded animate-pulse" />
                    </div>
                    <div>
                      <div className="h-4 w-18 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="space-y-3">
                    <div>
                      <div className="h-4 w-20 bg-muted rounded animate-pulse mb-2" />
                      <div className="space-y-1">
                        {[...Array(5)].map((_, j) => (
                          <div key={j} className="flex justify-between">
                            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                          </div>
                        ))}
                        <div className="flex justify-between pt-1 border-t">
                          <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="h-4 w-18 bg-muted rounded animate-pulse mb-2" />
                      <div className="space-y-1">
                        {[...Array(5)].map((_, j) => (
                          <div key={j} className="flex justify-between">
                            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                          </div>
                        ))}
                        <div className="flex justify-between pt-1 border-t">
                          <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional earnings */}
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="h-4 w-16 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    </div>
                    <div>
                      <div className="h-4 w-12 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-4 w-18 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t flex items-center justify-end gap-2">
                  <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 