'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

export function PasswordChangeStatus() {
  const { userProfile, requiresPasswordChange } = useAuth();

  if (!userProfile) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Shield className="h-4 w-4" />
          <span>Password Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">User: {userProfile.name}</p>
          <p className="text-xs text-muted-foreground">Email: {userProfile.email}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Password Change Required:</span>
          {requiresPasswordChange ? (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <AlertCircle className="h-3 w-3" />
              <span>Yes</span>
            </Badge>
          ) : (
            <Badge variant="default" className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3" />
              <span>No</span>
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">First Login:</span>
          <Badge variant={userProfile.firstLogin ? "secondary" : "outline"}>
            {userProfile.firstLogin ? "Yes" : "No"}
          </Badge>
        </div>
        
        {requiresPasswordChange && (
          <div className="p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
            <strong>Notice:</strong> This user must change their admin-set password before accessing the workspace.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 