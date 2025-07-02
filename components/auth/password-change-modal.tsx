'use client';

import { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserService } from '@/lib/user-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Eye, EyeOff } from 'lucide-react';

interface PasswordChangeModalProps {
  isOpen: boolean;
  userEmail: string;
  userId: string;
  onPasswordChanged: () => void;
}

export function PasswordChangeModal({ 
  isOpen, 
  userEmail, 
  userId, 
  onPasswordChanged 
}: PasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handlePasswordChange = async () => {
    try {
      setSubmitting(true);

      // Validate passwords
      if (!newPassword || !confirmPassword) {
        toast({
          title: 'Error',
          description: 'Please fill in both password fields',
          variant: 'destructive',
        });
        return;
      }

      if (newPassword.length < 6) {
        toast({
          title: 'Error',
          description: 'New password must be at least 6 characters long',
          variant: 'destructive',
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        toast({
          title: 'Error',
          description: 'Passwords do not match',
          variant: 'destructive',
        });
        return;
      }

      // Update password with Firebase Auth
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      await updatePassword(user, newPassword);

      // Update user record to remove password change requirement
      await UserService.updateUser(userId, {
        requiresPasswordChange: false,
        firstLogin: false,
        lastActive: new Date(),
      });

      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully changed. You now have full access to the workspace.',
      });

      // Clear form
      setNewPassword('');
      setConfirmPassword('');

      // Notify parent component
      onPasswordChanged();
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please log out and log back in, then try changing your password.';
      }

      toast({
        title: 'Password Change Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <span>Password Change Required</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Security Notice:</strong> Your administrator set an initial password for your account. 
              For security reasons, you must change it to your own secure password before accessing the workspace.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new secure password (min 6 characters)"
                  disabled={submitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={submitting}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  disabled={submitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={submitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords don't match</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Password Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>At least 6 characters long</li>
                <li>Different from your current password</li>
                <li>Consider using a mix of letters, numbers, and symbols</li>
              </ul>
            </div>

            <Button 
              onClick={handlePasswordChange}
              disabled={
                submitting || 
                !newPassword || 
                !confirmPassword ||
                newPassword !== confirmPassword ||
                newPassword.length < 6
              }
              className="w-full"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password & Continue
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            You cannot access the workspace until you change your password.
            <br />
            Contact your administrator if you need assistance.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 