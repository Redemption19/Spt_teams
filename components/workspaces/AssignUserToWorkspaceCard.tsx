import { useEffect, useState } from 'react';
import { User, Workspace } from '@/lib/types';
import { WorkspaceService } from '@/lib/workspace-service';
import { UserService } from '@/lib/user-service';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface AssignUserToWorkspaceCardProps {
  workspaces: Workspace[];
}

export function AssignUserToWorkspaceCard({ workspaces }: AssignUserToWorkspaceCardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'owner'>('admin');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await UserService.getAllUsers();
        setUsers(allUsers);
      } catch {
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = userQuery
    ? users.filter(u => u.name.toLowerCase().includes(userQuery.toLowerCase()) || u.email.toLowerCase().includes(userQuery.toLowerCase()))
    : users;

  const handleAssign = async () => {
    if (!selectedUserId || !selectedWorkspaceId || !role) return;
    setLoading(true);
    try {
      await WorkspaceService.addUserToWorkspace(selectedUserId, selectedWorkspaceId, role);
      toast({ title: 'User assigned', description: 'User added to workspace successfully.' });
      setSelectedUserId('');
      setUserQuery('');
    } catch {
      toast({ title: 'Error', description: 'Failed to assign user.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-8 border shadow-enhanced bg-card">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Assign User to Workspace</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            placeholder="Search user by name or email"
            value={userQuery}
            onChange={e => setUserQuery(e.target.value)}
            className="mb-2"
          />
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {filteredUsers.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} <span className="text-xs text-muted-foreground">({user.email})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map(ws => (
                <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={role} onValueChange={val => setRole(val as 'admin' | 'member' | 'owner')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAssign} disabled={loading || !selectedUserId || !selectedWorkspaceId} className="h-10 min-w-[120px]">
          {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : 'Assign'}
        </Button>
      </CardContent>
    </Card>
  );
} 