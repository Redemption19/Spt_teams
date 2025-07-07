import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserCheck } from 'lucide-react';
import { type User } from '@/lib/types';

interface UnassignedUsersListProps {
  unassignedUsers: User[];
}

export function UnassignedUsersList({ unassignedUsers }: UnassignedUsersListProps) {
  return (
    <>
      {unassignedUsers.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">All users are assigned</h3>
          <p className="text-muted-foreground">
            All users in your workspace have been assigned to departments.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {unassignedUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user.role}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}