import { useEffect, useState } from 'react';
import { Workspace, User } from '@/lib/types';
import { WorkspaceService } from '@/lib/workspace-service';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface MoveUserBetweenWorkspacesCardProps {
  workspaces: Workspace[];
}

export function MoveUserBetweenWorkspacesCard({ workspaces }: MoveUserBetweenWorkspacesCardProps) {
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [users, setUsers] = useState<{ user: User; role: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [removeFromSource, setRemoveFromSource] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!sourceId) {
      setUsers([]);
      setSelectedUserId('');
      return;
    }
    const fetchMembers = async () => {
      try {
        const members = await WorkspaceService.getWorkspaceUsers(sourceId);
        setUsers(members);
      } catch {
        setUsers([]);
      }
    };
    fetchMembers();
  }, [sourceId]);

  const handleMove = async () => {
    if (!selectedUserId || !sourceId || !targetId || !role) return;
    setLoading(true);
    try {
      await WorkspaceService.addUserToWorkspace(selectedUserId, targetId, role);
      if (removeFromSource) {
        await WorkspaceService.removeUserFromWorkspace(selectedUserId, sourceId, 'system');
      }
      toast({ title: 'User moved', description: 'User moved to target workspace successfully.' });
      setSelectedUserId('');
    } catch {
      toast({ title: 'Error', description: 'Failed to move user.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const availableTargets = workspaces.filter(ws => ws.id !== sourceId);
  const selectedUser = users.find(u => u.user.id === selectedUserId);

  return (
    <Card className="mb-8 border shadow-enhanced bg-card">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Move User Between Workspaces</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Select value={sourceId} onValueChange={setSourceId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Source workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map(ws => (
                <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={!sourceId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {users.map(({ user, role }) => (
                <SelectItem key={user.id} value={user.id}>{user.name} <span className="text-xs text-muted-foreground">({role})</span></SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={targetId} onValueChange={setTargetId} disabled={!sourceId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Target workspace" />
            </SelectTrigger>
            <SelectContent>
              {availableTargets.map(ws => (
                <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={role} onValueChange={val => setRole(val as 'admin' | 'member')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Role in target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Checkbox checked={removeFromSource} onCheckedChange={setRemoveFromSource} id="remove-source" />
          <label htmlFor="remove-source" className="text-xs text-muted-foreground">Remove from source</label>
        </div>
        <Button onClick={handleMove} disabled={loading || !selectedUserId || !sourceId || !targetId} className="h-10 min-w-[120px]">
          {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : 'Move'}
        </Button>
      </CardContent>
    </Card>
  );
} 