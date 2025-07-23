'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ExpensesLoadingSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 bg-muted/70 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
          <div className="h-10 w-28 bg-muted rounded animate-pulse" />
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-6 w-16 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 w-24 bg-muted/70 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs and Filters Skeleton */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <div className="h-10 w-16 bg-muted rounded animate-pulse" />
            <div className="h-10 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-muted rounded animate-pulse" />
            <div className="h-10 w-40 bg-muted rounded animate-pulse" />
            <div className="h-10 w-36 bg-muted rounded animate-pulse" />
            <div className="h-10 w-28 bg-muted rounded animate-pulse" />
          </div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="h-10 w-full bg-muted rounded animate-pulse" />

        {/* Expense List Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-4">
                      <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
                      <div className="h-4 w-16 bg-muted/70 rounded animate-pulse" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-4 w-24 bg-muted/70 rounded animate-pulse" />
                      <div className="h-4 w-20 bg-muted/70 rounded animate-pulse" />
                      <div className="h-4 w-28 bg-muted/70 rounded animate-pulse" />
                    </div>
                    <div className="h-3 w-48 bg-muted/50 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                    <div className="flex gap-1">
                      <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                      <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                      <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExpenseTableLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {/* Table Header Skeleton */}
      <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/30">
        {['Title', 'Amount', 'Category', 'Date', 'Status', 'Submitted By', 'Actions'].map((header, i) => (
          <div key={i} className="col-span-2 h-4 bg-muted rounded animate-pulse" />
        ))}
      </div>

      {/* Table Rows Skeleton */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <div key={i} className="grid grid-cols-12 gap-4 p-4 border-b">
          <div className="col-span-2 h-4 bg-muted rounded animate-pulse" />
          <div className="col-span-2 h-4 bg-muted rounded animate-pulse" />
          <div className="col-span-2 h-4 bg-muted rounded animate-pulse" />
          <div className="col-span-2 h-4 bg-muted rounded animate-pulse" />
          <div className="col-span-1 h-4 bg-muted rounded animate-pulse" />
          <div className="col-span-2 h-4 bg-muted rounded animate-pulse" />
          <div className="col-span-1 flex gap-1">
            <div className="h-6 w-6 bg-muted rounded animate-pulse" />
            <div className="h-6 w-6 bg-muted rounded animate-pulse" />
            <div className="h-6 w-6 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
