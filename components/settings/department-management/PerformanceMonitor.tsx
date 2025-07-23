'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface PerformanceMonitorProps {
  enabled?: boolean;
}

export function PerformanceMonitor({ enabled = process.env.NODE_ENV === 'development' }: PerformanceMonitorProps) {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [renderTime, setRenderTime] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const startTime = performance.now();

    // Measure load time
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.entryType === 'navigation') {
          setLoadTime(entry.duration);
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });

    // Measure render time
    const endTime = performance.now();
    setRenderTime(endTime - startTime);

    return () => {
      observer.disconnect();
    };
  }, [enabled]);

  if (!enabled || (!loadTime && !renderTime)) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-1">
      {renderTime && (
        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
          Render: {renderTime.toFixed(1)}ms
        </Badge>
      )}
      {loadTime && (
        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
          Load: {loadTime.toFixed(1)}ms
        </Badge>
      )}
    </div>
  );
}
