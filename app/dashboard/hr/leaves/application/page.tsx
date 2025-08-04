'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { WorkspaceService } from '@/lib/workspace-service';
import { useIsAdminOrOwner } from '@/lib/rbac-hooks';
import AnnualLeaveApplicationForm from '@/components/leave/AnnualLeaveApplicationForm';

export default function AnnualLeaveApplicationPage() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const isAdminOrOwner = useIsAdminOrOwner();
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkspaces = async () => {
      // For members, we don't need to load workspaces, so set loading to false immediately
      if (!user) {
        setLoading(false);
        return;
      }

      // For non-admin/non-owner users, we don't need to load workspaces
      if (!isAdminOrOwner) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userWorkspaces = await WorkspaceService.getUserWorkspaces(user.uid);
        const validWorkspaces = userWorkspaces
          .map(uw => uw.workspace)
          .filter(ws => ws && ws.id);
        setAllWorkspaces(validWorkspaces);
      } catch (error) {
        console.error('Error loading workspaces:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, [user, isAdminOrOwner]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
          <p className="text-muted-foreground">Please select a workspace to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnnualLeaveApplicationForm
        workspaceId={currentWorkspace.id}
        allWorkspaces={allWorkspaces}
        shouldShowCrossWorkspace={isAdminOrOwner && allWorkspaces.length > 1}
        onSuccess={() => {
          // Redirect back to leaves page after successful submission
          window.location.href = '/dashboard/hr/leaves';
        }}
      />
    </div>
  );
} 