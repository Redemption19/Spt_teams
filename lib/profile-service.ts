'use client';

import { 
  doc, 
  updateDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { 
  updateProfile as updateFirebaseProfile,
  updateEmail,
  updatePassword,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage, auth } from './firebase';
import { User } from './types';

export class ProfileService {
  /**
   * Update user profile information
   */
  static async updateProfile(userId: string, profileData: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Calculate profile completeness
      const completeness = this.calculateProfileCompleteness(profileData);
      
      const updateData = {
        ...profileData,
        profileCompleteness: completeness,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userRef, updateData);

      // Update Firebase Auth profile if name changed
      if (profileData.name && auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, {
          displayName: profileData.name,
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Update user avatar
   */
  static async updateAvatar(userId: string, file: File): Promise<string> {
    try {
      // Delete old avatar if exists
      const currentUser = await this.getProfile(userId);
      if (currentUser?.avatar) {
        try {
          const oldAvatarRef = ref(storage, `avatars/${userId}/avatar`);
          await deleteObject(oldAvatarRef);
        } catch (error) {
          // Old avatar doesn't exist, continue
        }
      }

      // Upload new avatar
      const avatarRef = ref(storage, `avatars/${userId}/avatar`);
      const snapshot = await uploadBytes(avatarRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update user document with new avatar URL
      await this.updateProfile(userId, { avatar: downloadURL });

      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, {
          photoURL: downloadURL,
        });
      }

      return downloadURL;
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw new Error('Failed to update avatar');
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        return {
          id: userSnap.id,
          ...userData,
          createdAt: userData.createdAt?.toDate(),
          lastActive: userData.lastActive?.toDate(),
          dateOfBirth: userData.dateOfBirth?.toDate(),
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting profile:', error);
      throw new Error('Failed to get profile');
    }
  }

  /**
   * Update email address
   */
  static async updateEmail(newEmail: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      await updateEmail(auth.currentUser, newEmail);
      
      // Update in Firestore
      await this.updateProfile(auth.currentUser.uid, { email: newEmail });
    } catch (error) {
      console.error('Error updating email:', error);
      throw new Error('Failed to update email');
    }
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      await updatePassword(auth.currentUser, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw new Error('Failed to update password');
    }
  }

  /**
   * Add skill to user profile
   */
  static async addSkill(userId: string, skill: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentSkills = userData.skills || [];
        
        if (!currentSkills.includes(skill)) {
          const updatedSkills = [...currentSkills, skill];
          await this.updateProfile(userId, { skills: updatedSkills });
        }
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      throw new Error('Failed to add skill');
    }
  }

  /**
   * Remove skill from user profile
   */
  static async removeSkill(userId: string, skill: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentSkills = userData.skills || [];
        const updatedSkills = currentSkills.filter((s: string) => s !== skill);
        await this.updateProfile(userId, { skills: updatedSkills });
      }
    } catch (error) {
      console.error('Error removing skill:', error);
      throw new Error('Failed to remove skill');
    }
  }

  /**
   * Calculate profile completeness percentage
   */
  static calculateProfileCompleteness(userData: Partial<User>): number {
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'jobTitle',
      'department',
    ];

    const optionalFields = [
      'bio',
      'avatar',
      'address',
      'socialLinks',
      'skills',
      'languages',
      'timezone',
    ];

    let completedRequired = 0;
    let completedOptional = 0;

    // Check required fields (60% weight)
    requiredFields.forEach(field => {
      if (userData[field as keyof User]) {
        completedRequired++;
      }
    });

    // Check optional fields (40% weight)
    optionalFields.forEach(field => {
      const value = userData[field as keyof User];
      if (value) {
        if (field === 'address' && typeof value === 'object') {
          // Address is complete if at least city and country are filled
          if ((value as any).city && (value as any).country) {
            completedOptional++;
          }
        } else if (field === 'socialLinks' && typeof value === 'object') {
          // Social links complete if at least one link is provided
          const links = Object.values(value as any).filter(Boolean);
          if (links.length > 0) {
            completedOptional++;
          }
        } else if (Array.isArray(value) && value.length > 0) {
          completedOptional++;
        } else if (typeof value === 'string' && value.trim()) {
          completedOptional++;
        }
      }
    });

    // Calculate percentage (60% for required, 40% for optional)
    const requiredPercentage = (completedRequired / requiredFields.length) * 60;
    const optionalPercentage = (completedOptional / optionalFields.length) * 40;
    
    return Math.round(requiredPercentage + optionalPercentage);
  }

  /**
   * Get profile statistics
   */
  static async getProfileStats(userId: string): Promise<{
    completeness: number;
    lastUpdated: Date | null;
    accountAge: number;
    teamCount: number;
  }> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      const accountAge = profile.createdAt 
        ? Math.floor((Date.now() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        completeness: profile.profileCompleteness || 0,
        lastUpdated: profile.lastActive,
        accountAge,
        teamCount: profile.teamIds?.length || 0,
      };
    } catch (error) {
      console.error('Error getting profile stats:', error);
      throw new Error('Failed to get profile statistics');
    }
  }

  /**
   * Search users by skills or department
   */
  static async searchProfiles(searchTerm: string, workspaceId: string): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('workspaceId', '==', workspaceId)
      );

      const querySnapshot = await getDocs(q);
      const users: User[] = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const user = {
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate(),
          lastActive: userData.lastActive?.toDate(),
        } as User;

        // Search in name, skills, department, or job title
        const searchableText = [
          user.name,
          user.firstName,
          user.lastName,
          user.department,
          user.jobTitle,
          ...(user.skills || []),
        ].join(' ').toLowerCase();

        if (searchableText.includes(searchTerm.toLowerCase())) {
          users.push(user);
        }
      });

      return users;
    } catch (error) {
      console.error('Error searching profiles:', error);
      throw new Error('Failed to search profiles');
    }
  }

  /**
   * Get team members' profiles
   */
  static async getTeamProfiles(userIds: string[]): Promise<User[]> {
    try {
      const profiles: User[] = [];
      
      for (const userId of userIds) {
        const profile = await this.getProfile(userId);
        if (profile) {
          profiles.push(profile);
        }
      }

      return profiles;
    } catch (error) {
      console.error('Error getting team profiles:', error);
      throw new Error('Failed to get team profiles');
    }
  }
}
