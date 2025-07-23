'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Shield, Users, User, Eye, Edit, Trash2, Check } from 'lucide-react';
import { ExpenseAccessControl, ExpenseAccessLevel } from '@/lib/expense-access-control';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';

interface ExpenseAccessInfoProps {
  className?: string;
}

export function ExpenseAccessInfo({ className }: ExpenseAccessInfoProps) {
  const [accessLevel, setAccessLevel] = useState<ExpenseAccessLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAccessLevel = async () => {
      if (!currentWorkspace?.id || !user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const access = await ExpenseAccessControl.getExpenseAccessLevel(user.uid, currentWorkspace.id);
        setAccessLevel(access);
      } catch (error) {
        console.error('Error fetching access level:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccessLevel();
  }, [currentWorkspace?.id, user?.uid]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-slate-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!accessLevel) {
    return null;
  }

  const getAccessLevelDescription = () => {
    if (accessLevel.canViewAll) {
      return {
        title: 'Full Access',
        description: 'You can view, edit, and manage all expenses across the workspace.',
        icon: Shield,
        color: 'bg-green-100 text-green-800 border-green-200'
      };
    }
    
    if (accessLevel.canViewDepartment) {
      return {
        title: 'Department Access',
        description: 'You can view and manage expenses within your department.',
        icon: Users,
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    }
    
    if (accessLevel.canViewOwn) {
      return {
        title: 'Personal Access',
        description: 'You can only view and manage your own expenses.',
        icon: User,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      };
    }
    
    return {
      title: 'No Access',
      description: 'You do not have permission to view expenses.',
      icon: Info,
      color: 'bg-red-100 text-red-800 border-red-200'
    };
  };

  const accessInfo = getAccessLevelDescription();
  const Icon = accessInfo.icon;

  const permissions = [
    { label: 'View All Expenses', granted: accessLevel.canViewAll, icon: Eye },
    { label: 'View Department Expenses', granted: accessLevel.canViewDepartment, icon: Users },
    { label: 'View Own Expenses', granted: accessLevel.canViewOwn, icon: User },
    { label: 'Edit Expenses', granted: accessLevel.canEdit, icon: Edit },
    { label: 'Edit Own Expenses', granted: accessLevel.canEditOwn, icon: Edit },
    { label: 'Delete Expenses', granted: accessLevel.canDelete, icon: Trash2 },
    { label: 'Delete Own Expenses', granted: accessLevel.canDeleteOwn, icon: Trash2 },
    { label: 'Approve Expenses', granted: accessLevel.canApprove, icon: Check },
    { label: 'Approve Department Expenses', granted: accessLevel.canApproveDepartment, icon: Check }
  ].filter(permission => permission.granted);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${accessInfo.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">{accessInfo.title}</CardTitle>
            <CardDescription className="text-xs">
              {accessInfo.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      {permissions.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Your Permissions
            </h4>
            <div className="flex flex-wrap gap-1">
              {permissions.map((permission) => {
                const PermIcon = permission.icon;
                return (
                  <Badge 
                    key={permission.label} 
                    variant="secondary" 
                    className="text-xs"
                  >
                    <PermIcon className="w-3 h-3 mr-1" />
                    {permission.label}
                  </Badge>
                );
              })}
            </div>
          </div>
          
          {accessLevel.allowedDepartments.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Accessible Departments
              </h4>
              <p className="text-xs text-muted-foreground">
                {accessLevel.allowedDepartments.length} department(s)
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
