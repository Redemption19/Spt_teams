'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building, Users, Plus, ArrowRight, CheckCircle, Sparkles, Link2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { WorkspaceService } from '@/lib/workspace-service';
import { InvitationService } from '@/lib/invitation-service';
import { toast } from '@/hooks/use-toast';

type OnboardingStep = 'welcome' | 'workspace-choice' | 'create-workspace' | 'complete';

interface OnboardingFlowProps {
  inviteToken?: string;
}

export function OnboardingFlow({ inviteToken }: OnboardingFlowProps) {
  const router = useRouter();
  const { user, clearNewUserFlag } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
    description: '',
    type: 'company' as const,
  });

  const handleInviteFlow = useCallback(async () => {
    if (!inviteToken || !user) return;

    try {
      setLoading(true);
      
      // Validate and accept invitation
      const invitationData = await InvitationService.validateInvitationToken(inviteToken);
      
      if (!invitationData) {
        toast({
          title: 'Invalid Invitation',
          description: 'This invitation link is invalid or has expired.',
          variant: 'destructive',
        });
        return;
      }

      setInvitation(invitationData);
      
      // Auto-accept invitation
      await InvitationService.acceptInvitation(inviteToken);
      
      setStep('complete');
      
      // Redirect to workspace after brief success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error handling invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to process invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [inviteToken, user, router]);

  const checkExistingWorkspaces = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userWorkspaces = await WorkspaceService.getUserWorkspaces(user.uid);
      setWorkspaces(userWorkspaces);
      
      if (userWorkspaces.length === 0) {
        // User has no workspaces, show workspace creation options
        setStep('workspace-choice');
      } else {
        // User already has workspaces, clear new user flag and redirect
        clearNewUserFlag();
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking workspaces:', error);
      setStep('workspace-choice');
    } finally {
      setLoading(false);
    }
  }, [user, router, clearNewUserFlag]);

  useEffect(() => {
    handleInviteFlow();
    checkExistingWorkspaces();
  }, [handleInviteFlow, checkExistingWorkspaces]);

  const handleCreateWorkspace = async () => {
    if (!user || !workspaceForm.name) return;

    try {
      setLoading(true);
      
      const workspaceData = {
        ...workspaceForm,
        ownerId: user.uid,
      };
      const workspaceId = await WorkspaceService.createWorkspace(workspaceData, user.uid);
      
      setStep('complete');
      
      toast({
        title: 'Workspace Created',
        description: `${workspaceForm.name} has been created successfully!`,
      });
      
      // Clear new user flag before redirecting
      clearNewUserFlag();
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast({
        title: 'Error',
        description: 'Failed to create workspace. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6 shadow-xl">
          <Sparkles className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Welcome to SPT Teams!
        </h1>
        <p className="text-lg text-muted-foreground">
          Let&apos;s get your workspace set up in just a few steps
        </p>
      </div>
      
      <Card className="shadow-2xl border-0 card-enhanced">
        <CardContent className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Preparing your workspace...</p>
            </div>
          ) : (
            <Button 
              onClick={() => setStep('workspace-choice')}
              className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg"
              size="lg"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderWorkspaceChoiceStep = () => (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Choose Your Path</h2>
        <p className="text-lg text-muted-foreground">
          How would you like to get started?
        </p>
      </div>
      
      <Card className="shadow-2xl border-0 card-enhanced">
        <CardContent className="p-8 space-y-6">
          <Button
            variant="outline"
            className="w-full h-auto p-8 text-left border-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
            onClick={() => setStep('create-workspace')}
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Plus className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Create New Workspace</h3>
                <p className="text-sm text-muted-foreground">
                  Start fresh and build your organization from scratch
                </p>
              </div>
            </div>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-4 text-muted-foreground font-medium">
                or
              </span>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center space-x-2 mb-3">
              <Link2 className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Have an invitation?</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Use your invitation link to join an existing workspace
            </p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                // Prompt for invitation link
                const inviteUrl = prompt('Please enter your invitation link:');
                if (inviteUrl) {
                  // Extract token from URL
                  const url = new URL(inviteUrl);
                  const token = url.searchParams.get('token');
                  if (token) {
                    router.push(`/invite?token=${token}`);
                  } else {
                    toast({
                      title: 'Invalid Link',
                      description: 'Please enter a valid invitation link',
                      variant: 'destructive'
                    });
                  }
                }
              }}
            >
              Join with Invitation Link
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCreateWorkspaceStep = () => (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Create Your Workspace</h2>
        <p className="text-lg text-muted-foreground">
          Set up your organization&apos;s digital headquarters
        </p>
      </div>
      
      <Card className="shadow-2xl border-0 card-enhanced">
        <CardContent className="p-8">
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="workspace-name" className="text-base font-medium">
                Workspace Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="workspace-name"
                placeholder="e.g., Standard Pensions Trust"
                value={workspaceForm.name}
                onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
                className="h-12 text-base"
              />
              <p className="text-sm text-muted-foreground">
                This is your organization&apos;s name
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspace-description" className="text-base font-medium">
                Description (Optional)
              </Label>
              <Input
                id="workspace-description"
                placeholder="Brief description of your organization"
                value={workspaceForm.description}
                onChange={(e) => setWorkspaceForm({ ...workspaceForm, description: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspace-type" className="text-base font-medium">
                Organization Type
              </Label>
              <Select
                value={workspaceForm.type}
                onValueChange={(value) => setWorkspaceForm({ ...workspaceForm, type: value as any })}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="nonprofit">Non-Profit</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12"
                onClick={() => setStep('workspace-choice')}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1 h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                onClick={handleCreateWorkspace}
                disabled={loading || !workspaceForm.name}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Workspace
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="w-full max-w-lg mx-auto">
      <Card className="shadow-2xl border-0 card-enhanced">
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold mb-3">All Set!</h2>
          <p className="text-lg text-muted-foreground mb-6">
            {invitation 
              ? `Welcome to ${invitation.workspaceName}!`
              : `Your workspace "${workspaceForm.name}" is ready!`
            }
          </p>
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Redirecting you to your dashboard...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-secondary/10 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative z-10 w-full">
        {step === 'welcome' && renderWelcomeStep()}
        {step === 'workspace-choice' && renderWorkspaceChoiceStep()}
        {step === 'create-workspace' && renderCreateWorkspaceStep()}
        {step === 'complete' && renderCompleteStep()}
      </div>
    </div>
  );
}
