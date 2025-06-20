'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Workspace, UserWorkspace } from './types';
import { WorkspaceService } from './workspace-service';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  userWorkspaces: {workspace: Workspace, role: string}[];
  userRole: string | null;
  loading: boolean;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

interface WorkspaceProviderProps {
  children: ReactNode;
  userId?: string; // Current authenticated user ID
}

export function WorkspaceProvider({ children, userId }: WorkspaceProviderProps) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [userWorkspaces, setUserWorkspaces] = useState<{workspace: Workspace, role: string}[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadUserWorkspaces = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const workspaces = await WorkspaceService.getUserWorkspaces(userId);
      setUserWorkspaces(workspaces);
    } catch (error) {
      console.error('Error loading user workspaces:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load workspaces when userId changes
  useEffect(() => {
    if (userId) {
      loadUserWorkspaces();
    } else {
      setUserWorkspaces([]);
      setCurrentWorkspace(null);
      setUserRole(null);
      setLoading(false);
    }
  }, [userId, loadUserWorkspaces]);

  // Load current workspace from localStorage on mount
  useEffect(() => {
    if (userWorkspaces.length > 0) {
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
      if (savedWorkspaceId) {
        const savedWorkspace = userWorkspaces.find(uw => uw.workspace.id === savedWorkspaceId);
        if (savedWorkspace) {
          setCurrentWorkspace(savedWorkspace.workspace);
          setUserRole(savedWorkspace.role);
          return;
        }
      }
      
      // If no saved workspace or saved workspace not found, use the first one
      if (userWorkspaces[0]) {
        setCurrentWorkspace(userWorkspaces[0].workspace);
        setUserRole(userWorkspaces[0].role);
        localStorage.setItem('currentWorkspaceId', userWorkspaces[0].workspace.id);
      }
    }  }, [userWorkspaces]);

  const switchWorkspace = async (workspaceId: string) => {
    try {
      const workspaceData = userWorkspaces.find(uw => uw.workspace.id === workspaceId);
      if (workspaceData) {
        setCurrentWorkspace(workspaceData.workspace);
        setUserRole(workspaceData.role);
        localStorage.setItem('currentWorkspaceId', workspaceId);
      }
    } catch (error) {
      console.error('Error switching workspace:', error);
      throw error;
    }
  };

  const refreshWorkspaces = async () => {
    await loadUserWorkspaces();
  };

  const createWorkspace = async (data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      const workspaceId = await WorkspaceService.createWorkspace(data, userId);
      await refreshWorkspaces();
      return workspaceId;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  };

  const value: WorkspaceContextType = {
    currentWorkspace,
    userWorkspaces,
    userRole,
    loading,
    switchWorkspace,
    refreshWorkspaces,
    createWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
