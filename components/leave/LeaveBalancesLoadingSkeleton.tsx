import { Card, CardContent } from '@/components/ui/card';

export default function LeaveBalancesLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 h-10 bg-muted rounded animate-pulse" />
            <div className="h-10 w-[180px] bg-muted rounded animate-pulse" />
            <div className="h-10 w-[120px] bg-muted rounded animate-pulse" />
            <div className="h-10 w-[140px] bg-muted rounded animate-pulse" />
            <div className="h-10 w-[100px] bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="card-enhanced">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                      <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                      <div className="h-2 w-full bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 