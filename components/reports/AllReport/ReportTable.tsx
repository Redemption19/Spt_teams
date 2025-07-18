import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  ArrowUpDown,
  MoreVertical,
  Eye,
  Calendar,
  FileText,
  User,
  Building,
  Download
} from 'lucide-react';
import { EnhancedReport, ReportTemplate, User as UserType } from '@/lib/types';
import { getStatusBadge } from './all-reports';

interface ReportTableProps {
  reports: EnhancedReport[];
  templates: ReportTemplate[];
  users: UserType[];
  departments: any[];
  onViewReport: (report: EnhancedReport) => void;
  loading: boolean;
  canManageReports?: boolean;
  onComment?: (report: EnhancedReport) => void;
  onDelete?: (report: EnhancedReport) => void;
  onArchive?: (report: EnhancedReport) => void;
}

export function ReportTable({
  reports,
  templates,
  users,
  departments,
  onViewReport,
  loading,
  canManageReports,
  onComment,
  onDelete,
  onArchive,
}: ReportTableProps) {
  if (loading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Report</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Files</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="animate-pulse h-4 bg-muted rounded w-2/3"></div>
                </TableCell>
                <TableCell>
                  <div className="animate-pulse h-4 bg-muted rounded w-1/2"></div>
                </TableCell>
                <TableCell>
                  <div className="animate-pulse h-6 bg-muted rounded w-20"></div>
                </TableCell>
                <TableCell>
                  <div className="animate-pulse h-4 bg-muted rounded w-24"></div>
                </TableCell>
                <TableCell>
                  <div className="animate-pulse h-4 bg-muted rounded w-8"></div>
                </TableCell>
                <TableCell>
                  <div className="animate-pulse h-6 w-6 bg-muted rounded"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Report</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Files</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <div className="space-y-3">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">No reports found</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="cursor-pointer hover:bg-muted/80">
                  <div className="flex items-center space-x-1">
                    <span>Report</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/80">
                  <div className="flex items-center space-x-1">
                    <span>Template</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/80">
                  <div className="flex items-center space-x-1">
                    <span>Author</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/80">
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/80">
                  <div className="flex items-center space-x-1">
                    <span>Submitted</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Files</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const template = templates.find(t => t.id === report.templateId);
                const author = users.find(u => u.id === report.authorId);
                const department = departments.find(d => d.id === author?.departmentId);
                const statusBadge = getStatusBadge(report.status);

                return (
                  <TableRow key={report.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="space-y-1">
                        <div
                          className="font-medium cursor-pointer hover:text-primary line-clamp-1 text-sm"
                          onClick={() => onViewReport(report)}
                        >
                          {report.title}
                        </div>
                        {template?.category && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            Category: {template.category}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Created: {report.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{template?.name || 'Unknown'}</div>
                        {department && (
                          <div className="text-xs text-muted-foreground">{department.name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {(author?.name || author?.firstName || author?.email || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {author?.name || `${author?.firstName} ${author?.lastName}` || author?.email || 'Unknown'}
                          </div>
                          {author?.jobTitle && (
                            <div className="text-xs text-muted-foreground">{author.jobTitle}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge {...statusBadge} className="text-xs">
                        {report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.submittedAt ? (
                        <div className="text-sm text-muted-foreground">
                          {report.submittedAt.toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not submitted</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {report.attachments?.length || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* View/Review */}
                          <DropdownMenuItem onClick={() => onViewReport(report)}>
                            <Eye className="h-3 w-3 mr-2" />
                            {report.status === 'approved' ? 'View Report' : 'Review Report'}
                          </DropdownMenuItem>
                          {/* Comment, Archive, Delete for admins/owners on approved */}
                          {canManageReports && report.status === 'approved' && (
                            <>
                              <DropdownMenuItem onClick={() => onComment && onComment(report)}>
                                <User className="h-3 w-3 mr-2" />
                                Comment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onArchive && onArchive(report)}>
                                <Building className="h-3 w-3 mr-2" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDelete && onDelete(report)} className="text-destructive">
                                <FileText className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {reports.map((report) => {
          const template = templates.find(t => t.id === report.templateId);
          const author = users.find(u => u.id === report.authorId);
          const department = departments.find(d => d.id === author?.departmentId);
          const statusBadge = getStatusBadge(report.status);

          return (
            <Card key={report.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4
                        className="font-medium text-sm line-clamp-2 cursor-pointer hover:text-primary"
                        onClick={() => onViewReport(report)}
                      >
                        {report.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template?.name || 'Unknown Template'}
                      </p>
                    </div>
                    <Badge {...statusBadge} className="text-xs ml-2 flex-shrink-0">
                      {report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {(author?.name || author?.firstName || author?.email || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        {author?.name || `${author?.firstName} ${author?.lastName}` || author?.email || 'Unknown'}
                      </div>
                      {department && (
                        <div className="text-xs text-muted-foreground">{department.name}</div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {report.submittedAt ? report.submittedAt.toLocaleDateString() : report.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{report.attachments?.length || 0} files</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onViewReport(report)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
} 