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
      <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-4">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg break-words">
            {selectedDepartment?.name} Members ({members.length})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-96 overflow-y-auto">
          {members.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">No members in this department</p>
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                    <AvatarFallback className="text-xs sm:text-sm">
                      {member.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base truncate">{member.userName}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground truncate">{member.userEmail}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{member.userRole}</Badge>
                  {member.departmentRole === 'head' && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">Head</Badge>
                  )}
                  {isAdminOrOwner && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveMember(member.userId, selectedDepartment?.name || '')}
                      title="Remove member"
                      className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 touch-manipulation"
                    >
                      <UserMinus className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline ml-1">Remove</span>
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