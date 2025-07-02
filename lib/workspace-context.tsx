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
  switchWorkspace: (workspaceId: string) => Promise<void>;
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

  // Load user workspaces with hierarchical data
  const loadUserWorkspaces = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // console.log(`DEBUG: WorkspaceContext.loadUserWorkspaces called for userId: ${userId}`);
      
      // Load basic workspace relationships
      const workspaces = await WorkspaceService.getUserWorkspaces(userId);
      // console.log(`DEBUG: getUserWorkspaces returned:`, workspaces);
      setUserWorkspaces(workspaces);
      
      // Load hierarchical workspace data
      const hierarchicalData = await WorkspaceService.getUserAccessibleWorkspaces(userId);
      setMainWorkspaces(hierarchicalData.mainWorkspaces);
      setSubWorkspaces(hierarchicalData.subWorkspaces);
      
      // Create flat list of accessible workspaces
      const allAccessible: Workspace[] = [
        ...hierarchicalData.mainWorkspaces,
        ...Object.values(hierarchicalData.subWorkspaces).flat()
      ];
      setAccessibleWorkspaces(allAccessible);
      
      console.log('Loaded hierarchical workspace data:', {
        mainWorkspaces: hierarchicalData.mainWorkspaces.length,
        subWorkspaces: Object.keys(hierarchicalData.subWorkspaces).length,
        totalAccessible: allAccessible.length
      });
      
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

  // Load current workspace and set context
  useEffect(() => {
    if (userWorkspaces.length > 0 && accessibleWorkspaces.length > 0) {
      loadCurrentWorkspaceContext();
    }
  }, [userWorkspaces, accessibleWorkspaces]);

  // Update context when current workspace changes
  useEffect(() => {
    if (currentWorkspace && userId) {
      updateWorkspaceContext();
    }
  }, [currentWorkspace, userId]);

  // Real-time workspace settings listener
  useEffect(() => {
    if (!currentWorkspace?.id) return;

    const workspaceRef = doc(db, 'workspaces', currentWorkspace.id);
    
    const unsubscribe = onSnapshot(workspaceRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const updatedWorkspace = {
          id: docSnapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        } as Workspace;
        
        // Check for changes, especially the critical allowAdminWorkspaceCreation setting
        const currentSettings = currentWorkspace.settings;
        const newSettings = updatedWorkspace.settings;
        
        const currentAllowAdmin = currentSettings?.allowAdminWorkspaceCreation;
        const newAllowAdmin = newSettings?.allowAdminWorkspaceCreation;
        const adminPermissionChanged = currentAllowAdmin !== newAllowAdmin;
        
        const settingsChanged = JSON.stringify(currentSettings) !== JSON.stringify(newSettings);
        
        // Force update if critical admin permission changed or any settings changed
        if (settingsChanged || adminPermissionChanged) {
          // Update the workspace context
          setCurrentWorkspace(updatedWorkspace);
          
          // Notify user of settings change (especially important for admin users)
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('workspaceSettingsChanged', {
              detail: {
                workspaceId: updatedWorkspace.id,
                workspaceName: updatedWorkspace.name,
                newSettings: updatedWorkspace.settings,
                adminPermissionChanged
              }
            });
            window.dispatchEvent(event);
          }
        }
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, [currentWorkspace?.id]);

  const loadCurrentWorkspaceContext = async () => {
    try {
      // console.log(`DEBUG: loadCurrentWorkspaceContext called`);
      // console.log(`DEBUG: accessibleWorkspaces.length: ${accessibleWorkspaces.length}`);
      // console.log(`DEBUG: mainWorkspaces.length: ${mainWorkspaces.length}`);
      
      // Get saved workspace or default to first main workspace
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
      // console.log(`DEBUG: savedWorkspaceId from localStorage: ${savedWorkspaceId}`);
      
      let targetWorkspace: Workspace | null = null;
      
      if (savedWorkspaceId) {
        targetWorkspace = accessibleWorkspaces.find(w => w.id === savedWorkspaceId) || null;
        // console.log(`DEBUG: Found saved workspace:`, targetWorkspace);
      }
      
      // Default to first main workspace if no saved workspace
      if (!targetWorkspace && mainWorkspaces.length > 0) {
        targetWorkspace = mainWorkspaces[0];
        // console.log(`DEBUG: Using first main workspace:`, targetWorkspace);
      }
      
      // If no main workspaces, use first accessible workspace
      if (!targetWorkspace && accessibleWorkspaces.length > 0) {
        targetWorkspace = accessibleWorkspaces[0];
        // console.log(`DEBUG: Using first accessible workspace:`, targetWorkspace);
      }
      
      if (targetWorkspace) {
        // console.log(`DEBUG: About to call switchToWorkspace with:`, targetWorkspace);
        await switchToWorkspace(targetWorkspace);
      } else {
        // console.log(`DEBUG: No target workspace found!`);
      }
    } catch (error) {
      console.error('Error loading current workspace context:', error);
    }
  };

  const updateWorkspaceContext = async () => {
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
  };

  const switchToWorkspace = async (workspace: Workspace) => {
    try {
      // console.log(`DEBUG: switchToWorkspace called for workspace: ${workspace.name} (${workspace.id})`);
      // console.log(`DEBUG: Available userWorkspaces:`, userWorkspaces);
      
      // Find user's role in this workspace
      const userWorkspace = userWorkspaces.find(uw => uw.workspace.id === workspace.id);
      // console.log(`DEBUG: Found userWorkspace:`, userWorkspace);
      
      const role = userWorkspace?.role || null;
      // console.log(`DEBUG: Determined role:`, role);
      
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
  };

  const switchWorkspace = async (workspaceId: string) => {
    try {
      let workspace: Workspace | undefined = accessibleWorkspaces.find(w => w.id === workspaceId);
      
      // If workspace not found in cache or we need fresh data, fetch from database
      if (!workspace) {
        console.log(`Workspace ${workspaceId} not found in cache, fetching from database...`);
        const fetchedWorkspace = await WorkspaceService.getWorkspace(workspaceId);
        workspace = fetchedWorkspace ?? undefined;
        
        if (!workspace) {
          throw new Error('Workspace not accessible');
        }
        
        // Verify user has access to this workspace
        const userRole = await WorkspaceService.getUserRole(userId!, workspaceId);
        if (!userRole) {
          throw new Error('User does not have access to this workspace');
        }
      }
      
      await switchToWorkspace(workspace);
    } catch (error) {
      console.error('Error switching workspace:', error);
      throw error;
    }
  };

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
      await switchWorkspace(workspaceId);
      
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
      await switchWorkspace(subWorkspaceId);
      
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
    switchWorkspace,
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
