import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

export function LoadingSpinner({ 
  size = 'md', 
  text, 
  className, 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-2",
      fullScreen ? "min-h-screen" : "py-8",
      className
    )}>
      <Loader2 className={cn(
        "animate-spin text-primary",
        sizeClasses[size]
      )} />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  return content;
}

// Skeleton loader for better UX
export function ExpenseEditSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-9 w-9 bg-muted rounded-md"></div>
          <div>
            <div className="h-8 w-32 bg-muted rounded mb-2"></div>
            <div className="h-4 w-48 bg-muted rounded"></div>
          </div>
        </div>
        <div className="h-9 w-20 bg-muted rounded"></div>
      </div>

      {/* Form Skeleton */}
      <div className="bg-card rounded-lg border p-6 space-y-6">
        <div>
          <div className="h-6 w-32 bg-muted rounded mb-2"></div>
          <div className="h-4 w-64 bg-muted rounded"></div>
        </div>
        
        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded"></div>
              <div className="h-10 w-full bg-muted rounded"></div>
            </div>
          ))}
        </div>

        {/* Text Areas */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded"></div>
            <div className="h-20 w-full bg-muted rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 bg-muted rounded"></div>
            <div className="h-16 w-full bg-muted rounded"></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <div className="h-10 w-20 bg-muted rounded"></div>
          <div className="h-10 w-32 bg-muted rounded"></div>
        </div>
      </div>
    </div>
  );
}
