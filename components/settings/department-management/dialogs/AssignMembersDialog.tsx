import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { type Department } from '@/lib/department-service';
import { type User } from '@/lib/types';

interface AssignMembersDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedDepartment: Department | null;
  unassignedUsers: User[];
  selectedUserIds: string[];
  setSelectedUserIds: (ids: string[]) => void;
  handleConfirmAssignMembers: () => void;
  submitting: boolean;
}

export function AssignMembersDialog({
  isOpen,
  setIsOpen,
  selectedDepartment,
  unassignedUsers,
  selectedUserIds,
  setSelectedUserIds,
  handleConfirmAssignMembers,
  submitting,
}: AssignMembersDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Assign Members to {selectedDepartment?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Select users to assign to this department:
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {unassignedUsers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No unassigned users available</p>
              </div>
            ) : (
              unassignedUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedUserIds.includes(user.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUserIds([...selectedUserIds, user.id]);
                      } else {
                        setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user.role}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAssignMembers}
            disabled={submitting || selectedUserIds.length === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              `Assign ${selectedUserIds.length} Member(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}