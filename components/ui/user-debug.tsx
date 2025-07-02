'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { getDoc, doc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function UserDebug() {
  const [userEmail, setUserEmail] = useState('');
  const [debugResult, setDebugResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const debugUser = async () => {
    if (!userEmail) {
      toast({
        title: 'Error',
        description: 'Please enter user email',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const result: any = {
        userDocument: null,
        userWorkspaces: [],
        issues: []
      };

      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', userEmail));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        result.issues.push('User not found');
        setDebugResult(result);
        return;
      }

      const userDoc = snapshot.docs[0];
      result.userDocument = { id: userDoc.id, ...userDoc.data() };

      // Get UserWorkspace relationships
      const userWorkspacesRef = collection(db, 'userWorkspaces');
      const uwQuery = query(userWorkspacesRef, where('userId', '==', result.userDocument.id));
      const uwSnapshot = await getDocs(uwQuery);
      
      result.userWorkspaces = uwSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Check for issues
      if (result.userWorkspaces.length === 0) {
        result.issues.push('Missing UserWorkspace relationship');
      }

      if (result.userDocument.role !== result.userWorkspaces[0]?.role) {
        result.issues.push(`Role mismatch: User=${result.userDocument.role}, UserWorkspace=${result.userWorkspaces[0]?.role}`);
      }

      setDebugResult(result);

      if (result.issues.length === 0) {
        toast({
          title: 'User is properly configured',
          description: 'No issues found',
        });
      }

    } catch (error: any) {
      toast({
        title: 'Debug failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fixUserWorkspace = async () => {
    if (!debugResult?.userDocument) return;

    try {
      setLoading(true);
      const user = debugResult.userDocument;
      
      const userWorkspaceRef = doc(db, 'userWorkspaces', `${user.id}_${user.workspaceId}`);
      await setDoc(userWorkspaceRef, {
        id: `${user.id}_${user.workspaceId}`,
        userId: user.id,
        workspaceId: user.workspaceId,
        role: user.role,
        joinedAt: new Date(),
        scope: 'direct',
        effectiveRole: user.role,
        permissions: {
          canAccessSubWorkspaces: user.role !== 'member',
          canCreateSubWorkspaces: user.role === 'owner',
          canManageInherited: user.role !== 'member',
          canViewHierarchy: true,
          canSwitchWorkspaces: true,
          canInviteToSubWorkspaces: user.role !== 'member'
        }
      });
      
      toast({
        title: 'Fixed!',
        description: 'UserWorkspace relationship created',
      });
      
      await debugUser(); // Refresh
      
    } catch (error: any) {
      toast({
        title: 'Fix failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>User Debug Tool</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="Enter user email"
            className="flex-1"
          />
          <Button onClick={debugUser} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Debug
          </Button>
        </div>

        {debugResult && (
          <div className="space-y-4">
            {debugResult.issues.length > 0 ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-800">Issues Found:</span>
                </div>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {debugResult.issues.map((issue: string, i: number) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
                
                {debugResult.issues.includes('Missing UserWorkspace relationship') && (
                  <Button 
                    onClick={fixUserWorkspace}
                    disabled={loading}
                    size="sm"
                    className="mt-3"
                  >
                    Fix UserWorkspace
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-800">User properly configured</span>
                </div>
              </div>
            )}

            {debugResult.userDocument && (
              <div className="space-y-2">
                <h3 className="font-semibold">User Details</h3>
                <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                  <p><strong>ID:</strong> {debugResult.userDocument.id}</p>
                  <p><strong>Name:</strong> {debugResult.userDocument.name}</p>
                  <p><strong>Role:</strong> <Badge>{debugResult.userDocument.role}</Badge></p>
                  <p><strong>Workspace:</strong> {debugResult.userDocument.workspaceId}</p>
                  <p><strong>Status:</strong> <Badge variant="outline">{debugResult.userDocument.status}</Badge></p>
                </div>
              </div>
            )}

            {debugResult.userWorkspaces.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">UserWorkspace Relationships</h3>
                {debugResult.userWorkspaces.map((uw: any, i: number) => (
                  <div key={i} className="p-3 bg-muted rounded-lg text-sm space-y-1">
                    <p><strong>Workspace:</strong> {uw.workspaceId}</p>
                    <p><strong>Role:</strong> <Badge>{uw.role}</Badge></p>
                    <p><strong>Scope:</strong> {uw.scope || 'N/A'}</p>
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