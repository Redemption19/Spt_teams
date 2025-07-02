'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Users, Settings } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { collection, query, where, getDocs, getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  status: string;
  workspaceId: string;
  createdAt: any;
}

interface UserWorkspaceStatus {
  user: User;
  hasUserWorkspace: boolean;
  isFixed: boolean;
  error?: string;
}

export default function UserFixPage() {
  const { currentWorkspace } = useWorkspace();
  const [users, setUsers] = useState<UserWorkspaceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadUsers();
    }
  }, [currentWorkspace]);

  const loadUsers = async () => {
    if (!currentWorkspace?.id) return;

    setLoading(true);
    try {
      // Get all users in the current workspace
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('workspaceId', '==', currentWorkspace.id));
      const usersSnapshot = await getDocs(q);
      
      const userStatuses: UserWorkspaceStatus[] = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const user = { id: userDoc.id, ...userDoc.data() } as User;
        
        // Check if UserWorkspace relationship exists
        const userWorkspaceRef = doc(db, 'userWorkspaces', `${user.id}_${user.workspaceId}`);
        const userWorkspaceDoc = await getDoc(userWorkspaceRef);
        
        userStatuses.push({
          user,
          hasUserWorkspace: userWorkspaceDoc.exists(),
          isFixed: false
        });
      }
      
      setUsers(userStatuses);
      
      const missingCount = userStatuses.filter(u => !u.hasUserWorkspace).length;
      if (missingCount > 0) {
        setMessage({
          type: 'info',
          text: `Found ${missingCount} users with missing UserWorkspace relationships`
        });
      } else {
        setMessage({
          type: 'success',
          text: 'All users have proper UserWorkspace relationships'
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load users. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const fixUserWorkspace = async (userStatus: UserWorkspaceStatus) => {
    const { user } = userStatus;
    setFixing(prev => [...prev, user.id]);

    try {
      // Create UserWorkspace relationship
      const userWorkspaceRef = doc(db, 'userWorkspaces', `${user.id}_${user.workspaceId}`);
      await setDoc(userWorkspaceRef, {
        id: `${user.id}_${user.workspaceId}`,
        userId: user.id,
        workspaceId: user.workspaceId,
        role: user.role,
        joinedAt: new Date(),
        invitedBy: 'system',
        scope: 'direct',
        permissions: {
          canAccessSubWorkspaces: user.role !== 'member',
          canCreateSubWorkspaces: user.role === 'owner',
          canManageInherited: user.role !== 'member',
          canViewHierarchy: true,
          canSwitchWorkspaces: true,
          canInviteToSubWorkspaces: user.role !== 'member'
        },
        effectiveRole: user.role,
        canAccessSubWorkspaces: user.role !== 'member',
        accessibleWorkspaces: [user.workspaceId]
      });

      // Update the status
      setUsers(prev => prev.map(u => 
        u.user.id === user.id 
          ? { ...u, hasUserWorkspace: true, isFixed: true }
          : u
      ));

      console.log('Fixed UserWorkspace for:', user.email);
    } catch (error) {
      console.error('Error fixing user workspace:', error);
      setUsers(prev => prev.map(u => 
        u.user.id === user.id 
          ? { ...u, error: 'Failed to fix relationship' }
          : u
      ));
    } finally {
      setFixing(prev => prev.filter(id => id !== user.id));
    }
  };

  const fixAllUsers = async () => {
    const usersToFix = users.filter(u => !u.hasUserWorkspace && !u.isFixed);
    
    for (const userStatus of usersToFix) {
      await fixUserWorkspace(userStatus);
    }

    setMessage({
      type: 'success',
      text: `Fixed UserWorkspace relationships for ${usersToFix.length} users`
    });
  };

  const getUserStatusIcon = (userStatus: UserWorkspaceStatus) => {
    if (userStatus.isFixed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (userStatus.error) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (userStatus.hasUserWorkspace) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  const getUserStatusText = (userStatus: UserWorkspaceStatus) => {
    if (userStatus.isFixed) return 'Fixed';
    if (userStatus.error) return 'Error';
    if (userStatus.hasUserWorkspace) return 'OK';
    return 'Missing Relationship';
  };

  const getUserStatusVariant = (userStatus: UserWorkspaceStatus): "default" | "secondary" | "destructive" | "outline" => {
    if (userStatus.isFixed || userStatus.hasUserWorkspace) return 'default';
    if (userStatus.error) return 'destructive';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading users...</span>
        </div>
      </div>
    );
  }

  const missingCount = users.filter(u => !u.hasUserWorkspace && !u.isFixed).length;
  const fixedCount = users.filter(u => u.isFixed).length;

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">User Relationship Fix</h1>
          <p className="text-muted-foreground">
            Fix missing UserWorkspace relationships for existing users
          </p>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200' : message.type === 'success' ? 'border-green-200' : 'border-blue-200'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{missingCount}</p>
                <p className="text-sm text-muted-foreground">Need Fixing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{fixedCount}</p>
                <p className="text-sm text-muted-foreground">Fixed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Relationships</CardTitle>
              <CardDescription>
                Manage UserWorkspace relationships for all users in {currentWorkspace?.name}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadUsers} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {missingCount > 0 && (
                <Button onClick={fixAllUsers} disabled={fixing.length > 0}>
                  Fix All ({missingCount})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((userStatus, index) => (
              <div key={userStatus.user.id}>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getUserStatusIcon(userStatus)}
                    <div>
                      <div className="font-medium">{userStatus.user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {userStatus.user.email} • {userStatus.user.role}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={getUserStatusVariant(userStatus)}>
                      {getUserStatusText(userStatus)}
                    </Badge>
                    
                    {!userStatus.hasUserWorkspace && !userStatus.isFixed && (
                      <Button
                        size="sm"
                        onClick={() => fixUserWorkspace(userStatus)}
                        disabled={fixing.includes(userStatus.user.id)}
                      >
                        {fixing.includes(userStatus.user.id) ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Fix'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                {index < users.length - 1 && <Separator />}
              </div>
            ))}
            
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found in this workspace.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About This Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • This tool fixes missing UserWorkspace relationships that are required for proper access control
            </p>
            <p>
              • UserWorkspace relationships define user permissions and workspace access
            </p>
            <p>
              • Users without these relationships may experience login issues or access problems
            </p>
            <p>
              • The fix creates proper hierarchical permissions based on the user's current role
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 