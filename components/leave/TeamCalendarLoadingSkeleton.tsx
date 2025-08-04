import { Card, CardContent } from '@/components/ui/card';

export default function TeamCalendarLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 w-[200px] bg-muted rounded animate-pulse" />
            <div className="h-10 w-[140px] bg-muted rounded animate-pulse" />
            <div className="h-10 w-[140px] bg-muted rounded animate-pulse" />
            <div className="h-10 w-[100px] bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>

      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {[...Array(42)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 