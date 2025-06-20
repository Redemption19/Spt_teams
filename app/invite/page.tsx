'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Mail, Users, Building } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { InvitationService } from '@/lib/invitation-service';
import { WorkspaceService } from '@/lib/workspace-service';
import { TeamService } from '@/lib/team-service';
import { Invitation, Workspace, Team } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    const fetchInvitationData = async () => {
      try {
        const invitationData = await InvitationService.validateInvitationToken(token);
        
        if (!invitationData) {
          setError('Invalid or expired invitation');
          return;
        }

        setInvitation(invitationData);

        // Fetch workspace details
        const workspaceData = await WorkspaceService.getWorkspace(invitationData.workspaceId);
        setWorkspace(workspaceData);

        // Fetch team details if applicable
        if (invitationData.teamId) {
          const teamData = await TeamService.getTeam(invitationData.teamId);
          setTeam(teamData);
        }
      } catch (err) {
        console.error('Error fetching invitation data:', err);
        setError('Failed to load invitation data');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitationData();  }, [token]);
  // Auto-accept invitation when user becomes authenticated (e.g., after registration)
  useEffect(() => {
    const autoAcceptInvitation = async () => {
      if (user && invitation && invitation.status === 'pending' && invitation.email === user.email) {
        console.log('Auto-accepting invitation for newly registered user');
        try {
          setAccepting(true);
          await InvitationService.acceptInvitation(invitation.id);
          toast({
            title: "Welcome to the team!",
            description: "Your invitation has been accepted. Redirecting to dashboard...",
          });
          
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } catch (err: any) {
          console.error('Error auto-accepting invitation:', err);
          toast({
            title: "Notice",
            description: "Please manually accept your invitation below.",
          });
        } finally {
          setAccepting(false);
        }
      }
    };

    // Only auto-accept if we have all required data and user just became available
    if (!authLoading && user && invitation && !accepting) {
      autoAcceptInvitation();
    }
  }, [user, invitation, authLoading, router, accepting]);

  const handleAcceptInvitation = async () => {
    if (!user || !invitation) return;

    setAccepting(true);
    try {
      await InvitationService.acceptInvitation(invitation.id);
      toast({
        title: "Invitation Accepted",
        description: "Welcome to the workspace! Redirecting to dashboard...",
      });
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-red-700">Invalid Invitation</CardTitle>
            <CardDescription>
              {error || 'This invitation link is invalid or has expired.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
              variant="outline"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is already logged in and email matches, show accept invitation
  if (user && user.email === invitation.email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4">
        <Card className="w-full max-w-lg shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-gray-900">You&apos;re Invited!</CardTitle>
            <CardDescription className="text-lg">
              Join {workspace?.name || 'the workspace'} and start collaborating
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Building className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Workspace</p>
                  <p className="text-sm text-gray-600">{workspace?.name}</p>
                </div>
              </div>
              
              {team && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Team</p>
                    <p className="text-sm text-gray-600">{team.name}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Role</p>
                  <p className="text-sm text-gray-600 capitalize">{invitation.role}</p>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation expires on {invitation.expiresAt.toLocaleDateString()}
              </AlertDescription>
            </Alert>

            <div className="flex space-x-3">
              <Button 
                onClick={handleAcceptInvitation}
                disabled={accepting}
                className="flex-1"
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Accepting...
                  </>
                ) : (
                  'Accept Invitation'
                )}
              </Button>
              <Button 
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="flex-1"
              >
                Maybe Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is not logged in or email doesn't match, show register form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md">
        <Card className="mb-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-gray-900">Join {workspace?.name}</CardTitle>
            <CardDescription>
              You&apos;ve been invited to join as a {invitation.role}
              {team && ` in the ${team.name} team`}
            </CardDescription>
          </CardHeader>
        </Card>
        
        <RegisterForm 
          inviteToken={token!} 
          preAssignedRole={invitation.role}
          preAssignedEmail={invitation.email}
          workspaceId={invitation.workspaceId}
          teamId={invitation.teamId}
        />
      </div>
    </div>
  );
}
