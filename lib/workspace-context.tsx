'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Workspace, UserWorkspace, SubWorkspaceData } from './types';
import { WorkspaceService } from './workspace-service';
import { InheritanceService } from './inheritance-service';
import { GuestService } from './guest-service';
import { useAuth } from './auth-context';

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
  
  // Guest-specific properties
  isGuest: boolean;
}

interface WorkspaceProviderProps {
  children: ReactNode;
  userId: string;
  authLoading?: boolean;
  isGuest?: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children, userId, authLoading = false, isGuest = false }: WorkspaceProviderProps) {
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

  // Guest state - use the prop from auth context instead of detecting by UID length
  const [isGuestState, setIsGuestState] = useState(isGuest);

  // Memoize loadUserWorkspaces to prevent infinite loops
  const loadUserWorkspaces = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {

      
      // Use the isGuest prop from auth context instead of detecting by UID length
      if (isGuest) {

        setIsGuestState(true);
        
        // Create guest workspace data
        const guestWorkspace = await GuestService.createGuestWorkspace(userId);
        const sampleData = GuestService.getSampleWorkspaceData();
        
        setUserWorkspaces([{
          workspace: guestWorkspace,
          role: 'member'
        }]);
        setMainWorkspaces([guestWorkspace]);
        setSubWorkspaces({});
        setAccessibleWorkspaces([guestWorkspace]);
        setCurrentWorkspace(guestWorkspace);
        setUserRole('member');
        
        // Create sample data for guest
        await GuestService.createSampleGuestData(userId);
        

        // Don't set loading to false here, let loadCurrentWorkspaceContext handle it
        return;
      }
      
      // Regular user workspace loading
      setIsGuestState(false);
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
      setLoading(false);
    }
    // Don't set loading to false in finally block for regular users,
    // let loadCurrentWorkspaceContext handle it
  }, [userId, isGuest]);

  // Load workspaces when userId changes
  useEffect(() => {

    
    if (!authLoading && userId) {

      // Clear any previous workspace state and localStorage before loading new user workspaces
      setUserWorkspaces([]);
      setCurrentWorkspace(null);
      setUserRole(null);
      setMainWorkspaces([]);
      setSubWorkspaces({});
      setWorkspaceHierarchy([]);
      setParentWorkspace(undefined);
      setCanCreateSubWorkspace(false);
      setAccessibleWorkspaces([]);
      setIsGuestState(isGuest);
      setLoading(true);
      localStorage.removeItem('currentWorkspaceId');
      // Now load workspaces for the new user
      loadUserWorkspaces();
    } else if (!authLoading && !userId) {
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
      setIsGuestState(false);
      setLoading(false);
      localStorage.removeItem('currentWorkspaceId');
    }
  }, [userId, authLoading, isGuest, loadUserWorkspaces]);

  // Memoize switchToWorkspace to prevent infinite loops
  const switchToWorkspace = useCallback(async (workspace: Workspace) => {
    try {

      
      // For guest users, always allow switching to guest workspace
      if (isGuestState) {
        setCurrentWorkspace(workspace);
        setUserRole('member');
        localStorage.setItem('currentWorkspaceId', workspace.id);

        return;
      }
      
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
      

    } catch (error) {
      console.error('Error switching to workspace:', error);
      throw error;
    }
  }, [userWorkspaces, userId, isGuestState]);

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
      // For guest users, always use guest workspace
      if (isGuestState) {
        const guestWorkspace = accessibleWorkspaces[0];
        if (guestWorkspace) {
          await switchToWorkspace(guestWorkspace);
        }
        return;
      }
      
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
  }, [accessibleWorkspaces, mainWorkspaces, switchToWorkspace, isGuestState]);

  // Load current workspace and set context
  useEffect(() => {
    if (userWorkspaces.length > 0 && accessibleWorkspaces.length > 0) {
      setLoading(true);
      loadCurrentWorkspaceContext().finally(() => {
        setLoading(false);
      });
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
  }, [currentWorkspace, userId, updateWorkspaceContext]);

  const refreshWorkspaces = useCallback(async () => {
    await loadUserWorkspaces();
  }, [loadUserWorkspaces]);

  const refreshCurrentWorkspace = useCallback(async () => {
    if (currentWorkspace) {
      try {
        const updatedWorkspace = await WorkspaceService.getWorkspace(currentWorkspace.id);
        if (updatedWorkspace) {
          setCurrentWorkspace(updatedWorkspace);
        }
      } catch (error) {
        console.error('Error refreshing current workspace:', error);
      }
    }
  }, [currentWorkspace]);

  const createWorkspace = useCallback(async (data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isGuestState) {
      throw new Error('Guest users cannot create workspaces');
    }
    
    const workspaceId = await WorkspaceService.createWorkspace(data, userId);
    await refreshWorkspaces();
    return workspaceId;
  }, [isGuestState, refreshWorkspaces, userId]);

  const createSubWorkspace = useCallback(async (parentWorkspaceId: string, data: SubWorkspaceData) => {
    if (isGuestState) {
      throw new Error('Guest users cannot create sub-workspaces');
    }
    
    const workspaceId = await WorkspaceService.createSubWorkspace(parentWorkspaceId, data, userId);
    await refreshWorkspaces();
    return workspaceId;
  }, [isGuestState, refreshWorkspaces, userId]);

  const getWorkspaceHierarchyPath = useCallback(async (workspaceId?: string) => {
    if (isGuestState) {
      return [accessibleWorkspaces[0]].filter(Boolean);
    }
    
    const targetId = workspaceId || currentWorkspace?.id;
    if (!targetId) return [];
    
    return await WorkspaceService.getWorkspaceHierarchyPath(targetId);
  }, [isGuestState, accessibleWorkspaces, currentWorkspace]);

  const getUserRole = useCallback((workspaceId: string) => {
    if (isGuestState) {
      return 'member';
    }
    
    const userWorkspace = userWorkspaces.find(uw => uw.workspace.id === workspaceId);
    return userWorkspace?.role || null;
  }, [isGuestState, userWorkspaces]);

  const canUserAccessWorkspace = useCallback((workspaceId: string) => {
    if (isGuestState) {
      return workspaceId === GuestService.getGuestWorkspaceId();
    }
    
    return accessibleWorkspaces.some(w => w.id === workspaceId);
  }, [isGuestState, accessibleWorkspaces]);

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
    
    // Guest-specific properties
    isGuest: isGuestState,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
