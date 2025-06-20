'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Calendar,
  User,
  Download,
  Eye,
  Edit,
  Trash2,
  FolderOpen
} from 'lucide-react';

const mockReports = [
  {
    id: '1',
    title: 'Q4 Performance Analysis',
    type: 'quarterly',
    status: 'approved',
    author: 'John Doe',
    branch: 'Central Branch',
    team: 'Analytics Team',
    folder: 'Performance Reports',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-18',
    summary: 'Comprehensive analysis of Q4 performance metrics across all departments.',
  },
  {
    id: '2',
    title: 'Weekly Team Standup - Week 3',
    type: 'weekly',
    status: 'submitted',
    author: 'Sarah Wilson',
    branch: 'North Branch',
    team: 'Development Team',
    folder: 'Weekly Reports',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20',
    summary: 'Weekly progress update on current sprint tasks and blockers.',
  },
  {
    id: '3',
    title: 'Project Milestone Report',
    type: 'project',
    status: 'draft',
    author: 'Mike Chen',
    branch: 'South Branch',
    team: 'Product Team',
    folder: 'Project Reports',
    createdAt: '2024-01-22',
    updatedAt: '2024-01-23',
    summary: 'Milestone achievement report for the mobile app redesign project.',
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    case 'submitted':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    case 'draft':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    case 'archived':
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'weekly':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
    case 'monthly':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400';
    case 'quarterly':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    case 'project':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function ReportsDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredReports = mockReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
    const matchesType = selectedType === 'all' || report.type === selectedType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Reports
          </h1>
          <p className="text-muted-foreground mt-1">Manage team reports and documentation</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Report Title</Label>
                  <Input id="title" placeholder="Enter report title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Report Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="folder">Folder</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly-reports">Weekly Reports</SelectItem>
                      <SelectItem value="performance-reports">Performance Reports</SelectItem>
                      <SelectItem value="project-reports">Project Reports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team">Team</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development Team</SelectItem>
                      <SelectItem value="analytics">Analytics Team</SelectItem>
                      <SelectItem value="product">Product Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea id="summary" placeholder="Brief summary of the report" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Report Content</Label>
                <Textarea id="content" placeholder="Write your report content here..." rows={8} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  Create Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-border bg-background"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-40 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="project">Project</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="grid" className="space-y-6">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <Card key={report.id} className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <Badge className={getTypeColor(report.type)}>
                        {report.type}
                      </Badge>
                    </div>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight text-foreground">{report.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{report.summary}</p>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="h-4 w-4" />
                      <span>{report.folder}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{report.author}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      {report.branch} • {report.team}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card className="border-border/50 shadow-lg bg-card/90 backdrop-blur-sm card-enhanced">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filteredReports.map((report) => (
                  <div key={report.id} className="p-4 hover:bg-card/80 hover:shadow-sm border border-transparent hover:border-border/30 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-foreground">{report.title}</h4>
                            <Badge className={getTypeColor(report.type)}>
                              {report.type}
                            </Badge>
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{report.summary}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{report.author}</span>
                            <span>•</span>
                            <span>{report.folder}</span>
                            <span>•</span>
                            <span>{report.branch}</span>
                            <span>•</span>
                            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}