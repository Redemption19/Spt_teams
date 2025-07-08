"use client";
import { useState } from 'react';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const db = getFirestore();

export default function FixSubWorkspaceOwnership() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fixed, setFixed] = useState<number | null>(null);
  const [toFix, setToFix] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  async function findSubWorkspacesToFix() {
    if (!user) {
      setError('You must be logged in to use this tool.');
      return;
    }
    setLoading(true);
    setError(null);
    setFixed(null);
    setToFix([]);
    try {
      const workspacesRef = collection(db, 'workspaces');
      const snapshot = await getDocs(workspacesRef);
      const mySubs: any[] = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.workspaceType === 'sub' && data.ownerId === user.uid) {
          // Check userWorkspaces
          const uwRef = doc(db, 'userWorkspaces', `${user.uid}_${docSnap.id}`);
          const uwSnap = await getDoc(uwRef);
          if (!uwSnap.exists() || uwSnap.data().role !== 'owner') {
            mySubs.push({ id: docSnap.id, name: data.name });
          }
        }
      }
      setToFix(mySubs);
      setChecked(true);
    } catch (e: any) {
      setError(e.message || 'Error finding sub-workspaces');
    } finally {
      setLoading(false);
    }
  }

  async function fixOwnerships() {
    if (!user) {
      setError('You must be logged in to use this tool.');
      return;
    }
    setLoading(true);
    setError(null);
    let count = 0;
    try {
      for (const ws of toFix) {
        const uwRef = doc(db, 'userWorkspaces', `${user.uid}_${ws.id}`);
        await setDoc(uwRef, {
          id: `${user.uid}_${ws.id}`,
          userId: user.uid,
          workspaceId: ws.id,
          role: 'owner',
          joinedAt: new Date(),
          scope: 'direct',
          permissions: {
            canAccessSubWorkspaces: true,
            canCreateSubWorkspaces: true,
            canManageInherited: true,
            canViewHierarchy: true,
            canSwitchWorkspaces: true,
            canInviteToSubWorkspaces: true
          },
          effectiveRole: 'owner',
          canAccessSubWorkspaces: true,
          accessibleWorkspaces: [ws.id]
        }, { merge: true });
        count++;
      }
      setFixed(count);
      setToFix([]);
    } catch (e: any) {
      setError(e.message || 'Error fixing ownerships');
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <Card className="max-w-xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Fix Sub-Workspace Ownership</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">You must be logged in to use this tool.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Fix Sub-Workspace Ownership</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          This tool will find all sub-workspaces where you are the owner but not set as <b>owner</b> in userWorkspaces, and fix them so you have full owner privileges in the UI.
        </p>
        <Button onClick={findSubWorkspacesToFix} disabled={loading} className="mb-4">
          {loading ? 'Checking...' : 'Check My Sub-Workspaces'}
        </Button>
        {checked && !loading && (
          <div className="mb-4">
            {toFix.length === 0 ? (
              <span className="text-green-600">All your sub-workspaces are correct! 🎉</span>
            ) : (
              <>
                <div className="mb-2 text-yellow-600">{toFix.length} sub-workspaces need fixing:</div>
                <ul className="mb-2 list-disc pl-5">
                  {toFix.map(ws => <li key={ws.id}>{ws.name} ({ws.id})</li>)}
                </ul>
                <Button onClick={fixOwnerships} disabled={loading} variant="destructive">
                  {loading ? 'Fixing...' : 'Fix Ownerships'}
                </Button>
              </>
            )}
          </div>
        )}
        {fixed !== null && (
          <div className="text-green-600 mb-2">Fixed {fixed} sub-workspaces!</div>
        )}
        {error && <div className="text-red-600">{error}</div>}
      </CardContent>
    </Card>
  );
} 