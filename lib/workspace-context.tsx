'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Workspace, UserWorkspace, SubWorkspaceData } from './types';
import { WorkspaceService } from './workspace-service';
import { InheritanceService } from './inheritance-service';

interface WorkspaceContextType {
  // Current workspace state
  currentWorkspace: Workspace | null;
  userWorkspaces: {workspace: Workspace, role: string}[];
  userRole: string | null;
  loading: boolean;
  
  // Hierarchical workspace data
  mainWorkspaces: Workspace[];
  subWorkspaces: { [parentId: string]: Workspace[] };
  workspaceHierarchy: Workspace[];
  parentWorkspace: Workspace | undefined;
  canCreateSubWorkspace: boolean;
  accessibleWorkspaces: Workspace[];
  
  // Workspace management
  switchToWorkspace: (workspaceId: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  refreshCurrentWorkspace: () => Promise<void>;
  createWorkspace: (data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  createSubWorkspace: (parentWorkspaceId: string, data: SubWorkspaceData) => Promise<string>;
  
  // Hierarchy navigation
  getWorkspaceHierarchyPath: (workspaceId?: string) => Promise<Workspace[]>;
  getUserRole: (workspaceId: string) => string | null;
  canUserAccessWorkspace: (workspaceId: string) => boolean;
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
  // Basic workspace state
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [userWorkspaces, setUserWorkspaces] = useState<{workspace: Workspace, role: string}[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Hierarchical workspace state
  const [mainWorkspaces, setMainWorkspaces] = useState<Workspace[]>([]);
  const [subWorkspaces, setSubWorkspaces] = useState<{ [parentId: string]: Workspace[] }>({});
  const [workspaceHierarchy, setWorkspaceHierarchy] = useState<Workspace[]>([]);
  const [parentWorkspace, setParentWorkspace] = useState<Workspace | undefined>(undefined);
  const [canCreateSubWorkspace, setCanCreateSubWorkspace] = useState(false);
  const [accessibleWorkspaces, setAccessibleWorkspaces] = useState<Workspace[]>([]);

  // Memoize loadUserWorkspaces to prevent infinite loops
  const loadUserWorkspaces = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const workspaces = await WorkspaceService.getUserWorkspaces(userId);
      setUserWorkspaces(workspaces);
      
      // Extract main and sub workspaces
      const mains = workspaces.filter(uw => uw.workspace.workspaceType === 'main').map(uw => uw.workspace);
      const subs: { [parentId: string]: Workspace[] } = {};
      
      workspaces
        .filter(uw => uw.workspace.workspaceType === 'sub')
        .forEach(uw => {
          const parentId = uw.workspace.parentWorkspaceId;
          if (parentId) {
            if (!subs[parentId]) subs[parentId] = [];
            subs[parentId].push(uw.workspace);
          }
        });
      
      setMainWorkspaces(mains);
      setSubWorkspaces(subs);
      setAccessibleWorkspaces(workspaces.map(uw => uw.workspace));
      
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
      // Reset all state when user logs out
      setUserWorkspaces([]);
      setCurrentWorkspace(null);
      setUserRole(null);
      setMainWorkspaces([]);
      setSubWorkspaces({});
      setWorkspaceHierarchy([]);
      setParentWorkspace(undefined);
      setCanCreateSubWorkspace(false);
      setAccessibleWorkspaces([]);
      setLoading(false);
    }
  }, [userId, loadUserWorkspaces]);

  // Memoize switchToWorkspace to prevent infinite loops
  const switchToWorkspace = useCallback(async (workspace: Workspace) => {
    try {
      // Find user's role in this workspace
      const userWorkspace = userWorkspaces.find(uw => uw.workspace.id === workspace.id);
      const role = userWorkspace?.role || null;
      
      // Update state
      setCurrentWorkspace(workspace);
      setUserRole(role);
      
      // Save to localStorage
      localStorage.setItem('currentWorkspaceId', workspace.id);
      
      // Update user's active workspace in database
      if (userId) {
        await WorkspaceService.switchUserWorkspace(userId, workspace.id);
      }
      
      console.log(`Switched to workspace: ${workspace.name} (${workspace.workspaceType}) with role: ${role}`);
    } catch (error) {
      console.error('Error switching to workspace:', error);
      throw error;
    }
  }, [userWorkspaces, userId]);

  // Helper function to switch to workspace by ID
  const switchToWorkspaceById = useCallback(async (workspaceId: string) => {
    const workspace = accessibleWorkspaces.find(w => w.id === workspaceId);
    if (!workspace) {
      throw new Error(`Workspace with ID ${workspaceId} not found or not accessible`);
    }
    await switchToWorkspace(workspace);
  }, [accessibleWorkspaces, switchToWorkspace]);

  // Memoize loadCurrentWorkspaceContext to prevent infinite loops
  const loadCurrentWorkspaceContext = useCallback(async () => {
    try {
      // Get saved workspace or default to first main workspace
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
      
      let targetWorkspace: Workspace | null = null;
      
      if (savedWorkspaceId) {
        targetWorkspace = accessibleWorkspaces.find(w => w.id === savedWorkspaceId) || null;
      }
      
      // Default to first main workspace if no saved workspace
      if (!targetWorkspace && mainWorkspaces.length > 0) {
        targetWorkspace = mainWorkspaces[0];
      }
      
      // If no main workspaces, use first accessible workspace
      if (!targetWorkspace && accessibleWorkspaces.length > 0) {
        targetWorkspace = accessibleWorkspaces[0];
      }
      
      if (targetWorkspace) {
        await switchToWorkspace(targetWorkspace);
      }
    } catch (error) {
      console.error('Error loading current workspace context:', error);
    }
  }, [accessibleWorkspaces, mainWorkspaces, switchToWorkspace]);

  // Load current workspace and set context
  useEffect(() => {
    if (userWorkspaces.length > 0 && accessibleWorkspaces.length > 0) {
      loadCurrentWorkspaceContext();
    }
  }, [userWorkspaces.length, accessibleWorkspaces.length, loadCurrentWorkspaceContext]);

  // Memoize updateWorkspaceContext to prevent infinite loops
  const updateWorkspaceContext = useCallback(async () => {
    if (!currentWorkspace || !userId) return;
    
    try {
      // Update hierarchy path
      const hierarchyPath = await WorkspaceService.getWorkspaceHierarchyPath(currentWorkspace.id);
      setWorkspaceHierarchy(hierarchyPath);
      
      // Set parent workspace if this is a sub-workspace
      if (currentWorkspace.workspaceType === 'sub' && currentWorkspace.parentWorkspaceId) {
        const parent = await WorkspaceService.getWorkspace(currentWorkspace.parentWorkspaceId);
        setParentWorkspace(parent ?? undefined);
      } else {
        setParentWorkspace(undefined);
      }
      
      // Check if user can create sub-workspaces
      const canCreate = await WorkspaceService.canUserCreateSubWorkspace(userId, currentWorkspace.id);
      setCanCreateSubWorkspace(canCreate);
      
    } catch (error) {
      console.error('Error updating workspace context:', error);
    }
  }, [currentWorkspace, userId]);

  // Update context when current workspace changes
  useEffect(() => {
    if (currentWorkspace && userId) {
      updateWorkspaceContext();
    }
  }, [currentWorkspace?.id, userId, updateWorkspaceContext]);

  const refreshWorkspaces = async () => {
    await loadUserWorkspaces();
    
    // Also refresh the current workspace to get latest settings
    if (currentWorkspace) {
      await refreshCurrentWorkspace();
    }
  };

  const refreshCurrentWorkspace = async () => {
    if (!currentWorkspace?.id) return;
    
    try {
      // Fetch the latest workspace data from database
      const latestWorkspace = await WorkspaceService.getWorkspace(currentWorkspace.id);
      
      if (latestWorkspace) {
        setCurrentWorkspace(latestWorkspace);
      }
    } catch (error) {
      console.error('Error refreshing current workspace:', error);
    }
  };

  const createWorkspace = async (data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      const workspaceId = await WorkspaceService.createWorkspace(data, userId);
      await refreshWorkspaces();
      
      // Switch to the new workspace
      await switchToWorkspaceById(workspaceId);
      
      return workspaceId;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  };

  const createSubWorkspace = async (
    parentWorkspaceId: string, 
    data: SubWorkspaceData
  ): Promise<string> => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      console.log('Creating sub-workspace with data:', data);
      const subWorkspaceId = await WorkspaceService.createSubWorkspace(parentWorkspaceId, data, userId);
      
      // Refresh workspace data to include the new sub-workspace
      await refreshWorkspaces();
      
      // Give a moment for the refresh to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Switch to the new sub-workspace (this will now fetch fresh data if needed)
      await switchToWorkspaceById(subWorkspaceId);
      
      return subWorkspaceId;
    } catch (error) {
      console.error('Error creating sub-workspace:', error);
      throw error;
    }
  };

  const getWorkspaceHierarchyPath = async (workspaceId?: string): Promise<Workspace[]> => {
    try {
      const targetWorkspaceId = workspaceId || currentWorkspace?.id;
      if (!targetWorkspaceId) return [];
      
      return await WorkspaceService.getWorkspaceHierarchyPath(targetWorkspaceId);
    } catch (error) {
      console.error('Error getting workspace hierarchy path:', error);
      return [];
    }
  };

  const getUserRole = (workspaceId: string): string | null => {
    const userWorkspace = userWorkspaces.find(uw => uw.workspace.id === workspaceId);
    return userWorkspace?.role || null;
  };

  const canUserAccessWorkspace = (workspaceId: string): boolean => {
    return accessibleWorkspaces.some(w => w.id === workspaceId);
  };

  const value: WorkspaceContextType = {
    // Current workspace state
    currentWorkspace,
    userWorkspaces,
    userRole,
    loading,
    
    // Hierarchical workspace data
    mainWorkspaces,
    subWorkspaces,
    workspaceHierarchy,
    parentWorkspace,
    canCreateSubWorkspace,
    accessibleWorkspaces,
    
    // Workspace management
    switchToWorkspace: switchToWorkspaceById,
    refreshWorkspaces,
    refreshCurrentWorkspace,
    createWorkspace,
    createSubWorkspace,
    
    // Hierarchy navigation
    getWorkspaceHierarchyPath,
    getUserRole,
    canUserAccessWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
