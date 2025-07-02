'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, CheckCircle, AlertCircle, User, Building } from 'lucide-react';
import { getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function UserVerification() {
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const verifyUser = async () => {
    if (!userId && !userEmail) {
      toast({
        title: 'Error',
        description: 'Please enter either a User ID or Email',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const result: any = {
        userDocument: null,
        userWorkspaces: [],
        workspaceDetails: [],
        issues: []
      };

      // Get user document
      if (userId) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          result.userDocument = { id: userDoc.id, ...userDoc.data() };
        } else {
          result.issues.push('User document not found');
        }
      } else if (userEmail) {
        // Search by email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          result.userDocument = { id: userDoc.id, ...userDoc.data() };
          setUserId(userDoc.id); // Set userId for workspace lookup
        } else {
          result.issues.push('User not found by email');
        }
      }

      // Get user-workspace relationships
      if (result.userDocument?.id) {
        const userWorkspacesRef = collection(db, 'userWorkspaces');
        const q = query(userWorkspacesRef, where('userId', '==', result.userDocument.id));
        const snapshot = await getDocs(q);
        
        result.userWorkspaces = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (result.userWorkspaces.length === 0) {
          result.issues.push('No UserWorkspace relationships found');
        }

        // Get workspace details
        for (const uw of result.userWorkspaces) {
          const workspaceDoc = await getDoc(doc(db, 'workspaces', (uw as any).workspaceId));
          if (workspaceDoc.exists()) {
            result.workspaceDetails.push({
              id: workspaceDoc.id,
              ...workspaceDoc.data()
            });
          }
        }
      }

      // Check for inconsistencies
      if (result.userDocument && result.userWorkspaces.length > 0) {
        const userRole = result.userDocument.role;
        const workspaceRole = (result.userWorkspaces[0] as any).role;
        
        if (userRole !== workspaceRole) {
          result.issues.push(`Role mismatch: User document shows "${userRole}" but UserWorkspace shows "${workspaceRole}"`);
        }

        const userWorkspaceId = result.userDocument.workspaceId;
        const hasMatchingWorkspace = result.userWorkspaces.some((uw: any) => uw.workspaceId === userWorkspaceId);
        
        if (!hasMatchingWorkspace) {
          result.issues.push(`User's workspaceId "${userWorkspaceId}" not found in UserWorkspace relationships`);
        }
      }

      setVerificationResult(result);

      if (result.issues.length === 0) {
        toast({
          title: 'Verification Complete',
          description: 'User setup appears correct!',
        });
      } else {
        toast({
          title: 'Issues Found',
          description: `Found ${result.issues.length} issue(s)`,
          variant: 'destructive',
        });
      }

    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fixUserWorkspaceRelationship = async () => {
    if (!verificationResult?.userDocument) return;

    try {
      setLoading(true);
      const user = verificationResult.userDocument;
      
      // Import setDoc here to avoid circular imports
      const { setDoc } = await import('firebase/firestore');
      
      const userWorkspaceRef = doc(db, 'userWorkspaces', `${user.id}_${user.workspaceId}`);
      const userWorkspace = {
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
      };
      
      await setDoc(userWorkspaceRef, userWorkspace);
      
      toast({
        title: 'Fixed!',
        description: 'UserWorkspace relationship created successfully',
      });
      
      // Re-verify
      await verifyUser();
      
    } catch (error: any) {
      toast({
        title: 'Fix Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>User Verification Tool</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userEmail">Or User Email</Label>
            <Input
              id="userEmail"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Enter user email"
            />
          </div>
        </div>

        <Button onClick={verifyUser} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify User
        </Button>

        {verificationResult && (
          <div className="space-y-4 mt-6">
            {/* Issues */}
            {verificationResult.issues.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h3 className="font-semibold text-red-800 dark:text-red-200 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Issues Found ({verificationResult.issues.length})
                </h3>
                <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 mt-2">
                  {verificationResult.issues.map((issue: string, index: number) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
                
                {verificationResult.issues.includes('No UserWorkspace relationships found') && (
                  <Button 
                    onClick={fixUserWorkspaceRelationship}
                    disabled={loading}
                    size="sm"
                    className="mt-3"
                  >
                    Fix UserWorkspace Relationship
                  </Button>
                )}
              </div>
            )}

            {/* Success */}
            {verificationResult.issues.length === 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h3 className="font-semibold text-green-800 dark:text-green-200 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  User Setup Correct
                </h3>
              </div>
            )}

            {/* User Document */}
            {verificationResult.userDocument && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  User Document
                </h3>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p><strong>ID:</strong> {verificationResult.userDocument.id}</p>
                  <p><strong>Name:</strong> {verificationResult.userDocument.name}</p>
                  <p><strong>Email:</strong> {verificationResult.userDocument.email}</p>
                  <p><strong>Role:</strong> <Badge variant="outline">{verificationResult.userDocument.role}</Badge></p>
                  <p><strong>Workspace ID:</strong> {verificationResult.userDocument.workspaceId}</p>
                  <p><strong>Status:</strong> <Badge variant={verificationResult.userDocument.status === 'active' ? 'default' : 'secondary'}>{verificationResult.userDocument.status}</Badge></p>
                </div>
              </div>
            )}

            {/* UserWorkspace Relationships */}
            {verificationResult.userWorkspaces.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Workspace Relationships ({verificationResult.userWorkspaces.length})
                </h3>
                {verificationResult.userWorkspaces.map((uw: any, index: number) => (
                  <div key={index} className="p-3 bg-muted rounded-lg text-sm">
                    <p><strong>Workspace ID:</strong> {uw.workspaceId}</p>
                    <p><strong>Role:</strong> <Badge variant="outline">{uw.role}</Badge></p>
                    <p><strong>Scope:</strong> {uw.scope || 'N/A'}</p>
                    <p><strong>Effective Role:</strong> {uw.effectiveRole || 'N/A'}</p>
                    <p><strong>Joined:</strong> {uw.joinedAt ? new Date(uw.joinedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Workspace Details */}
            {verificationResult.workspaceDetails.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Workspace Details</h3>
                {verificationResult.workspaceDetails.map((workspace: any, index: number) => (
                  <div key={index} className="p-3 bg-muted rounded-lg text-sm">
                    <p><strong>Name:</strong> {workspace.name}</p>
                    <p><strong>Type:</strong> {workspace.workspaceType || 'main'}</p>
                    <p><strong>Owner ID:</strong> {workspace.ownerId}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 