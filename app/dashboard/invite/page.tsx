'use client';

import { Mail, Users, Plus, Copy, Check, Calendar, Trash2, Loader2, UserPlus, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { InvitationService } from '@/lib/invitation-service';
import { TeamService } from '@/lib/team-service';
import { Invitation, Team } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { convertTimestamps } from '@/lib/firestore-utils';

export default function InvitationsPage() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Form state for sending invitations
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member' as 'admin' | 'member',
    teamId: 'none' as string,
  });

  // Load data
  const loadData = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    
    setLoading(true);
    try {
      const [invitationsData, teamsData] = await Promise.all([
        InvitationService.getWorkspaceInvitations(currentWorkspace.id),
        TeamService.getWorkspaceTeams(currentWorkspace.id),
      ]);
      
      setInvitations(invitationsData);
      setTeams(teamsData);
      
      console.log('Loaded invitations:', invitationsData.length);
      console.log('Loaded teams:', teamsData.length);
    } catch (error) {
      console.error('Error loading invitation data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invitation data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (currentWorkspace) {
      loadData();
    }
  }, [currentWorkspace, loadData]);

  // Send invitation
  const handleSendInvitation = async () => {
    if (!currentWorkspace?.id || !user?.uid) return;

    if (!inviteForm.email.trim()) {
      toast({
        title: 'Error',
        description: 'Email address is required',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const invitationData: any = {
        email: inviteForm.email.trim(),
        workspaceId: currentWorkspace.id,
        role: inviteForm.role,
      };

      // Add team if selected
      if (inviteForm.teamId && inviteForm.teamId !== 'none') {
        invitationData.teamId = inviteForm.teamId;
        invitationData.teamRole = 'member'; // Default team role
      }

      await InvitationService.createInvitation(
        invitationData,
        user.displayName || 'Admin'
      );

      toast({
        title: 'Success',
        description: `Invitation sent to ${inviteForm.email}`,
      });

      // Reset form and close dialog
      setInviteForm({
        email: '',
        role: 'member',
        teamId: 'none',
      });
      setIsInviteOpen(false);
      
      // Reload data
      await loadData();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Copy invitation link
  const copyInviteLink = (inviteId: string) => {
    const link = `${window.location.origin}/invite?token=${inviteId}`;
    navigator.clipboard.writeText(link);
    setCopied(inviteId);
    setTimeout(() => setCopied(null), 2000);
    
    toast({
      title: 'Link Copied',
      description: 'Invitation link copied to clipboard',
    });
  };

  // Resend invitation
  const handleResendInvitation = async (invitationId: string) => {
    setResendingId(invitationId);
    try {
      await InvitationService.resendInvitation(invitationId);
      
      toast({
        title: 'Success',
        description: 'Invitation resent successfully',
      });
      
      await loadData(); // Reload to show updated expiration date
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend invitation',
        variant: 'destructive',
      });
    } finally {
      setResendingId(null);
    }
  };

  // Delete invitation
  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    setDeletingId(invitationId);
    try {
      await InvitationService.cancelInvitation(invitationId);
      
      toast({
        title: 'Success',
        description: 'Invitation cancelled successfully',
      });
      
      await loadData(); // Reload data
    } catch (error: any) {
      console.error('Error deleting invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel invitation',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'accepted': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      case 'declined': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400';
      case 'admin': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400';
      case 'member': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTeamName = (teamId?: string) => {
    if (!teamId) return null;
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'today';
    } else if (diffDays === 1) {
      return '1 day ago';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatExpiryDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'expired';
    } else if (diffDays === 0) {
      return 'expires today';
    } else if (diffDays === 1) {
      return 'expires in 1 day';
    } else {
      return `expires in ${diffDays} days`;
    }
  };

  // Filter invitations
  const pendingInvites = invitations.filter(inv => inv.status === 'pending');
  const acceptedInvites = invitations.filter(inv => inv.status === 'accepted');
  const expiredInvites = invitations.filter(inv => inv.status === 'expired');
  const recentInvites = invitations.filter(inv => inv.status !== 'pending').slice(0, 10);

  // Calculate this month's invitations
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const thisMonthInvites = invitations.filter(inv => 
    convertTimestamps(inv.createdAt) >= thisMonth
  );

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No workspace selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Invitations</h1>
          <p className="text-muted-foreground">
            Invite users to join {currentWorkspace.name} and manage pending invitations
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
              <Plus className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send Invitation</DialogTitle>
              <DialogDescription>
                Invite a new user to join {currentWorkspace.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@company.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteForm.role} onValueChange={(value: 'admin' | 'member') => setInviteForm({ ...inviteForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Team (Optional)</Label>
                <Select value={inviteForm.teamId} onValueChange={(value) => setInviteForm({ ...inviteForm, teamId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsInviteOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={handleSendInvitation} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="card-enhanced border border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingInvites.length}</div>
            <p className="text-xs text-muted-foreground">awaiting response</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced border border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{acceptedInvites.length}</div>
            <p className="text-xs text-muted-foreground">users joined</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced border border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredInvites.length}</div>
            <p className="text-xs text-muted-foreground">need resending</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced border border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{thisMonthInvites.length}</div>
            <p className="text-xs text-muted-foreground">invitations sent</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invitations */}
      <Card className="card-enhanced border border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-primary" />
            <span>Pending Invitations</span>
          </CardTitle>
          <CardDescription>Invitations waiting for user response</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pendingInvites.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending invitations</p>
              <p className="text-sm text-muted-foreground">Send your first invitation to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{invite.email}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>Sent {formatDate(convertTimestamps(invite.createdAt))}</span>
                        <span>•</span>
                        <span className={formatExpiryDate(convertTimestamps(invite.expiresAt)).includes('expired') ? 'text-red-600' : ''}>
                          {formatExpiryDate(convertTimestamps(invite.expiresAt))}
                        </span>
                        {getTeamName(invite.teamId) && (
                          <>
                            <span>•</span>
                            <span>Team: {getTeamName(invite.teamId)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getRoleColor(invite.role)}>
                      {invite.role}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInviteLink(invite.id)}
                      disabled={copied === invite.id}
                    >
                      {copied === invite.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendInvitation(invite.id)}
                      disabled={resendingId === invite.id}
                    >
                      {resendingId === invite.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteInvitation(invite.id)}
                      disabled={deletingId === invite.id}
                    >
                      {deletingId === invite.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="card-enhanced border border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>Recently processed invitations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recentInvites.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{invite.email}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>Sent {formatDate(convertTimestamps(invite.createdAt))}</span>
                        {invite.status === 'accepted' && invite.acceptedAt && (
                          <>
                            <span>•</span>
                            <span>Accepted {formatDate(convertTimestamps(invite.acceptedAt))}</span>
                          </>
                        )}
                        {getTeamName(invite.teamId) && (
                          <>
                            <span>•</span>
                            <span>Team: {getTeamName(invite.teamId)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(invite.status)}>
                      {invite.status}
                    </Badge>
                    <Badge variant="outline" className={getRoleColor(invite.role)}>
                      {invite.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
