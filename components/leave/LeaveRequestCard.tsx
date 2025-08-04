'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Check,
  X,
  MessageSquare,
  Building,
  Trash2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { LeaveRequest } from '@/lib/leave-service';

interface LeaveRequestCardProps {
  request: LeaveRequest;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string, reason: string) => void;
  onDelete?: (request: LeaveRequest) => void;
  showActions?: boolean;
  showEmployeeName?: boolean;
  canDelete?: boolean;
}

export default function LeaveRequestCard({ 
  request, 
  onApprove, 
  onReject, 
  onDelete,
  showActions = true,
  showEmployeeName = true,
  canDelete = false
}: LeaveRequestCardProps) {
  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getLeaveTypeColor = (leaveType: string) => {
    const typeColors: Record<string, string> = {
      'Annual Leave': 'bg-blue-100 text-blue-800 border-blue-200',
      'Sick Leave': 'bg-red-100 text-red-800 border-red-200',
      'Casual Leave': 'bg-green-100 text-green-800 border-green-200',
      'Maternity Leave': 'bg-pink-100 text-pink-800 border-pink-200',
      'Paternity Leave': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return typeColors[leaveType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card className="card-enhanced hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-4">
            {/* Header with employee name and status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {showEmployeeName && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">{request.employeeName}</h3>
                  </div>
                )}
                {getStatusBadge(request.status)}
                {request.emergency && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Emergency
                  </Badge>
                )}
              </div>
              
              {request.workspaceName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building className="w-3 h-3" />
                  {request.workspaceName}
                </div>
              )}
            </div>

            {/* Leave details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Leave Type</p>
                  <Badge variant="outline" className={getLeaveTypeColor(request.leaveType)}>
                    {request.leaveType}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Duration</p>
                  <p className="text-muted-foreground">{request.days} day(s)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">From</p>
                  <p className="text-muted-foreground">
                    {format(parseISO(request.startDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">To</p>
                  <p className="text-muted-foreground">
                    {format(parseISO(request.endDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium text-foreground">Reason</p>
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                {request.reason}
              </p>
            </div>

            {/* Applied date */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Applied on {format(parseISO(request.appliedDate), 'MMM dd, yyyy')}</span>
            </div>

            {/* Approval/Rejection info */}
            {request.status === 'approved' && request.approvedBy && (
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                <CheckCircle className="w-3 h-3" />
                <span>Approved by {request.approvedBy}</span>
                {request.approvedDate && (
                  <span>on {format(parseISO(request.approvedDate), 'MMM dd, yyyy')}</span>
                )}
              </div>
            )}

            {request.status === 'rejected' && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                <XCircle className="w-3 h-3" />
                <span>Rejected</span>
                {request.rejectionReason && (
                  <span>- {request.rejectionReason}</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 ml-4">
            {/* Approve/Reject Actions for Pending Requests */}
            {showActions && request.status === 'pending' && onApprove && onReject && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  onClick={() => onApprove(request.id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => onReject(request.id, 'Rejected by manager')}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            
            {/* Delete Action for Admins/Owners */}
            {canDelete && onDelete && (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => onDelete(request)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 