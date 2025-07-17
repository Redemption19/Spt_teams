import { useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { WorkspaceService } from '@/lib/workspace-service';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Users } from 'lucide-react';

interface WorkspaceMembersTableProps {
  workspaceId: string;
}

export function WorkspaceMembersTable({ workspaceId }: WorkspaceMembersTableProps) {
  const [members, setMembers] = useState<Array<{ user: User; role: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await WorkspaceService.getWorkspaceUsers(workspaceId);
      setMembers(users);
    } catch (err) {
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
    setUpdating(userId);
    try {
      await WorkspaceService.updateUserWorkspaceRole(userId, workspaceId, newRole, 'system');
      toast({ title: 'Role updated', description: `User role changed to ${newRole}` });
      fetchMembers();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Loading members...
      </div>
    );
  }
  if (error) {
    return <div className="text-destructive py-4">{error}</div>;
  }
  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No members found</h3>
        <p className="text-sm text-muted-foreground mb-4">Invite users to this workspace to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg bg-card shadow-enhanced">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Current Role</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map(({ user, role }) => (
            <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">
                      {user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground line-clamp-1">{user.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <Badge variant={role === 'admin' ? 'secondary' : role === 'owner' ? 'default' : 'outline'} className="capitalize text-xs px-2 py-1">
                  {role}
                </Badge>
              </TableCell>
              <TableCell>
                <Select
                  value={role}
                  onValueChange={(val) => handleRoleChange(user.id, val as 'admin' | 'member')}
                  disabled={updating === user.id || role === 'owner'}
                >
                  <SelectTrigger className="w-28 h-8 text-xs bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 