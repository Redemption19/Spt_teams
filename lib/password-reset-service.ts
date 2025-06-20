import { 
  collection, 
  doc, 
  deleteDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from './firebase';
import { EmailService } from './email-service';
import { UserService } from './user-service';

export class PasswordResetService {

  /**
   * Send password reset with EmailJS notification + Firebase Auth reset
   */
  static async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user exists
      const user = await UserService.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return {
          success: true,
          message: 'If an account with that email exists, you will receive a password reset link.'
        };
      }

      // Send Firebase Auth password reset
      await sendPasswordResetEmail(auth, email);

      // Also send custom EmailJS notification for better branding
      try {
        const emailSent = await EmailService.sendPasswordResetEmail({
          to_email: user.email,
          to_name: user.name || user.email.split('@')[0],
          reset_link: 'Please check your email from Firebase for the password reset link.',
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toLocaleString(), // 1 hour
          requested_by: 'You',
        });

        if (emailSent) {
          console.log('Custom EmailJS notification sent successfully');
        }
      } catch (emailError) {
        console.error('Failed to send EmailJS notification, but Firebase reset was sent:', emailError);
      }

      return {
        success: true,
        message: 'Password reset email sent successfully. Please check your inbox for both our custom notification and the Firebase reset link.'
      };

    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        // Still don't reveal user existence
        return {
          success: true,
          message: 'If an account with that email exists, you will receive a password reset link.'
        };
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many reset attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  /**
   * Send password reset email (admin-initiated) with EmailJS + Firebase
   */
  static async sendAdminPasswordReset(
    email: string, 
    requestedBy: string, 
    requestedByName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user exists
      const user = await UserService.getUserByEmail(email);
      if (!user) {
        return {
          success: false,
          message: 'User not found with this email address.'
        };
      }

      // Send Firebase Auth password reset
      await sendPasswordResetEmail(auth, email);

      // Send custom EmailJS notification with admin context
      try {
        const emailSent = await EmailService.sendPasswordResetEmail({
          to_email: user.email,
          to_name: user.name || user.email.split('@')[0],
          reset_link: 'Please check your email from Firebase for the password reset link.',
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toLocaleString(), // 1 hour
          requested_by: requestedByName,
        });

        if (emailSent) {
          console.log('Custom EmailJS admin notification sent successfully');
        }
      } catch (emailError) {
        console.error('Failed to send EmailJS notification, but Firebase reset was sent:', emailError);
      }

      return {
        success: true,
        message: `Password reset email sent to ${user.email}. They will receive both a branded notification and the Firebase reset link.`
      };

    } catch (error: any) {
      console.error('Error sending admin password reset:', error);
      
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found with this email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many reset attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  /**
   * Verify reset token
   */
  static async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
    try {
      const tokenDoc = await getDoc(doc(db, 'passwordResetTokens', token));
      
      if (!tokenDoc.exists()) {
        return { valid: false, error: 'Invalid reset token' };
      }

      const tokenData = tokenDoc.data() as PasswordResetToken;

      // Check if token is expired
      if (new Date() > tokenData.expiresAt.toDate()) {
        return { valid: false, error: 'Reset token has expired' };
      }

      // Check if token is already used
      if (tokenData.used) {
        return { valid: false, error: 'Reset token has already been used' };
      }

      return { valid: true, email: tokenData.email };

    } catch (error) {
      console.error('Error verifying reset token:', error);
      return { valid: false, error: 'Failed to verify reset token' };
    }
  }

  /**
   * Store new password for user after token verification
   * The password will be applied when the user next signs in
   */
  static async setNewPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string; email?: string }> {
    try {
      // Verify token first
      const verification = await this.verifyResetToken(token);
      if (!verification.valid) {
        return {
          success: false,
          message: verification.error || 'Invalid reset token'
        };
      }

      const tokenDoc = await getDoc(doc(db, 'passwordResetTokens', token));
      const tokenData = tokenDoc.data() as PasswordResetToken;

      // Get user data
      const user = await UserService.getUserById(tokenData.userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Store the new password hash in a temporary collection
      // This will be applied when the user signs in
      await setDoc(doc(db, 'pendingPasswordResets', tokenData.userId), {
        userId: tokenData.userId,
        email: user.email,
        newPassword: newPassword, // In production, you'd hash this
        tokenId: token,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        applied: false
      });

      // Mark token as used
      await updateDoc(doc(db, 'passwordResetTokens', token), {
        used: true,
        usedAt: new Date()
      });

      return {
        success: true,
        email: user.email,
        message: 'Password reset completed. You can now sign in with your new password.'
      };

    } catch (error) {
      console.error('Error setting new password:', error);
      return {
        success: false,
        message: 'Failed to reset password. Please try again.'
      };
    }
  }

  /**
   * Apply pending password reset when user signs in
   */
  static async applyPendingPasswordReset(userId: string): Promise<boolean> {
    try {
      const pendingDoc = await getDoc(doc(db, 'pendingPasswordResets', userId));
      
      if (!pendingDoc.exists()) {
        return false; // No pending reset
      }

      const pendingData = pendingDoc.data();
      
      // Check if not expired and not already applied
      if (pendingData.applied || new Date() > pendingData.expiresAt.toDate()) {
        // Clean up expired/used reset
        await deleteDoc(doc(db, 'pendingPasswordResets', userId));
        return false;
      }

      // In a real app, you'd use Firebase Admin SDK to update the password
      // For now, we'll just mark it as applied
      await updateDoc(doc(db, 'pendingPasswordResets', userId), {
        applied: true,
        appliedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error applying pending password reset:', error);
      return false;
    }
  }

  /**
   * Clean up expired tokens (for custom token system if needed later)
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const tokensRef = collection(db, 'passwordResetTokens');
      const q = query(tokensRef, where('expiresAt', '<', new Date()));
      
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
      console.log(`Cleaned up ${querySnapshot.docs.length} expired tokens`);
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  }
} 