import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, UserMinus } from 'lucide-react';
import { type Department, type DepartmentUser } from '@/lib/department-service';

interface ViewMembersDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedDepartment: Department | null;
  departmentMembers: {[key: string]: DepartmentUser[]};
  isAdminOrOwner: boolean;
  handleRemoveMember: (userId: string, departmentName: string) => void;
}

export function ViewMembersDialog({
  isOpen,
  setIsOpen,
  selectedDepartment,
  departmentMembers,
  isAdminOrOwner,
  handleRemoveMember,
}: ViewMembersDialogProps) {
  const members = selectedDepartment ? departmentMembers[selectedDepartment.id] || [] : [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {selectedDepartment?.name} Members ({members.length})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No members in this department</p>
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {member.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{member.userName}</div>
                    <div className="text-sm text-muted-foreground">{member.userEmail}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{member.userRole}</Badge>
                  {member.departmentRole === 'head' && (
                    <Badge className="bg-yellow-100 text-yellow-800">Head</Badge>
                  )}
                  {isAdminOrOwner && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveMember(member.userId, selectedDepartment?.name || '')}
                      title="Remove member"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}