'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  Download, 
  Search,
  Filter,
  FileText,
  Calendar,
  User,
  MoreHorizontal,
  Trash2,
  Share2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { GeneratedReport } from '@/lib/financial-reports-service';
import { useCurrency } from '@/hooks/use-currency';
import { useRouter } from 'next/navigation';

interface ReportHistoryProps {
  reports: GeneratedReport[];
  loading: boolean;
  onViewReport: (reportId: string) => void;
  onDownloadReport: (reportId: string) => void;
  onDeleteReport: (reportId: string) => void;
  onShareReport: (reportId: string) => void;
}

const statusColors: { [key: string]: string } = {
  'completed': 'bg-green-100 text-green-800 border-green-300',
  'generating': 'bg-blue-100 text-blue-800 border-blue-300',
  'failed': 'bg-red-100 text-red-800 border-red-300'
};

const statusIcons: { [key: string]: any } = {
  'completed': CheckCircle,
  'generating': Clock,
  'failed': AlertCircle
};

const reportTypeLabels: { [key: string]: string } = {
  'expense': 'Expense Report',
  'budget': 'Budget Report',
  'invoice': 'Invoice Report',
  'profit_loss': 'P&L Statement',
  'cash_flow': 'Cash Flow',
  'roi': 'ROI Analysis'
};

export function ReportHistory({ 
  reports, 
  loading, 
  onViewReport, 
  onDownloadReport, 
  onDeleteReport,
  onShareReport 
}: ReportHistoryProps) {
  const { formatAmount } = useCurrency();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.generatedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    const IconComponent = statusIcons[status] || CheckCircle;
    return <IconComponent className="w-4 h-4" />;
  };

  const getStatusBadgeClass = (status: string) => {
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatReportType = (type: string) => {
    return reportTypeLabels[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewReport = (report: GeneratedReport) => {
    router.push(`/dashboard/financial/reports/view/${report.id}`);
    onViewReport(report.id);
  };

  if (loading) {
    return (
      <Card className="card-enhanced">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Clock className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
            <span className="text-muted-foreground">Loading report history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Report History
        </CardTitle>
        <CardDescription>
          View and download previously generated reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search reports by name or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="generating">Generating</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="budget">Budget</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="profit_loss">P&L</SelectItem>
              <SelectItem value="cash_flow">Cash Flow</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-medium text-foreground">{report.name}</h3>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                      >
                        {formatReportType(report.type)}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusBadgeClass(report.status)}`}
                      >
                        <span className="flex items-center gap-1">
                          {getStatusIcon(report.status)}
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>Generated by: {report.generatedBy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(report.generatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{report.fileSize}</span>
                      </div>
                    </div>
                    
                    {report.filters && (
                      <div className="text-xs text-muted-foreground">
                        <span>Period: {formatDate(report.filters.dateRange.start)} - {formatDate(report.filters.dateRange.end)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {report.status === 'completed' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewReport(report)}
                          className="hover:bg-muted"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onDownloadReport(report.id)}
                          className="hover:bg-muted"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onShareReport(report.id)}
                          className="hover:bg-muted"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    
                    {report.status === 'generating' && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                        {report.progress && (
                          <span>({report.progress}%)</span>
                        )}
                      </div>
                    )}
                    
                    {report.status === 'failed' && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>Failed</span>
                        {report.error && (
                          <span className="text-xs">({report.error})</span>
                        )}
                      </div>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onDeleteReport(report.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? (
                <>
                  <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No reports match your current filters. Try adjusting your search criteria.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setTypeFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Reports Generated</h3>
                  <p className="text-muted-foreground">
                    Generated reports will appear here. Start by creating your first report using the templates above.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
        
        {filteredReports.length > 0 && reports.length > filteredReports.length && (
          <div className="text-center mt-6 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {filteredReports.length} of {reports.length} reports
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 