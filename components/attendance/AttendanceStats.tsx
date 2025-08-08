import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CheckCircle,
  XCircle,
  Clock,
  Home,
  Calendar,
  TrendingUp,
  Timer
} from 'lucide-react';
import { AttendanceStats as AttendanceStatsType } from '@/lib/attendance-service';

interface AttendanceStatsProps {
  stats: AttendanceStatsType;
  loading?: boolean;
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color = 'text-muted-foreground',
  bgColor = 'bg-muted',
  subtitle 
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  bgColor?: string;
  subtitle?: string;
}) {
  return (
    <Card className="stats-card hover:shadow-lg transition-all duration-300 h-full">
      <CardContent className="p-3 sm:p-4 lg:p-6 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 sm:p-3 rounded-full ${bgColor} transition-colors duration-300 flex-shrink-0 ml-2`}>
            <div className={color}>
              <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6">
                {icon}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}m`;
}

function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function AttendanceStats({ stats, loading = false }: AttendanceStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="stats-card">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="animate-pulse">
                <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 sm:h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-2 sm:h-3 bg-muted rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={<Users className="h-6 w-6" />}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        
        <StatCard
          title="Present"
          value={stats.present}
          icon={<CheckCircle className="h-6 w-6" />}
          color="text-green-600"
          bgColor="bg-green-100 dark:bg-green-900/20"
          subtitle={stats.totalEmployees > 0 ? `${Math.round((stats.present / stats.totalEmployees) * 100)}% of total` : undefined}
        />
        
        <StatCard
          title="Absent"
          value={stats.absent}
          icon={<XCircle className="h-6 w-6" />}
          color="text-red-600"
          bgColor="bg-red-100 dark:bg-red-900/20"
          subtitle={stats.totalEmployees > 0 ? `${Math.round((stats.absent / stats.totalEmployees) * 100)}% of total` : undefined}
        />
        
        <StatCard
          title="Attendance Rate"
          value={formatPercentage(stats.attendanceRate)}
          icon={<TrendingUp className="h-6 w-6" />}
          color={stats.attendanceRate >= 90 ? 'text-green-600' : stats.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'}
          bgColor={stats.attendanceRate >= 90 ? 'bg-green-100 dark:bg-green-900/20' : stats.attendanceRate >= 75 ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-red-100 dark:bg-red-900/20'}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          title="Late Arrivals"
          value={stats.late}
          icon={<Clock className="h-6 w-6" />}
          color="text-yellow-600"
          bgColor="bg-yellow-100 dark:bg-yellow-900/20"
          subtitle={stats.totalEmployees > 0 ? `${Math.round((stats.late / stats.totalEmployees) * 100)}% of total` : undefined}
        />
        
        <StatCard
          title="Work from Home"
          value={stats.workFromHome}
          icon={<Home className="h-6 w-6" />}
          color="text-purple-600"
          bgColor="bg-purple-100 dark:bg-purple-900/20"
          subtitle={stats.totalEmployees > 0 ? `${Math.round((stats.workFromHome / stats.totalEmployees) * 100)}% of total` : undefined}
        />
        
        <StatCard
          title="Half Day"
          value={stats.halfDay}
          icon={<Calendar className="h-6 w-6" />}
          color="text-orange-600"
          bgColor="bg-orange-100 dark:bg-orange-900/20"
          subtitle={stats.totalEmployees > 0 ? `${Math.round((stats.halfDay / stats.totalEmployees) * 100)}% of total` : undefined}
        />
        
        <StatCard
          title="Avg Work Hours"
          value={formatHours(stats.avgWorkHours)}
          icon={<Timer className="h-6 w-6" />}
          color="text-accent"
          bgColor="bg-accent/10"
          subtitle={stats.totalOvertime > 0 ? `+${formatHours(stats.totalOvertime)} overtime` : 'No overtime'}
        />
      </div>

      {/* Status Breakdown */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            <span>Status Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* First Row - 3 items */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.present}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Present</div>
                <Badge variant="outline" className="mt-1 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                  <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  <span className="hidden sm:inline">Active</span>
                  <span className="sm:hidden">✓</span>
                </Badge>
              </div>
              
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.absent}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Absent</div>
                <Badge variant="outline" className="mt-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
                  <XCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  <span className="hidden sm:inline">Away</span>
                  <span className="sm:hidden">✗</span>
                </Badge>
              </div>
              
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.late}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Late</div>
                <Badge variant="outline" className="mt-1 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
                  <Clock className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  <span className="hidden sm:inline">Delayed</span>
                </Badge>
              </div>
            </div>
            
            {/* Second Row - 2 items centered */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.workFromHome}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">WFH</div>
                <Badge variant="outline" className="mt-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                  <Home className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  <span className="hidden sm:inline">Remote</span>
                </Badge>
              </div>
              
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.halfDay}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Half Day</div>
                <Badge variant="outline" className="mt-1 text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                  <Calendar className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  <span className="hidden sm:inline">Partial</span>
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Hours Summary */}
      {(stats.avgWorkHours > 0 || stats.totalOvertime > 0) && (
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <Timer className="h-5 w-5 text-primary" />
              <span>Work Hours Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-accent">
                  {formatHours(stats.avgWorkHours)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Average Work Hours</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Per employee today
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                  {formatHours(stats.totalOvertime)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Total Overtime</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Across all employees
                </div>
              </div>
              
              <div className="text-center sm:col-span-2 lg:col-span-1">
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                  {stats.totalEmployees > 0 ? formatHours(stats.avgWorkHours * (stats.present + stats.late + stats.workFromHome + stats.halfDay)) : '0h 0m'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Total Work Hours</div>
                <div className="text-xs text-muted-foreground mt-1">
                  All working employees
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}