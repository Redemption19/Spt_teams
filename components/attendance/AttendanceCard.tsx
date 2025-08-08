import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  MapPin, 
  Edit, 
  Trash2, 
  Coffee,
  Play,
  Square,
  User,
  Building,
  XCircle
} from 'lucide-react';
import { AttendanceRecord } from '@/lib/attendance-service';
import { format, parseISO } from 'date-fns';

interface AttendanceCardProps {
  record: AttendanceRecord;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (record: AttendanceRecord) => void;
  onDelete?: (record: AttendanceRecord) => void;
  showEmployeeName?: boolean;
  showWorkspaceName?: boolean;
}

function getStatusBadge(status: AttendanceRecord['status']) {
  const statusConfig = {
    present: { label: 'Present', variant: 'default' as const, className: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' },
    absent: { label: 'Absent', variant: 'destructive' as const, className: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' },
    late: { label: 'Late', variant: 'secondary' as const, className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' },
    'half-day': { label: 'Half Day', variant: 'outline' as const, className: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400' },
    'work-from-home': { label: 'WFH', variant: 'outline' as const, className: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400' }
  };

  const config = statusConfig[status] || statusConfig.present;
  
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

function formatTime(time: string | null): string {
  if (!time) return '--:--';
  return time;
}

function formatWorkHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}m`;
}

function getBreakStatus(breakStart: string | null, breakEnd: string | null): { text: string; icon: React.ReactNode; className: string } {
  if (!breakStart) {
    return {
      text: 'No break',
      icon: <Coffee className="h-3 w-3" />,
      className: 'text-muted-foreground'
    };
  }
  
  if (breakStart && !breakEnd) {
    return {
      text: 'On break',
      icon: <Play className="h-3 w-3" />,
      className: 'text-orange-600'
    };
  }
  
  return {
    text: `${formatTime(breakStart)} - ${formatTime(breakEnd)}`,
    icon: <Square className="h-3 w-3" />,
    className: 'text-green-600'
  };
}

export function AttendanceCard({
  record,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
  showEmployeeName = false,
  showWorkspaceName = false
}: AttendanceCardProps) {
  const breakStatus = getBreakStatus(record.breakStart, record.breakEnd);
  const isClockInOnly = record.clockIn && !record.clockOut;
  
  return (
    <Card className="card-enhanced hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0">
            {showEmployeeName && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm text-foreground truncate">{record.employeeName}</span>
                {showWorkspaceName && record.workspaceName && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    <Building className="h-3 w-3 mr-1" />
                    <span className="truncate max-w-20">{record.workspaceName}</span>
                  </Badge>
                )}
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {format(new Date(record.date), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end space-x-2">
            {getStatusBadge(record.status)}
            {(canEdit || canDelete) && (
              <div className="flex items-center space-x-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit?.(record)}
                    className="h-9 w-9 sm:h-8 sm:w-8 p-0 hover:bg-accent hover:text-accent-foreground"
                  >
                    <Edit className="h-4 w-4 sm:h-3 sm:w-3" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete?.(record)}
                    className="h-9 w-9 sm:h-8 sm:w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4 sm:h-3 sm:w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Time Information - Only show for non-absent records */}
        {record.status !== 'absent' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Play className="h-4 w-4 text-green-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Clock In</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatTime(record.clockIn)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Square className="h-4 w-4 text-red-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Clock Out</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatTime(record.clockOut)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-semibold text-red-600">
                  Employee was absent on this date
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Break Information - Only show for non-absent records */}
        {record.status !== 'absent' && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {breakStatus.icon}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Break</p>
                <p className={`text-sm font-semibold ${breakStatus.className}`}>
                  {breakStatus.text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Work Hours - Only show for non-absent records */}
        {record.status !== 'absent' && record.workHours > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Work Hours</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatWorkHours(record.workHours)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Location */}
        {record.location && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm text-foreground break-words">{record.location}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {record.notes && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="text-sm text-foreground bg-muted/30 p-3 sm:p-2 rounded border border-border/30 break-words">
              {record.notes}
            </p>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pt-2 border-t border-border/30">
          <div className="flex flex-wrap items-center gap-2">
            {record.status === 'absent' ? (
              <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                Absent
              </Badge>
            ) : (
              <>
                {isClockInOnly && (
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
                    <Play className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
                {record.breakStart && !record.breakEnd && (
                  <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 text-xs">
                    <Coffee className="h-3 w-3 mr-1" />
                    On Break
                  </Badge>
                )}
                {record.clockOut && (
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-xs">
                    <Square className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            {record.updatedAt && (
              <span>Updated: {format(record.updatedAt, 'HH:mm')}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}