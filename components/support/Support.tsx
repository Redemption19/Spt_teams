'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { SupportService, SupportTicket, FAQ, KnowledgeArticle, SupportStats } from '@/lib/support-service';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { useRolePermissions, useHasPermission } from '@/lib/rbac-hooks';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  HelpCircle, 
  BookOpen, 
  BarChart3, 
  Filter,
  Globe,
  Users,
  Clock,
  Star,
  Eye,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { SupportDataSeeder } from '@/lib/support-data-seeder';
import { TicketCard } from './tickets/TicketCard';

export default function Support() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const permissions = useRolePermissions();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [crossWorkspaceStats, setCrossWorkspaceStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [accessibleWorkspaces, setAccessibleWorkspaces] = useState<{
    ownedWorkspaces: string[];
    adminWorkspaces: string[];
    memberWorkspaces: string[];
    allWorkspaces: string[];
  } | null>(null);

  // Ticket creation state
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'general' as SupportTicket['category'],
    priority: 'medium' as SupportTicket['priority']
  });

  // Search results
  const [searchResults, setSearchResults] = useState<{
    faqs: FAQ[];
    articles: KnowledgeArticle[];
  }>({ faqs: [], articles: [] });

  // Add state for search results
  const [searchTab, setSearchTab] = useState<'tickets' | 'faqs' | 'knowledge'>('tickets');
  const [ticketSearchResults, setTicketSearchResults] = useState<SupportTicket[]>([]);

  // Move loadUserPermissions and loadSupportData above useEffect
  const loadUserPermissions = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    try {
      const role = await SupportService.getUserWorkspaceRole(user.uid, currentWorkspace.id);
      setUserRole(role);
      const workspaces = await SupportService.getAccessibleWorkspaces(user.uid);
      setAccessibleWorkspaces(workspaces);
      if (role === 'owner') {
        const crossStats = await SupportService.getCrossWorkspaceStats(user.uid);
        setCrossWorkspaceStats(crossStats);
      }
    } catch (error) {
      console.error('Error loading user permissions:', error);
    }
  }, [user, currentWorkspace]);

  const loadSupportData = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    setLoading(true);
    try {
      const [ticketsData, faqsData, articlesData, statsData] = await Promise.all([
        SupportService.getUserTickets(user.uid, currentWorkspace.id),
        SupportService.getFAQs(),
        SupportService.getKnowledgeArticles(),
        SupportService.getSupportStats(user.uid, currentWorkspace.id)
      ]);
      setTickets(ticketsData);
      setFaqs(faqsData);
      setArticles(articlesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading support data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load support data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspace, toast]);

  useEffect(() => {
    loadSupportData();
    loadUserPermissions();
  }, [loadSupportData, loadUserPermissions]);

  const handleCreateTicket = async () => {
    if (!user || !currentWorkspace) return;
    
    try {
      const ticketData = {
        ...newTicket,
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || user.email || 'Unknown User',
        workspaceId: currentWorkspace.id,
        status: 'open' as SupportTicket['status']
      };

      await SupportService.createTicket(ticketData);
      
      toast({
        title: 'Success',
        description: 'Support ticket created successfully',
      });
      
      setShowCreateTicket(false);
      setNewTicket({ title: '', description: '', category: 'general', priority: 'medium' });
      loadSupportData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create ticket',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    if (!user) return;
    
    try {
      await SupportService.updateTicketStatus(ticketId, status, user.uid);
      toast({
        title: 'Success',
        description: 'Ticket status updated successfully',
      });
      loadSupportData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update ticket status',
        variant: 'destructive'
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults({ faqs: [], articles: [] });
      setTicketSearchResults([]);
      return;
    }
    try {
      // Search tickets (title, description, category, priority)
      const ticketResults = tickets.filter(
        t =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.priority.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setTicketSearchResults(ticketResults);
      // Search FAQs and knowledge articles
      const results = await SupportService.searchSupport(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleRateFAQ = async (faqId: string, helpful: boolean) => {
    try {
      await SupportService.rateFAQ(faqId, helpful);
      toast({
        title: 'Thank you!',
        description: 'Your feedback has been recorded',
      });
    } catch (error) {
      console.error('Error rating FAQ:', error);
    }
  };

  const handleRateArticle = async (articleId: string, helpful: boolean) => {
    try {
      await SupportService.rateArticle(articleId, helpful);
      toast({
        title: 'Thank you!',
        description: 'Your feedback has been recorded',
      });
    } catch (error) {
      console.error('Error rating article:', error);
    }
  };

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const canManageTickets = userRole === 'owner' || userRole === 'admin';
  const canViewAllTickets = userRole === 'owner' || userRole === 'admin';
  const isOwner = userRole === 'owner';

  const handleSeedTickets = async () => {
    if (!user) return;
    try {
      await SupportDataSeeder.seedSupportTickets(user.uid);
      toast({
        title: 'Seeded!',
        description: 'Support tickets have been seeded.',
      });
      loadSupportData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to seed tickets',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading support data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Support Center</h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
            Get help, submit tickets, and find answers to common questions
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isOwner && (
            <Button
              variant="outline"
              onClick={() => setShowAllWorkspaces(!showAllWorkspaces)}
              className="flex items-center gap-2 h-11 sm:h-10 px-3 sm:px-4 min-w-[44px]"
            >
              <Globe className="h-4 w-4" />
              {showAllWorkspaces ? 'Current Workspace' : 'All Workspaces'}
            </Button>
          )}
          {/* Seed tickets button for dev/owner/admin only */}
          {/* (isOwner || userRole === 'admin') && process.env.NODE_ENV !== 'production' && (
            <Button variant="secondary" onClick={handleSeedTickets}>
              Seed Tickets
            </Button>
          ) */}
          
          {permissions.canCreateSupportTickets && (
            <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 h-11 sm:h-10 px-3 sm:px-4 min-w-[44px]">
                  <Plus className="h-4 w-4" />
                  <span className="hidden xs:inline">New Ticket</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Support Ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={newTicket.title}
                      onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                      placeholder="Detailed description of your issue"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Select
                        value={newTicket.category}
                        onValueChange={(value) => setNewTicket({ ...newTicket, category: value as SupportTicket['category'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="feature-request">Feature Request</SelectItem>
                          <SelectItem value="bug-report">Bug Report</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Priority</label>
                      <Select
                        value={newTicket.priority}
                        onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as SupportTicket['priority'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateTicket(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTicket}>
                      Create Ticket
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Cross-workspace stats for owners */}
      {isOwner && showAllWorkspaces && crossWorkspaceStats && (
        <Card className="bg-card border border-border rounded-2xl shadow-lg mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary font-bold text-2xl">
              <Globe className="h-5 w-5 text-primary" />
              Cross-Workspace Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{crossWorkspaceStats.totalWorkspaces}</div>
                <div className="text-sm text-card-foreground">Workspaces</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{crossWorkspaceStats.totalTickets}</div>
                <div className="text-sm text-card-foreground">Total Tickets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {crossWorkspaceStats.averageResponseTime.toFixed(1)}h
                </div>
                <div className="text-sm text-card-foreground">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {crossWorkspaceStats.topIssues[0]?.category || 'N/A'}
                </div>
                <div className="text-sm text-card-foreground">Top Issue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col xs:flex-row gap-2 w-full">
            <Input
              placeholder="Search FAQs and knowledge articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 text-base sm:text-lg h-11 sm:h-10 px-3 sm:px-4 min-w-[44px]"
            />
            <Button onClick={handleSearch} className="h-11 sm:h-10 px-3 sm:px-4 min-w-[44px]">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results Section */}
      {searchQuery && (ticketSearchResults.length > 0 || searchResults.faqs.length > 0 || searchResults.articles.length > 0) && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Search Results for &quot;{searchQuery}&quot;</CardTitle>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant={searchTab === 'tickets' ? 'default' : 'outline'} onClick={() => setSearchTab('tickets')}>
                Tickets
              </Button>
              <Button size="sm" variant={searchTab === 'faqs' ? 'default' : 'outline'} onClick={() => setSearchTab('faqs')}>
                FAQs
              </Button>
              <Button size="sm" variant={searchTab === 'knowledge' ? 'default' : 'outline'} onClick={() => setSearchTab('knowledge')}>
                Knowledge Base
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {searchTab === 'tickets' && (
              <div className="space-y-2">
                {ticketSearchResults.length === 0 ? (
                  <div className="text-muted-foreground text-center py-4">No tickets found.</div>
                ) : (
                  ticketSearchResults.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      currentUserId={user?.uid || ''}
                      currentUserRole={userRole || 'member'}
                      onTicketUpdated={loadSupportData}
                      onTicketDeleted={loadSupportData}
                    />
                  ))
                )}
              </div>
            )}
            {searchTab === 'faqs' && (
              <div className="space-y-2">
                {searchResults.faqs.length === 0 ? (
                  <div className="text-muted-foreground text-center py-4">No FAQs found.</div>
                ) : (
                  searchResults.faqs.map((faq) => (
                    <div key={faq.id} className="p-3 border rounded-lg">
                      <h5 className="font-medium">{faq.question}</h5>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))
                )}
              </div>
            )}
            {searchTab === 'knowledge' && (
              <div className="space-y-2">
                {searchResults.articles.length === 0 ? (
                  <div className="text-muted-foreground text-center py-4">No knowledge articles found.</div>
                ) : (
                  searchResults.articles.map((article) => (
                    <div key={article.id} className="p-3 border rounded-lg">
                      <h5 className="font-medium">{article.title}</h5>
                      <p className="text-sm text-muted-foreground">{article.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTickets}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.openTickets} open, {stats.resolvedTickets} resolved
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageResponseTime.toFixed(1)}h</div>
                  <p className="text-xs text-muted-foreground">Average response time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.satisfactionScore.toFixed(1)}/5</div>
                  <p className="text-xs text-muted-foreground">Average rating</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Category</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.topCategories[0]?.category || 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.topCategories[0]?.count || 0} tickets
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Activity */}
          {stats?.recentActivity && stats.recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm">{activity.action}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {activity.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {userRole === 'member' ? 'My Tickets' : 'Support Tickets'}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {userRole === 'owner' ? 'Owner' : userRole === 'admin' ? 'Admin' : 'Member'}
              </Badge>
              {canViewAllTickets && (
                <Badge variant="outline" className="text-xs">
                  {tickets.length} tickets
                </Badge>
              )}
            </div>
          </div>

          {tickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {userRole === 'member' ? 'You have not raised any tickets yet.' : 'No tickets found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  currentUserId={user?.uid || ''}
                  currentUserRole={userRole || 'member'}
                  onTicketUpdated={loadSupportData}
                  onTicketDeleted={loadSupportData}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {faqs.length} FAQs
              </Badge>
            </div>
          </div>

          {faqs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No FAQs available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => (
                <Card key={faq.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold">{faq.question}</h4>
                        <Badge variant="outline" className="text-xs">
                          {faq.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {faq.views} views
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {faq.helpful} helpful
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRateFAQ(faq.id, true)}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRateFAQ(faq.id, false)}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Knowledge Base</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {articles.length} articles
              </Badge>
            </div>
          </div>

          {articles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No knowledge articles available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <Card key={article.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold">{article.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {article.category}
                          </Badge>
                          {article.featured && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {article.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>By: {article.author}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.views} views
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {article.helpful} helpful
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRateArticle(article.id, true)}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRateArticle(article.id, false)}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
